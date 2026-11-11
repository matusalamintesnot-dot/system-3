// Network-first service worker: always tries the live file, falls back to cache offline.
const CACHE = 'edutrack-data-sana-v4';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './data-demo.js', './assistant.js', './data-firebase.js', './manifest.webmanifest', './assets/school-logo.jpg'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))); });
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return; // never touch Firebase/Google requests
  e.respondWith(fetch(req).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
    return res;
  }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
});
