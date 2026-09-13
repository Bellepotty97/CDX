/* หน้าขอใบเสนอราคา
   quote.html?i=<ลำดับสินค้า>  มาจากปุ่มขอราคาในหน้ารายละเอียดสินค้า
   quote.html?s=<รหัสบริการ>   มาจากปุ่มขอใบเสนอราคาในหน้ารายละเอียดงานบริการ
   quote.html                  มาจากการ์ดสอบถามสินค้าและบริการ ไม่ผูกกับรายการใด
   ชื่อ field อ้างตาม crm.lead ของ Odoo ไว้ใน data-odoo-field เพื่อให้ต่อระบบภายหลังได้ตรง */
(function () {
'use strict';

const C = window.PEM_CATALOG, S = window.PEM_SERVICES, L = window.PEM_LIB, I = window.PEM_ICON;
const esc = L.esc, $ = s => document.querySelector(s);
const p = new URLSearchParams(location.search);

/* ---------------- รายการที่ขอราคา ---------------- */
let item = null;                       // { kind, title, sub, img, fields[] , interest }
const sid = p.get('s');
const idx = parseInt(p.get('i'), 10);

if (sid) {
  const s = S.find(x => x.id === sid);
  if (s) item = {
    kind:'service', title:s.name, sub:s.full, imgAttrs:'src="'+L.imgForService(s.id)+'"',
    interest:'งานบริการ: ' + s.name,
    fields:[['ประเภท','งานบริการและโซลูชัน'],['รูปแบบราคา','ประเมินเป็นรายโครงการ']],
    back:'product.html?s=' + encodeURIComponent(s.id),
  };
} else if (Number.isInteger(idx) && idx >= 0 && idx < C.items.length) {
  const r = L.row(idx);
  const sp = L.specs(r.name);
  item = {
    kind:'product', title:r.name, sub:r.core, imgAttrs:L.imgAttrs(r.core),
    interest:'สินค้า: ' + r.name + ' (รหัส ' + r.code + ')',
    fields:[['รหัสสินค้า',r.code],['กลุ่มสินค้า',r.core],['ประเภท',r.type]]
      .concat(sp.slice(0,3).map(x => [x.label, x.value])),
    back:'product.html?i=' + r.i,
  };
}

/* ---------------- แถบข้าง ---------------- */
function drawSide() {
  $('#sidecol').innerHTML = (item ? `
    <div class="qcard">
      <div class="shot"><img ${item.imgAttrs} alt="ภาพประกอบ ${esc(item.title)}" width="480" height="360"></div>
      <div class="b">
        <p class="meta">${esc(item.kind === 'service' ? 'งานบริการและโซลูชัน' : item.sub)}</p>
        <h3>${esc(item.title)}</h3>
        <dl>${item.fields.map(([k, v]) =>
          `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <p style="margin-top:14px"><a href="${item.back}" style="color:var(--blue);font-weight:600;font-size:.86rem">
          &larr; กลับไปหน้ารายละเอียด</a></p>
      </div>
    </div>` : `
    <div class="qcard"><div class="b">
      <h3>สอบถามสินค้าและบริการ</h3>
      <p class="meta">ยังไม่ได้เลือกรายการ ระบุสิ่งที่ต้องการในช่อง “เรื่องที่ต้องการให้เสนอราคา” ได้เลย
        หรือเลือกจากหน้าสินค้าเพื่อให้ระบบกรอกข้อมูลรุ่นให้อัตโนมัติ</p>
      <p style="margin-top:14px"><a href="products.html" style="color:var(--blue);font-weight:600;font-size:.86rem">
        เลือกจากสินค้า 446 รายการ &rarr;</a></p>
    </div></div>`) + `
    <div class="qnote">
      <b>ติดต่อฝ่ายขายโดยตรง</b><br>
      โทร <a href="tel:0922836660" style="color:var(--blue);font-weight:600">092-283-6660</a><br>
      อีเมล <a href="mailto:info@precise.co.th" style="color:var(--blue);font-weight:600">info@precise.co.th</a><br>
      <span style="color:var(--muted)">จันทร์–ศุกร์ 08:00–17:00 น.</span>
    </div>`;
}

/* ---------------- ฟอร์ม ---------------- */
function drawForm() {
  $('#crumb').innerHTML =
    `<a href="precise-pcc-pem.html">หน้าแรก</a> › <a href="products.html">สินค้าและบริการ</a>` +
    (item ? ` › <a href="${item.back}">${esc(item.title.slice(0, 40))}</a>` : '') + ` › ขอใบเสนอราคา`;

  $('#formcol').innerHTML = `
  <form class="fbox" id="qform" novalidate>
    <fieldset class="fset">
      <legend>เรื่องที่ต้องการให้เสนอราคา</legend>
      <label class="field"><span class="req">รายการที่สนใจ</span>
        <input type="text" name="interest" data-odoo-field="x_product_interest" required
               value="${item ? esc(item.interest) : ''}"
               placeholder="เช่น หม้อแปลงจำหน่าย 3 เฟส 250 kVA หรือ งานติดตั้งระบบไฟฟ้า">
        ${item ? '<span class="hint">กรอกให้จากรายการที่ท่านเลือกมา แก้ไขได้</span>' : ''}</label>
      <div class="g2">
        <label class="field"><span>จำนวนที่ต้องการ</span>
          <input type="text" name="qty" placeholder="เช่น 4 ชุด"></label>
        <label class="field"><span>กำหนดที่ต้องการใช้งาน</span>
          <input type="date" name="needBy"></label>
      </div>
      <label class="field"><span>สถานที่ส่งมอบหรือหน้างาน</span>
        <input type="text" name="site" placeholder="จังหวัดหรือชื่อโครงการ"></label>
    </fieldset>

    <fieldset class="fset">
      <legend>ข้อมูลผู้ขอราคา</legend>
      <div class="g2">
        <label class="field"><span class="req">ชื่อ-นามสกุล</span>
          <input type="text" name="contactName" data-odoo-field="contact_name" required></label>
        <label class="field"><span>บริษัท / หน่วยงาน</span>
          <input type="text" name="partnerName" data-odoo-field="partner_name"></label>
        <label class="field"><span class="req">เบอร์โทรศัพท์</span>
          <input type="tel" name="phone" data-odoo-field="phone" required placeholder="08x-xxx-xxxx"></label>
        <label class="field"><span class="req">อีเมล</span>
          <input type="email" name="email" data-odoo-field="email_from" required></label>
      </div>
      <label class="field"><span class="req">ติดต่อในฐานะ</span>
        <select name="customerType" data-odoo-field="x_customer_type" required>
          <option value="">เลือก</option>
          <option>ลูกค้า</option>
          <option>ตัวแทนจำหน่าย</option>
          <option>ผู้รับเหมา</option>
          <option>หน่วยงานราชการ / รัฐวิสาหกิจ</option>
          <option>อื่น ๆ</option>
        </select></label>
    </fieldset>

    <fieldset class="fset">
      <legend>รายละเอียดเพิ่มเติม</legend>
      <label class="field"><span>รายละเอียดงานหรือข้อกำหนดเฉพาะ</span>
        <textarea name="description" data-odoo-field="description"
          placeholder="พิกัดที่ต้องการ มาตรฐานที่ต้องผ่าน เงื่อนไขการส่งมอบ หรือข้อมูลอื่นที่ช่วยให้เสนอราคาได้ตรง"></textarea></label>
      <label class="field"><span>ช่องทางที่สะดวกให้ติดต่อกลับ</span>
        <select name="prefer">
          <option>โทรศัพท์</option><option>อีเมล</option><option>LINE</option>
        </select></label>
    </fieldset>

    <label class="checkrow" style="margin:4px 0 20px">
      <input type="checkbox" name="pdpa" required>
      <span>ข้าพเจ้ายินยอมให้บริษัท พรีไซซ อีเลคตริค แมนูแฟคเจอริ่ง จำกัด เก็บรวบรวมและใช้ข้อมูลที่ให้ไว้
        เพื่อจัดทำใบเสนอราคาและติดต่อกลับ ตาม
        <a href="https://precise.co.th/corporate-governance/privacy-rights/" target="_blank" rel="noopener"
           style="color:var(--blue);text-decoration:underline">นโยบายความเป็นส่วนตัว</a></span>
    </label>

    <button class="btn btn--orange" type="submit">ส่งคำขอใบเสนอราคา</button>
    <p class="err" id="qerr" hidden></p>
  </form>`;

  $('#qform').addEventListener('submit', submit);
}

function submit(e) {
  e.preventDefault();
  const f = e.target, err = $('#qerr');
  if (!f.checkValidity()) {
    err.textContent = 'กรุณากรอกข้อมูลที่จำเป็นให้ครบ และยินยอมให้เก็บข้อมูลก่อนส่งคำขอ';
    err.hidden = false;
    const bad = f.querySelector(':invalid');
    if (bad) { bad.focus(); bad.scrollIntoView({ block:'center' }); }
    return;
  }
  const ref = 'QT-69-' + String(Math.floor(Math.random() * 9000) + 1000);
  const data = Object.fromEntries(new FormData(f).entries());

  // ระบบจริงส่ง payload นี้เข้า crm.lead ของ Odoo ผ่าน backend พร้อมบันทึกหลักฐานการยินยอม
  console.log('quote request', {
    ref, consentAt:new Date().toISOString(), consentVersion:'2569-09', source:location.href,
    itemKind: item ? item.kind : 'none', itemRef: item ? item.back : null, ...data });

  $('#formcol').innerHTML = `
    <div class="done">
      <h2>รับคำขอใบเสนอราคาแล้ว</h2>
      <p>ฝ่ายขายจะติดต่อกลับทาง ${esc(data.prefer || 'โทรศัพท์')} ภายใน 2 วันทำการ
         หากเป็นงานที่ต้องสำรวจหน้างาน จะนัดหมายเข้าดูสถานที่ก่อนเสนอราคา</p>
      <p class="ref">เลขที่คำขอ ${ref}</p>
      <p style="margin-top:14px">รายการที่ขอราคา: <b>${esc(data.interest)}</b></p>
    </div>
    <p style="color:var(--muted);font-size:.86rem;margin-top:16px">
      <span class="ph" title="ยังไม่ได้เชื่อมกับ Odoo ข้อมูลที่กรอกยังไม่ถูกบันทึกที่ใด">
      หน้าสาธิต ข้อมูลยังไม่ถูกส่งไปที่ระบบใด</span></p>
    <p style="margin-top:22px;display:flex;gap:11px;flex-wrap:wrap">
      <a class="btn btn--solid" href="products.html">ดูสินค้าและบริการต่อ</a>
      <a class="btn btn--line" href="precise-pcc-pem.html">กลับหน้าแรก</a></p>`;
  window.scrollTo({ top:0, behavior:'smooth' });
}

drawSide();
drawForm();
if (item) document.title = 'ขอใบเสนอราคา ' + item.title + ' | PEM พรีไซซ อีเลคตริค แมนูแฟคเจอริ่ง';

})();
