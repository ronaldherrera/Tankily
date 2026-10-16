// Service worker mínimo de Tankily: SOLO actúa cuando no se puede abrir una página por falta de red,
// y entonces muestra /offline.html. Todo lo demás va directo a la red, sin caché propia, así que
// nunca sirve contenido antiguo cuando hay conexión. Para cambiar la página sin conexión, sube la versión.
const CACHE = 'tankily-sin-conexion-v1';
const RECURSOS = ['/offline.html', '/icon.svg'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(RECURSOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.mode === 'navigate') {
    evento.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
  } else if (request.method === 'GET' && new URL(request.url).pathname === '/icon.svg') {
    // El logo de la página sin conexión
    evento.respondWith(fetch(request).catch(() => caches.match('/icon.svg')));
  }
});
