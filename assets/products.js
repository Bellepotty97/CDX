/* หน้าสินค้าและบริการ — เลย์เอาต์สองคอลัมน์
   คอลัมน์ซ้ายคือประเภทสินค้าและบริการ คอลัมน์ขวาคือการ์ดของประเภทที่เลือก
   ข้อมูลทั้งหมดมาจาก data/catalog.js และ data/services.js ไม่มีการเพิ่มข้อมูลใหม่ */
(function () {
'use strict';

const C = window.PEM_CATALOG;
const S = window.PEM_SERVICES;
const L = window.PEM_LIB;
const I = window.PEM_ICON;
const esc = L.esc;
const $ = s => document.querySelector(s);

const ROWS = L.rows();
const COUNT = {};
ROWS.forEach(r => { COUNT[r.core] = (COUNT[r.core] || 0) + 1; });
const CORES = C.core.slice().sort((a, b) => COUNT[b] - COUNT[a]);

const PAGE = 24;
let sel = { kind: 'all' };   // all | core | svcAll | svc
let term = '', shown = PAGE;

/* ---------------- คอลัมน์ซ้าย ---------------- */
function drawSide() {
  const item = (key, label, icon, count, svc) => `
    <li><button class="catbtn${svc ? ' is-svc' : ''}" type="button" data-sel="${esc(key)}">
      <span class="ico">${I.svg(icon, 17)}</span><span>${esc(label)}</span>
      ${count != null ? `<span class="n">${count}</span>` : ''}
    </button></li>`;

  $('#catside').innerHTML =
    '<h3>ประเภทสินค้า</h3><ul>' +
      item('all', 'สินค้าทั้งหมด', 'box', ROWS.length) +
      CORES.map(c => item('core:' + c, c, I.byCore(c), COUNT[c])).join('') +
    '</ul>' +
    '<h3>งานบริการและโซลูชัน</h3><ul>' +
      item('svcAll', 'บริการทั้งหมด', 'install', S.length, true) +
      S.map(s => item('svc:' + s.id, s.name, s.icon, null, true)).join('') +
    '</ul>';

  $('#catside').querySelectorAll('.catbtn').forEach(b =>
    b.addEventListener('click', () => { pick(b.dataset.sel); }));
  markSide();
}
function selKey() {
  return sel.kind === 'core' ? 'core:' + sel.value
       : sel.kind === 'svc'  ? 'svc:' + sel.value
       : sel.kind;
}
function markSide() {
  const k = selKey();
  $('#catside').querySelectorAll('.catbtn').forEach(b => {
    if (b.dataset.sel === k) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  });
}
function pick(key) {
  if (key === 'all')          sel = { kind: 'all' };
  else if (key === 'svcAll')  sel = { kind: 'svcAll' };
  else if (key.startsWith('core:')) sel = { kind: 'core', value: key.slice(5) };
  else if (key.startsWith('svc:'))  sel = { kind: 'svc',  value: key.slice(4) };
  shown = PAGE;
  render(); writeUrl();
  $('#catalog').scrollIntoView({ block: 'start', behavior: 'smooth' });
}

/* ---------------- สิ่งที่จะแสดง ---------------- */
const hit = (r, t) =>
  (r.name + ' ' + r.code + ' ' + r.core + ' ' + r.type + ' ' + r.biz).toLowerCase().includes(t);
function products() {
  const t = term.trim().toLowerCase();
  return ROWS.filter(r => {
    if (sel.kind === 'core' && r.core !== sel.value) return false;
    return !t || hit(r, t);
  });
}
// จำนวนที่ตรงคำค้นเมื่อไม่จำกัดประเภท ใช้บอกผู้ใช้ว่ายังมีผลลัพธ์ในประเภทอื่น
function allMatches() {
  const t = term.trim().toLowerCase();
  return t ? ROWS.filter(r => hit(r, t)).length : ROWS.length;
}
function services() {
  return sel.kind === 'svc' ? S.filter(s => s.id === sel.value) : S;
}
const showingServices = () => sel.kind === 'svcAll' || sel.kind === 'svc';

/* ---------------- การ์ด ---------------- */
function productCard(r) {
  return `<article class="pcard">
    <a class="shot" href="product.html?i=${r.i}" aria-label="${esc(r.name)}">
      <img ${L.imgAttrs(r.core)} alt="ภาพสินค้ากลุ่ม ${esc(r.core)}" loading="lazy" width="480" height="360">
    </a>
    <div class="body">
      <h3>${esc(r.name)}</h3>
      <p class="meta">${esc(r.core)} · รหัส ${esc(r.code)}</p>
      <p class="desc">${esc(L.shortDesc(r))}</p>
      <p class="go"><a class="btn btn--line" href="product.html?i=${r.i}">ดูรายละเอียด</a></p>
    </div>
  </article>`;
}
function serviceCard(s) {
  return `<article class="pcard is-svc">
    <a class="shot" href="product.html?s=${esc(s.id)}" aria-label="${esc(s.name)}">
      <img src="${L.imgForService(s.id)}" alt="ภาพประกอบงานบริการ ${esc(s.name)}" loading="lazy" width="480" height="360">
    </a>
    <div class="body">
      <h3>${esc(s.name)}</h3>
      <p class="meta">${esc(s.full)}</p>
      <p class="desc">${esc(s.short)}</p>
      <p class="go"><a class="btn btn--line" href="product.html?s=${esc(s.id)}">ดูรายละเอียด</a></p>
    </div>
  </article>`;
}

/* ---------------- แสดงผล ---------------- */
function render() {
  const head = $('#cathead'), list = $('#plist'), more = $('#moreBtn');
  markSide();

  if (showingServices()) {
    const items = services();
    const one = sel.kind === 'svc' ? S.find(s => s.id === sel.value) : null;
    head.innerHTML = `
      <div><h2><span class="ico">${I.svg(one ? one.icon : 'install', 20)}</span>${esc(one ? one.name : 'งานบริการและโซลูชัน')}</h2>
        <p>${one ? esc(one.full) : 'ไม่มีราคากลาง ขอบเขตงานและราคาประเมินเป็นรายโครงการ'}</p></div>`;
    list.innerHTML = items.map(serviceCard).join('');
    more.hidden = true;
    document.title = (one ? one.name + ' — ' : '') + BASE_TITLE;
    return;
  }

  const m = products();
  const q = term.trim();
  const title = sel.kind === 'core' ? sel.value : 'สินค้าทั้งหมด';
  // ค้นหาขณะเลือกประเภทอยู่จะจำกัดผลเฉพาะประเภทนั้น จึงต้องบอกผู้ใช้ให้ชัด
  // และเปิดทางให้ขยายไปค้นทุกประเภทได้ในคลิกเดียว
  const scoped = sel.kind === 'core' && q;
  const outside = scoped ? allMatches() - m.length : 0;
  const wider = outside > 0
    ? ` <button class="linkbtn" type="button" id="searchAll">ค้นทุกประเภท (อีก ${outside} รายการ)</button>`
    : '';
  head.innerHTML = `
    <div><h2><span class="ico">${I.svg(sel.kind === 'core' ? I.byCore(sel.value) : 'box', 20)}</span>${esc(title)}</h2>
      <p id="catmeta">${m.length ? `พบ ${m.length} รายการ` + (q ? ` จากคำค้น “${esc(q)}”` : '')
                                 : `ไม่พบสินค้าที่ตรงกับคำค้น “${esc(q)}”`}${
        scoped ? ` — ค้นเฉพาะใน ${esc(sel.value)}${wider}` : ''}</p></div>`;
  list.innerHTML = m.length
    ? m.slice(0, shown).map(productCard).join('')
    : `<div class="emptymsg" style="grid-column:1/-1">ไม่พบสินค้าที่ตรงกับคำค้น${q ? ` “${esc(q)}”` : ''}${
         scoped && outside > 0
           ? ` ในประเภท ${esc(sel.value)} แต่พบ ${outside} รายการในประเภทอื่น
               <button class="linkbtn" type="button" id="searchAllEmpty">ค้นทุกประเภท</button>`
           : ' ลองพิมพ์คำอื่น'}
         หรือ<a href="#contact" style="color:var(--blue);font-weight:600"> ติดต่อฝ่ายขายโดยตรง</a></div>`;
  ['#searchAll', '#searchAllEmpty'].forEach(id => {
    const b = $(id);
    if (b) b.addEventListener('click', () => pick('all'));
  });
  more.hidden = m.length <= shown;
  if (!more.hidden) more.textContent = `แสดงเพิ่ม (เหลืออีก ${m.length - shown})`;
  document.title = (sel.kind === 'core' ? sel.value + ' — ' : '') + BASE_TITLE;
}
const BASE_TITLE = 'สินค้าและบริการ หม้อแปลงไฟฟ้า อุปกรณ์ระบบจำหน่าย | PEM พรีไซซ อีเลคตริค แมนูแฟคเจอริ่ง';

/* ---------------- ตัวกรองใน URL ---------------- */
function writeUrl() {
  const p = new URLSearchParams();
  if (sel.kind === 'core') p.set('core', sel.value);
  if (sel.kind === 'svc')  p.set('svc', sel.value);
  if (sel.kind === 'svcAll') p.set('svc', 'all');
  if (term.trim()) p.set('q', term.trim());
  history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
}
function readUrl() {
  const p = new URLSearchParams(location.search);
  term = p.get('q') || '';
  $('#q').value = term;
  const svc = p.get('svc');
  const core = p.get('core');
  if (svc === 'all' || location.hash === '#services') sel = { kind: 'svcAll' };
  else if (svc && S.some(s => s.id === svc))          sel = { kind: 'svc', value: svc };
  else if (core && C.core.indexOf(core) >= 0)         sel = { kind: 'core', value: core };
  else sel = { kind: 'all' };
}

/* ---------------- เหตุการณ์ ---------------- */
// ลิงก์กลุ่มสินค้าในเมนูใหญ่และ footer ชี้มาหน้านี้อยู่แล้ว จึงกรองในที่โดยไม่โหลดหน้าใหม่
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-core]');
  if (a && C.core.indexOf(a.dataset.core) >= 0) {
    e.preventDefault(); term = ''; $('#q').value = '';
    pick('core:' + a.dataset.core);
    return;
  }
  const top = e.target.closest('a.top[href]');
  if (top && !top.dataset.core) {
    const u = new URL(top.href, location.href);
    // เฉพาะเมนู "สินค้าและบริการ" ที่ชี้มาหน้านี้ตรง ๆ เท่านั้นที่ให้ล้างตัวกรอง
    // ลิงก์ที่เป็นสมอในหน้า เช่น #contact ต้องปล่อยให้เบราว์เซอร์เลื่อนไปเอง
    if (u.pathname === location.pathname && !u.hash) {
      e.preventDefault(); term = ''; $('#q').value = '';
      pick('all'); window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
});
// ลิงก์ที่ชี้ไป #services ให้เลือกกลุ่มบริการแทนการกระโดดหาสมอที่ไม่มีแล้ว
document.addEventListener('click', e => {
  const a = e.target.closest('a[href$="#services"]');
  if (!a) return;
  e.preventDefault(); term = ''; $('#q').value = '';
  pick('svcAll');
});

$('#q').addEventListener('input', () => {
  term = $('#q').value;
  if (showingServices()) sel = { kind: 'all' };
  shown = PAGE; render(); writeUrl();
});
$('#clearBtn').addEventListener('click', () => {
  term = ''; $('#q').value = ''; sel = { kind: 'all' };
  shown = PAGE; render(); writeUrl(); $('#q').focus();
});
$('#moreBtn').addEventListener('click', () => { shown += PAGE; render(); });
const allBtn = document.getElementById('allProducts');
if (allBtn) allBtn.addEventListener('click', e => {
  e.preventDefault(); term = ''; $('#q').value = ''; pick('all');
});
window.addEventListener('popstate', () => { readUrl(); shown = PAGE; render(); });

drawSide();
readUrl();
render();

})();
