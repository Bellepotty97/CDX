/* แคตตาล็อกสินค้าในหน้าสินค้าและบริการ
   ต่างจากเวอร์ชันเดิมที่ฝังอยู่ในหน้าแรกตรงที่ ตัวกรองและคำค้นถูกเขียนลง URL
   ทำให้แชร์ลิงก์ที่กรองไว้แล้วได้ กดปุ่มย้อนกลับได้ และยิงโฆษณาเข้ากลุ่มสินค้าตรง ๆ ได้ */
(function () {
'use strict';

const CAT = window.PEM_CATALOG;
const chipsEl = document.getElementById('chips');
const listEl  = document.getElementById('plist');
const metaEl  = document.getElementById('catmeta');
const moreBtn = document.getElementById('moreBtn');
const q       = document.getElementById('q');
const PAGE = 40;
let activeCore = null, shown = PAGE, matches = [];

const counts = CAT.core.map((_, i) => CAT.items.filter(it => it[0] === i).length);

function buildChips() {
  const order = CAT.core.map((n, i) => [n, i, counts[i]]).sort((a, b) => b[2] - a[2]);
  chipsEl.innerHTML = `<button class="chip" data-core="">ทั้งหมด <b>${CAT.items.length}</b></button>` +
    order.map(([n, i, c]) => `<button class="chip" data-core="${i}">${n} <b>${c}</b></button>`).join('');
}
function markChips() {
  chipsEl.querySelectorAll('.chip').forEach(c =>
    c.classList.toggle('is-on', c.dataset.core === (activeCore === null ? '' : String(activeCore))));
}

function apply(push) {
  const term = q.value.trim().toLowerCase();
  matches = CAT.items.filter(it => {
    if (activeCore !== null && it[0] !== activeCore) return false;
    if (!term) return true;
    return (it[2] + ' ' + it[3] + ' ' + CAT.core[it[0]] + ' ' + CAT.type[it[1]] + ' ' + it[4]).toLowerCase().includes(term);
  });
  shown = PAGE;
  markChips();
  render();
  if (push !== false) writeUrl();
}

function render() {
  const label = activeCore !== null ? CAT.core[activeCore] : null;
  metaEl.textContent = matches.length
    ? `พบ ${matches.length} รายการ` + (label ? ` ในกลุ่ม ${label}` : '')
    : 'ไม่พบสินค้าที่ตรงกับคำค้น ลองพิมพ์คำอื่น หรือติดต่อฝ่ายขายโดยตรง';
  listEl.innerHTML = matches.slice(0, shown).map(it => `
    <article class="prow">
      <div class="pmain">
        <span class="ico">${PEM_ICON.svg(PEM_ICON.byCore(CAT.core[it[0]]), 20)}</span>
        <div>
          <h3>${it[2]}</h3>
          <span class="pmeta">${CAT.core[it[0]]} · ${CAT.type[it[1]]}</span>
        </div>
      </div>
      <span class="pcode">${it[3]}</span>
      <a class="pask" href="#contact">ขอราคา</a>
    </article>`).join('');
  moreBtn.hidden = matches.length <= shown;
  if (!moreBtn.hidden) moreBtn.textContent = `แสดงเพิ่ม (เหลืออีก ${matches.length - shown})`;
  document.title = (label ? label + ' — ' : '') +
    'สินค้าและบริการ หม้อแปลงไฟฟ้า อุปกรณ์ระบบจำหน่าย | PEM พรีไซซ อีเลคตริค แมนูแฟคเจอริ่ง';
}

/* ---------- ตัวกรองใน URL ---------- */
function writeUrl() {
  const p = new URLSearchParams();
  if (activeCore !== null) p.set('core', CAT.core[activeCore]);
  if (q.value.trim()) p.set('q', q.value.trim());
  const url = location.pathname + (p.toString() ? '?' + p : '') + location.hash;
  history.replaceState(null, '', url);
}
function readUrl() {
  const p = new URLSearchParams(location.search);
  const core = p.get('core');
  const i = core ? CAT.core.indexOf(core) : -1;
  activeCore = i >= 0 ? i : null;
  q.value = p.get('q') || '';
}

/* ---------- เหตุการณ์ ---------- */
chipsEl.addEventListener('click', e => {
  const b = e.target.closest('.chip');
  if (!b) return;
  activeCore = b.dataset.core === '' ? null : +b.dataset.core;
  apply();
  document.getElementById('catalog').scrollIntoView({ block:'start', behavior:'smooth' });
});

// ลิงก์ในเมนูใหญ่และ footer ที่ชี้มาหน้านี้อยู่แล้ว ให้กรองในที่โดยไม่โหลดหน้าใหม่
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-core]');
  if (!a) return;
  const i = CAT.core.indexOf(a.dataset.core);
  if (i < 0) return;
  e.preventDefault();
  activeCore = i;
  q.value = '';
  apply();
  document.getElementById('catalog').scrollIntoView({ block:'start', behavior:'smooth' });
});

moreBtn.addEventListener('click', () => { shown += PAGE; render(); });
q.addEventListener('input', () => apply());
document.getElementById('clearBtn').addEventListener('click', () => {
  q.value = ''; activeCore = null; apply(); q.focus();
});
// กดเมนู "สินค้าและบริการ" ขณะอยู่หน้านี้อยู่แล้ว ให้ล้างตัวกรองแล้วเลื่อนขึ้นบน
// แทนการโหลดหน้าใหม่ทั้งหน้า
document.addEventListener('click', e => {
  const a = e.target.closest('a.top[href]');
  if (!a || a.dataset.core) return;
  if (new URL(a.href, location.href).pathname !== location.pathname) return;
  e.preventDefault();
  activeCore = null; q.value = ''; apply();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const allBtn = document.getElementById('allProducts');
if (allBtn) allBtn.addEventListener('click', e => {
  e.preventDefault();
  activeCore = null; q.value = ''; apply();
  document.getElementById('catalog').scrollIntoView({ block:'start', behavior:'smooth' });
});
window.addEventListener('popstate', () => { readUrl(); apply(false); });

buildChips();
readUrl();
apply(false);

})();
