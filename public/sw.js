// LC Representações - Service Worker
// Network-first: sempre busca a versão mais recente quando online
const CACHE_NAME = 'lc-representacoes-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  // Network-first: tenta rede primeiro, usa cache só se offline
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        if (res.ok && (e.request.method === 'GET') && !e.request.url.includes('/api/')) {
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
