// [DEMO: Module 1 – Clip 3 START]
/**
 * Service Worker Lifecycle Demo
 * Demonstrates install, activate, and fetch event handling
 */

console.log('[DEMO M1-C3] 🔄 Lifecycle demo loaded');

// Install Event - Prepare for activation
self.addEventListener('install', (event) => {
  console.log('[DEMO M1-C3] 🔧 Service Worker installing...');

  event.waitUntil(
    (async () => {
      try {
        // Pre-cache essential resources
        const cache = await caches.open(
          self.CACHE_NAMES?.M1_C3_LIFECYCLE || 'tp-lifecycle-demo-v1'
        );
        const urlsToCache = [
          '/',
          '/src/index.html',
          '/src/styles.css',
          '/src/app.js',
          '/offline.html',
        ];

        console.log('[DEMO M1-C3] 📦 Pre-caching essential resources');
        await cache.addAll(urlsToCache);

        console.log('[DEMO M1-C3] ✅ Pre-caching completed');

        // Force activation of new service worker
        await self.skipWaiting();
      } catch (error) {
        console.error('[DEMO M1-C3] ❌ Install failed:', error);
      }
    })()
  );
});

// Activate Event - Clean up and take control
self.addEventListener('activate', (event) => {
  console.log('[DEMO M1-C3] ✅ Service Worker activating...');

  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(
          (name) =>
            name.startsWith('tp-lifecycle-demo-') &&
            name !==
              (self.CACHE_NAMES?.M1_C3_LIFECYCLE || 'tp-lifecycle-demo-v1')
        );

        if (oldCaches.length > 0) {
          console.log('[DEMO M1-C3] 🧹 Cleaning up old caches:', oldCaches);
          await Promise.all(oldCaches.map((name) => caches.delete(name)));
        }

        // Take control of all clients immediately
        await self.clients.claim();

        // Notify clients that SW is ready
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            data: { version: 'lifecycle-demo-v1', timestamp: Date.now() },
          });
        });

        console.log(
          '[DEMO M1-C3] 🎉 Service Worker activated and took control'
        );
      } catch (error) {
        console.error('[DEMO M1-C3] ❌ Activation failed:', error);
      }
    })()
  );
});

// Fetch Event - Intercept network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle requests for our origin
  if (url.origin !== self.location.origin) {
    return;
  }

  console.log('[DEMO M1-C3] 🌐 Intercepting request:', url.pathname);

  event.respondWith(
    (async () => {
      try {
        // Try cache first for navigation requests
        if (request.mode === 'navigate') {
          const cache = await caches.open('tp-lifecycle-demo-v1');
          const cachedResponse = await cache.match(request);

          if (cachedResponse) {
            console.log('[DEMO M1-C3] 💾 Serving from cache:', url.pathname);
            return cachedResponse;
          }
        }

        // Fallback to network
        console.log('[DEMO M1-C3] 🌐 Serving from network:', url.pathname);
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse.ok && request.method === 'GET') {
          const cache = await caches.open('tp-lifecycle-demo-v1');
          cache.put(request, networkResponse.clone());
          console.log('[DEMO M1-C3] 📦 Cached response:', url.pathname);
        }

        return networkResponse;
      } catch (error) {
        console.error('[DEMO M1-C3] ❌ Fetch failed:', error);

        // Provide offline fallback for navigation
        if (request.mode === 'navigate') {
          const cache = await caches.open('tp-lifecycle-demo-v1');
          const offlinePage = await cache.match('/offline.html');
          if (offlinePage) {
            console.log('[DEMO M1-C3] 📴 Serving offline page');
            return offlinePage;
          }
        }

        return new Response('Network error', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      }
    })()
  );
});

// Message Event - Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  if (type === 'LIFECYCLE_DEMO_PING') {
    console.log('[DEMO M1-C3] 💬 Received ping from client');
    event.ports[0]?.postMessage({
      type: 'LIFECYCLE_DEMO_PONG',
      data: {
        timestamp: Date.now(),
        version: 'lifecycle-demo-v1',
        state: 'active',
      },
    });
  }
});

console.log('[DEMO M1-C3] 🚀 Lifecycle demo event listeners registered');
// [DEMO: Module 1 – Clip 3 END]
