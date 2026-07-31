/* 栗栀小窝 PWA Service Worker —— 离线缓存（stale-while-revalidate） */
const CACHE = 'lizhi-pwa-v1';
const ASSETS = [
  '.',
  'index.html',
  'fitness-dashboard.html',
  'manifest.webmanifest',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchP = fetch(req, sameOrigin ? {} : { mode: 'no-cors' })
        .then(res => {
          if (res && (res.status === 200 || res.type === 'opaque')) {
            const cp = res.clone();
            caches.open(CACHE).then(c => c.put(req, cp));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchP;
    })
  );
});
