/* สคริปต์กลางของหน้าเว็บสาธารณะ: เมนูมือถือและเมนูย่อย
   ใช้ร่วมกันระหว่างหน้าแรกและหน้าสินค้าและบริการ */
// เมนูมือถือ
const burger = document.getElementById('burger'), nav = document.getElementById('nav');
burger.addEventListener('click', () => {
  const open = nav.dataset.open !== 'true';
  nav.dataset.open = open;
  burger.setAttribute('aria-expanded', open);
});
nav.addEventListener('click', e => {
  if (e.target.closest('a')) { nav.dataset.open = 'false'; burger.setAttribute('aria-expanded','false'); }
});
nav.querySelectorAll('button.top').forEach(btn => {
  btn.addEventListener('click', () => {
    const li = btn.parentElement, open = li.dataset.open !== 'true';
    li.dataset.open = open;
    btn.setAttribute('aria-expanded', open);
  });
});
