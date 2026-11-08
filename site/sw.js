/* 電波がなくても開けるように、開いたファイルをとっておく（PWA、D-049）。
   つながるときは毎回新しいものを取りにいき（問題を直したらすぐ届く）、取れないときだけ、とっておいたものを出す。
   Google のログインとドライブ、フォントは、ほかのサイトのものなので触らない。 */
const CACHE = 'michisuji-v1';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'space.js', 'music.js', 'sync.js', 'data.js', 'problems.js',
  'vendor/three.module.min.js', 'manifest.webmanifest', 'icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
