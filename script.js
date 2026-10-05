'use strict';
/* Sanwariya Pharma – frontend demo. No data is sent anywhere.
   A backend / email service is required for real enquiry submissions. */

const PRODUCTS = [
  ['Paracetamol 500mg Tablets','Tablets','10 x 10 Tablets',120],
  ['Azithromycin 500mg Tablets','Antibiotics','1 x 3 Tablets',85],
  ['Amoxicillin 500mg Capsules','Antibiotics','10 x 10 Capsules',180],
  ['Pantoprazole 40mg Tablets','Gastro','10 x 10 Tablets',110],
  ['Cetirizine 10mg Tablets','Allergy','10 x 10 Tablets',70],
  ['ORS Powder','Healthcare','21g Sachet',18],
  ['Multivitamin Tablets','Supplements','10 x 10 Tablets',150],
  ['Vitamin C Tablets','Vitamins','10 x 10 Tablets',130],
  ['Antiseptic Liquid','Medical Supplies','100ml',75],
  ['Disposable Surgical Gloves','Medical Supplies','100 Pieces',450],
  ['Surgical Face Masks','Medical Supplies','50 Pieces',120],
  ['Digital Thermometer','Medical Equipment','1 Piece',150]
].map(([name,cat,pack,price],id)=>({id,name,cat,pack,price}));

const CATS = ['All','Tablets','Capsules','Antibiotics','Gastro','Allergy','Vitamins','Healthcare','Medical Supplies','Medical Equipment'];
const $ = s => document.querySelector(s);
let activeCat = 'All', query = '', enquiry = [];

/* Loader */
window.addEventListener('load', () => setTimeout(() => $('#loader').classList.add('done'), 700));

/* Navbar: sticky shadow, hamburger, scroll-to-top */
const nav = $('#nav'), menu = $('#menu'), burger = $('#burger'), totop = $('#totop');
window.addEventListener('scroll', () => {
  nav.classList.toggle('stuck', scrollY > 10);
  totop.classList.toggle('show', scrollY > 500);
});
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
});
menu.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => {
  menu.classList.remove('open'); burger.classList.remove('open');
}));
totop.addEventListener('click', () => scrollTo({top:0,behavior:'smooth'}));

/* Toast */
let toastTimer;
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* Product catalog: search + filter */
const chips = $('#chips');
CATS.forEach(c => {
  const b = document.createElement('button');
  b.className = 'chip' + (c === 'All' ? ' on' : ''); b.textContent = c;
  b.addEventListener('click', () => {
    activeCat = c;
    chips.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b));
    render();
  });
  chips.appendChild(b);
});
$('#search').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); render(); });

function render(){
  // "Tablets" and "Capsules" also match by pack type so those filters stay useful
  const list = PRODUCTS.filter(p => {
    const inCat = activeCat === 'All' || p.cat === activeCat ||
      (activeCat === 'Tablets' && /tablet/i.test(p.pack)) ||
      (activeCat === 'Capsules' && /capsule/i.test(p.pack));
    return inCat && p.name.toLowerCase().includes(query);
  });
  $('#grid').innerHTML = list.map(p => `
    <article class="card">
      <span class="tag">${p.cat}</span>
      <h3>${p.name}</h3>
      <p class="pack">Pack: ${p.pack}</p>
      <p class="price">₹${p.price} <small>indicative wholesale</small></p>
      <button class="btn btn-green" data-id="${p.id}">Add to Enquiry</button>
    </article>`).join('');
  $('#empty').hidden = list.length > 0;
}
$('#grid').addEventListener('click', e => {
  const b = e.target.closest('button[data-id]'); if (!b) return;
  const p = PRODUCTS[+b.dataset.id], ex = enquiry.find(i => i.id === p.id);
  ex ? ex.qty++ : enquiry.push({id:p.id, name:p.name, pack:p.pack, qty:1});
  updateEnquiry(); toast(p.name + ' added to enquiry');
});

/* Enquiry drawer */
const drawer = $('#drawer'), overlay = $('#overlay'), enqForm = $('#enqForm');
function openDrawer(e){ if (e) e.preventDefault(); drawer.classList.add('show'); overlay.classList.add('show'); drawer.setAttribute('aria-hidden','false'); }
function closeDrawer(){ drawer.classList.remove('show'); overlay.classList.remove('show'); drawer.setAttribute('aria-hidden','true'); }
['#navEnquire','#contactEnquire'].forEach(s => $(s).addEventListener('click', e => { openDrawer(e); menu.classList.remove('open'); burger.classList.remove('open'); }));
$('#dClose').addEventListener('click', closeDrawer);
overlay.addEventListener('click', closeDrawer);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

function updateEnquiry(){
  const total = enquiry.length;
  $('#navCount').textContent = total; $('#dCount').textContent = total;
  $('#listEmpty').hidden = total > 0;
  $('#list').innerHTML = enquiry.map(i => `
    <li><div class="nm">${i.name}<small>${i.pack}</small></div>
      <div class="qty"><button data-a="dec" data-id="${i.id}" aria-label="Decrease">−</button>
        <span>${i.qty}</span><button data-a="inc" data-id="${i.id}" aria-label="Increase">+</button></div>
      <button class="rm" data-a="rm" data-id="${i.id}">Remove</button></li>`).join('');
  enqForm.elements.sel.value = enquiry.map(i => `${i.name} (${i.pack}) x ${i.qty}`).join('\n');
}
$('#list').addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const i = enquiry.find(x => x.id === +b.dataset.id);
  if (b.dataset.a === 'inc') i.qty++;
  if (b.dataset.a === 'dec') i.qty = Math.max(1, i.qty - 1);
  if (b.dataset.a === 'rm') enquiry = enquiry.filter(x => x !== i);
  updateEnquiry();
});
$('#sendEnq').addEventListener('click', () => {
  if (!enquiry.length) return toast('Add at least one product first');
  enqForm.hidden = false; enqForm.scrollIntoView({behavior:'smooth'});
});

/* Validation */
function validate(form, rules){
  let ok = true;
  rules.forEach(([name, test, msg]) => {
    const f = form.elements[name], err = f.parentElement.querySelector('small');
    const bad = !test(f.value.trim());
    f.classList.toggle('bad', bad); if (err) err.textContent = bad ? msg : '';
    if (bad) ok = false;
  });
  return ok;
}
const req = v => v.length > 1;
const mobile = v => /^[6-9]\d{9}$/.test(v.replace(/[\s-]/g,''));
const emailOk = v => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

enqForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!validate(enqForm, [['name',req,'Enter your name'],['mobile',mobile,'Enter a valid 10-digit mobile number'],['business',req,'Enter your business name']])) return;
  enqForm.reset(); enquiry = []; updateEnquiry(); enqForm.hidden = true; closeDrawer();
  toast('Enquiry submitted (demo). We will contact you soon.');
});
const cf = $('#contactForm');
cf.addEventListener('submit', e => {
  e.preventDefault();
  const ok = validate(cf, [['name',req,'Enter your full name'],['mobile',mobile,'Enter a valid 10-digit mobile number'],
    ['email',emailOk,'Enter a valid email address'],['business',req,'Enter your business name'],['product',req,'Tell us what you need']]);
  if (!ok) return;
  cf.reset(); const m = cf.querySelector('.ok'); m.hidden = false;
  toast('Enquiry submitted (demo)'); setTimeout(() => m.hidden = true, 6000);
});

/* Animated counters */
const io = new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return; io.unobserve(en.target);
  const to = +en.target.dataset.to, t0 = performance.now();
  (function step(t){
    const p = Math.min((t - t0) / 1400, 1);
    en.target.textContent = Math.round(to * p); if (p < 1) requestAnimationFrame(step);
  })(t0);
}), {threshold:.6});
document.querySelectorAll('.count').forEach(c => io.observe(c));

render(); updateEnquiry();
