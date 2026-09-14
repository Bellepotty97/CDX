/* หน้ารายละเอียดสินค้าและงานบริการ
   product.html?i=<ลำดับในแคตตาล็อก>  สำหรับสินค้า
   product.html?s=<รหัสบริการ>        สำหรับงานบริการ
   อ้างสินค้าด้วยลำดับแทนรหัสสินค้า เพราะรหัส DS-F-99-0308 ถูกใช้ซ้ำสองรายการในต้นฉบับ */
(function () {
'use strict';

const C = window.PEM_CATALOG, S = window.PEM_SERVICES, L = window.PEM_LIB, I = window.PEM_ICON;
const esc = L.esc, $ = s => document.querySelector(s);
const p = new URLSearchParams(location.search);

function setMeta(title, desc) {
  document.title = title;
  const m = document.querySelector('meta[name=description]');
  if (m) m.setAttribute('content', desc);
}
function crumb(parts) {
  $('#crumb').innerHTML = parts.map((x, i) =>
    (i ? '<span>›</span>' : '') + (x.href ? `<a href="${x.href}">${esc(x.label)}</a>` : esc(x.label))
  ).join('');
}
function notFound() {
  crumb([{ label:'หน้าแรก', href:'precise-pcc-pem.html' },
         { label:'สินค้าและบริการ', href:'products.html' }, { label:'ไม่พบรายการ' }]);
  $('#detail').innerHTML = `<div class="emptymsg">
    <h1 style="font-size:1.2rem;color:var(--blue-dark);margin-bottom:10px">ไม่พบรายการที่ต้องการ</h1>
    <p>ลิงก์อาจไม่ถูกต้องหรือรายการถูกย้ายแล้ว</p>
    <p style="margin-top:18px"><a class="btn btn--solid" href="products.html">ดูสินค้าและบริการทั้งหมด</a></p></div>`;
}

/* ---------------- งานบริการ ---------------- */
function renderService(s) {
  crumb([{ label:'หน้าแรก', href:'precise-pcc-pem.html' },
         { label:'สินค้าและบริการ', href:'products.html' },
         { label:'งานบริการและโซลูชัน', href:'products.html?svc=all' },
         { label:s.name }]);
  setMeta(`${s.name} — ${s.full} | PEM พรีไซซ อีเลคตริค แมนูแฟคเจอริ่ง`, s.short);

  $('#detail').innerHTML = `
    <div class="detail">
      <div class="shot"><img src="${L.imgForService(s.id)}" alt="ภาพประกอบงานบริการ ${esc(s.name)}" width="480" height="360"></div>
      <div>
        <div class="tags"><span class="badge" style="background:#fff4e8;color:#a4560c">งานบริการและโซลูชัน</span></div>
        <h1>${esc(s.name)}</h1>
        <p class="lead">${esc(s.full)}</p>
        <p class="lead">${esc(s.short)}</p>
        <ul class="pointlist">${s.points.map(t =>
          `<li><span class="ico">${I.svg('check', 17)}</span><span>${esc(t)}</span></li>`).join('')}</ul>
        <div class="spectable" style="margin-top:22px">
          <div><dt>รูปแบบราคา</dt><dd>ไม่มีราคากลาง ประเมินเป็นรายโครงการตามขอบเขตงาน</dd></div>
          <div><dt>ผู้ให้บริการ</dt><dd>บริษัท พรีไซซ อีเลคตริค แมนูแฟคเจอริ่ง จำกัด (PEM)</dd></div>
        </div>
        <div class="cta">
          <a class="btn btn--orange" href="quote.html?s=${esc(s.id)}">ขอใบเสนอราคา</a>
          <a class="btn btn--line" href="products.html?svc=all">ดูงานบริการอื่น</a>
        </div>
        <p style="color:var(--muted);font-size:.84rem;margin-top:16px">
          <span class="ph" title="รอฝ่ายขายยืนยันขอบเขตงานและเนื้อหาจริง">
          รายละเอียดขอบเขตงานเป็นข้อมูลเบื้องต้น รอฝ่ายขายยืนยัน</span></p>
      </div>
    </div>
    <div class="related">
      <h2>งานบริการอื่น</h2>
      <div class="cardgrid">${S.filter(x => x.id !== s.id).map(x => `
        <article class="pcard is-svc">
          <a class="shot" href="product.html?s=${esc(x.id)}"><img src="${L.imgForService(x.id)}"
             alt="ภาพประกอบงานบริการ ${esc(x.name)}" loading="lazy" width="480" height="360"></a>
          <div class="body"><h3>${esc(x.name)}</h3><p class="desc">${esc(x.short)}</p>
            <p class="go"><a class="btn btn--line" href="product.html?s=${esc(x.id)}">ดูรายละเอียด</a></p></div>
        </article>`).join('')}</div>
    </div>`;
}

/* ---------------- สินค้า ---------------- */
function renderProduct(r) {
  const sp = L.specs(r.name);
  crumb([{ label:'หน้าแรก', href:'precise-pcc-pem.html' },
         { label:'สินค้าและบริการ', href:'products.html' },
         { label:r.core, href:'products.html?core=' + encodeURIComponent(r.core) },
         { label:r.name }]);
  setMeta(`${r.name} — ${r.core} | PEM พรีไซซ อีเลคตริค แมนูแฟคเจอริ่ง`,
          `${r.name} รหัสสินค้า ${r.code} กลุ่ม ${r.core} ประเภท ${r.type}` +
          (sp.length ? ' พิกัด ' + sp.map(x => x.value).join(' ') : ''));

  const related = L.rows().filter(x => x.core === r.core && x.i !== r.i).slice(0, 3);

  $('#detail').innerHTML = `
    <div class="detail">
      <div class="shot"><img ${L.imgAttrs(r.core)} alt="ภาพสินค้ากลุ่ม ${esc(r.core)}" width="480" height="360">
        ${L.fallbackFor(r.core) ? `
        <p style="padding:11px 14px;font-size:.8rem;color:var(--muted);background:#fff;border-top:1px solid var(--line)">
          ภาพตัวอย่างกลุ่ม ${esc(r.core)} รายละเอียดตัวเครื่องอาจต่างกันตามรุ่น</p>` : `
        <p style="padding:11px 14px;font-size:.8rem;color:var(--muted);background:#fff;border-top:1px solid var(--line)">
          <span class="ph" title="ยังไม่มีภาพถ่ายสินค้าจริง ใช้ภาพประกอบกลุ่มสินค้าไปก่อน">
          ภาพประกอบกลุ่มสินค้า ยังไม่ใช่ภาพถ่ายสินค้าจริง</span></p>`}
      </div>
      <div>
        <div class="tags">
          <span class="badge">${esc(r.core)}</span>
          <span class="badge" style="background:#eef1f4;color:var(--muted)">${esc(r.type)}</span>
        </div>
        <h1>${esc(r.name)}</h1>
        <p class="lead">รหัสสินค้า <b style="color:var(--ink)">${esc(r.code)}</b> ·
           ผลิตและจำหน่ายโดย บริษัท พรีไซซ อีเลคตริค แมนูแฟคเจอริ่ง จำกัด (PEM)</p>
        <div class="spectable">
          <div><dt>กลุ่มสินค้า</dt><dd>${esc(r.core)}</dd></div>
          <div><dt>ประเภทสินค้า</dt><dd>${esc(r.type)}</dd></div>
          <div><dt>รหัสสินค้า</dt><dd>${esc(r.code)}</dd></div>
          ${sp.map(x => `<div><dt>${esc(x.label)}</dt><dd>${esc(x.value)}</dd></div>`).join('')}
        </div>
        ${sp.length ? '' : `<p style="color:var(--muted);font-size:.86rem;margin-top:12px">
          พิกัดทางไฟฟ้าของรุ่นนี้ระบุอยู่ในชื่อรุ่น สอบถามรายละเอียดเพิ่มเติมได้จากฝ่ายขาย</p>`}
        <div class="cta">
          <a class="btn btn--orange" href="quote.html?i=${r.i}">ขอราคา</a>
          <a class="btn btn--line" href="products.html?core=${encodeURIComponent(r.core)}">ดูสินค้าอื่นในกลุ่มนี้</a>
        </div>
        <p style="color:var(--muted);font-size:.84rem;margin-top:16px">
          ข้อมูลอ้างอิงจาก Price List ประกาศใช้ 1 มิถุนายน 2569 · ไม่แสดงราคาบนหน้าเว็บ</p>
      </div>
    </div>
    ${related.length ? `<div class="related">
      <h2>สินค้าอื่นในกลุ่ม ${esc(r.core)}</h2>
      <div class="cardgrid">${related.map(x => `
        <article class="pcard">
          <a class="shot" href="product.html?i=${x.i}"><img ${L.imgAttrs(x.core)}
             alt="ภาพสินค้ากลุ่ม ${esc(x.core)}" loading="lazy" width="480" height="360"></a>
          <div class="body"><h3>${esc(x.name)}</h3>
            <p class="meta">รหัส ${esc(x.code)}</p>
            <p class="desc">${esc(L.shortDesc(x))}</p>
            <p class="go"><a class="btn btn--line" href="product.html?i=${x.i}">ดูรายละเอียด</a></p></div>
        </article>`).join('')}</div>
    </div>` : ''}`;
}

/* ---------------- เริ่มต้น ---------------- */
const sid = p.get('s');
if (sid) {
  const s = S.find(x => x.id === sid);
  s ? renderService(s) : notFound();
} else {
  const i = parseInt(p.get('i'), 10);
  const r = Number.isInteger(i) && i >= 0 && i < C.items.length ? L.row(i) : null;
  r ? renderProduct(r) : notFound();
}

})();
