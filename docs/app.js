(() => {
'use strict';
const $ = id => document.getElementById(id);
const BD = '০১২৩৪৫৬৭৮৯', PAGE = 24;
const DB = ['শনি','রবি','সোম','মঙ্গল','বুধ','বৃহ','শুক্র'], DE = ['Sat','Sun','Mon','Tue','Wed','Thu','Fri'];
const DBF = ['শনিবার','রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার'], DEF = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];
const TX = {
 bn:{skip:'সরাসরি তালিকায় যান',h1:'আপনার ডাক্তার খুঁজুন',sub:'বগুড়ার ৭টি হাসপাতালের ডাক্তার – কোথায় বসেন, কোন দিন, কয়টায়।',s1:'রোগ বা বিভাগ বাছুন',s2:'হাসপাতাল ও দিন বাছুন',s3:'ডাক্তারের সময় দেখুন',ph:'ডাক্তার, রোগ বা হাসপাতাল লিখুন',hCat:'১. কোন বিভাগের ডাক্তার?',hHosp:'২. কোন হাসপাতাল?',hDay:'৩. কোন দিন দেখাতে চান?',reset:'সব মুছে ফেলুন',more:'আরও দেখুন',sos:'জরুরি অবস্থায় ফোন করুন',note:'ডাক্তারের সময় বদলাতে পারে। যাওয়ার আগে হাসপাতালে ফোন করে নিশ্চিত হয়ে নিন। এই সাইট কোনো হাসপাতালের অফিসিয়াল সাইট নয়।',
  all:'সব',fav:'প্রিয় ডাক্তার',favAdd:'প্রিয় করুন',favDel:'প্রিয় থেকে সরান',share:'শেয়ার করুন',everyday:'প্রতিদিন',nofav:'এখনো কোনো প্রিয় ডাক্তার নেই। ডাক্তারের কার্ডের হার্ট চিহ্নে চাপ দিন।',shareHead:'ডাক্তারের তথ্য – সেবা পয়েন্ট বগুড়া',today:'আজ',anyday:'যেকোনো দিন',found:'জন ডাক্তার পাওয়া গেছে',none:'কোনো ডাক্তার পাওয়া যায়নি। অন্য শব্দ লিখুন বা “সব মুছে ফেলুন” চাপুন।',sitsToday:'আজ বসছেন',map:'ম্যাপে দেখুন',prof:'বিস্তারিত',nod:'বসার দিন তালিকায় নেই – হাসপাতালে ফোন করুন',doctors:'ডাক্তার'},
 en:{skip:'Skip to list',h1:'Find your doctor',sub:'Doctors of 7 Bogura hospitals – where they sit, which days, what time.',s1:'Pick a problem / department',s2:'Pick hospital & day',s3:'See the doctor’s timing',ph:'Type doctor, problem or hospital',hCat:'1. Which department?',hHosp:'2. Which hospital?',hDay:'3. Which day do you want to go?',reset:'Clear all',more:'Show more',sos:'In an emergency call',note:'Doctor schedules can change. Please phone the hospital to confirm before you go. This is not an official hospital website.',
  all:'All',fav:'Favourite doctors',favAdd:'Add to favourites',favDel:'Remove from favourites',share:'Share',everyday:'Every day',nofav:'No favourite doctors yet. Tap the heart on a doctor’s card.',shareHead:'Doctor info – Sheba Point Bogura',today:'Today',anyday:'Any day',found:'doctors found',none:'No doctor found. Try another word or press “Clear all”.',sitsToday:'Sits today',map:'Open map',prof:'Details',nod:'Days not listed – please call the hospital',doctors:'doctors'}};
let L = 'bn'; try { L = localStorage.getItem('lang') === 'en' ? 'en' : 'bn'; } catch (e) {}
const S = {q:'', c:'', h:'', d:'', f:false, n:PAGE};
let FAV = new Set(); try { FAV = new Set(JSON.parse(localStorage.getItem('fav') || '[]')); } catch (e) {}
const fk = d => d.h + '|' + d.n;
const saveFav = () => { try { localStorage.setItem('fav', JSON.stringify([...FAV])); } catch (e) {} };
let DATA = null, C = {}, H = {}, view = [];
const t = k => TX[L][k];
const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const num = s => L === 'bn' ? String(s).replace(/\d/g, d => BD[d]) : String(s);
const todayIdx = () => (new Date().getDay() + 1) % 7;
const dn = i => (L === 'bn' ? DB : DE)[i];
const mn = n => L !== 'bn' ? n : n.replace(/first and last/i, 'মাসের প্রথম ও শেষ').replace(/2nd and last/i, 'মাসের ২য় ও শেষ').replace(/^last/i, 'মাসের শেষ').replace(/^first/i, 'মাসের প্রথম').replace(/\s*of every month/i, '').replace(/saturday|sunday|monday|tuesday|wednesday|thursday|friday/gi, m => DBF[DEF.findIndex(x => x.toLowerCase() === m.toLowerCase())]);
function tm(s) {
  const i = s.indexOf(' | '); if (i > -1) return mn(s.slice(0, i)) + ' · ' + tm(s.slice(i + 3)); // "4:00 PM" -> "বিকাল ৪:০০" so nobody needs to read AM/PM
  if (L !== 'bn') return s;
  return num(s.replace(/(\d{1,2}):(\d{2}) (AM|PM)/gi, (_, h, m, ap) => {
    h = +h; const pm = ap.toUpperCase() === 'PM';
    const w = pm ? (h === 12 || h < 4 ? 'দুপুর' : h < 6 ? 'বিকাল' : h < 8 ? 'সন্ধ্যা' : 'রাত') : (h === 12 ? 'রাত' : h < 6 ? 'ভোর' : 'সকাল');
    return `${w} ${h}:${m}`;
  }).replace(/ AM| PM/gi, ''));
}
const hs = (d, i) => { d._i = i; const h = H[d.h], c = C[d.c]; d._x = (d.n + ' ' + d.s + ' ' + h.en + ' ' + h.bn + ' ' + c.en + ' ' + c.bn).toLowerCase(); };

function chip(cls, attrs, html, on) { return `<button type="button" class="${cls}" ${attrs} aria-pressed="${on}">${html}</button>`; }
function renderFilters() {
  const cnt = {}; DATA.docs.forEach(d => cnt[d.c] = (cnt[d.c] || 0) + 1);
  $('cats').innerHTML = DATA.cats.filter(c => cnt[c.k]).map(c =>
    chip('cat', `data-c="${c.k}"`, `<span class="ic">${IC(c.k)}</span><b>${esc(L === 'bn' ? c.bn : c.en)}</b><small>${num(cnt[c.k])} ${t('doctors')}</small>`, S.c === c.k)).join('');
  $('hosp').innerHTML = chip('chip', 'data-h=""', t('all'), !S.h) + DATA.hosp.map(h => chip('chip', `data-h="${h.k}"`, esc(L === 'bn' ? h.sb : h.se), S.h === h.k)).join('');
  const fb = $('favbtn'); if (fb) { fb.innerHTML = `${IC('heart')} ${t('fav')} (${num(FAV.size)})`; fb.setAttribute('aria-pressed', S.f); }
  const t0 = todayIdx();
  $('days').innerHTML = chip('chip', 'data-d=""', t('anyday'), S.d === '') + chip('chip', `data-d="${t0}"`, `${t('today')} (${(L === 'bn' ? DBF : DEF)[t0]})`, S.d === String(t0)) +
    [0,1,2,3,4,5,6].filter(i => i !== t0).map(i => chip('chip', `data-d="${i}"`, (L === 'bn' ? DBF : DEF)[i], S.d === String(i))).join('');
}
function card(d) {
  const h = H[d.h], c = C[d.c], t0 = todayIdx(), sits = d.sc.some(s => s.d.includes(t0));
  const slots = d.sc.map(s => `<div class="slot">${s.d.length ? `<div class="dd" aria-label="${s.d.map(i => (L === 'bn' ? DBF : DEF)[i]).join(', ')}">${[0,1,2,3,4,5,6].map(i => `<i class="${s.d.includes(i) ? 'on' : ''} ${i === t0 ? 'td' : ''}">${dn(i)}</i>`).join('')}</div>` : `<p class="nod">${t('nod')}</p>`}<div class="tm">${IC('clock')} ${esc(tm(s.t))}</div></div>`).join('');
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.q)}`;
  const ini = (d.n.replace(/\b(prof|dr|md|mst|mrs|mr|miss|major|col|brig|lt|gen|ex)\b\.?/ig, '').match(/[A-Za-z]+/g) || ['D']).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  return `<article class="doc" data-h="${d.h}">${sits ? `<span class="tag">${t('sitsToday')}</span>` : ''}
  <div class="dh"><span class="av" aria-hidden="true">${ini}</span><div><h3>${esc(d.n)}</h3><p class="spec">${IC(c.k)} ${esc(L === 'bn' ? c.bn : c.en)}<small>${esc(d.s)}</small></p></div><div class="ib"><button type="button" class="fav" data-i="${d._i}" aria-pressed="${FAV.has(fk(d))}" aria-label="${FAV.has(fk(d)) ? t('favDel') : t('favAdd')}">${IC('heart')}</button><button type="button" class="shr" data-i="${d._i}" aria-label="${t('share')}">${IC('share')}</button></div></div>
  <p class="hosp">${IC('hospital')} <span>${esc(L === 'bn' ? h.bn : h.en)}</span></p>${slots}
  <div class="acts"><a href="${map}" target="_blank" rel="noopener noreferrer">${IC('pin')} ${t('map')}</a>${d.l ? `<a href="${esc(d.l)}" target="_blank" rel="noopener noreferrer">${IC('info')} ${t('prof')}</a>` : ''}</div></article>`;
}
function filter() {
  const words = S.q.toLowerCase().split(/\s+/).filter(Boolean), t0 = todayIdx();
  view = DATA.docs.filter(d => (!S.c || d.c === S.c) && (!S.h || d.h === S.h) && (!S.f || FAV.has(fk(d))) &&
    (S.d === '' || d.sc.some(s => s.d.includes(+S.d))) && words.every(w => d._x.includes(w)));
  view.sort((a, b) => (b.sc.some(s => s.d.includes(t0)) - a.sc.some(s => s.d.includes(t0))) || a.n.localeCompare(b.n));
}
function render(keep) {
  filter();
  $('count').textContent = num(view.length) + ' ' + t('found');
  $('list').innerHTML = view.length ? view.slice(0, S.n).map(card).join('') : `<p class="none">${IC(S.f && !FAV.size ? 'heart' : 'sad', 'big')}${S.f && !FAV.size ? t('nofav') : t('none')}</p>`;
  $('more').hidden = view.length <= S.n;
  if (!keep) S.n = PAGE;
}
function applyLang() {
  document.documentElement.lang = L;
  document.querySelectorAll('[data-t]').forEach(e => e.textContent = t(e.dataset.t));
  document.querySelectorAll('[data-p]').forEach(e => e.placeholder = t(e.dataset.p));
  $('lang').textContent = L === 'bn' ? 'English' : 'বাংলা';
  document.querySelectorAll('.steps i').forEach((e, i) => e.textContent = num(i + 1));
  renderFilters(); render(true);
}
function shareText(d) {
  const h = H[d.h], dl = L === 'bn' ? DBF : DEF;
  const sched = d.sc.map(s => (s.d.length === 7 ? t('everyday') : s.d.map(i => dl[i]).join(', ')) + (s.d.length ? ' – ' : '') + tm(s.t)).join('\n');
  return `${t('shareHead')}\n\n${d.n}\n${d.s}\n${L === 'bn' ? h.bn : h.en}\n${sched}\n\n${location.origin}${location.pathname}?q=${encodeURIComponent(d.n)}`;
}
function pick(key, val, scroll) { S[key] = S[key] === val ? '' : val; S.n = PAGE; renderFilters(); render(); if (scroll) $('list').scrollIntoView({behavior: 'smooth', block: 'start'}); }
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.classList.contains('fav')) {
    const d = DATA.docs[+b.dataset.i], k = fk(d), on = !FAV.has(k);
    on ? FAV.add(k) : FAV.delete(k); saveFav();
    b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? t('favDel') : t('favAdd'));
    renderFilters(); if (S.f) render(true);
  }
  else if (b.classList.contains('shr')) {
    const text = shareText(DATA.docs[+b.dataset.i]);
    if (navigator.share) navigator.share({title: DATA.docs[+b.dataset.i].n, text}).catch(() => {});
    else window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }
  else if (b.id === 'favbtn') { S.f = !S.f; S.n = PAGE; renderFilters(); render(); }
  else if (b.dataset.c !== undefined) pick('c', b.dataset.c, true);
  else if (b.closest('#hosp')) { S.h = b.dataset.h; S.n = PAGE; renderFilters(); render(); }
  else if (b.closest('#days')) { S.d = b.dataset.d; S.n = PAGE; renderFilters(); render(); }
  else if (b.id === 'more') { S.n += PAGE; render(true); }
  else if (b.id === 'reset') { Object.assign(S, {q:'', c:'', h:'', d:'', f:false, n:PAGE}); $('q').value = ''; renderFilters(); render(); }
  else if (b.id === 'lang') { L = L === 'bn' ? 'en' : 'bn'; try { localStorage.setItem('lang', L); } catch (x) {} applyLang(); }
});
let timer; $('q').addEventListener('input', e => { clearTimeout(timer); timer = setTimeout(() => { S.q = e.target.value.slice(0, 60); S.n = PAGE; render(); }, 150); });
fetch('doctors.json', {credentials: 'omit'}).then(r => r.json()).then(j => {
  DATA = j; DATA.cats.forEach(c => C[c.k] = c); DATA.hosp.forEach(h => H[h.k] = h); DATA.docs.forEach(hs);
  const P = new URLSearchParams(location.search); // links from Home / Hospitals pages: doctors.html?h=ibn&c=heart&d=today&q=...
  if (H[P.get('h')]) S.h = P.get('h');
  if (C[P.get('c')]) S.c = P.get('c');
  if (P.get('d') === 'today') S.d = String(todayIdx()); else if (/^[0-6]$/.test(P.get('d') || '')) S.d = P.get('d');
  if (P.get('fav') === '1') S.f = true;
  if (P.get('q')) { S.q = P.get('q').slice(0, 60); $('q').value = S.q; }
  applyLang();
}).catch(() => { $('list').innerHTML = '<p class="none">'+IC('alert','big')+'Internet / ইন্টারনেট সমস্যা। পরে আবার চেষ্টা করুন।</p>'; });
})();
