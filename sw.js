// sw.js - Service Worker for offline capability, immediate cache purging and push reminders
//
// OneSignal shares this same worker (see the matching serviceWorkerPath/scope in index.html).
// KEEP this import at the top: it is what lets a closed phone receive the 4 PM and 8 PM reminders.
// The try/catch only protects offline caching if the OneSignal CDN cannot be reached during install.
try {
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
} catch (err) {
  console.warn('[Service Worker] OneSignal push script could not load. Offline caching will still work.', err);
}

const CACHE_NAME = 'studyspace-v88-v16'; // Studyarea panel toggle centred on the panel's left edge

const MAX_CACHE_ENTRIES = 80;
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './icons.js?v=5',
  './manifest.json',
  './logo.png',
  './offline-sync.js?v=12',
  './study-engine.js?v=10',
  './fonts/Faruma.woff2',
  './fonts/Faruma.woff',
  './api.js?v=2',
  './streaks.js?v=15',
  './cache-reset.js?v=8'
];

// 1. Install event: Cache core assets and bypass waiting phase immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching core assets for v88');
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

// Keep the runtime cache bounded and expire stale entries.
async function trimCache(cache) {
  const now = Date.now();
  const keys = await cache.keys();
  await Promise.all(keys.map(async (request) => {
    const response = await cache.match(request);
    const cachedAt = Number(response && response.headers.get('x-studyspace-cached-at'));
    if (cachedAt && now - cachedAt > MAX_CACHE_AGE_MS) await cache.delete(request);
  }));
  const remaining = await cache.keys();
  await Promise.all(remaining.slice(0, Math.max(0, remaining.length - MAX_CACHE_ENTRIES)).map((request) => cache.delete(request)));
}

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
          const headers = new Headers(responseToCache.headers);
          headers.set('x-studyspace-cached-at', String(Date.now()));
          const stamped = new Response(responseToCache.body, { status: responseToCache.status, statusText: responseToCache.statusText, headers: headers });
          cache.put(event.request, stamped).then(() => trimCache(cache));
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
