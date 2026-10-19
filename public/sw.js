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

// Notificaciones push (Edge Function `push`): { titulo, cuerpo, url, etiqueta }
self.addEventListener('push', (evento) => {
  let datos = {};
  try { datos = evento.data?.json() || {}; } catch { /* aviso sin datos */ }
  evento.waitUntil(self.registration.showNotification(datos.titulo || 'Tankily', {
    body: datos.cuerpo || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: datos.etiqueta,
    renotify: !!datos.etiqueta,
    data: { url: datos.url || '/' },
  }));
});

// Al tocarla: si Tankily ya está abierto, se usa esa ventana; si no, se abre una nueva
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const url = new URL(evento.notification.data?.url || '/', self.location.origin).href;
  evento.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const abierta = ventanas.find((v) => new URL(v.url).origin === self.location.origin);
    if (abierta) {
      await abierta.focus();
      return abierta.navigate(url).catch(() => self.clients.openWindow(url));
    }
    return self.clients.openWindow(url);
  })());
});
