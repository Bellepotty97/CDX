/* หน้าสมัคร เข้าสู่ระบบ และมุมมองฝ่ายขาย
   ทุกอย่างทำงานในเบราว์เซอร์เพื่อสาธิตขั้นตอน ยังไม่ได้เชื่อมกับระบบหลังบ้าน */
(function () {
'use strict';

const D = window.PEM_DEALER;
const I = window.PEM_ICON;
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const baht = n => D.baht(Math.round(n));

/* ---------------- แท็บ ---------------- */
const TABS = [['tab-reg','panel-reg'], ['tab-sales','panel-sales'], ['tab-login','panel-login']];
function showTab(id) {
  TABS.forEach(([t, p]) => {
    const on = t === id;
    $('#' + t).setAttribute('aria-selected', on);
    $('#' + p).hidden = !on;
  });
  if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
  window.scrollTo({ top: 0 });
}
TABS.forEach(([t]) => $('#' + t).addEventListener('click', () => showTab(t)));
$('#gotoreg').addEventListener('click', e => { e.preventDefault(); showTab('tab-reg'); });
if (TABS.some(([t]) => t === location.hash.slice(1))) showTab(location.hash.slice(1));

/* ---------------- ประเภทผู้สมัคร : นิติบุคคล หรือ บุคคลธรรมดา ---------------- */
const DOCS = {
  juristic: [
    ['docCert', 'หนังสือรับรองบริษัท', 'อายุไม่เกิน 6 เดือน'],
    ['docVat',  'ภ.พ.20', ''],
    ['docId',   'บัตรประชาชนผู้มีอำนาจลงนาม', ''],
  ],
  person: [
    ['docId',      'สำเนาบัตรประชาชน', 'รับรองสำเนาถูกต้อง'],
    ['docCommReg', 'ทะเบียนพาณิชย์', 'ถ้ามี'],
    ['docVat',     'ภ.พ.20', 'ถ้าจดทะเบียน VAT แล้ว'],
  ],
};
function entityMode() {
  const v = document.querySelector('input[name=entity]:checked').value;
  const person = v === 'person';

  const fj = $('#fsJuristic'), fp = $('#fsPerson');
  fj.hidden = person;  fj.disabled = person;      // disabled กันไม่ให้ช่องที่ซ่อนอยู่บล็อกการ validate
  fp.hidden = !person; fp.disabled = !person;

  // บุคคลธรรมดาไม่มีเลขทะเบียนนิติบุคคล จึงใช้เลขบัตรประชาชนเป็นช่องบังคับแทน
  fp.querySelector('[name=ownerName]').required = person;
  fp.querySelector('[name=citizenId]').required = person;

  $('#capLabel').textContent = person ? 'เงินทุนหมุนเวียนโดยประมาณ (บาท)' : 'ทุนจดทะเบียน (บาท)';
  $('#docNote').textContent = person
    ? 'ผู้ประกอบการบุคคลธรรมดาใช้สำเนาบัตรประชาชนเป็นเอกสารหลัก แนบภายหลังได้แต่ต้องครบก่อนเปิดบัญชี'
    : 'แนบภายหลังทางอีเมลได้ถ้ายังไม่พร้อม แต่ต้องครบก่อนเปิดบัญชี';
  $('#docFields').innerHTML = DOCS[person ? 'person' : 'juristic'].map(([n, label, hint]) =>
    `<label class="field"><span>${esc(label)}${hint ? ` <span class="hint">${esc(hint)}</span>` : ''}</span>
       <input type="file" name="${n}" accept=".pdf,.jpg,.jpeg,.png"></label>`).join('');
}
$$('input[name=entity]').forEach(r => r.addEventListener('change', entityMode));
entityMode();

/* ---------------- กลุ่มคู่ค้าในใบสมัคร ---------------- */
$('#grouplist').innerHTML = D.groups.map((g, i) => `
  <label class="opt">
    <input type="radio" name="group" value="${g.id}"${i === 2 ? ' checked' : ''}>
    <span><h4>${esc(g.name)}</h4><p>${esc(g.desc)}</p></span>
  </label>`).join('');
function syncPea() {
  const v = document.querySelector('input[name=group]:checked');
  $('#peafield').hidden = !v || v.value !== 'pea';
}
$('#grouplist').addEventListener('change', syncPea);
syncPea();

$('#interest').innerHTML = window.PEM_CATALOG.core.slice().sort((a, b) => a.localeCompare(b))
  .map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');

/* ---------------- ใบสมัครที่ฝ่ายขายเห็น ---------------- */
// ค่าตั้งต้นเป็นใบสมัครตัวอย่าง ถ้าผู้ใช้กดส่งใบสมัครจริงในแท็บแรก ข้อมูลจะถูกแทนที่ด้วยของจริง
let APP = {
  ref:'DR-69-4182', entity:'juristic',
  name:'บริษัท ตัวอย่างการค้าไฟฟ้า จำกัด', taxId:'0105566001234',
  contact:'คุณสมหญิง รักงาน', position:'ผู้จัดการฝ่ายจัดซื้อ',
  phone:'089-111-2233', email:'somying@example.com',
  address:'45/12 หมู่ 4 ต.บางรักพัฒนา อ.บางบัวทอง จ.นนทบุรี 11110',
  groupId:'private', capital:8000000, exp:7, forecast:12000000,
  area:'นนทบุรี ปทุมธานี พระนครศรีอยุธยา', peaAreas:'',
};

function drawAppCard() {
  const g = D.groupById(APP.groupId);
  const rows = [
    ['เลขที่คำขอ', APP.ref],
    ['ประเภทผู้สมัคร', APP.entity === 'person' ? 'บุคคลธรรมดา' : 'นิติบุคคล'],
    [APP.entity === 'person' ? 'ชื่อผู้ประกอบการ' : 'ชื่อนิติบุคคล', APP.name],
    [APP.entity === 'person' ? 'เลขประจำตัวประชาชน' : 'เลขทะเบียนนิติบุคคล', APP.taxId],
    ['ผู้ติดต่อ', APP.contact + (APP.position ? ' · ' + APP.position : '')],
    ['โทรศัพท์', APP.phone],
    ['อีเมล', APP.email],
    ['ที่อยู่', APP.address],
    ['กลุ่มที่ผู้สมัครเลือก', g ? g.name : '—'],
    ['ทุน / เงินทุนหมุนเวียน', APP.capital ? baht(APP.capital) + ' บาท' : '—'],
    ['ประสบการณ์', APP.exp ? APP.exp + ' ปี' : '—'],
    ['ยอดซื้อคาดการณ์ปีแรก', APP.forecast ? baht(APP.forecast) + ' บาท' : '—'],
    ['พื้นที่จำหน่าย', APP.area || '—'],
  ];
  if (APP.peaAreas) rows.push(['เขตการไฟฟ้าที่ขอเข้างาน', APP.peaAreas]);
  $('#appcard').innerHTML = rows.map(([k, v]) =>
    `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
  $('#chEmail').textContent = APP.email ? '· ' + APP.email : '';
  $('#chPhone').textContent = APP.phone ? '· ' + APP.phone : '';
}

$('#checklist').innerHTML = D.verifySteps.map((t, i) =>
  `<label><input type="checkbox" class="vs"${i < 3 ? ' checked' : ''}><span>${esc(t)}</span></label>`).join('');

/* ---------------- ให้คะแนนตามเกณฑ์ ---------------- */
// เดาระดับตั้งต้นจากตัวเลขที่ผู้สมัครกรอกมา ฝ่ายขายแก้ได้ทุกข้อ
function guessLevel(c) {
  const n = { capital: APP.capital, forecast: APP.forecast, exp: APP.exp }[c.key];
  if (n == null) return 2;
  if (c.key === 'capital')  return n > 20e6 ? 4 : n >= 5e6 ? 3 : n >= 1e6 ? 2 : 1;
  if (c.key === 'forecast') return n > 30e6 ? 4 : n >= 10e6 ? 3 : n >= 2e6 ? 2 : 1;
  if (c.key === 'exp')      return n > 10 ? 4 : n >= 5 ? 3 : n >= 2 ? 2 : 1;
  return 2;
}
function drawCriteria() {
  $('#critbox').innerHTML = D.firstTierCriteria.map(c => {
    const pick = guessLevel(c);
    return `<div class="crit" data-key="${c.key}" data-w="${c.w}">
      <div class="crithead"><b>${esc(c.label)}</b><span class="w">น้ำหนัก ${c.w}%</span>
        <span class="sc" data-sc="${c.key}"></span></div>
      <div class="lv">${c.levels.map((t, i) =>
        `<label><input type="radio" name="c_${c.key}" value="${i + 1}"${i + 1 === pick ? ' checked' : ''}>${esc(t)}</label>`).join('')}
      </div></div>`;
  }).join('');
  $('#critbox').addEventListener('change', score);
  score();
}
let SCORE = 0;
function score() {
  let total = 0;
  D.firstTierCriteria.forEach(c => {
    const v = +document.querySelector(`input[name=c_${c.key}]:checked`).value;
    const pts = v / 4 * c.w;
    total += pts;
    document.querySelector(`[data-sc="${c.key}"]`).textContent = pts.toFixed(1) + ' / ' + c.w;
  });
  SCORE = Math.round(total);
  $('#scoreVal').textContent = SCORE;
  const t = D.tierById(D.tierFromScore(SCORE));
  $('#scoreTier').textContent = t.id + ' ' + t.name;
  const cur = document.querySelector('input[name=stier]:checked');
  if (!cur || cur.dataset.auto === '1') pickTier(t.id, true);
  drawTierPick();
}

/* ---------------- จัดกลุ่มและระดับ ---------------- */
let SGROUP = APP.groupId, STIER = 'T1';
function drawGroupPick() {
  $('#sgroup').innerHTML = D.groups.map(g => `
    <label class="opt">
      <input type="radio" name="sgroup" value="${g.id}"${g.id === SGROUP ? ' checked' : ''}>
      <span><h4>${esc(g.name)} <span class="badge">ส่วนลด ${(g.disc * 100).toFixed(0)}%</span></h4>
        <p>${esc(g.desc)}</p>
        ${g.id === APP.groupId ? '<p style="color:var(--blue);font-weight:600;margin-top:5px">ผู้สมัครเลือกกลุ่มนี้มา</p>' : ''}
      </span></label>`).join('');
  $$('input[name=sgroup]').forEach(r => r.addEventListener('change', () => { SGROUP = r.value; drawPreview(); }));
}
function pickTier(id, auto) { STIER = id; window.__tierAuto = !!auto; }
function drawTierPick() {
  const suggested = D.tierFromScore(SCORE);
  $('#stier').innerHTML = D.tiers.map(t => `
    <label><input type="radio" name="stier" value="${t.id}"${t.id === STIER ? ' checked' : ''}
        data-auto="${window.__tierAuto && t.id === suggested ? '1' : '0'}">
      <h4>${t.id} · ${t.name}</h4>
      <div class="d">${(t.disc * 100).toFixed(0)}%</div>
      <p>${esc(t.note)}</p>
      <p style="margin-top:6px">${esc(t.credit)}</p>
      ${t.id === suggested ? '<span class="sug">ระบบแนะนำ</span>' : ''}
    </label>`).join('');
  $$('input[name=stier]').forEach(r => r.addEventListener('change', () => { pickTier(r.value, false); drawTierPick(); drawPreview(); }));
  drawPreview();
}
function drawPreview() {
  const g = D.groupById(SGROUP), t = D.tierById(STIER);
  const sample = D.basePrice('Distribution Transformer', 'TF-F-99-2307221B1');
  const net = D.netPrice(sample, g, t);
  $('#tierPreview').innerHTML = `
    ผลลัพธ์ที่คู่ค้ารายนี้จะได้ &nbsp;
    <b>${esc(g.name)}</b> ส่วนลด ${(g.disc * 100).toFixed(0)}%
    &nbsp;+&nbsp; <b>${t.id} ${esc(t.name)}</b> ส่วนลดเพิ่ม ${(t.disc * 100).toFixed(0)}%
    &nbsp;=&nbsp; <b>ส่วนลดรวม ${((1 - (1 - g.disc) * (1 - t.disc)) * 100).toFixed(1)}%</b>
    &nbsp;·&nbsp; เงื่อนไขชำระเงิน <b>${esc(t.credit)}</b>
    <br><span style="color:var(--muted);font-size:.86rem">
      ตัวอย่าง หม้อแปลงจำหน่ายราคาตั้ง ${baht(sample)} บาท &rarr; ราคาของคู่ค้ารายนี้ ${baht(net)} บาท</span>`;
  drawMessage();
}

/* ---------------- เปิดบัญชี ---------------- */
function makePass() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ', b = 'abcdefghijkmnpqrstuvwxyz', c = '23456789', s = '!@#$%';
  const pick = p => p[Math.floor(Math.random() * p.length)];
  return [pick(a), pick(a), pick(b), pick(b), pick(b), pick(c), pick(c), pick(c), pick(s)]
    .sort(() => Math.random() - 0.5).join('');
}
let USER = '', PASS = '';
function makeAccount() {
  USER = 'DL' + APP.ref.replace(/[^0-9]/g, '').slice(-6);
  PASS = makePass();
  $('#genUser').textContent = USER;
  $('#genPass').textContent = PASS;
  drawMessage();
}
$('#regen').addEventListener('click', () => { PASS = makePass(); $('#genPass').textContent = PASS; drawMessage(); });

function messageText() {
  const g = D.groupById(SGROUP), t = D.tierById(STIER);
  return `เรียน ${APP.contact}

บริษัท พรีไซซ อีเลคตริค แมนูแฟคเจอริ่ง จำกัด ขอแจ้งผลการพิจารณาใบสมัครเลขที่ ${APP.ref}
ยินดีต้อนรับ ${APP.name} เข้าเป็นตัวแทนจำหน่ายสินค้า PEM

กลุ่มคู่ค้า : ${g.name}
ระดับ      : ${t.id} ${t.name}
ส่วนลดรวม  : ${((1 - (1 - g.disc) * (1 - t.disc)) * 100).toFixed(1)}%
เงื่อนไขชำระเงิน : ${t.credit}

ข้อมูลเข้าใช้งาน Dealer Management Platform
ชื่อผู้ใช้  : ${USER}
รหัสผ่าน   : ${PASS}

กรุณาเปลี่ยนรหัสผ่านทันทีหลังเข้าสู่ระบบครั้งแรก และไม่เปิดเผยรหัสผ่านให้ผู้อื่นทราบ
เข้าใช้งานได้ที่หน้าเข้าสู่ระบบตัวแทนจำหน่ายบนเว็บไซต์ของบริษัท

สอบถามเพิ่มเติม ฝ่ายขาย 092-283-6660 หรือ info@precise.co.th`;
}
function drawMessage() { $('#msgbox').textContent = messageText(); }

$('#sendCred').addEventListener('click', () => {
  const ch = $$('.ch:checked').map(c => c.value);
  if (!ch.length) { alert('เลือกอย่างน้อย 1 ช่องทางก่อนส่ง'); return; }
  const undone = $$('.vs').filter(c => !c.checked).length;
  const box = $('#sentBox');
  box.hidden = false;
  box.innerHTML = I.svg('check', 20) +
    `<span><b>ส่งข้อมูลการเข้าใช้งานแล้วทาง ${esc(ch.join(' · '))}</b><br>
      บัญชี <b>${esc(USER)}</b> เปิดใช้งานแล้ว รหัสผ่านชั่วคราวหมดอายุใน 7 วัน และต้องเปลี่ยนเมื่อเข้าสู่ระบบครั้งแรก
      ${undone ? `<br><span style="color:var(--warn)">เตือน: ยังมีรายการตรวจสอบค้างอยู่ ${undone} ข้อ</span>` : ''}
      <br><span class="ph" title="ยังไม่ได้เชื่อมกับระบบส่งอีเมลหรือ SMS จริง">หน้าสาธิต ยังไม่มีการส่งข้อความออกจริง</span></span>`;
  box.scrollIntoView({ block:'center', behavior:'smooth' });
});
$('#copyCred').addEventListener('click', () => {
  const t = messageText();
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(
    () => { $('#copyCred').textContent = 'คัดลอกแล้ว'; setTimeout(() => $('#copyCred').textContent = 'คัดลอกข้อความ', 1800); },
    () => alert('คัดลอกไม่สำเร็จ กรุณาเลือกข้อความแล้วคัดลอกเอง'));
  else alert('เบราว์เซอร์นี้คัดลอกอัตโนมัติไม่ได้ กรุณาเลือกข้อความแล้วคัดลอกเอง');
});

/* ---------------- ส่งใบสมัคร ---------------- */
$('#regform').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, err = $('#regerr');
  if (!f.checkValidity()) {
    err.textContent = 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ และยินยอมให้เก็บข้อมูลก่อนส่งใบสมัคร';
    err.hidden = false;
    const bad = f.querySelector(':invalid');
    if (bad) { bad.focus(); bad.scrollIntoView({ block:'center' }); }
    return;
  }
  err.hidden = true;
  const d = Object.fromEntries(new FormData(f).entries());
  const ref = 'DR-69-' + String(Math.floor(Math.random() * 9000) + 1000);

  // ส่งต่อข้อมูลจริงเข้ามุมมองฝ่ายขาย เพื่อให้เห็นทั้งเส้นทางต่อเนื่องกัน
  APP = {
    ref, entity:d.entity,
    name: d.entity === 'person' ? (d.shopName || d.ownerName) : d.company,
    taxId: d.entity === 'person' ? d.citizenId : d.taxId,
    contact:d.contact, position:d.position, phone:d.phone, email:d.email, address:d.address,
    groupId:d.group, capital:+d.capital || 0, exp:+d.exp || 0, forecast:+d.forecast || 0,
    area:d.area, peaAreas:d.peaAreas || '',
  };
  SGROUP = APP.groupId;
  drawAppCard(); drawCriteria(); drawGroupPick(); makeAccount();
  $('#sentBox').hidden = true;

  $('#refno').textContent = ref;
  $('#regcard').hidden = true;
  $('#regdone').hidden = false;
  window.scrollTo({ top:0, behavior:'smooth' });
  console.log('dealer registration', {
    ref, consentAt:new Date().toISOString(), consentVersion:'2569-09', source:location.href, ...d });
});

/* ---------------- เข้าสู่ระบบ (สาธิต) ---------------- */
$('#loginform').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, err = $('#loginerr');
  if (f.user.value.trim() === D.demoAccount.user && f.pass.value === D.demoAccount.pass) {
    const store = f.remember.checked ? localStorage : sessionStorage;
    try { store.setItem('pem_dealer_session', D.demoAccount.user); } catch (_) {}
    location.href = 'dealer-portal.html';
  } else {
    err.textContent = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (บัญชีสาธิตคือ Dealer1 / Password)';
    err.hidden = false;
  }
});

/* ---------------- เริ่มต้น ---------------- */
drawAppCard();
drawCriteria();
drawGroupPick();
makeAccount();

})();
