// ===== sw.js =====
const CACHE_NAME = 'editor-cache-v1';
const DYNAMIC_CACHE = 'editor-dynamic-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // Assuming these exist per requirements, otherwise they will fail 
  // but strict caching usually requires them. 
  // If testing without real images, remove them from this array.
  './icon-192.png', 
  './icon-512.png'
];

// Install Event: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Cache-First Strategy with Network Fallback & Dynamic Caching
self.addEventListener('fetch', (event) => {
  // Handle Google Fonts and other external assets via dynamic caching
  const url = new URL(event.request.url);
  
  // Strategy for same-origin or font requests
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          // Check if valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
            return networkResponse;
          }

          // Cache the new resource (Dynamic Cache)
          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Optional: Return offline fallback page if needed
          // For a SPA text editor, index.html is likely already loaded
        });
    })
  );
});