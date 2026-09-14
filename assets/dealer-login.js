/* หน้าเข้าสู่ระบบตัวแทนจำหน่าย (แยกออกมาจาก dealer.html)
   จัดวางแบบ overlay ปิดได้ด้วยกากบาท ปุ่ม Esc หรือคลิกนอกการ์ด
   หมายเหตุสำคัญ: การตรวจรหัสผ่านที่นี่เป็นเพียงการสาธิต เมื่อต่อ Odoo จริง
   ต้องย้ายไปยืนยันตัวตนที่ฝั่งเซิร์ฟเวอร์และคืนค่าเป็น session cookie */
(function () {
'use strict';

const D = window.PEM_DEALER;
const $ = s => document.querySelector(s);

const HOME = 'precise-pcc-pem.html';
const PORTAL = 'dealer-portal.html';

/* ---------------- ปลายทางหลังเข้าสู่ระบบ ---------------- */
// รับได้เฉพาะพาธภายในเว็บนี้เท่านั้น กัน open redirect ไปเว็บอื่น
function safeNext() {
  const raw = new URLSearchParams(location.search).get('next');
  if (!raw) return PORTAL;
  if (!/^[A-Za-z0-9._-]+\.html(\?[^#]*)?(#.*)?$/.test(raw)) return PORTAL;
  return raw;
}

/* ---------------- ปิด overlay ---------------- */
// หน้าที่ผู้ใช้มา ใช้เป็นปลายทางตอนปิด ถ้าเปิดหน้านี้ตรง ๆ ให้กลับหน้าแรกแทน
const BACK_TO = (function () {
  if (!document.referrer) return HOME;
  try {
    const u = new URL(document.referrer);
    if (u.origin !== location.origin) return HOME;
    if (u.pathname === location.pathname) return HOME;   // กันวนกลับมาหน้าเดิม
    return u.href;
  } catch (_) { return HOME; }
})();

// ถอยกลับด้วย history.back() เพื่อคงตำแหน่งเลื่อนของหน้าเดิมไว้ให้
// ถ้าเปิดหน้านี้ตรง ๆ หรือเปิดในแท็บใหม่จนไม่มีหน้าให้ถอย ก็เปลี่ยนหน้าตรง ๆ แทน
function close() {
  if (BACK_TO !== HOME && history.length > 1) history.back();
  else location.replace(BACK_TO);
}
$('#closeBtn').addEventListener('click', close);
$('#ovlclose').addEventListener('click', close);
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  e.preventDefault();
  close();
});

/* ---------------- กักโฟกัสไว้ในการ์ด ---------------- */
const FOCUSABLE = 'a[href],button:not([tabindex="-1"]),input,select,textarea';
document.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const items = [].slice.call(document.querySelectorAll(FOCUSABLE))
    .filter(el => el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

/* ---------------- เข้าสู่ระบบ (สาธิต) ---------------- */
function session() {
  try { return localStorage.getItem('pem_dealer_session') || sessionStorage.getItem('pem_dealer_session'); }
  catch (_) { return null; }
}
// เข้าสู่ระบบค้างไว้อยู่แล้วก็ไม่ต้องให้กรอกซ้ำ
if (session() === D.demoAccount.user) location.replace(safeNext());

$('#loginform').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, err = $('#loginerr');
  if (f.user.value.trim() === D.demoAccount.user && f.pass.value === D.demoAccount.pass) {
    const store = f.remember.checked ? localStorage : sessionStorage;
    try { store.setItem('pem_dealer_session', D.demoAccount.user); } catch (_) {}
    location.href = safeNext();
  } else {
    err.textContent = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (บัญชีสาธิตคือ Dealer1 / Password)';
    err.hidden = false;
    f.pass.focus();
  }
});

// เบราว์เซอร์คืนโฟกัสให้ body หลังโหลดหน้าเสร็จ จึงสั่งโฟกัสอีกครั้งตอน load
function focusUser() {
  const el = document.querySelector('#loginform input[name=user]');
  if (el && document.activeElement !== el) el.focus();
}
focusUser();
window.addEventListener('load', focusUser);

})();
