// Service Worker - Generador DUN DoyPack
// Subí el número de versión cada vez que cambies index.html, app.js o style.css
const VERSION = 'v2';
const CACHE = `dun-doypack-${VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './app.js',
  './style.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

// Librerías externas que usa la app (se guardan para poder abrirla sin internet)
const CDN_URLS = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap'
];
const CDN_HOSTS = [
  'cdn.tailwindcss.com',
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Si falta algún archivo no se cancela la instalación
    await Promise.allSettled(APP_SHELL.map(f => cache.add(f)));
    // Si algún CDN falla no se cancela la instalación
    await Promise.allSettled(
      CDN_URLS.map(url => cache.add(new Request(url, { mode: 'no-cors' })))
    );
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Archivos propios: primero la red (siempre ves la versión nueva); sin conexión usa lo guardado
async function networkFirst(request, key) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(key || request, response.clone());
    return response;
  } catch (e) {
    return (await cache.match(key || request, { ignoreSearch: true })) || Response.error();
  }
}

// Devuelve lo guardado al instante y actualiza en segundo plano
async function staleWhileRevalidate(request, options) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, options);
  const network = fetch(request)
    .then(response => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch', event => {
  const { request } = event;
  // Solo GET. Los POST a la Zebra (/pstprnt) y a Labelary NO se tocan,
  // y las IPs de las impresoras tampoco: pasan directo a la red.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (request.mode === 'navigate') {
      event.respondWith(networkFirst(request, './index.html'));
    } else {
      event.respondWith(networkFirst(request));
    }
    return;
  }

  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
