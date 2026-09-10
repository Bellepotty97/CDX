/* Dealer Management Platform — ตรรกะหน้าจอทั้งหมด
   ข้อมูลผลงาน คำสั่งซื้อ และคะแนนสะสมในไฟล์นี้เป็นข้อมูลสาธิตที่สร้างขึ้นแบบคงที่
   ระบบจริงต้องดึงจาก Odoo ผ่าน backend ไม่ใช่สร้างในเบราว์เซอร์ */
(function () {
'use strict';

const D = window.PEM_DEALER;
const C = window.PEM_CATALOG;
const $ = s => document.querySelector(s);
const baht = n => D.baht(Math.round(n));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------------- ตรวจสอบการเข้าสู่ระบบ ---------------- */
function session() {
  try { return sessionStorage.getItem('pem_dealer_session') || localStorage.getItem('pem_dealer_session'); }
  catch (_) { return null; }
}
if (session() !== D.demoAccount.user) { location.replace('dealer.html#tab-login'); return; }

const ME    = D.demoAccount;
const GROUP = D.groupById(ME.groupId);
const TIER  = D.tierById(ME.tierId);
const isPEA = ME.groupId === 'pea';

$('#whoCompany').textContent = ME.company;
$('#whoMeta').innerHTML = `${esc(ME.code)} · ${esc(GROUP.name)} · ${esc(TIER.id)} ${esc(TIER.name)}`;
$('#logout').addEventListener('click', () => {
  try { sessionStorage.removeItem('pem_dealer_session'); localStorage.removeItem('pem_dealer_session'); } catch (_) {}
  location.href = 'dealer.html';
});

/* ---------------- ราคาของคู่ค้ารายนี้ ---------------- */
const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const NOW_M  = 9; // ข้อมูลสาธิตปิดยอดถึงเดือนกันยายน 2569

const ROWS = C.items.map((it, i) => {
  const core = C.core[it[0]];
  const base = D.basePrice(core, it[3]);
  const lt   = D.leadTime[core] || D.leadTimeDefault;
  return { i, core, type: C.type[it[1]], name: it[2], code: it[3], biz: it[4],
           base, net: D.netPrice(base, GROUP, TIER), lt };
});

/* ---------------- ข้อมูลผลงานสาธิต ---------------- */
const ANNUAL = { T1: 3000000, T2: 8000000, T3: 18000000, T4: 40000000 }[TIER.id];
const SEASON = [.06,.06,.09,.07,.08,.09,.09,.08,.09,.10,.10,.09];
const PERF = MONTHS.map((m, i) => {
  const target = Math.round(ANNUAL * SEASON[i] / 1000) * 1000;
  const swing  = [1.08,.86,1.14,.94,1.02,1.21,.89,1.06,1.11,0,0,0][i];
  return { m, i, target, actual: i < NOW_M ? Math.round(target * swing / 1000) * 1000 : null };
});
const YTD_A = PERF.slice(0, NOW_M).reduce((s, r) => s + r.actual, 0);
const YTD_T = PERF.slice(0, NOW_M).reduce((s, r) => s + r.target, 0);
const POINTS = Math.round(YTD_A / 1000 * TIER.point);

/* ---------------- คำสั่งซื้อสาธิต ---------------- */
const STATUS = ['ร่าง (ในตะกร้า)','สั่งซื้อแล้ว','เปิด PO','รอจัดส่ง','จัดส่งแล้ว','ชำระเงินแล้ว','ให้คะแนนแล้ว'];
const RATE_TOPICS = ['คุณภาพสินค้า','ความตรงเวลาในการส่งมอบ','การประสานงานของฝ่ายขาย','ความถูกต้องของเอกสาร'];

let ORDERS = [
  { id:'SO-69-0421', date:'2569-08-12', step:6, lines:[[5,3],[210,20]],
    rating:{ 'คุณภาพสินค้า':5,'ความตรงเวลาในการส่งมอบ':4,'การประสานงานของฝ่ายขาย':5,'ความถูกต้องของเอกสาร':4 } },
  { id:'SO-69-0468', date:'2569-08-28', step:5, lines:[[120,6],[300,40]], rating:null },
  { id:'SO-69-0502', date:'2569-09-02', step:4, lines:[[64,2]], rating:null },
  { id:'SO-69-0517', date:'2569-09-05', step:3, lines:[[18,10],[240,15],[401,4]], rating:null },
  { id:'SO-69-0523', date:'2569-09-08', step:1, lines:[[380,25]], rating:null },
];
const orderTotal = o => o.lines.reduce((s, [i, q]) => s + (ROWS[i] ? ROWS[i].net * q : 0), 0);

/* ---------------- งานที่แจ้งเข้ามา ---------------- */
const LEAD_STATUS = ['ส่งเรื่องแล้ว','PEM รับเรื่อง','กำลังเสนอราคา','ได้งาน','ไม่ได้งาน','จ่ายค่าตอบแทนแล้ว'];
let LEADS = [
  { id:'JB-69-0031', date:'2569-07-14', name:'ปรับปรุงหม้อแปลงโรงงานย่านบางบัวทอง',
    cust:'บริษัท อุตสาหกรรมตัวอย่าง จำกัด', value:2400000, kind:'สินค้า', step:5, comm:36000 },
  { id:'JB-69-0044', date:'2569-08-21', name:'ติดตั้งระบบ EMS อาคารสำนักงาน',
    cust:'นิติบุคคลอาคารชุดตัวอย่าง', value:1150000, kind:'บริการ', step:2, comm:null },
  { id:'JB-69-0052', date:'2569-09-03', name:'เปลี่ยน Load Break Switch สายป้อน กฟอ.ปากเกร็ด',
    cust:'การไฟฟ้าส่วนภูมิภาค', value:860000, kind:'สินค้า', step:1, comm:null },
];
const COMMISSION = { 'สินค้า':0.015, 'บริการ':0.03 };

/* ---------------- ตะกร้า ---------------- */
let CART = {};
try { CART = JSON.parse(sessionStorage.getItem('pem_dealer_cart') || '{}'); } catch (_) {}
function saveCart() { try { sessionStorage.setItem('pem_dealer_cart', JSON.stringify(CART)); } catch (_) {} }
const cartCount = () => Object.values(CART).reduce((s, q) => s + q, 0);
const cartTotal = () => Object.entries(CART).reduce((s, [i, q]) => s + ROWS[i].net * q, 0);

/* ---------------- เมนู ---------------- */
const MENUS = [
  { id:'perf',     n:1, name:'Target & Performance' },
  { id:'shop',     n:2, name:'สั่งซื้อสินค้า' },
  { id:'price',    n:3, name:'Check Pricelist' },
  { id:'orders',   n:4, name:'Order Status' },
  { id:'leads',    n:5, name:'แจ้งงาน / ส่งต่อโอกาสขาย' },
  { id:'training', n:6, name:'Training' },
  { id:'appoint',  n:7, name:'หนังสือแต่งตั้ง', peaOnly:true },
  { id:'reward',   n:8, name:'Rewards' },
].filter(m => !m.peaOnly || isPEA);

function drawNav() {
  $('#side').innerHTML = '<h4>เมนู</h4>' + MENUS.map(m => `
    <button class="navbtn" data-view="${m.id}" type="button">
      <span class="n">${m.n}</span><span>${esc(m.name)}</span>
      ${m.id === 'shop' && cartCount() ? `<span class="tag">${cartCount()}</span>` : ''}
    </button>`).join('');
  $('#side').querySelectorAll('.navbtn').forEach(b =>
    b.addEventListener('click', () => go(b.dataset.view)));
  markNav();
}
function markNav() {
  $('#side').querySelectorAll('.navbtn').forEach(b => {
    if (b.dataset.view === CURRENT) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
}

/* ---------------- โมดัล ---------------- */
function modal(html) {
  $('#modalBody').innerHTML = html;
  $('#modal').hidden = false;
  const c = $('#modalBody').querySelector('[data-close]');
  if (c) c.addEventListener('click', closeModal);
}
function closeModal() { $('#modal').hidden = true; $('#modalBody').innerHTML = ''; }
$('#modal').addEventListener('click', e => { if (e.target === $('#modal')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

/* ================================================================
   1. TARGET & PERFORMANCE
   ================================================================ */
function viewPerf() {
  const pct  = YTD_A / YTD_T;
  const rank = 3, groupSize = 14;
  const credit = ME.creditLimit - ME.creditUsed;

  return `
  <div class="viewhead">
    <h1>Target &amp; Performance</h1>
    <p>เป้าหมายและผลงานของ ${esc(ME.company)} ปี 2569 เป้าหมายกำหนดตามกลุ่ม
       <b>${esc(GROUP.name)}</b> และระดับ <b>${esc(TIER.id)} ${esc(TIER.name)}</b>
       ทบทวนระดับทุกไตรมาสจากยอดซื้อที่ชำระแล้วย้อนหลัง 12 เดือน</p>
  </div>

  <div class="kpirow">
    <div class="kpi">
      <div class="lab">ยอดซื้อสะสม ม.ค.–ก.ย.</div>
      <div class="val">${baht(YTD_A)}</div>
      <div class="sub">เป้าสะสม ${baht(YTD_T)} บาท</div>
      <div class="meter"><i class="${pct >= 1 ? 'over' : 'under'}" style="width:${Math.min(pct * 100, 100)}%"></i></div>
    </div>
    <div class="kpi">
      <div class="lab">ผลงานเทียบเป้าสะสม</div>
      <div class="val">${(pct * 100).toFixed(1)}%</div>
      <div class="delta ${pct >= 1 ? 'up' : 'down'}">${pct >= 1 ? '▲ เกินเป้า ' : '▼ ต่ำกว่าเป้า '}${baht(Math.abs(YTD_A - YTD_T))} บาท</div>
    </div>
    <div class="kpi">
      <div class="lab">อันดับในกลุ่ม ${esc(GROUP.name)}</div>
      <div class="val">${rank} <span style="font-size:.9rem;font-weight:400;color:var(--muted)">/ ${groupSize}</span></div>
      <div class="sub">จัดอันดับจาก % ที่ทำได้เทียบเป้า</div>
    </div>
    <div class="kpi">
      <div class="lab">วงเงินเครดิตคงเหลือ</div>
      <div class="val">${baht(credit)}</div>
      <div class="sub">ใช้ไป ${baht(ME.creditUsed)} จาก ${baht(ME.creditLimit)} · ${esc(TIER.credit)}</div>
      <div class="meter"><i style="width:${ME.creditUsed / ME.creditLimit * 100}%"></i></div>
    </div>
  </div>

  <div class="chartcard">
    <div class="cardhead" style="margin-bottom:6px">
      <div><h2 style="font-size:1.05rem;color:var(--blue-dark)">ยอดซื้อรายเดือนเทียบเป้าหมาย ปี 2569</h2>
        <p style="color:var(--muted);font-size:.86rem;margin-top:4px">หน่วย: ล้านบาท · ข้อมูลถึงเดือนกันยายน</p></div>
      <span class="sp"></span>
      <button class="btn btn--line btn--sm" id="tblToggle" type="button">ดูเป็นตาราง</button>
    </div>
    <div class="legend">
      <span><i class="swatch"></i>ยอดซื้อจริง</span>
      <span><i class="swatch tick"></i>เป้าหมาย</span>
    </div>
    <div class="chartbox" id="chartbox"></div>
    <div id="perfTable" hidden style="margin-top:16px"></div>
  </div>

  <div class="note" style="margin-top:18px">
    เหลืออีก <b>${baht(Math.max(ANNUAL - YTD_A, 0))} บาท</b> จะถึงเป้าทั้งปี ${baht(ANNUAL)} บาท
    ${YTD_A >= D.tierById('T4').min ? '' :
      `· ยอดสะสม 12 เดือนอีก <b>${baht(Math.max(nextTierGap(), 0))} บาท</b> จะเลื่อนเป็นระดับถัดไป`}
  </div>`;
}
function nextTierGap() {
  const next = D.tiers[D.tiers.findIndex(t => t.id === TIER.id) + 1];
  return next ? next.min - YTD_A : 0;
}

// ปัดขั้นแกนให้เป็น 1, 2, 2.5 หรือ 5 คูณกำลังสิบ
function niceStep(x) {
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  const n = x / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

function drawChart() {
  const box = $('#chartbox'); if (!box) return;
  const W = 760, H = 268, L = 58, R = 14, T = 26, B = 38;
  const iw = W - L - R, ih = H - T - B;
  // ปัดเพดานแกนขึ้นเป็นเลขกลม เพื่อให้ค่าบนแกนอ่านง่าย
  const raw = Math.max(...PERF.map(p => Math.max(p.target, p.actual || 0))) * 1.08;
  const step = niceStep(raw / 4);
  const max = step * 4;
  const y = v => T + ih - (v / max) * ih;
  const slot = iw / PERF.length;
  const bw = Math.min(slot * 0.52, 34);

  const ticks = [0, 1, 2, 3, 4].map(i => i * step);
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="กราฟยอดซื้อรายเดือนเทียบเป้าหมาย">`;
  ticks.forEach(t => {
    svg += `<line class="gridline" x1="${L}" x2="${W - R}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>`;
    svg += `<text class="axistext" x="${L - 8}" y="${(y(t) + 4).toFixed(1)}" text-anchor="end">${(t / 1e6).toFixed(step < 5e5 ? 2 : 1)}</text>`;
  });
  PERF.forEach((p, i) => {
    const cx = L + slot * i + slot / 2;
    if (p.actual != null) {
      const h = Math.max(ih - (y(p.actual) - T), 2);
      svg += `<rect class="barmark" data-i="${i}" x="${(cx - bw / 2).toFixed(1)}" y="${y(p.actual).toFixed(1)}"
                width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4"/>`;
    }
    svg += `<line class="tickmark" x1="${(cx - bw * 0.78).toFixed(1)}" x2="${(cx + bw * 0.78).toFixed(1)}"
              y1="${y(p.target).toFixed(1)}" y2="${y(p.target).toFixed(1)}"/>`;
    svg += `<text class="axistext" x="${cx.toFixed(1)}" y="${H - 14}" text-anchor="middle">${p.m}</text>`;
  });
  // ป้ายตัวเลขเฉพาะเดือนล่าสุด เพื่อไม่ให้ตัวเลขเต็มกราฟ
  const last = PERF[NOW_M - 1];
  const lx = L + slot * (NOW_M - 1) + slot / 2;
  svg += `<text class="vallabel" x="${lx.toFixed(1)}" y="${(y(last.actual) - 8).toFixed(1)}">${(last.actual / 1e6).toFixed(2)} ลบ.</text>`;
  // พื้นที่รับ hover กว้างกว่าแท่ง
  PERF.forEach((p, i) => {
    svg += `<rect class="hit" data-i="${i}" x="${(L + slot * i).toFixed(1)}" y="${T}" width="${slot.toFixed(1)}"
              height="${ih}" fill="transparent" style="cursor:pointer"/>`;
  });
  svg += `<line class="gridline" x1="${L}" x2="${W - R}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}"/></svg>`;
  box.innerHTML = svg + '<div class="tip" id="tip"></div>';

  const tip = $('#tip');
  box.querySelectorAll('.hit').forEach(h => {
    h.addEventListener('mouseenter', ev => {
      const p = PERF[+h.dataset.i];
      const pc = p.actual == null ? null : p.actual / p.target;
      tip.innerHTML = `<b>${p.m} 2569</b><br>เป้าหมาย ${baht(p.target)} บาท<br>` +
        (p.actual == null ? 'ยังไม่ถึงกำหนด'
          : `ยอดจริง ${baht(p.actual)} บาท<br>${(pc * 100).toFixed(0)}% ของเป้า`);
      tip.classList.add('on');
      const r = box.getBoundingClientRect(), t = ev.target.getBoundingClientRect();
      tip.style.left = Math.max(4, Math.min(t.left - r.left + box.scrollLeft - 40, box.clientWidth - 160)) + 'px';
      tip.style.top  = '6px';
      box.querySelectorAll('.barmark').forEach(b => b.classList.toggle('is-on', b.dataset.i === h.dataset.i));
    });
    h.addEventListener('mouseleave', () => {
      tip.classList.remove('on');
      box.querySelectorAll('.barmark').forEach(b => b.classList.remove('is-on'));
    });
  });

  $('#perfTable').innerHTML = `<div class="tablewrap"><table>
    <thead><tr><th>เดือน</th><th class="num">เป้าหมาย</th><th class="num">ยอดจริง</th><th class="num">% ของเป้า</th><th class="num">ส่วนต่าง</th></tr></thead>
    <tbody>${PERF.map(p => `<tr><td>${p.m} 2569</td><td class="num">${baht(p.target)}</td>
      <td class="num">${p.actual == null ? '—' : baht(p.actual)}</td>
      <td class="num">${p.actual == null ? '—' : (p.actual / p.target * 100).toFixed(0) + '%'}</td>
      <td class="num" style="color:${p.actual == null ? 'var(--muted)' : p.actual >= p.target ? 'var(--ok)' : 'var(--bad)'}">
        ${p.actual == null ? '—' : (p.actual >= p.target ? '+' : '−') + baht(Math.abs(p.actual - p.target))}</td></tr>`).join('')}
    </tbody>
    <tfoot><tr><th>รวมสะสม</th><th class="num">${baht(YTD_T)}</th><th class="num">${baht(YTD_A)}</th>
      <th class="num">${(YTD_A / YTD_T * 100).toFixed(1)}%</th><th class="num"></th></tr></tfoot>
  </table></div>`;
  $('#tblToggle').addEventListener('click', e => {
    const t = $('#perfTable');
    t.hidden = !t.hidden;
    e.target.textContent = t.hidden ? 'ดูเป็นตาราง' : 'ซ่อนตาราง';
  });
}

/* ================================================================
   2. สั่งซื้อสินค้า
   ================================================================ */
let shopCore = null, shopTerm = '', shopShown = 30;

function viewShop() {
  return `
  <div class="viewhead">
    <h1>สั่งซื้อสินค้า</h1>
    <p>รายการสินค้าชุดเดียวกับหน้าเว็บสาธารณะ แต่แสดงราคาของท่านตามกลุ่ม <b>${esc(GROUP.name)}</b>
       (ส่วนลด ${(GROUP.disc*100).toFixed(0)}%) และระดับ <b>${esc(TIER.id)} ${esc(TIER.name)}</b>
       (ส่วนลดเพิ่ม ${(TIER.disc*100).toFixed(0)}%) พร้อมระยะเวลาส่งมอบโดยประมาณ</p>
  </div>
  <div class="note warn" style="margin-bottom:18px">
    <span class="ph" title="รอราคาจริงจากฝ่ายขาย ตัวเลขที่เห็นสร้างขึ้นเพื่อสาธิตการทำงานของระบบ">
    ราคาที่แสดงเป็นราคาประมาณการเพื่อสาธิตระบบ ยังไม่ใช่ราคาตาม Price List ฉบับจริง</span>
  </div>
  <div class="toolbar">
    <input type="search" id="shopQ" placeholder="ค้นหาชื่อรุ่น พิกัด หรือรหัสสินค้า" value="${esc(shopTerm)}">
    <button class="btn btn--line btn--sm" id="shopClear" type="button">ล้าง</button>
  </div>
  <div class="toolbar" id="shopChips"></div>
  <p style="color:var(--muted);font-size:.88rem;margin-bottom:12px" id="shopMeta"></p>
  <div id="shopList"></div>
  <p style="text-align:center;margin-top:20px"><button class="btn btn--line" id="shopMore" type="button" hidden></button></p>
  <div id="cartBar"></div>`;
}

function shopMatches() {
  const t = shopTerm.trim().toLowerCase();
  return ROWS.filter(r => {
    if (shopCore !== null && r.core !== shopCore) return false;
    if (!t) return true;
    return (r.name + ' ' + r.code + ' ' + r.core + ' ' + r.type + ' ' + r.biz).toLowerCase().includes(t);
  });
}

function drawShop() {
  const counts = {};
  ROWS.forEach(r => counts[r.core] = (counts[r.core] || 0) + 1);
  const order = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  $('#shopChips').innerHTML =
    `<button class="pill${shopCore === null ? ' is-on' : ''}" data-core="">ทั้งหมด <b>${ROWS.length}</b></button>` +
    order.map(c => `<button class="pill${shopCore === c ? ' is-on' : ''}" data-core="${esc(c)}">${esc(c)} <b>${counts[c]}</b></button>`).join('');
  $('#shopChips').querySelectorAll('.pill').forEach(p => p.addEventListener('click', () => {
    shopCore = p.dataset.core || null; shopShown = 30; drawShop();
  }));

  const m = shopMatches();
  $('#shopMeta').textContent = m.length ? `พบ ${D.baht(m.length)} รายการ` : 'ไม่พบสินค้าที่ตรงกับคำค้น';
  $('#shopList').innerHTML = m.slice(0, shopShown).map(r => {
    const q = CART[r.i] || 0;
    return `<article class="prod">
      <div>
        <h3>${esc(r.name)}</h3>
        <div class="meta">${esc(r.core)} · ${esc(r.type)} · รหัส ${esc(r.code)}</div>
        <div class="lt">${r.lt.stock
          ? `<span class="badge is-ok">มีสต๊อก ส่งได้ใน ${r.lt.min}–${r.lt.max} วัน</span>`
          : `<span class="badge is-warn">ผลิตตามคำสั่งซื้อ ${r.lt.min}–${r.lt.max} วัน</span>`}</div>
      </div>
      <div class="right">
        <span class="base">${baht(r.base)}</span>
        <span class="net">${baht(r.net)} บาท</span>
        <span class="save">ประหยัด ${((1 - r.net / r.base) * 100).toFixed(0)}%</span>
        <span class="qty">
          <button type="button" data-dec="${r.i}" aria-label="ลดจำนวน">−</button>
          <input type="number" min="0" value="${q}" data-qty="${r.i}" aria-label="จำนวน ${esc(r.name)}">
          <button type="button" data-inc="${r.i}" aria-label="เพิ่มจำนวน">+</button>
        </span>
      </div>
    </article>`;
  }).join('');

  const more = $('#shopMore');
  more.hidden = m.length <= shopShown;
  if (!more.hidden) more.textContent = `แสดงเพิ่ม (เหลืออีก ${D.baht(m.length - shopShown)})`;

  $('#shopList').querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', () => bump(+b.dataset.inc, 1)));
  $('#shopList').querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', () => bump(+b.dataset.dec, -1)));
  $('#shopList').querySelectorAll('[data-qty]').forEach(inp => inp.addEventListener('change', () => {
    setQty(+inp.dataset.qty, Math.max(0, parseInt(inp.value, 10) || 0));
  }));
  drawCartBar();
}
function bump(i, d) { setQty(i, Math.max(0, (CART[i] || 0) + d)); }
function setQty(i, q) {
  if (q > 0) CART[i] = q; else delete CART[i];
  saveCart(); drawShop(); drawNav();
}

function drawCartBar() {
  const n = cartCount();
  $('#cartBar').innerHTML = !n ? '' : `
    <div class="cartbar">
      <span>ในตะกร้า <b>${n}</b> ชิ้น จาก ${Object.keys(CART).length} รายการ</span>
      <span class="sp"></span>
      <span>รวม <b>${baht(cartTotal())} บาท</b> <span style="font-size:.8rem;color:#9dc4e2">(ยังไม่รวม VAT)</span></span>
      <button class="btn btn--line btn--sm" id="cartClear" type="button">ล้างตะกร้า</button>
      <button class="btn btn--orange btn--sm" id="cartSubmit" type="button">ยืนยันสั่งซื้อ</button>
    </div>`;
  if (!n) return;
  $('#cartClear').addEventListener('click', () => { CART = {}; saveCart(); drawShop(); drawNav(); });
  $('#cartSubmit').addEventListener('click', submitCart);
}

function submitCart() {
  const id = 'SO-69-' + String(600 + ORDERS.length * 7);
  ORDERS.unshift({ id, date: '2569-09-10', step: 1,
                   lines: Object.entries(CART).map(([i, q]) => [+i, q]), rating: null });
  CART = {}; saveCart(); drawShop(); drawNav();
  modal(`<h2 style="color:var(--blue-dark)">ส่งคำสั่งซื้อแล้ว</h2>
    <p style="color:var(--muted);margin-top:10px">เลขที่คำสั่งซื้อ <b style="color:var(--ink)">${id}</b>
      ฝ่ายขายจะตรวจสอบและออก PO ให้ ติดตามสถานะได้ที่เมนู Order Status</p>
    <p class="ph" style="display:inline-block;margin-top:14px;color:var(--muted);font-size:.86rem"
       title="ยังไม่ได้เชื่อมกับ Odoo คำสั่งซื้อนี้อยู่ในหน่วยความจำของเบราว์เซอร์เท่านั้น">
      หน้าสาธิต คำสั่งซื้อยังไม่ถูกส่งไปที่ระบบใด</p>
    <p style="margin-top:20px"><button class="btn btn--solid" data-close type="button">ปิด</button>
      <button class="btn btn--line" id="goOrders" type="button" style="margin-left:8px">ไปที่ Order Status</button></p>`);
  $('#goOrders').addEventListener('click', () => { closeModal(); go('orders'); });
}

/* ================================================================
   3. CHECK PRICELIST
   ================================================================ */
let priceCore = null;
function viewPrice() {
  return `
  <div class="viewhead">
    <h1>Check Pricelist</h1>
    <p>ราคาสินค้าทั้งหมด ${D.baht(ROWS.length)} รายการ ตามกลุ่มและระดับของท่าน
       สั่งพิมพ์หรือบันทึกเป็น PDF ได้จากปุ่มด้านขวา</p>
  </div>
  <div class="note warn" style="margin-bottom:18px">
    <span class="ph" title="รอราคาจริงจากฝ่ายขาย ตัวเลขที่เห็นสร้างขึ้นเพื่อสาธิตการทำงานของระบบ">
    ราคาประมาณการเพื่อสาธิตระบบ ยังไม่ใช่ราคาตาม Price List ฉบับจริง</span>
  </div>
  <div class="toolbar noprint">
    <select id="priceCore"><option value="">ทุกกลุ่มสินค้า</option>
      ${C.core.slice().sort().map(c => `<option${priceCore === c ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select>
    <span class="sp"></span>
    <button class="btn btn--line btn--sm" id="priceCsv" type="button">ดาวน์โหลด CSV</button>
    <button class="btn btn--line btn--sm" onclick="window.print()" type="button">พิมพ์ / บันทึก PDF</button>
  </div>
  <div class="card" style="padding:18px 20px;margin-bottom:16px">
    <div style="display:flex;gap:26px;flex-wrap:wrap;font-size:.9rem">
      <span>คู่ค้า <b>${esc(ME.company)}</b></span>
      <span>รหัส <b>${esc(ME.code)}</b></span>
      <span>กลุ่ม <span class="badge">${esc(GROUP.name)} −${(GROUP.disc*100).toFixed(0)}%</span></span>
      <span>ระดับ <span class="badge is-tier">${esc(TIER.id)} ${esc(TIER.name)} −${(TIER.disc*100).toFixed(0)}%</span></span>
      <span>เงื่อนไขชำระเงิน <b>${esc(TIER.credit)}</b></span>
    </div>
  </div>
  <div id="priceTable"></div>`;
}
function drawPrice() {
  const rows = priceCore ? ROWS.filter(r => r.core === priceCore) : ROWS;
  $('#priceTable').innerHTML = `<div class="tablewrap"><table>
    <thead><tr><th>รหัสสินค้า</th><th>รายละเอียด</th><th>กลุ่มสินค้า</th>
      <th class="num">ราคาตั้ง</th><th class="num">ราคาของท่าน</th><th class="num">ส่วนลดรวม</th><th>ส่งมอบ</th></tr></thead>
    <tbody>${rows.map(r => `<tr>
      <td style="white-space:nowrap">${esc(r.code)}</td>
      <td>${esc(r.name)}</td>
      <td>${esc(r.core)}<br><span style="color:var(--muted);font-size:.8rem">${esc(r.type)}</span></td>
      <td class="num" style="color:var(--muted)">${baht(r.base)}</td>
      <td class="num"><b>${baht(r.net)}</b></td>
      <td class="num" style="color:var(--ok)">${((1 - r.net / r.base) * 100).toFixed(0)}%</td>
      <td style="white-space:nowrap">${r.lt.min}–${r.lt.max} วัน</td></tr>`).join('')}</tbody>
  </table></div>
  <p style="color:var(--muted);font-size:.84rem;margin-top:10px">แสดง ${D.baht(rows.length)} รายการ · ราคาไม่รวม VAT 7%</p>`;

  $('#priceCore').addEventListener('change', e => { priceCore = e.target.value || null; drawPrice(); });
  $('#priceCsv').addEventListener('click', () => {
    const head = ['รหัสสินค้า','รายละเอียด','กลุ่มสินค้า','ประเภท','ราคาตั้ง','ราคาของท่าน','ส่งมอบ(วัน)'];
    const body = rows.map(r => [r.code, r.name, r.core, r.type, r.base, r.net, `${r.lt.min}-${r.lt.max}`]);
    const csv = '﻿' + [head, ...body]
      .map(line => line.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    download(`pricelist-${ME.code}.csv`, csv, 'text/csv;charset=utf-8');
  });
}
function download(name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* ================================================================
   4. ORDER STATUS
   ================================================================ */
function viewOrders() {
  return `
  <div class="viewhead">
    <h1>Order Status</h1>
    <p>ติดตามคำสั่งซื้อตั้งแต่ร่างในตะกร้าจนถึงชำระเงินและให้คะแนน
       เมื่อชำระเงินแล้วจะเปิดให้ให้คะแนนคำสั่งซื้อ และแจ้งปัญหาได้จากช่องทางเดียวกับหน้าเว็บ</p>
  </div>
  <div id="orderList"></div>`;
}
function drawOrders() {
  $('#orderList').innerHTML = ORDERS.map(o => {
    const total = orderTotal(o);
    const canRate = o.step >= 5;
    const avg = o.rating ? (Object.values(o.rating).reduce((a, b) => a + b, 0) / RATE_TOPICS.length) : null;
    return `<div class="card">
      <div class="cardhead" style="margin-bottom:4px">
        <div>
          <h2 style="font-size:1.05rem;color:var(--blue-dark)">${esc(o.id)}</h2>
          <p style="color:var(--muted);font-size:.86rem;margin-top:4px">
            สั่งเมื่อ ${esc(o.date)} · ${o.lines.length} รายการ · รวม <b style="color:var(--ink)">${baht(total)} บาท</b></p>
        </div>
        <span class="sp"></span>
        <span class="badge ${o.step >= 6 ? 'is-ok' : o.step >= 5 ? 'is-ok' : o.step === 0 ? 'is-mute' : 'is-warn'}">${esc(STATUS[o.step])}</span>
      </div>

      <div class="pipe">${STATUS.map((s, i) =>
        `<span class="st ${i < o.step ? 'done' : ''} ${i === o.step ? 'now done' : ''}">${esc(s)}</span>`).join('')}</div>

      <div class="tablewrap" style="margin-top:16px">
        <table><thead><tr><th>รหัส</th><th>รายละเอียด</th><th class="num">จำนวน</th><th class="num">ราคา/หน่วย</th><th class="num">รวม</th></tr></thead>
        <tbody>${o.lines.map(([i, q]) => { const r = ROWS[i]; return `<tr>
          <td style="white-space:nowrap">${esc(r.code)}</td><td>${esc(r.name)}</td>
          <td class="num">${q}</td><td class="num">${baht(r.net)}</td><td class="num">${baht(r.net * q)}</td></tr>`; }).join('')}
        </tbody></table>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;align-items:center">
        <button class="btn btn--line btn--sm" type="button" data-issue="${esc(o.id)}">แจ้งปัญหาคำสั่งซื้อนี้</button>
        ${canRate ? `<button class="btn ${o.rating ? 'btn--line' : 'btn--orange'} btn--sm" type="button" data-rate="${esc(o.id)}">
            ${o.rating ? 'แก้ไขคะแนน' : 'ให้คะแนนคำสั่งซื้อ'}</button>` : ''}
        ${avg ? `<span style="font-size:.88rem;color:var(--muted)">คะแนนเฉลี่ย
            <b style="color:#f5a623">${avg.toFixed(1)}</b> / 5</span>` : ''}
      </div>
    </div>`;
  }).join('');

  $('#orderList').querySelectorAll('[data-rate]').forEach(b =>
    b.addEventListener('click', () => rateModal(b.dataset.rate)));
  $('#orderList').querySelectorAll('[data-issue]').forEach(b =>
    b.addEventListener('click', () => { location.href = 'support.html?ref=' + encodeURIComponent(b.dataset.issue); }));
}

function rateModal(id) {
  const o = ORDERS.find(x => x.id === id);
  const cur = o.rating || {};
  modal(`<h2 style="color:var(--blue-dark)">ให้คะแนนคำสั่งซื้อ ${esc(id)}</h2>
    <p style="color:var(--muted);font-size:.9rem;margin-top:8px">ให้คะแนน 1–5 ดาวในแต่ละหัวข้อ เพื่อให้เราปรับปรุงการให้บริการ</p>
    <div style="margin-top:18px">${RATE_TOPICS.map(t => `
      <div class="rateline"><span>${esc(t)}</span>
        <span class="stars" data-topic="${esc(t)}">${[1,2,3,4,5].map(n =>
          `<button class="star${(cur[t] || 0) >= n ? ' on' : ''}" type="button" data-n="${n}"
             aria-label="${n} ดาว">★</button>`).join('')}</span></div>`).join('')}
    </div>
    <label class="field" style="margin-top:18px"><span>ความเห็นเพิ่มเติม</span>
      <textarea id="rateNote" placeholder="สิ่งที่อยากให้ปรับปรุง หรือสิ่งที่ประทับใจ"></textarea></label>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn--orange" id="rateSave" type="button">บันทึกคะแนน</button>
      <button class="btn btn--line" data-close type="button">ยกเลิก</button>
    </div>`);

  const picked = Object.assign({}, cur);
  $('#modalBody').querySelectorAll('.stars').forEach(box => {
    box.querySelectorAll('.star').forEach(s => s.addEventListener('click', () => {
      const n = +s.dataset.n;
      picked[box.dataset.topic] = n;
      box.querySelectorAll('.star').forEach(x => x.classList.toggle('on', +x.dataset.n <= n));
    }));
  });
  $('#rateSave').addEventListener('click', () => {
    if (Object.keys(picked).length < RATE_TOPICS.length) {
      alert('กรุณาให้คะแนนให้ครบทุกหัวข้อ'); return;
    }
    o.rating = picked;
    o.step = 6;
    closeModal(); drawOrders();
  });
}

/* ================================================================
   5. แจ้งงาน / ส่งต่อโอกาสขาย
   ================================================================ */
function viewLeads() {
  const paid = LEADS.filter(l => l.comm).reduce((s, l) => s + l.comm, 0);
  const pipeline = LEADS.filter(l => l.step < 3).reduce((s, l) => s + l.value, 0);
  return `
  <div class="viewhead">
    <h1>แจ้งงาน / ส่งต่อโอกาสขาย</h1>
    <p>พบงานที่เข้ากับสินค้าหรือบริการของพรีไซซ แต่เกินขอบเขตที่ท่านรับเองได้ ส่งเรื่องเข้ามาให้ทีมงานเข้าไปเสนอราคา
       ถ้าปิดงานได้ ท่านจะได้รับค่าตอบแทนตามสัดส่วนที่ตกลงไว้</p>
  </div>

  <div class="kpirow" style="grid-template-columns:repeat(3,1fr)">
    <div class="kpi"><div class="lab">งานที่แจ้งแล้ว</div><div class="val">${LEADS.length}</div>
      <div class="sub">ปี 2569</div></div>
    <div class="kpi"><div class="lab">มูลค่างานที่อยู่ระหว่างดำเนินการ</div><div class="val">${baht(pipeline)}</div>
      <div class="sub">ยังไม่สรุปผล</div></div>
    <div class="kpi"><div class="lab">ค่าตอบแทนที่ได้รับแล้ว</div><div class="val">${baht(paid)}</div>
      <div class="sub">จ่ายหลังลูกค้าชำระงวดสุดท้าย</div></div>
  </div>

  <div class="card">
    <h2>อัตราค่าตอบแทน</h2>
    <p>ข้อเสนอเพื่อพิจารณา ยังไม่ใช่เงื่อนไขที่ตกลงแล้ว</p>
    <div class="tablewrap" style="margin-top:14px">
      <table><thead><tr><th>ประเภทงาน</th><th class="num">ค่าตอบแทน</th><th>เงื่อนไข</th></tr></thead>
      <tbody>
        <tr><td>งานขายสินค้า</td><td class="num">1.5% ของมูลค่างาน</td><td>ต้องแจ้งก่อนที่ PEM จะติดต่อลูกค้ารายนั้นเอง</td></tr>
        <tr><td>งานบริการและโซลูชัน</td><td class="num">3.0% ของมูลค่างาน</td><td>EMS · MES · Solution Factory 4.0 · ติดตั้ง · บำรุงรักษา</td></tr>
        <tr><td>งานที่ Dealer ร่วมดำเนินการ</td><td class="num">ตกลงเป็นรายกรณี</td><td>เมื่อ Dealer รับผิดชอบติดตั้งหรือดูแลหลังการขายด้วย</td></tr>
      </tbody></table>
    </div>
  </div>

  <div class="card">
    <h2>แจ้งงานใหม่</h2>
    <form id="leadForm" style="margin-top:16px" novalidate>
      <label class="field"><span class="req">ชื่องาน / โครงการ</span><input type="text" name="name" required></label>
      <div class="grid2">
        <label class="field"><span class="req">ลูกค้า / เจ้าของงาน</span><input type="text" name="cust" required></label>
        <label class="field"><span>มูลค่างานโดยประมาณ (บาท)</span><input type="number" name="value" min="0" step="10000"></label>
        <label class="field"><span class="req">ประเภทงาน</span>
          <select name="kind" required><option value="สินค้า">งานขายสินค้า</option><option value="บริการ">งานบริการและโซลูชัน</option></select></label>
        <label class="field"><span>กำหนดที่ลูกค้าต้องการ</span><input type="date" name="due"></label>
      </div>
      <label class="field"><span>รายละเอียดงาน</span>
        <textarea name="detail" placeholder="ขอบเขตงาน สินค้าที่เกี่ยวข้อง ผู้ติดต่อฝั่งลูกค้า และข้อมูลที่ช่วยให้ทีมงานเตรียมตัวได้"></textarea></label>
      <button class="btn btn--orange" type="submit">ส่งเรื่อง</button>
    </form>
  </div>

  <div class="card">
    <h2>งานที่แจ้งไว้</h2>
    <div id="leadTable" style="margin-top:14px"></div>
  </div>`;
}
function drawLeads() {
  $('#leadTable').innerHTML = `<div class="tablewrap"><table>
    <thead><tr><th>เลขที่</th><th>งาน</th><th>ลูกค้า</th><th class="num">มูลค่า</th><th>ประเภท</th><th>สถานะ</th><th class="num">ค่าตอบแทน</th></tr></thead>
    <tbody>${LEADS.map(l => `<tr>
      <td style="white-space:nowrap">${esc(l.id)}</td>
      <td>${esc(l.name)}<br><span style="color:var(--muted);font-size:.8rem">แจ้ง ${esc(l.date)}</span></td>
      <td>${esc(l.cust)}</td>
      <td class="num">${baht(l.value)}</td>
      <td>${esc(l.kind)}</td>
      <td><span class="badge ${l.step === 3 || l.step === 5 ? 'is-ok' : l.step === 4 ? 'is-bad' : 'is-warn'}">${esc(LEAD_STATUS[l.step])}</span></td>
      <td class="num">${l.comm ? baht(l.comm) : '<span style="color:var(--muted)">ประมาณ ' + baht(l.value * COMMISSION[l.kind]) + '</span>'}</td>
    </tr>`).join('')}</tbody></table></div>`;

  $('#leadForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    if (!f.checkValidity()) { f.reportValidity(); return; }
    const d = Object.fromEntries(new FormData(f).entries());
    LEADS.unshift({ id:'JB-69-' + String(60 + LEADS.length * 3).padStart(4, '0'), date:'2569-09-10',
                    name:d.name, cust:d.cust, value:+d.value || 0, kind:d.kind, step:0, comm:null });
    f.reset(); drawLeads();
    modal(`<h2 style="color:var(--blue-dark)">รับเรื่องแล้ว</h2>
      <p style="color:var(--muted);margin-top:10px">ทีมขายจะติดต่อกลับภายใน 2 วันทำการเพื่อสอบถามรายละเอียดเพิ่มเติม</p>
      <p style="margin-top:18px"><button class="btn btn--solid" data-close type="button">ปิด</button></p>`);
  });
}

/* ================================================================
   6. TRAINING
   ================================================================ */
const TRAINING = {
  video: [
    { t:'แนะนำหม้อแปลงจำหน่าย Distribution Transformer', d:'โครงสร้าง พิกัด การเลือกใช้ และการติดตั้ง', len:'18 นาที' },
    { t:'Instrument Transformer แบบ Oil และ Dry', d:'ความต่าง การเลือกคลาสความแม่นยำ และงานที่เหมาะกับแต่ละแบบ', len:'14 นาที' },
    { t:'Surge Arrester และการป้องกันฟ้าผ่า', d:'หลักการทำงาน การเลือกพิกัด และจุดติดตั้งที่ถูกต้อง', len:'11 นาที' },
    { t:'Load Break Switch และ Recloser', d:'การทำงานของอุปกรณ์ตัดตอนในระบบจำหน่าย', len:'22 นาที' },
    { t:'ใช้งาน Dealer Management Platform เบื้องต้น', d:'เข้าสู่ระบบ ดูราคา สั่งซื้อ และติดตามสถานะ', len:'9 นาที' },
    { t:'ขั้นตอนขอหนังสือแต่งตั้งเข้างานการไฟฟ้า', d:'เอกสารที่ต้องเตรียม ระยะเวลา และข้อควรระวัง', len:'7 นาที' },
  ],
  doc: [
    { t:'แคตตาล็อกสินค้า PEM ฉบับรวม', d:'สินค้าทั้ง 17 กลุ่มพร้อมพิกัดและรหัสสินค้า', k:'PDF' },
    { t:'คู่มือติดตั้งหม้อแปลงจำหน่าย', d:'ขั้นตอนติดตั้ง ทดสอบ และตรวจรับ', k:'PDF' },
    { t:'ตารางเทียบพิกัดฟิวส์และดรอพเอาท์', d:'สำหรับเลือกอุปกรณ์ให้ตรงกับงานการไฟฟ้า', k:'PDF' },
    { t:'เงื่อนไขการรับประกันสินค้า', d:'ระยะเวลารับประกัน ขอบเขต และขั้นตอนการเคลม', k:'PDF' },
  ],
  manual: [
    { t:'คู่มือการใช้งานระบบ Dealer Management Platform', d:'ครอบคลุมทุกเมนูตั้งแต่เข้าสู่ระบบจนถึงการแลกของรางวัล', k:'PDF' },
    { t:'ขั้นตอนการสั่งซื้อและเปิด PO', d:'ผังงานตั้งแต่ใส่ตะกร้าจนถึงรับสินค้า', k:'PDF' },
    { t:'วิธีให้คะแนนและแจ้งปัญหาคำสั่งซื้อ', d:'ช่องทางเดียวกับที่ลูกค้าทั่วไปใช้บนหน้าเว็บ', k:'PDF' },
  ],
};
function viewTraining() {
  const card = (x, go) => `<article class="tile"><h3>${esc(x.t)}</h3><p>${esc(x.d)}</p>
    <span class="go ph" title="รอไฟล์จริงจากฝ่ายขายและฝ่ายเทคนิค">${go}</span></article>`;
  return `
  <div class="viewhead">
    <h1>Training</h1>
    <p>สื่อการเรียนรู้เรื่องสินค้าและบริการ พร้อมคู่มือการใช้งานระบบ Dealer Management Platform</p>
  </div>
  <div class="note warn" style="margin-bottom:20px">
    <span class="ph" title="รอไฟล์วิดีโอและเอกสารจริงจากทีมงาน รายการที่เห็นเป็นโครงเนื้อหาที่เสนอไว้">
    รายการทั้งหมดเป็นโครงเนื้อหาที่เสนอไว้ ยังไม่มีไฟล์จริงในระบบ</span>
  </div>

  <h2 style="font-size:1.05rem;color:var(--blue-dark);margin-bottom:12px">วิดีโอ</h2>
  <div class="tiles" style="margin-bottom:26px">
    ${TRAINING.video.map(v => `<article class="tile" style="padding:0;overflow:hidden">
      <div class="vid"></div>
      <div style="padding:16px 18px;display:flex;flex-direction:column;gap:6px;flex:1">
        <h3>${esc(v.t)}</h3><p>${esc(v.d)}</p>
        <span class="go ph" title="รอไฟล์วิดีโอจริง">เล่นวิดีโอ · ${esc(v.len)}</span>
      </div></article>`).join('')}
  </div>

  <h2 style="font-size:1.05rem;color:var(--blue-dark);margin-bottom:12px">เอกสารสินค้า</h2>
  <div class="tiles" style="margin-bottom:26px">${TRAINING.doc.map(d => card(d, 'ดาวน์โหลด ' + d.k)).join('')}</div>

  <h2 style="font-size:1.05rem;color:var(--blue-dark);margin-bottom:12px">คู่มือการใช้งานระบบ</h2>
  <div class="tiles">${TRAINING.manual.map(d => card(d, 'ดาวน์โหลด ' + d.k)).join('')}</div>`;
}

/* ================================================================
   7. หนังสือแต่งตั้ง (เฉพาะกลุ่ม Dealer-PEA Regional)
   ================================================================ */
const APPOINT_STATUS = ['ยื่นคำขอ','ฝ่ายขายตรวจสอบ','ผู้จัดการลงนาม','ออกหนังสือแล้ว','หมดอายุ'];
let APPOINTS = [
  { id:'PEM.จ.-69-2301', date:'2569-08-04', area:'กฟอ.ปากเกร็ด', item:'ดรอพเอาท์ฟิวส์คัทเอาท์ 22 เควี 100 แอมป์ 12 เคเอ',
    code:'1040010002', qty:50, from:'2569-08-04', to:'2569-08-19', step:3 },
  { id:'PEM.จ.-69-2338', date:'2569-09-01', area:'กฟจ.นนทบุรี', item:'หม้อแปลงจำหน่าย 3 เฟส 250 kVA 22kV',
    code:'1030030012', qty:4, from:'2569-09-01', to:'2569-09-30', step:2 },
];

function viewAppoint() {
  return `
  <div class="viewhead">
    <h1>หนังสือแต่งตั้งเข้างานการไฟฟ้า</h1>
    <p>สำหรับกลุ่ม <b>Dealer-PEA Regional</b> ขอหนังสือแต่งตั้งตัวแทนจำหน่ายจาก PEM เพื่อใช้ยื่นเข้างานตกลงราคา
       ของการไฟฟ้าส่วนภูมิภาค ระบุสินค้า จำนวน เขตการไฟฟ้า และช่วงเวลาที่ต้องการให้มีผล</p>
  </div>

  <div class="card">
    <h2>ยื่นคำขอหนังสือแต่งตั้ง</h2>
    <form id="apForm" style="margin-top:16px" novalidate>
      <div class="grid2">
        <label class="field"><span class="req">เขตการไฟฟ้าที่เข้างาน</span>
          <input type="text" name="area" required list="peaList" placeholder="เช่น กฟอ.สวรรคโลก">
          <datalist id="peaList">${ME.peaAreas.map(a => `<option value="${esc(a)}">`).join('')}</datalist></label>
        <label class="field"><span class="req">จำนวน (ชุด/ตัว)</span><input type="number" name="qty" min="1" required></label>
      </div>
      <label class="field"><span class="req">สินค้าที่ขอแต่งตั้ง</span>
        <input type="text" name="item" required list="itemList" placeholder="พิมพ์ชื่อรุ่นหรือรหัสสินค้า">
        <datalist id="itemList">${ROWS.slice(0, 400).map(r => `<option value="${esc(r.name)}">${esc(r.code)}</option>`).join('')}</datalist>
        <span class="hint">ค้นจากแคตตาล็อก ${D.baht(ROWS.length)} รายการ</span></label>
      <div class="grid2">
        <label class="field"><span class="req">มีผลตั้งแต่วันที่</span><input type="date" name="from" required></label>
        <label class="field"><span class="req">สิ้นสุดวันที่</span><input type="date" name="to" required></label>
      </div>
      <label class="field"><span>หมายเหตุถึงฝ่ายขาย</span><textarea name="note"></textarea></label>
      <button class="btn btn--orange" type="submit">ยื่นคำขอ</button>
    </form>
  </div>

  <div class="card">
    <div class="cardhead">
      <div><h2>ตัวอย่างแบบฟอร์ม</h2>
        <p>โครงหนังสือแต่งตั้งที่ PEM ออกให้ ดูตัวอย่างหรือดาวน์โหลดไปกรอกล่วงหน้าได้</p></div>
      <span class="sp"></span>
      <button class="btn btn--line btn--sm" id="apView" type="button">ดูตัวอย่าง</button>
      <button class="btn btn--line btn--sm" id="apDl" type="button">ดาวน์โหลดแบบฟอร์ม</button>
    </div>
    <div id="apDoc" hidden></div>
  </div>

  <div class="card">
    <h2>คำขอที่ยื่นไว้</h2>
    <div id="apTable" style="margin-top:14px"></div>
  </div>`;
}

function appointDoc(a) {
  const f = v => `<span class="fill">${v ? esc(v) : '&nbsp;'.repeat(24)}</span>`;
  return `<div class="doc">
    <div class="hd">
      <span>บริษัท พรีไซซ อีเลคตริค แมนูแฟคเจอริ่ง จำกัด<br>
        103/2 หมู่ 6 ต.บ้านใหม่ อ.เมืองปทุมธานี จ.ปทุมธานี 12000</span>
      <span style="text-align:right">โทร 02-584-2367<br>โทรสาร 02-584-1682<br>www.precise.co.th</span>
    </div>
    <p>เลขที่ ${f(a && a.id)}</p>
    <p style="text-align:right">วันที่ ${f(a && a.date)}</p>
    <h3>หนังสือแต่งตั้งตัวแทนจำหน่าย</h3>
    <p>ข้าพเจ้า <b>บริษัท พรีไซซ อีเลคตริค แมนูแฟคเจอริ่ง จำกัด (สำนักงานใหญ่)</b> สำนักงานตั้งอยู่เลขที่ 103/2
       หมู่ 6 ถนนติวานนท์ ตำบลบ้านใหม่ อำเภอเมืองปทุมธานี จังหวัดปทุมธานี 12000</p>
    <p style="margin-top:14px">ขอแต่งตั้ง ${f(a ? ME.company : '')} ${f(a ? ME.address : '')}
       เป็นผู้แทนจำหน่ายอุปกรณ์ ${f(a && a.item)} รหัส ${f(a && a.code)} จำนวน ${f(a && a.qty)} ชุด
       ภายใต้ยี่ห้อ <b>“PRECISE”</b> สำหรับเข้างานตกลงราคาของการไฟฟ้าส่วนภูมิภาค ${f(a && a.area)} เท่านั้น</p>
    <p style="margin-top:14px">ทั้งนี้ มีผลตั้งแต่วันที่ ${f(a && a.from)} สิ้นสุดวันที่ ${f(a && a.to)}</p>
    <p style="margin-top:14px">จึงเรียนมาเพื่อทราบ</p>
    <div class="sign">
      <p>ขอแสดงความนับถือ</p>
      <p style="margin-top:52px">(&nbsp;<span class="fill"></span>&nbsp;)</p>
      <p>ผู้จัดการฝ่ายขาย</p>
    </div>
  </div>`;
}

function drawAppoint() {
  $('#apTable').innerHTML = `<div class="tablewrap"><table>
    <thead><tr><th>เลขที่</th><th>สินค้า</th><th class="num">จำนวน</th><th>เขตการไฟฟ้า</th><th>ช่วงเวลา</th><th>สถานะ</th><th></th></tr></thead>
    <tbody>${APPOINTS.map((a, i) => `<tr>
      <td style="white-space:nowrap">${esc(a.id)}</td>
      <td>${esc(a.item)}<br><span style="color:var(--muted);font-size:.8rem">รหัส ${esc(a.code)}</span></td>
      <td class="num">${a.qty}</td><td>${esc(a.area)}</td>
      <td style="white-space:nowrap">${esc(a.from)}<br>ถึง ${esc(a.to)}</td>
      <td><span class="badge ${a.step === 3 ? 'is-ok' : a.step === 4 ? 'is-mute' : 'is-warn'}">${esc(APPOINT_STATUS[a.step])}</span></td>
      <td>${a.step === 3 ? `<button class="btn btn--line btn--sm" type="button" data-doc="${i}">เปิดดู</button>` : ''}</td>
    </tr>`).join('')}</tbody></table></div>`;

  $('#apTable').querySelectorAll('[data-doc]').forEach(b => b.addEventListener('click', () => {
    const a = APPOINTS[+b.dataset.doc];
    modal(`<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px" class="noprint">
        <button class="btn btn--solid btn--sm" onclick="window.print()" type="button">พิมพ์ / บันทึก PDF</button>
        <button class="btn btn--line btn--sm" data-close type="button">ปิด</button></div>
      ${appointDoc(a)}`);
  }));

  $('#apView').addEventListener('click', () => {
    const box = $('#apDoc');
    box.hidden = !box.hidden;
    if (!box.hidden) box.innerHTML = appointDoc(null);
    $('#apView').textContent = box.hidden ? 'ดูตัวอย่าง' : 'ซ่อนตัวอย่าง';
  });
  $('#apDl').addEventListener('click', () => {
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8">
<title>แบบฟอร์มหนังสือแต่งตั้งตัวแทนจำหน่าย</title><style>
body{font-family:'IBM Plex Sans Thai','Sarabun','Leelawadee UI',sans-serif;color:#16283c;margin:0;padding:40px;background:#fff}
.doc{max-width:760px;margin:0 auto;font-size:.95rem;line-height:2}
.doc .hd{display:flex;justify-content:space-between;gap:20px;font-size:.8rem;color:#5d6e80;
  border-bottom:1px solid #dde6ed;padding-bottom:12px;margin-bottom:24px}
.doc h3{text-align:center;font-size:1.05rem;margin:18px 0 22px;text-decoration:underline}
.doc .fill{display:inline-block;min-width:150px;border-bottom:1px dotted #5d6e80}
.doc .sign{text-align:center;margin-top:44px}
</style></head><body>${appointDoc(null)}</body></html>`;
    download('แบบฟอร์มหนังสือแต่งตั้งตัวแทนจำหน่าย.html', html, 'text/html;charset=utf-8');
  });

  $('#apForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    if (!f.checkValidity()) { f.reportValidity(); return; }
    const d = Object.fromEntries(new FormData(f).entries());
    const hit = ROWS.find(r => r.name === d.item) || ROWS.find(r => r.code === d.item);
    APPOINTS.unshift({ id:'PEM.จ.-69-' + String(2350 + APPOINTS.length), date:'2569-09-10',
      area:d.area, item:d.item, code: hit ? hit.code : '—', qty:+d.qty, from:d.from, to:d.to, step:0 });
    f.reset(); drawAppoint();
    modal(`<h2 style="color:var(--blue-dark)">ยื่นคำขอแล้ว</h2>
      <p style="color:var(--muted);margin-top:10px">ฝ่ายขายจะตรวจสอบและเสนอผู้จัดการลงนาม
        โดยปกติใช้เวลา 1–2 วันทำการ เมื่อออกหนังสือแล้วจะเปิดให้ดาวน์โหลดในตารางด้านล่าง</p>
      <p style="margin-top:18px"><button class="btn btn--solid" data-close type="button">ปิด</button></p>`);
  });
}

/* ================================================================
   8. REWARDS
   ================================================================ */
const REDEEM = [
  { t:'ส่วนลดบิลถัดไป', p:1000, d:'แลก 1,000 คะแนน เป็นส่วนลด 1,000 บาท ในคำสั่งซื้อถัดไป' },
  { t:'สินค้าตัวอย่างฟรี', p:2500, d:'เลือกสินค้ากลุ่ม Fuse, Surge Arrester หรือ LED มูลค่าไม่เกิน 3,000 บาท' },
  { t:'ค่าอบรมและสัมมนา', p:5000, d:'สิทธิ์เข้าอบรมเชิงเทคนิคที่โรงงานปทุมธานี พร้อมที่พัก 1 คืน' },
  { t:'ป้ายร้านและสื่อการขาย', p:8000, d:'ป้ายหน้าร้าน แคตตาล็อก และสื่อประชาสัมพันธ์แบรนด์ PRECISE' },
  { t:'ทริปดูงานต่างประเทศ', p:60000, d:'สำหรับคู่ค้าระดับ Gold ขึ้นไป จำกัดสิทธิ์ตามโควตาประจำปี' },
];
function viewReward() {
  const q = [
    { t:'ไตรมาส 1 (ม.ค.–มี.ค.)', a: PERF.slice(0,3).reduce((s,r)=>s+(r.actual||0),0), g: PERF.slice(0,3).reduce((s,r)=>s+r.target,0) },
    { t:'ไตรมาส 2 (เม.ย.–มิ.ย.)', a: PERF.slice(3,6).reduce((s,r)=>s+(r.actual||0),0), g: PERF.slice(3,6).reduce((s,r)=>s+r.target,0) },
    { t:'ไตรมาส 3 (ก.ค.–ก.ย.)', a: PERF.slice(6,9).reduce((s,r)=>s+(r.actual||0),0), g: PERF.slice(6,9).reduce((s,r)=>s+r.target,0) },
  ];
  const monthly = PERF.slice(0, NOW_M).map(p => ({ m: p.m, hit: p.actual >= p.target, pc: p.actual / p.target }));
  const bonus = monthly.reduce((s, m) => s + (m.pc >= 1.2 ? 1200 : m.hit ? 500 : 0), 0);

  return `
  <div class="viewhead">
    <h1>Rewards</h1>
    <p>คะแนนสะสมและรางวัลที่คำนวณจากผลงานในเมนู Target &amp; Performance
       รูปแบบด้านล่างเป็นข้อเสนอเพื่อพิจารณา ยังไม่ใช่โปรแกรมที่ประกาศใช้</p>
  </div>
  <div class="note warn" style="margin-bottom:20px">
    <span class="ph" title="รอฝ่ายขายและฝ่ายการตลาดยืนยันรูปแบบรางวัลและงบประมาณ">
    โครงสร้างรางวัลทั้งหมดเป็นข้อเสนอ ยังไม่ได้ประกาศใช้จริง</span>
  </div>

  <div class="kpirow">
    <div class="kpi"><div class="lab">คะแนนสะสมคงเหลือ</div>
      <div class="val" style="color:var(--orange)">${D.baht(POINTS + bonus)}</div>
      <div class="sub">จากยอดซื้อ ${baht(YTD_A)} บาท × ตัวคูณ ${TIER.point.toFixed(2)} (${esc(TIER.name)})</div></div>
    <div class="kpi"><div class="lab">โบนัสจากการทำถึงเป้ารายเดือน</div><div class="val">${D.baht(bonus)}</div>
      <div class="sub">ทำถึงเป้า ${monthly.filter(m=>m.hit).length} จาก ${monthly.length} เดือน</div></div>
    <div class="kpi"><div class="lab">อัตราการสะสม</div><div class="val">1,000 : 1</div>
      <div class="sub">ทุกยอดซื้อ 1,000 บาทที่ชำระแล้ว = 1 คะแนน</div></div>
    <div class="kpi"><div class="lab">ตัวคูณตามระดับ</div><div class="val">×${TIER.point.toFixed(2)}</div>
      <div class="sub">${D.tiers.map(t=>t.id+' ×'+t.point.toFixed(2)).join(' · ')}</div></div>
  </div>

  <div class="card">
    <h2>รางวัลรายเดือน</h2>
    <p>ทำยอดถึงเป้าของเดือนนั้นรับ 500 คะแนน · ทำได้ตั้งแต่ 120% ของเป้ารับ 1,200 คะแนน</p>
    <div class="tablewrap" style="margin-top:14px">
      <table><thead><tr><th>เดือน</th><th class="num">% ของเป้า</th><th>ผล</th><th class="num">คะแนนที่ได้</th></tr></thead>
      <tbody>${monthly.map(m => `<tr><td>${m.m} 2569</td>
        <td class="num">${(m.pc*100).toFixed(0)}%</td>
        <td>${m.pc >= 1.2 ? '<span class="badge is-ok">เกินเป้า 120%</span>'
              : m.hit ? '<span class="badge is-ok">ถึงเป้า</span>'
              : '<span class="badge is-bad">ไม่ถึงเป้า</span>'}</td>
        <td class="num">${m.pc >= 1.2 ? '1,200' : m.hit ? '500' : '—'}</td></tr>`).join('')}
      </tbody></table>
    </div>
  </div>

  <div class="card">
    <h2>รางวัลรายไตรมาส</h2>
    <p>คู่ค้าที่ทำ % เทียบเป้าสูงสุด 3 อันดับแรกในกลุ่มเดียวกัน รับเงินคืนจากยอดซื้อของไตรมาสนั้น
       อันดับ 1 คืน 0.5% · อันดับ 2 คืน 0.3% · อันดับ 3 คืน 0.2%</p>
    <div class="tablewrap" style="margin-top:14px">
      <table><thead><tr><th>ไตรมาส</th><th class="num">เป้าหมาย</th><th class="num">ยอดจริง</th><th class="num">% ของเป้า</th><th>สถานะ</th></tr></thead>
      <tbody>${q.map((x, i) => `<tr><td>${x.t}</td><td class="num">${baht(x.g)}</td>
        <td class="num">${x.a ? baht(x.a) : '—'}</td>
        <td class="num">${x.a ? (x.a/x.g*100).toFixed(0)+'%' : '—'}</td>
        <td>${!x.a ? '<span class="badge is-mute">ยังไม่ถึงกำหนด</span>'
             : x.a >= x.g ? '<span class="badge is-ok">เข้าเกณฑ์พิจารณา</span>'
             : '<span class="badge is-warn">ต่ำกว่าเป้า</span>'}</td></tr>`).join('')}
      </tbody></table>
    </div>
  </div>

  <div class="card">
    <h2>รางวัลประจำปี</h2>
    <div class="tiles" style="margin-top:14px">
      <article class="tile"><h3>Dealer of the Year</h3>
        <p>คู่ค้าที่ทำ % เทียบเป้าสูงสุดของแต่ละกลุ่ม รับโล่ประกาศเกียรติคุณและสิทธิ์ร่วมงานประจำปีของกลุ่มพรีไซซ</p></article>
      <article class="tile"><h3>เลื่อนระดับอัตโนมัติ</h3>
        <p>ทำยอดทั้งปีตั้งแต่ 110% ของเป้า เลื่อนระดับขึ้น 1 ขั้นทันทีและล็อกระดับไว้ 1 ปีเต็ม</p></article>
      <article class="tile"><h3>ทริปดูงาน</h3>
        <p>คู่ค้าระดับ Gold ขึ้นไปที่ทำถึงเป้าทั้งปี รับสิทธิ์ร่วมทริปดูงานโรงงานผู้ผลิตในต่างประเทศ</p></article>
    </div>
  </div>

  <div class="card">
    <h2>แลกของรางวัล</h2>
    <div class="tablewrap" style="margin-top:14px">
      <table><thead><tr><th>ของรางวัล</th><th class="num">คะแนน</th><th>รายละเอียด</th><th></th></tr></thead>
      <tbody>${REDEEM.map(r => { const ok = (POINTS + bonus) >= r.p; return `<tr>
        <td>${esc(r.t)}</td><td class="num">${D.baht(r.p)}</td><td>${esc(r.d)}</td>
        <td>${ok ? '<button class="btn btn--orange btn--sm" type="button" disabled title="รอเปิดใช้งานจริง">แลก</button>'
                 : '<span class="badge is-mute">คะแนนไม่พอ</span>'}</td></tr>`; }).join('')}
      </tbody></table>
    </div>
    <p style="color:var(--muted);font-size:.84rem;margin-top:12px">
      เงื่อนไข: ต้องไม่มียอดค้างชำระเกินกำหนด และคะแนนมีอายุ 24 เดือนนับจากวันที่ได้รับ</p>
  </div>`;
}

/* ================================================================
   ตัวควบคุมหน้าจอ
   ================================================================ */
const VIEWS = {
  perf:     { html: viewPerf,     after: drawChart },
  shop:     { html: viewShop,     after: () => { drawShop(); bindShop(); } },
  price:    { html: viewPrice,    after: drawPrice },
  orders:   { html: viewOrders,   after: drawOrders },
  leads:    { html: viewLeads,    after: drawLeads },
  training: { html: viewTraining, after: null },
  appoint:  { html: viewAppoint,  after: drawAppoint },
  reward:   { html: viewReward,   after: null },
};
function bindShop() {
  $('#shopQ').addEventListener('input', e => { shopTerm = e.target.value; shopShown = 30; drawShop(); });
  $('#shopClear').addEventListener('click', () => { shopTerm = ''; $('#shopQ').value = ''; shopShown = 30; drawShop(); });
  $('#shopMore').addEventListener('click', () => { shopShown += 30; drawShop(); });
}

let CURRENT = null;
function go(id) {
  if (!VIEWS[id] || !MENUS.some(m => m.id === id)) id = 'perf';
  CURRENT = id;
  $('#main').innerHTML = VIEWS[id].html();
  if (VIEWS[id].after) VIEWS[id].after();
  markNav();
  if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
  window.scrollTo({ top: 0 });
}
window.addEventListener('hashchange', () => go(location.hash.slice(1)));

drawNav();
go(location.hash.slice(1) || 'perf');

})();
