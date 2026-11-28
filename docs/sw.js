// Sheba Point Bogura - service worker: works offline, but always tries the network first so updates show up at once.
const CACHE = 'sheba-v1'; // change v1 -> v2 if you ever need to force-clear old offline copies
const CORE = [
 "./",
 "index.html",
 "doctors.html",
 "hospitals.html",
 "about.html",
 "contact.html",
 "privacy.html",
 "disclaimer.html",
 "404.html",
 "style.css",
 "app.js",
 "site.js",
 "icons.js",
 "doctors.json",
 "logo.svg",
 "manifest.webmanifest",
 "icon-192.png",
 "fonts/baloo-da-2-bengali-800-normal.woff2",
 "fonts/baloo-da-2-latin-800-normal.woff2",
 "fonts/hind-siliguri-bengali-400-normal.woff2",
 "fonts/hind-siliguri-bengali-600-normal.woff2",
 "fonts/hind-siliguri-bengali-700-normal.woff2",
 "fonts/hind-siliguri-latin-400-normal.woff2",
 "fonts/hind-siliguri-latin-600-normal.woff2",
 "fonts/hind-siliguri-latin-700-normal.woff2"
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r, {ignoreSearch: true}).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
