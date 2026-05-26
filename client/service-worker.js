/* Tereré Mix — Service Worker v1
   Cache-first para assets estáticos, network-first para API.
*/

const CACHE = 'terere-mix-v3';
const STATIC = [
  '/',
  '/index.html',
  '/cardapio.html',
  '/carrinho.html',
  '/pedidos.html',
  '/manifest.json',
  '/css/styles.css',
  '/assets/images/logotipo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Nunca intercepta chamadas de API
  if (url.pathname.startsWith('/api/')) return;
  if (request.method !== 'GET') return;

  e.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      });
      return cached || network;
    })
  );
});
