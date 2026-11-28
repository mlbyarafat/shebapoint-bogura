(() => {
'use strict';
// Shared by Home, Hospitals, About, Contact, Privacy, Disclaimer pages (the Doctors page uses app.js).
const BD = '০১২৩৪৫৬৭৮৯';
const esc = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const bi = (b, e) => `<span class="bn">${esc(b)}</span><span class="en">${esc(e)}</span>`;
const bnum = n => String(n).replace(/\d/g, d => BD[d]);
const DBF = ['শনিবার','রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার'], DEF = ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];
const nb = n => bi(String(n).replace(/\d/g, d => BD[d]), n);
let L = 'bn'; try { L = localStorage.getItem('lang') === 'en' ? 'en' : 'bn'; } catch (e) {}
document.documentElement.lang = L;

// ---- install-as-app + offline (service worker) ----
let dip = null;
const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
function showInstall() {
  const band = document.getElementById('installband'); if (!band || standalone()) return;
  const btn = document.getElementById('install'), ios = document.getElementById('iosHint');
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (dip && btn) { btn.hidden = false; band.hidden = false; }
  else if (isIos && ios) { ios.hidden = false; band.hidden = false; }
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); dip = e; showInstall(); });
window.addEventListener('appinstalled', () => { const b = document.getElementById('installband'); if (b) b.hidden = true; });
if ('serviceWorker' in navigator) window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
const MB = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'], ME = ['January','February','March','April','May','June','July','August','September','October','November','December'];

document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id), btn = $('lang');
  const paint = () => { document.documentElement.lang = L; if (btn && !$('q')) btn.textContent = L === 'bn' ? 'English' : 'বাংলা'; };
  paint();
  showInstall();
  const ib = $('install'); if (ib) ib.addEventListener('click', async () => { if (!dip) return; dip.prompt(); try { await dip.userChoice; } catch (x) {} dip = null; ib.hidden = true; const b = $('installband'); if (b) b.hidden = true; });
  const ph = () => { const q = $('hq'); if (q) q.placeholder = L === 'bn' ? 'ডাক্তার, রোগ বা হাসপাতাল' : 'Doctor, problem or hospital'; };
  ph();
  if (btn && !$('q')) btn.addEventListener('click', () => { L = L === 'bn' ? 'en' : 'bn'; try { localStorage.setItem('lang', L); } catch (x) {} paint(); ph(); });

  const go = $('hgo'), hq = $('hq'); // Home page search box -> Doctors page
  if (go && hq) {
    const run = () => { location.href = 'doctors.html' + (hq.value.trim() ? '?q=' + encodeURIComponent(hq.value.trim().slice(0, 60)) : ''); };
    go.addEventListener('click', run);
    hq.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
  }

  if (!$('stats') && !$('hlist') && !$('hquick') && !$('todaymsg') && !document.querySelector('.upd')) return;
  fetch('doctors.json', {credentials: 'omit'}).then(r => r.json()).then(j => {
    const cnt = {}, byH = {};
    j.docs.forEach(d => { cnt[d.c] = (cnt[d.c] || 0) + 1; (byH[d.h] = byH[d.h] || {})[d.c] = (byH[d.h][d.c] || 0) + 1; });
    const total = k => j.docs.filter(d => d.h === k).length, C = {}; j.cats.forEach(c => C[c.k] = c);
    if ($('stats')) {
      const depts = Object.keys(cnt).filter(k => k !== 'other').length;
      $('stats').innerHTML =
        `<div class="stat"><b>${nb(j.docs.length)}</b><span>${bi('ডাক্তার', 'Doctors')}</span></div>` +
        `<div class="stat"><b>${nb(j.hosp.length)}</b><span>${bi('হাসপাতাল', 'Hospitals')}</span></div>` +
        `<div class="stat"><b>${nb(depts)}</b><span>${bi('বিভাগ', 'Departments')}</span></div>`;
    }
    if (j.updated) {
      const [y, m, d] = j.updated.split('-').map(Number);
      document.querySelectorAll('.upd-date').forEach(e => { e.innerHTML = bi(`${bnum(d)} ${MB[m - 1]} ${bnum(y)}`, `${d} ${ME[m - 1]} ${y}`); });
    }
    if ($('hquick')) {
      $('hquick').innerHTML = j.hosp.map(h => `<a class="hq" data-h="${h.k}" href="doctors.html?h=${h.k}"><b>${bi(h.sb, h.se)}</b><em>${nb(total(h.k))} ${bi('জন', 'doctors')}</em></a>`).join('');
    }
    if ($('todaymsg')) {
      const t0 = (new Date().getDay() + 1) % 7, n = j.docs.filter(d => d.sc.some(s => s.d.includes(t0))).length;
      $('todaymsg').innerHTML = bi(`আজ ${DBF[t0]} – ${bnum(n)} জন ডাক্তার বসছেন`, `Today, ${DEF[t0]} – ${n} doctors available`);
    }
    if ($('hlist')) {
      $('hlist').innerHTML = j.hosp.map(h => {
        const top = Object.entries(byH[h.k] || {}).filter(([k]) => k !== 'other').sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => C[k]);
        const sp = top.map(c => `${IC(c.k)} ${bi(c.bn, c.en)}`).join(' · ');
        return `<article class="hcard" data-h="${h.k}"><h3>${bi(h.bn, h.en)}</h3>
          <p class="n">${IC('doctor')} ${nb(total(h.k))} ${bi('জন ডাক্তার', 'doctors')}</p>${sp ? `<p class="sp">${sp}</p>` : ''}
          <div class="acts"><a href="doctors.html?h=${h.k}">${bi('ডাক্তারদের দেখুন', 'See doctors')}</a>
          <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.q)}" target="_blank" rel="noopener noreferrer">${IC('pin')} ${bi('ম্যাপে দেখুন', 'Open map')}</a></div></article>`;
      }).join('');
    }
  }).catch(() => {});
});
})();
