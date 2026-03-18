const CACHE = 'crack-the-code-v1';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Don't cache socket.io or API calls
  if (e.request.url.includes('socket.io') || e.request.url.includes('onrender.com')) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});