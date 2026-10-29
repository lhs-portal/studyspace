// sw.js - Service Worker for offline capability and immediate cache purging

const CACHE_NAME = 'studyspace-v18'; // Bumped so every phone and laptop picks up the new files

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './offline-sync.js',
  './api.js?v=1',
  './streaks.js?v=10',
  './cache-reset.js?v=8'
];

// 1. Install event: Cache core assets and bypass waiting phase immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching core assets for v8');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activate event: Erase ALL old cache versions and claim all open client tabs
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting outdated cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch event: Network-First strategy to guarantee fresh code/streaks, fallback to cache if offline
self.addEventListener('fetch', (event) => {
  // Let Google Apps Script API submissions pass directly through to live backend without caching
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  // Bypass GET requests that aren't HTTP/HTTPS (e.g. chrome-extension://)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cache a clone of the fresh network response for offline use
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      })
      .catch(() => {
        // Fallback to cached copy ONLY when completely offline
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});
