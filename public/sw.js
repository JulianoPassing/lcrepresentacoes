// LC Representações - Service Worker
const CACHE_NAME = 'lc-representacoes-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll([
    '/',
    '/index.html',
    '/painel.html',
    '/painel-clientes.html',
    '/pedidos.html',
    '/auth.js',
    '/modern-design.css',
    '/mobile.css',
    '/manifest.json'
  ])).then(() => self.skipWaiting()).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
