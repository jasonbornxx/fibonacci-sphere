/* Simple service worker: precache core assets and provide offline fallback.
   Adjust CACHE_NAME when you change assets to force refresh.
*/
const CACHE_NAME = 'spear-cache-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // For navigations, try network first then fallback to cache/offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(response => {
        // Put a copy in the cache
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy).catch(() => {}));
        return response;
      }).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // For other requests, try cache first, then network and cache response
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(networkResponse => {
        // Only cache successful (status 200) same-origin responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
          const respCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, respCopy).catch(() => {}));
        }
        return networkResponse;
      }).catch(() => {
        // As a best-effort fallback, serve offline for images or navigation if available
        if (event.request.destination === 'image') {
          return caches.match('/icons/icon-192.png');
        }
      });
    })
  );
});
