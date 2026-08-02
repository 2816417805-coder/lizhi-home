/* 栗栀小窝 PWA Service Worker —— 导航请求 network-first，保证及时更新 */
const CACHE = 'lizhi-pwa-v2';
const ASSETS = [
  '.',
  'index.html',
  'manifest.webmanifest',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
  'chestnut.png',
  'avatar-lizhi.png'
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
  const isNav = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '';
  if (isNav) {
    // 导航/页面类请求：优先网络，确保用户始终拿到最新 HTML（修复后即时生效）
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const cp = res.clone();
            caches.open(CACHE).then(c => c.put(req, cp));
          }
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('index.html') || caches.match('.')))
    );
    return;
  }
  // 静态资源（图标/图片等）：stale-while-revalidate
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchP = fetch(req)
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
