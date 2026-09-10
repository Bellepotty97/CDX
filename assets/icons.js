// ชุดไอคอนกลาง ใช้ร่วมกันทั้งหน้าเว็บสาธารณะและ Dealer Management Platform
// เป็น inline SVG ทั้งหมด ไม่มีการโหลดจากภายนอก จึงไม่พังเมื่อเปิดออฟไลน์
// ใช้งาน: <span data-icon="transformer"></span> แล้วสคริปต์นี้จะเติม svg ให้เอง
//        หรือเรียก PEM_ICON.svg('transformer') ตอนสร้าง HTML ด้วย JavaScript
window.PEM_ICON = (function () {
  const P = {
    // ---------- กลุ่มสินค้า ----------
    transformer:'<path d="M7 4v3M17 4v3M7 17v3M17 17v3"/><rect x="4" y="7" width="6" height="10" rx="1"/><rect x="14" y="7" width="6" height="10" rx="1"/><path d="M10 10h4M10 14h4"/>',
    meter:'<circle cx="12" cy="12" r="8"/><path d="M12 12l3.5-3M12 4v1M20 12h-1M12 20v-1M4 12h1"/>',
    shield:'<path d="M12 3l7 3v6c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6z"/><path d="M12 8v5"/><circle cx="12" cy="15.5" r=".6" fill="currentColor" stroke="none"/>',
    fuse:'<path d="M3 12h3M18 12h3"/><rect x="6" y="8" width="12" height="8" rx="2"/><path d="M9 12h6"/>',
    arrester:'<path d="M13 2L5 13h5l-1 9 8-11h-5z"/>',
    breaker:'<circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/><path d="M7.5 15.5L17 7"/><path d="M13 5h5v5"/>',
    capacitor:'<path d="M3 12h6M15 12h6"/><path d="M9 5v14M15 5v14"/>',
    insulator:'<path d="M12 3v18"/><ellipse cx="12" cy="8" rx="6" ry="2"/><ellipse cx="12" cy="12" rx="6" ry="2"/><ellipse cx="12" cy="16" rx="6" ry="2"/>',
    led:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3 11v2h6v-2a6 6 0 0 0-3-11z"/>',
    router:'<rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 17h.01M11 17h.01"/><path d="M12 10V4M8.5 7.5a5 5 0 0 1 7 0"/>',
    relay:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M4 10h-2M4 14h-2M22 10h-2M22 14h-2"/>',
    switchgear:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M7 14h2M12 14h5"/>',
    // ---------- บริการ ----------
    energy:'<path d="M13 2L5 13h5l-1 9 8-11h-5z"/>',
    install:'<path d="M14.7 6.3a4 4 0 0 1-5 5L4 17v3h3l5.7-5.7a4 4 0 0 1 5-5z"/>',
    maintain:'<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
    factory:'<path d="M3 20h18"/><path d="M4 20V9l5 3V9l5 3V9l5 3v8"/><path d="M8 20v-3M13 20v-3M18 20v-3"/>',
    chartbar:'<path d="M4 20h16"/><rect x="6" y="11" width="3" height="6" rx="1"/><rect x="11" y="7" width="3" height="10" rx="1"/><rect x="16" y="13" width="3" height="4" rx="1"/>',
    // ---------- ติดต่อ / งานทั่วไป ----------
    quote:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
    handshake:'<path d="M8 12l2.5 2.5a1.8 1.8 0 0 0 2.5 0L18 10"/><path d="M3 9l4-4 4 3h4l4 4"/><path d="M3 9v5l4 4"/><path d="M21 9v5l-3 3"/>',
    support:'<path d="M21 12a8 8 0 1 1-3.2-6.4"/><path d="M12 8v5"/><circle cx="12" cy="16" r=".7" fill="currentColor" stroke="none"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    box:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
    // ---------- พอร์ทัลคู่ค้า ----------
    target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8" fill="currentColor" stroke="none"/>',
    cart:'<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 12.4a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.2L21 7H6"/>',
    tag:'<path d="M3 12V4h8l9 9-8 8z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
    truck:'<rect x="2" y="7" width="12" height="9" rx="1"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/>',
    briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>',
    training:'<path d="M12 4L2 9l10 5 10-5z"/><path d="M6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5"/>',
    certificate:'<path d="M8 3h11a1 1 0 0 1 1 1v11H8z"/><path d="M8 15H4v4a2 2 0 0 0 2 2h12"/><circle cx="14" cy="9" r="2.5"/><path d="M12.5 11v3l1.5-1 1.5 1v-3"/>',
    gift:'<rect x="3" y="9" width="18" height="12" rx="1.5"/><path d="M3 13h18M12 9v12"/><path d="M12 9S10.5 4 8 4a2 2 0 0 0 0 4h4zM12 9s1.5-5 4-5a2 2 0 0 1 0 4h-4z"/>',
    coin:'<circle cx="12" cy="12" r="8"/><path d="M12 7v10M14.5 9.5A2.5 2.5 0 0 0 12 8.5h-.5a2 2 0 0 0 0 4h1a2 2 0 0 1 0 4H12a2.5 2.5 0 0 1-2.5-1"/>',
    // ---------- ช่องทางติดต่อ ----------
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    phone:'<path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  };
  const FILLED = {
    facebook:'<path d="M14 8.5V7c0-.7.5-1 1-1h1.5V3.2C16 3.1 15 3 14 3c-2.3 0-3.9 1.4-3.9 4v1.5H7.5V12h2.6v9h3.3v-9h2.5l.5-3.5H14z"/>',
    line:'<path d="M12 3C6.9 3 2.8 6.3 2.8 10.4c0 3.7 3.3 6.8 7.7 7.4.3.1.7.2.8.5.1.3.1.6 0 .9l-.1.8c0 .2-.2.9.8.5s5.3-3.1 7.2-5.3c1.3-1.4 1.9-2.9 1.9-4.8C21.2 6.3 17.1 3 12 3zM8.3 12.8h-2c-.3 0-.5-.2-.5-.5V9c0-.3.2-.5.5-.5s.5.2.5.5v2.8h1.5c.3 0 .5.2.5.5s-.2.5-.5.5zm2.1-.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V9c0-.3.2-.5.5-.5s.5.2.5.5v3.3zm4 0c0 .2-.1.4-.4.5h-.2c-.2 0-.3-.1-.4-.2l-1.7-2.3v2c0 .3-.2.5-.5.5s-.5-.2-.5-.5V9c0-.2.1-.4.4-.5.2-.1.5 0 .6.2l1.7 2.3V9c0-.3.2-.5.5-.5s.5.2.5.5v3.3zm3.1-2.2c.3 0 .5.2.5.5s-.2.5-.5.5h-1.5v.7h1.5c.3 0 .5.2.5.5s-.2.5-.5.5h-2c-.3 0-.5-.2-.5-.5V9c0-.3.2-.5.5-.5h2c.3 0 .5.2.5.5s-.2.5-.5.5h-1.5v.6h1.5z"/>',
    telegram:'<path d="M21.3 4.3 2.9 11.4c-.9.3-.9 1.6.1 1.9l4.6 1.4 1.8 5.5c.2.6 1 .8 1.4.3l2.5-2.5 4.6 3.4c.6.4 1.4.1 1.6-.6l3.3-14.9c.2-.9-.7-1.6-1.5-1.3zM9.7 14.2l8.1-5.6-6.6 6.8-.3 3.1-1.2-4.3z"/>',
    star:'<path d="M12 3.5l2.6 5.6 6 .8-4.4 4.2 1.1 6.1L12 17.3l-5.3 2.9 1.1-6.1L3.4 9.9l6-.8z"/>',
    check:'<path d="M20.3 6.3 9.6 17 3.7 11.1l1.4-1.4 4.5 4.5 9.3-9.3z"/>',
  };
  function svg(name, size) {
    const s = size || 22;
    if (FILLED[name])
      return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${FILLED[name]}</svg>`;
    if (!P[name]) return '';
    return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name]}</svg>`;
  }
  // จับคู่ core product ในแคตตาล็อกกับไอคอน
  const BY_CORE = {
    'Distribution Transformer':'transformer',
    'Instrument Transformer (Oil Type)':'meter',
    'Instrument Transformer (Dry Type)':'meter',
    'Fuse':'fuse',
    'Surge Arrester':'arrester',
    'Load Break Switch':'breaker',
    'Recloser':'breaker',
    'Protection Relay':'relay',
    'Power Capacitor':'capacitor',
    'Suspension Insulator':'insulator',
    'LED':'led',
    'Cellular Router':'router',
    'FRTU':'router',
  };
  function paint(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(el => {
      if (el.dataset.iconDone) return;
      el.innerHTML = svg(el.dataset.icon, +el.dataset.iconSize || 22);
      el.dataset.iconDone = '1';
    });
  }
  document.addEventListener('DOMContentLoaded', () => paint());
  return { svg, paint, byCore: c => BY_CORE[c] || 'box' };
})();
