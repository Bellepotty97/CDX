/* มาตรฐานและเอกสารรับรองของสินค้า PEM
   ที่มาของข้อมูลทั้งหมด: แคตตาล็อก Precise Products 2026 ฉบับภาษาไทยที่อยู่ในรีโปนี้
   (catalogue-2026_TH) โดยอ้างอิงเลขหน้าไว้ในฟิลด์ src ของแต่ละรายการ

   หลักการสำคัญ
   - ไม่ใส่เลขที่ใบรับรองหรือวันหมดอายุที่ยังไม่ได้รับยืนยันจากฝ่ายคุณภาพ
     เพราะเป็นข้อมูลที่มีผลทางกฎหมายและตรวจสอบได้ หน้าเว็บจึงระบุเฉพาะ
     "มาตรฐานที่ใช้" ซึ่งยืนยันได้จากแคตตาล็อก แล้วให้ลูกค้าขอสำเนาใบรับรอง
     ฉบับจริงจากฝ่ายขาย
   - เมื่อฝ่ายคุณภาพส่งเลขที่ใบรับรองและไฟล์ PDF มาแล้ว ให้เติมลงในฟิลด์
     no (เลขที่) และ file (พาธไฟล์ใน assets/docs/) ของแต่ละรายการ
     หน้าเว็บจะเปลี่ยนจากปุ่ม "ขอเอกสาร" เป็นปุ่มดาวน์โหลดให้เองโดยไม่ต้องแก้โค้ด */
window.PEM_CERT = (function () {

  // ---------- การรับรองระดับบริษัท ใช้ได้กับสินค้าทุกกลุ่ม ----------
  const company = [
    { id:'mit',      name:'Made in Thailand (MiT)', by:'สภาอุตสาหกรรมแห่งประเทศไทย (ส.อ.ท.)',
      note:'ยืนยันว่าผลิตในประเทศไทย ใช้สิทธิแต้มต่อในการจัดซื้อจัดจ้างภาครัฐได้',
      icon:'certificate', tone:'mit', no:'', file:'', src:'แคตตาล็อก 2026 หน้า 65' },
    { id:'iso9001',  name:'ISO 9001:2015', by:'ระบบบริหารงานคุณภาพ',
      note:'ครอบคลุมการออกแบบ การผลิต และการส่งมอบ',
      icon:'shield', tone:'iso', no:'', file:'', src:'แคตตาล็อก 2026 หน้า 4 และ 65' },
    { id:'iso14001', name:'ISO 14001', by:'ระบบการจัดการสิ่งแวดล้อม',
      note:'', icon:'shield', tone:'iso', no:'', file:'', src:'แคตตาล็อก 2026 หน้า 65' },
    { id:'iso45001', name:'ISO 45001', by:'ระบบการจัดการอาชีวอนามัยและความปลอดภัย',
      note:'', icon:'shield', tone:'iso', no:'', file:'', src:'แคตตาล็อก 2026 หน้า 65' },
  ];

  // ---------- ห้องทดสอบที่ออกรายงานผลทดสอบ (Type Test) ----------
  const labs = [
    { name:'CESI',  place:'อิตาลี' },
    { name:'KEMA',  place:'เนเธอร์แลนด์' },
    { name:'KERI',  place:'เกาหลีใต้' },
    { name:'EGAT',  place:'การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย' },
  ];

  // ---------- มาตรฐานประจำกลุ่มสินค้า ----------
  // kind: 'tis' = มอก. ออกโดย สมอ. | 'iec' = มาตรฐานสากล | 'pea' = มาตรฐานการไฟฟ้าส่วนภูมิภาค
  const byCore = {
    'Distribution Transformer': [
      { kind:'tis', code:'384', note:'หม้อแปลงไฟฟ้ากำลัง', src:'หน้า 5-6' },
      { kind:'iec', code:'IEC 60076', note:'Power transformers', src:'หน้า 5-6' },
    ],
    'Instrument Transformer (Oil Type)': [
      { kind:'iec', code:'IEC 61869-2', note:'หม้อแปลงกระแส (CT)', src:'หน้า 22-27' },
      { kind:'iec', code:'IEC 61869-3', note:'หม้อแปลงแรงดัน (VT)', src:'หน้า 22-27' },
      { kind:'iec', code:'IEEE C57.13-2008', note:'Instrument transformers', src:'หน้า 22-27' },
    ],
    'Instrument Transformer (Dry Type)': [
      { kind:'iec', code:'IEC 61869-2', note:'หม้อแปลงกระแส (CT)', src:'หน้า 22-27' },
      { kind:'iec', code:'IEC 61869-3', note:'หม้อแปลงแรงดัน (VT)', src:'หน้า 22-27' },
      { kind:'iec', code:'IEEE C57.13-2008', note:'Instrument transformers', src:'หน้า 22-27' },
    ],
    'LED': [
      { kind:'tis', code:'1955-2551', note:'บริภัณฑ์ส่องสว่างและบริภัณฑ์ที่คล้ายกัน', src:'หน้า 29' },
      { kind:'tis', code:'902 เล่ม 2(3)-2557', note:'ความเข้ากันได้ทางแม่เหล็กไฟฟ้า', src:'หน้า 29' },
      { kind:'iec', code:'IEC 60598-2-3', note:'โคมไฟถนน', src:'หน้า 29' },
      { kind:'iec', code:'IEC 62031', note:'โมดูล LED', src:'หน้า 29' },
      { kind:'iec', code:'IEC 62471', note:'ความปลอดภัยทางแสงชีวภาพ', src:'หน้า 29' },
      { kind:'iec', code:'IEC 60529', note:'ระดับการป้องกัน IP', src:'หน้า 29' },
    ],
    'Power Capacitor': [
      { kind:'iec', code:'IEC 60871-1', note:'คาปาซิเตอร์แรงสูง', src:'หน้า 34-35' },
      { kind:'iec', code:'IEC 60831-1 / IEC 60831-2', note:'คาปาซิเตอร์แรงต่ำ', src:'หน้า 34-35' },
    ],
    'Fuse': [
      { kind:'tis', code:'2109', note:'ฟิวส์แรงต่ำ', src:'หน้า 51' },
      { kind:'iec', code:'IEC 60269-2', note:'ฟิวส์แรงต่ำ', src:'หน้า 48-51' },
      { kind:'iec', code:'IEC 61952', note:'ดรอปเอาต์ฟิวส์คัตเอาต์', src:'หน้า 47-53' },
    ],
    'Surge Arrester': [
      { kind:'iec', code:'IEC 60099-4', note:'กับดักเสิร์จโลหะออกไซด์', src:'หน้า 45-46' },
      { kind:'iec', code:'IEC 61643-1', note:'อุปกรณ์ป้องกันเสิร์จแรงต่ำ', src:'หน้า 45-46' },
      { kind:'iec', code:'IEC 60815-3', note:'การเลือกฉนวนตามสภาพมลภาวะ', src:'หน้า 45-46' },
    ],
    'Load Break Switch': [
      { kind:'iec', code:'IEC 62271-103', note:'สวิตช์ตัดตอนแรงสูง', src:'หน้า 36-40' },
      { kind:'iec', code:'IEC 62271-1', note:'ข้อกำหนดร่วมสวิตช์เกียร์แรงสูง', src:'หน้า 36-40' },
    ],
    'Recloser': [
      { kind:'iec', code:'IEC 62271-111', note:'รีโคลสเซอร์', src:'หน้า 41-42' },
      { kind:'iec', code:'IEEE C37.60', note:'Automatic circuit reclosers', src:'หน้า 41' },
    ],
    'FRTU': [
      { kind:'iec', code:'IEC 60870-5-101', note:'โพรโทคอล SCADA', src:'หน้า 42' },
      { kind:'iec', code:'IEC 60870-5-104', note:'โพรโทคอล SCADA ผ่าน TCP/IP', src:'หน้า 42' },
    ],
    'Cellular Router': [
      { kind:'iec', code:'IEC 60870-5-104', note:'โพรโทคอล SCADA ผ่าน TCP/IP', src:'หน้า 42' },
    ],
    'Protection Relay': [
      { kind:'iec', code:'IEC 61439-1', note:'ตู้สวิตช์บอร์ดแรงต่ำ', src:'หน้า 15-21' },
      { kind:'iec', code:'IEC 62271-200', note:'สวิตช์เกียร์แรงสูงแบบตู้ปิด', src:'หน้า 15-21' },
    ],
    '1-Pole Disconnecting Switch (Vertical Break)': [
      { kind:'iec', code:'IEC 62271-102', note:'สวิตช์ใบมีดและสวิตช์กราวด์', src:'หน้า 43-44' },
    ],
    '3-Pole Air Break Switch (Center Break)': [
      { kind:'iec', code:'IEC 62271-102', note:'สวิตช์ใบมีดและสวิตช์กราวด์', src:'หน้า 43-44' },
      { kind:'iec', code:'IEC 62271-1', note:'ข้อกำหนดร่วมสวิตช์เกียร์แรงสูง', src:'หน้า 43' },
    ],
    '3-Pole Disconnecting Switch (Double-side Break)': [
      { kind:'iec', code:'IEC 62271-102', note:'สวิตช์ใบมีดและสวิตช์กราวด์', src:'หน้า 44' },
      { kind:'iec', code:'IEC 60694', note:'ข้อกำหนดร่วมสวิตช์เกียร์แรงสูง', src:'หน้า 44' },
    ],
    '3-Pole Earthing Switch (Vertical Break)': [
      { kind:'iec', code:'IEC 62271-102', note:'สวิตช์ใบมีดและสวิตช์กราวด์', src:'หน้า 44' },
    ],
    'Suspension Insulator': [
      { kind:'iec', code:'IEC 61109', note:'ลูกถ้วยแขวนแบบคอมโพสิต', src:'หน้า 54' },
    ],
  };

  const KIND = {
    tis: { label:'มอก.', by:'สมอ. (สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม)' },
    iec: { label:'สากล', by:'IEC / IEEE' },
    pea: { label:'กฟภ.', by:'การไฟฟ้าส่วนภูมิภาค' },
  };

  return {
    company, labs, byCore, KIND,
    forCore: core => byCore[core] || [],
    // สินค้ากลุ่มนี้มี มอก. ที่ระบุไว้ในแคตตาล็อกหรือไม่
    hasTis: core => (byCore[core] || []).some(x => x.kind === 'tis'),
  };
})();
