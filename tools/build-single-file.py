#!/usr/bin/env python3
"""รวมเว็บไซต์ทั้งหมดเป็นไฟล์ .html ไฟล์เดียว สำหรับส่งให้คนอื่นเปิดดู

วิธีใช้:  python3 tools/build-single-file.py [ชื่อไฟล์ออก]
ค่าเริ่มต้น: dist/pem-website-single.html

แนวคิด
  ไฟล์ผลลัพธ์เก็บ "หน้าเว็บทุกหน้า" ไว้เป็นสตริงใน window.__PEM_PAGES และ
  เก็บรูปภาพทั้งหมดเป็น data URI ไว้ใน window.__PEM_IMG
  เวลาเปลี่ยนหน้าใช้ document.open/write/close เขียนทั้งเอกสารใหม่
  ซึ่งทำให้สคริปต์ของแต่ละหน้าเริ่มต้นในเอกสารสะอาดเหมือนโหลดหน้าจริง
  ไม่มีปัญหา event listener ซ้อนกันแบบการทำ single page app
  ส่วน window ไม่ถูกล้างเมื่อ document.write รูปภาพกับเนื้อหาหน้าจึงเก็บครั้งเดียว

ไฟล์นี้สร้างผลลัพธ์จากต้นฉบับโดยตรง ถ้าแก้เว็บแล้วให้รันใหม่ ไม่ต้องแก้สองที่
"""
import base64, io, json, mimetypes, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ['precise-pcc-pem.html', 'products.html', 'product.html', 'quote.html',
         'support.html', 'dealer.html', 'dealer-login.html', 'dealer-portal.html']
HOME = PAGES[0]

def jsliteral(obj):
    """แปลงเป็นสตริง JS ที่ฝังใน <script> ได้ปลอดภัย
       ต้องหนี </script> เป็น <\\/script> ไม่งั้นเบราว์เซอร์จะปิดแท็ก script
       ตรงกลางข้อมูล ทำให้ทั้งไฟล์พัง"""
    return (json.dumps(obj, ensure_ascii=False)
            .replace('</', '<\\/')
            .replace('\u2028', '\\u2028').replace('\u2029', '\\u2029'))

def rd(p, b=False):
    with open(os.path.join(ROOT, p), 'rb' if b else 'r', encoding=None if b else 'utf-8') as f:
        return f.read()

def data_uri(path):
    mt = mimetypes.guess_type(path)[0] or 'application/octet-stream'
    return 'data:%s;base64,%s' % (mt, base64.b64encode(rd(path, True)).decode())

# ---------- รูปภาพทั้งหมด เก็บครั้งเดียวใช้ร่วมกันทุกหน้า ----------
IMG = {}
for d in ('assets/img',):
    for n in sorted(os.listdir(os.path.join(ROOT, d))):
        if n.startswith('.'): continue
        IMG[f'{d}/{n}'] = data_uri(f'{d}/{n}')
IMG['assets/hero-home.jpg'] = data_uri('assets/hero-home.jpg')

# ---------- CSS ----------
def css_of(href):
    s = rd(href)
    # ภาพ hero อ้างผ่านตัวแปร CSS เพื่อไม่ให้ data URI ถูกเขียนซ้ำในทุกหน้า
    # (ตัวแปรถูกตั้งค่าในสคริปต์นำของแต่ละหน้า โดยอ่านจากตารางรูปชุดเดียว)
    s = s.replace('url("hero-home.jpg")', 'var(--hero-img,none)')
    s = re.sub(r',\s*url\("hero-home\.(?:jpeg|png|webp)"\)', '', s)
    return s

# ---------- สคริปต์ ----------
# เปลี่ยนคำสั่งย้ายหน้าใน JS ให้เรียก router แทน เพราะไฟล์เดียวไม่มี URL แยกหน้า
NAV_RE = [
    (re.compile(r'location\.replace\('), '__PEM_NAV('),
    (re.compile(r'location\.href\s*=\s*'), '__PEM_NAV('),
]
def js_of(src):
    s = rd(src)
    s = NAV_RE[0][0].sub(NAV_RE[0][1], s)
    # location.href = X;  ->  __PEM_NAV(X);
    s = re.sub(r"location\.href\s*=\s*([^;\n]+);", r"__PEM_NAV(\1);", s)
    if src.endswith('catalog-lib.js'):
        s += IMG_PATCH
    # ห่อทุกสคริปต์ไว้ในฟังก์ชัน เพราะ window ไม่ถูกล้างเมื่อ document.write
    # ถ้าไม่ห่อ ตัวแปร const ระดับบนสุด (เช่น burger ใน site.js) จะถูกประกาศซ้ำ
    # เมื่อเปลี่ยนหน้าแล้วสคริปต์พังทั้งไฟล์ ทุกไฟล์ส่งค่าออกผ่าน window.PEM_* อยู่แล้ว
    return ';(function(){\n%s\n})();' % s

# หลัง catalog-lib.js ให้พาธรูปทุกอันวิ่งผ่านตารางรูปที่ฝังไว้
IMG_PATCH = r'''
/* ---- เพิ่มโดยตัวรวมไฟล์: ชี้พาธรูปไปยัง data URI ที่ฝังไว้ ---- */
(function () {
  var M = window.__PEM_IMG || {}, L = window.PEM_LIB;
  if (!L) return;
  var m = function (p) { return M[p] || p; };
  ['imgForCore', 'imgForService', 'svgForCore'].forEach(function (k) {
    var o = L[k]; L[k] = function (x) { return m(o(x)); };
  });
  var of_ = L.fallbackFor;
  L.fallbackFor = function (c) {
    return of_(c).split(',').filter(Boolean).map(m).join(',');
  };
  L.imgAttrs = function (c) {
    var fb = L.fallbackFor(c);
    return 'src="' + L.imgForCore(c) + '"' + (fb ? ' data-fallback="' + fb + '"' : '');
  };
})();
'''

# ---------- โค้ดที่ใส่ไว้บนสุดของทุกหน้า ----------
PRELUDE = r'''
/* ---- เพิ่มโดยตัวรวมไฟล์: ทำให้หน้าเว็บทำงานได้ในไฟล์เดียว ---- */
(function () {
  var W = window;
  // ภาพพื้นหลัง hero ดึงจากตารางรูปที่เก็บไว้ครั้งเดียว
  var hero = (W.__PEM_IMG || {})['assets/hero-home.jpg'];
  if (hero) document.documentElement.style.setProperty('--hero-img', 'url("' + hero + '")');

  // ไฟล์เดียวไม่มี query string จริง จึงป้อนค่าที่ router เก็บไว้ให้แทน
  var Q = W.__PEM_Q || '';
  var Native = W.URLSearchParams;
  if (!W.__PEM_USP_PATCHED) {
    W.__PEM_USP_PATCHED = 1;
    W.URLSearchParams = function (init) {
      return new Native(init === undefined || init === null || init === '' ? (W.__PEM_Q || '') : init);
    };
    W.URLSearchParams.prototype = Native.prototype;
  }

  // history ของไฟล์เดียวเปลี่ยน path ไม่ได้ ให้เก็บเฉพาะส่วน hash
  var hs = history.replaceState.bind(history), ps = history.pushState.bind(history);
  function keepHash(fn) {
    return function (st, ti, url) {
      if (typeof url === 'string' && url.indexOf('#') >= 0) {
        var h = url.slice(url.indexOf('#'));
        if (location.hash !== h) { try { fn(st, ti, h); } catch (e) { location.hash = h; } }
      }
    };
  }
  history.replaceState = keepHash(hs);
  history.pushState = keepHash(ps);
})();
'''

POSTLUDE = r'''
/* ---- เพิ่มโดยตัวรวมไฟล์: ดักการกดลิงก์ให้ router จัดการ ---- */
(function () {
  if (window.PEM_ICON) window.PEM_ICON.paint();
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    var href = a.getAttribute('href');
    if (!href || !/^[A-Za-z0-9._-]+\.html(\?|#|$)/.test(href)) return;
    // ปล่อยให้สคริปต์ของหน้าทำงานก่อน ถ้ามันจัดการเองแล้วก็ไม่ต้องเปลี่ยนหน้า
    e.preventDefault();
    setTimeout(function () { if (!e.defaultPrevented || true) window.__PEM_NAV(href); }, 0);
  });
})();
'''

# ---------- ประกอบแต่ละหน้า ----------
SCRIPT_RE = re.compile(r'[ \t]*<script src="([^"?]+)(?:\?[^"]*)?"></script>\n?')
LINK_RE   = re.compile(r'[ \t]*<link rel="stylesheet" href="([^"?]+)(?:\?[^"]*)?">\n?')

def build_page(name):
    s = rd(name)
    # ต้องแทรกสคริปต์นำและสคริปต์ปิดท้ายก่อนฝัง JS ลงไป
    # เพราะ dealer-portal.js สร้างเอกสาร HTML ทั้งฉบับไว้ในเทมเพลตสตริง
    # ซึ่งมี </head> กับ </body> อยู่ข้างใน ถ้าฝัง JS ก่อนจะไปแทรกผิดที่
    s = s.replace('</head>', '<script>%s</script>\n</head>' % PRELUDE, 1)
    s = s.replace('</body>', '<script>%s</script>\n</body>' % POSTLUDE, 1)
    s = LINK_RE.sub(lambda m: '<style>\n%s\n</style>\n' % css_of(m.group(1)), s)
    s = SCRIPT_RE.sub(lambda m: '<script>\n%s\n</script>\n' % js_of(m.group(1)), s)
    return s

pages = {n: build_page(n) for n in PAGES}

ROUTER = r'''
window.__PEM_GO = function (page, query, hash) {
  var html = window.__PEM_PAGES[page];
  if (!html) { page = %(home)s; html = window.__PEM_PAGES[page]; }
  window.__PEM_PAGE = page;
  window.__PEM_Q = query || '';
  try { if ((location.hash || '') !== (hash || '')) location.hash = hash || ''; } catch (e) {}
  document.open();
  document.write(html);
  document.close();
  window.scrollTo(0, 0);
};
window.__PEM_NAV = function (url) {
  url = String(url);
  if (/^(https?:|mailto:|tel:)/i.test(url)) { window.open(url, '_blank'); return; }
  var hash = '', query = '';
  var i = url.indexOf('#'); if (i >= 0) { hash = url.slice(i); url = url.slice(0, i); }
  i = url.indexOf('?');     if (i >= 0) { query = url.slice(i); url = url.slice(0, i); }
  if (!url) {   // ลิงก์ที่มีแต่ #... คือสมอในหน้าเดิม
    if (hash) { var el = document.getElementById(hash.slice(1)); if (el) el.scrollIntoView(); }
    return;
  }
  window.__PEM_GO(url, query, hash);
};
window.addEventListener('hashchange', function () {
  if (!document.getElementById('side')) return;   // พอร์ทัลจัดการ hash เอง
});
// ต้องรอให้ตัวแยกวิเคราะห์เอกสารทำงานเสร็จก่อน ไม่งั้น document.open()
// จะถูกเพิกเฉยเพราะยังอ่านหน้าอยู่ แล้วเนื้อหาจะถูกต่อท้ายแทนที่จะแทนที่
document.addEventListener('DOMContentLoaded', function () {
  window.__PEM_GO(%(home)s, '', location.hash || '');
});
''' % {'home': json.dumps(HOME)}

out = sys.argv[1] if len(sys.argv) > 1 else 'dist/pem-website-single.html'
outp = os.path.join(ROOT, out)
os.makedirs(os.path.dirname(outp), exist_ok=True)

def git(*a):
    try:
        return subprocess.run(['git'] + list(a), cwd=ROOT, capture_output=True,
                              text=True, check=True).stdout.strip()
    except Exception:
        return '?'

# ประทับที่มาไว้ในไฟล์ จะได้ตรวจได้ว่าไฟล์ที่ถืออยู่สร้างจากโค้ดรุ่นไหน
stamp = 'สร้างจาก commit %s เมื่อ %s โดย tools/build-single-file.py' % (
    git('rev-parse', '--short', 'HEAD'), git('log', '-1', '--format=%cd', '--date=format:%d/%m/%Y %H:%M'))

shell = (
 '<!DOCTYPE html>\n<html lang="th">\n<head>\n<meta charset="utf-8">\n'
 '<!-- ' + stamp + ' -->\n'
 '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
 '<title>เว็บไซต์ PEM — พรีไซซ อีเลคตริค แมนูแฟคเจอริ่ง</title>\n'
 '<style>body{margin:0;display:grid;place-items:center;min-height:100vh;background:#eef5fb;color:#16283c;'
 "font-family:'IBM Plex Sans Thai','Noto Sans Thai','Sarabun','Leelawadee UI',system-ui,sans-serif}</style>\n"
 '</head>\n<body>\n<p>กำลังเปิดเว็บไซต์ PEM…</p>\n'
 '<script>window.__PEM_IMG=' + jsliteral(IMG) + ';</scr' + 'ipt>\n'
 '<script>window.__PEM_PAGES=' + jsliteral(pages) + ';</scr' + 'ipt>\n'
 '<script>' + ROUTER + '</script>\n</body>\n</html>\n')

io.open(outp, 'w', encoding='utf-8').write(shell)
print('สร้าง %s  ขนาด %.1f MB  (%d หน้า, %d รูป)\n%s'
      % (out, len(shell.encode()) / 1048576, len(pages), len(IMG), stamp))
