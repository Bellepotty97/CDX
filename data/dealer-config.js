// ค่ากำหนดกลางของ Dealer Management Platform
// ใช้ร่วมกันระหว่างหน้าสมัคร/เข้าสู่ระบบ (dealer.html) และหน้าแพลตฟอร์ม (dealer-portal.html)
//
// ตัวเลขทั้งหมดในไฟล์นี้เป็นค่าสมมติสำหรับสาธิตระบบ ยังไม่ใช่เงื่อนไขทางการค้าจริง
// ราคาสินค้าเป็นการประมาณการจากรหัสสินค้าแบบคงที่ ไม่ได้มาจาก Price List ฉบับจริง

window.PEM_DEALER = (function () {

  // ---------- กลุ่มคู่ค้า : แบ่งตามลักษณะธุรกิจ ฝ่ายขายเป็นผู้จัดกลุ่มตอน verify ----------
  const groups = [
    { id:'inside',  name:'Inside Group',        disc:0.22,
      desc:'บริษัทในเครือกลุ่มพรีไซซ ซื้อเพื่อใช้ในโครงการของกลุ่ม' },
    { id:'smart',   name:'Smart Shop',          disc:0.08,
      desc:'ร้านค้าปลีกอุปกรณ์ไฟฟ้าในพื้นที่ ขายหน้าร้านเป็นหลัก' },
    { id:'private', name:'Dealer-Private',      disc:0.12,
      desc:'ตัวแทนจำหน่ายเอกชนและผู้รับเหมางานระบบไฟฟ้า' },
    { id:'pea',     name:'Dealer-PEA Regional', disc:0.15,
      desc:'ตัวแทนที่เข้างานตกลงราคาของการไฟฟ้าส่วนภูมิภาค ต้องมีหนังสือแต่งตั้งรายงาน' },
  ];

  // ---------- ระดับคู่ค้า (Tier) ----------
  // สมัครครั้งแรก ฝ่ายขายประเมินให้จากทุนจดทะเบียน ประสบการณ์ พื้นที่ขาย และยอดซื้อคาดการณ์ปีแรก
  // จากนั้นทบทวนอัตโนมัติทุกไตรมาสจากยอดซื้อที่ชำระแล้วย้อนหลัง 12 เดือน
  const tiers = [
    { id:'T1', name:'Standard', disc:0.00, credit:'เงินสด หรือเครดิต 30 วัน', min:0,
      point:1.00, note:'ระดับเริ่มต้นของคู่ค้าใหม่ทุกราย' },
    { id:'T2', name:'Silver',   disc:0.02, credit:'เครดิต 30 วัน',           min:2000000,
      point:1.15, note:'ยอดซื้อสะสม 12 เดือน ตั้งแต่ 2 ล้านบาท' },
    { id:'T3', name:'Gold',     disc:0.04, credit:'เครดิต 45 วัน',           min:10000000,
      point:1.30, note:'ยอดซื้อสะสม 12 เดือน ตั้งแต่ 10 ล้านบาท' },
    { id:'T4', name:'Platinum', disc:0.06, credit:'เครดิต 60 วัน',           min:30000000,
      point:1.50, note:'ยอดซื้อสะสม 12 เดือน ตั้งแต่ 30 ล้านบาท' },
  ];

  // ---------- เกณฑ์ที่ฝ่ายขายใช้ประเมิน tier ครั้งแรก ----------
  const firstTierCriteria = [
    { label:'ทุนจดทะเบียน',              w:20, detail:'ต่ำกว่า 1 ลบ. / 1-5 ลบ. / 5-20 ลบ. / มากกว่า 20 ลบ.' },
    { label:'ประสบการณ์ในธุรกิจไฟฟ้า',   w:20, detail:'น้อยกว่า 2 ปี / 2-5 ปี / 5-10 ปี / มากกว่า 10 ปี' },
    { label:'ยอดซื้อคาดการณ์ปีแรก',      w:30, detail:'ตัวเลขที่ผู้สมัครแจ้ง ประกอบกับงานในมือที่ตรวจสอบได้' },
    { label:'พื้นที่และช่องทางจำหน่าย',  w:15, detail:'จำนวนจังหวัดที่ครอบคลุม หน้าร้าน คลังสินค้า' },
    { label:'ผลงานอ้างอิง',              w:15, detail:'โครงการที่เคยส่งมอบ ลูกค้าอ้างอิง' },
  ];

  // ---------- ระยะเวลาส่งมอบตามกลุ่มสินค้า ----------
  const leadTime = {
    'Distribution Transformer':            { min:45, max:60,  stock:false },
    'Instrument Transformer (Oil Type)':   { min:30, max:45,  stock:false },
    'Instrument Transformer (Dry Type)':   { min:30, max:45,  stock:false },
    'Load Break Switch':                   { min:60, max:90,  stock:false },
    'Recloser':                            { min:90, max:120, stock:false },
    'Protection Relay':                    { min:40, max:55,  stock:false },
    'Power Capacitor':                     { min:21, max:30,  stock:false },
    'Fuse':                                { min:7,  max:14,  stock:true  },
    'Surge Arrester':                      { min:7,  max:14,  stock:true  },
    'Suspension Insulator':                { min:7,  max:10,  stock:true  },
    'LED':                                 { min:10, max:21,  stock:true  },
    'FRTU':                                { min:30, max:45,  stock:false },
    'Cellular Router':                     { min:21, max:30,  stock:true  },
  };
  const leadTimeDefault = { min:30, max:45, stock:false };

  // ---------- ช่วงราคาตั้งต้นต่อกลุ่มสินค้า (บาท) : ประมาณการเพื่อสาธิตเท่านั้น ----------
  const priceBand = {
    'Distribution Transformer':            [ 78000, 860000 ],
    'Instrument Transformer (Oil Type)':   [  9000,  48000 ],
    'Instrument Transformer (Dry Type)':   [  7500,  42000 ],
    'Load Break Switch':                   [ 62000, 265000 ],
    'Recloser':                            [340000, 720000 ],
    'Protection Relay':                    [ 26000, 185000 ],
    'Power Capacitor':                     [  3200,  36000 ],
    'Fuse':                                [   280,   4800 ],
    'Surge Arrester':                      [   850,  12500 ],
    'Suspension Insulator':                [   240,   1900 ],
    'LED':                                 [  1500,   9200 ],
    'FRTU':                                [ 95000, 145000 ],
    'Cellular Router':                     [ 14000,  22000 ],
  };
  const priceBandDefault = [ 5000, 38000 ];

  // hash คงที่จากรหัสสินค้า ให้ราคาสาธิตไม่เปลี่ยนทุกครั้งที่รีเฟรช
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) / 4294967295;
  }

  function basePrice(coreName, code) {
    const [lo, hi] = priceBand[coreName] || priceBandDefault;
    const v = lo + hash(code) * (hi - lo);
    const step = v > 100000 ? 1000 : v > 10000 ? 100 : 10;
    return Math.round(v / step) * step;
  }

  function netPrice(base, group, tier) {
    return Math.round(base * (1 - group.disc) * (1 - tier.disc));
  }

  // ---------- บัญชีสาธิต ----------
  // บัญชีนี้มีไว้สาธิตหน้าจอฝั่ง Dealer เท่านั้น ตรวจสอบรหัสผ่านฝั่งเบราว์เซอร์
  // ระบบจริงต้องย้ายการยืนยันตัวตนไปฝั่งเซิร์ฟเวอร์ทั้งหมด
  const demoAccount = {
    user:'Dealer1',
    pass:'Password',
    code:'DL-69-0147',
    company:'บริษัท เดโมอิเลคทริค ซัพพลาย จำกัด',
    taxId:'0105560000000',
    contact:'คุณสมชาย ใจดี',
    phone:'081-234-5678',
    email:'dealer1@example.com',
    address:'99/9 หมู่ 3 ต.บางกระสอ อ.เมืองนนทบุรี จ.นนทบุรี 11000',
    groupId:'pea',
    tierId:'T3',
    since:'2566',
    peaAreas:['กฟจ.นนทบุรี','กฟอ.ปากเกร็ด','กฟอ.บางบัวทอง'],
    creditUsed: 1840000,
    creditLimit: 5000000,
  };

  return { groups, tiers, firstTierCriteria, leadTime, leadTimeDefault,
           basePrice, netPrice, demoAccount,
           groupById: id => groups.find(g => g.id === id),
           tierById:  id => tiers.find(t => t.id === id),
           baht: n => n.toLocaleString('th-TH') };
})();
