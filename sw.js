const CACHE = 'lionfish-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://unpkg.com/@picocss/pico@2/css/pico.min.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k!==CACHE ? caches.delete(k) : null))))
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (ASSETS.includes(url.href) || url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then((res) => res || fetch(e.request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, copy));
        return resp;
      }).catch(() => caches.match('./index.html')))
    );
  }
});
