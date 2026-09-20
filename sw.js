// Service worker mínimo: solo se encarga de que la "carcasa" de la app
// (el propio index.html, el manifest y los iconos) se pueda abrir al
// instante y, si no hay red, siga abriendo desde caché. No toca las
// peticiones a Firebase (Auth/Firestore) ni a fuentes externas: esas
// siempre van directas a la red, para no interferir con el login ni con
// el guardado de datos.
const CACHE_NAME = 'gastrosoto-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // nunca interceptar escrituras
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Firebase, Google Fonts... van directos a la red

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
