// Bump this version whenever you change any cached file,
// so old caches get cleared and users get the new version.
var CACHE_NAME = 'azkar-cache-v1';

var APP_SHELL = [
  './',
  './index.html',
  './index.js',
  './main.css',
  './all.min.css',
  './bootstrap.min.css',
  './manifest.json',
  './icons-192.png',
  './icons-512.png',
  './quotation-mark_94894.png'
];

// On install - cache the full application shell
self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
});

// On activate - remove old caches from previous versions
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// On network request - try cache first, fall back to network,
// and cache new same-origin responses as we go.
self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then(function (networkResponse) {
          // Only cache successful, same-origin responses
          if (
            networkResponse &&
            networkResponse.ok &&
            event.request.url.startsWith(self.location.origin)
          ) {
            var responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(function () {
          // Offline and not cached: fall back to the app shell for
          // navigation requests, so the app still opens offline.
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
