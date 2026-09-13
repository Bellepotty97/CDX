/* ตัวช่วยที่ใช้ร่วมกันระหว่างหน้าสินค้าและหน้ารายละเอียดสินค้า
   อ่านข้อมูลจาก data/catalog.js และ data/services.js เท่านั้น ไม่ได้เพิ่มข้อมูลใหม่ */
window.PEM_LIB = (function () {
  const C = window.PEM_CATALOG;

  const esc = s => String(s == null ? '' : s)
    .replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const imgForCore    = core => 'assets/img/' + slug(core) + '.svg';
  const imgForService = id   => 'assets/img/service-' + id + '.svg';

  // แปลงแถวในแคตตาล็อกเป็นวัตถุที่อ่านง่าย
  const row = i => {
    const it = C.items[i];
    if (!it) return null;
    return { i, core: C.core[it[0]], type: C.type[it[1]], name: it[2], code: it[3], biz: it[4] };
  };
  const rows = () => C.items.map((_, i) => row(i));

  // ดึงพิกัดทางไฟฟ้าจากชื่อรุ่น ข้อมูลทั้งหมดมาจากชื่อสินค้าในแคตตาล็อก ไม่ได้แต่งเพิ่ม
  function specs(name) {
    const out = [];
    const push = (label, value) => { if (value && !out.some(o => o.label === label)) out.push({ label, value }); };
    let m;
    if ((m = name.match(/(\d+)\s*[- ]?\s*phase/i)))            push('จำนวนเฟส', m[1] + ' เฟส');
    // kVA ต้องไม่จับ kVAR ที่มีตัว R ต่อท้าย จึงใส่ lookahead กันไว้
    if ((m = name.match(/(\d+(?:[.,]\d+)?)\s*kVAR(?![A-Za-z])/i)))push('พิกัดกำลังรีแอกทีฟ', m[1] + ' kVAR');
    if ((m = name.match(/(\d+(?:[.,]\d+)?)\s*kVA(?![A-Za-z])/i))) push('พิกัดกำลัง', m[1] + ' kVA');
    if ((m = name.match(/(\d+(?:[.,]\d+)?)\s*kV(?![A-Za-z])/i)))push('พิกัดแรงดัน', m[1] + ' kV');
    if ((m = name.match(/(\d+(?:[.,]\d+)?)\s*kA(?![A-Za-z])/i)))push('พิกัดกระแสลัดวงจร', m[1] + ' kA');
    // หม้อแปลงเครื่องวัดเขียนอัตราส่วนได้สองแบบ 300/5A และ 75:5/5A (สองแกน)
    // ตัวเลขหน้าอัตราส่วนต้องไม่ติดกับเลขรุ่น เช่น LDB-35 : 300/5A ตัวเลข 35 คือรุ่น ไม่ใช่พิกัด
    // ใช้กลุ่มจับตัวอักษรข้างหน้าแทน lookbehind เพื่อให้เบราว์เซอร์รุ่นเก่ายังทำงานได้
    if ((m = name.match(/(^|[^-\w])(\d+)\s*:\s*(\d+)\s*\/\s*(\d+)\s*A(?![A-Za-z])/i)))
      push('อัตราส่วนกระแส', m[2] + ' : ' + m[3] + '/' + m[4] + ' A');
    else if ((m = name.match(/(\d+)\s*\/\s*(\d+)\s*A(?![A-Za-z])/i)))
      push('อัตราส่วนกระแส', m[1] + '/' + m[2] + ' A');
    else if ((m = name.match(/(\d+(?:[.,]\d+)?)\s*A(?![A-Za-z])/i)))
      push('พิกัดกระแส', m[1] + ' A');
    if ((m = name.match(/(\d+(?:[.,]\d+)?)\s*VA(?![A-Za-z])/i)))push('ภาระทางไฟฟ้า', m[1] + ' VA');
    if ((m = name.match(/Cl(?:ass)?\.?\s*([\d.]+)/i)))         push('ชั้นความแม่นยำ', 'Class ' + m[1]);
    // ต้องมีอย่างน้อยสองหลัก กันไม่ให้จับเลข 3 ใน √3V ของหม้อแปลงแรงดัน
    if ((m = name.match(/(\d{2,}(?:[.,]\d+)?)\s*V(?![A-Za-z])/i)))push('แรงดันใช้งาน', m[1] + ' V');
    if ((m = name.match(/(\d+(?:[.,]\d+)?)\s*W(?![A-Za-z])/i)))push('กำลังไฟฟ้า', m[1] + ' W');
    if (/\(PEA\)/i.test(name))     push('มาตรฐาน', 'ตามข้อกำหนดการไฟฟ้าส่วนภูมิภาค');
    if (/\(Private\)/i.test(name)) push('กลุ่มการใช้งาน', 'งานเอกชน');
    return out;
  }

  // คำอธิบายสั้นบนการ์ด สร้างจากพิกัดที่ดึงได้ ถ้าไม่มีก็ใช้ชื่อประเภทสินค้า
  function shortDesc(r) {
    const sp = specs(r.name);
    if (sp.length) return sp.slice(0, 3).map(x => x.value).join(' · ');
    return r.type;
  }

  return { esc, slug, imgForCore, imgForService, row, rows, specs, shortDesc };
})();
