const VERSION = 'v6';
const STATIC_CACHE = 'pwa-cache-static-' + VERSION;
const HTML_CACHE = 'pwa-cache-html-' + VERSION;
const ASSETS = [
  './manifest.json',
  './icons/icon-96.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => {
      if (![STATIC_CACHE, HTML_CACHE].includes(k)) return caches.delete(k);
    }))).then(() => self.clients.claim())
  );
});

async function networkFirstHtml(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(HTML_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // HTML/doc requests: network-first
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(networkFirstHtml(req));
    return;
  }

  // Static assets: cache-first
  if (ASSETS.some(a => url.pathname.endsWith(a.replace('./','/')))) {
    event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
    return;
  }

  // Default: try network, fallback to cache
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
