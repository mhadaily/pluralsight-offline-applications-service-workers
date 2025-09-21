// [DEMO: Module 4 – Clip 3 START]
/**
 * DEMO: Workbox Runtime Caching
 *
 * This demo demonstrates Workbox runtime caching strategies:
 * - Route-based caching rules
 * - Built-in caching strategies
 * - Cache expiration and cleanup
 */

console.log('[DEMO M4-C3] ⚡ Workbox Runtime Caching demo loaded');

// Simulate Workbox runtime caching routes
const WORKBOX_ROUTES = [
  {
    pattern: /\/api\/deals/,
    strategy: 'NetworkFirst',
    options: {
      cacheName: self.CACHE_NAMES?.WORKBOX_API || 'api-cache',
      networkTimeoutSeconds: 3,
    },
  },
  {
    pattern: /\.(?:png|jpg|jpeg|svg)$/,
    strategy: 'CacheFirst',
    options: {
      cacheName: self.CACHE_NAMES?.WORKBOX_IMAGES || 'images',
      maxEntries: 50,
    },
  },
  {
    pattern: /\.(?:js|css)$/,
    strategy: 'StaleWhileRevalidate',
    options: {
      cacheName: self.CACHE_NAMES?.WORKBOX_STATIC || 'static-resources',
    },
  },
];

const simulateWorkboxRoute = async (request) => {
  const url = request.url;

  // Find matching route
  const route = WORKBOX_ROUTES.find((r) => r.pattern.test(url));

  if (route) {
    console.log('[DEMO M4-C3] 🎯 Route matched:', route.strategy, 'for', url);

    const cache = await caches.open(route.options.cacheName);

    switch (route.strategy) {
      case 'NetworkFirst':
        try {
          const response = await fetch(request);
          await cache.put(request, response.clone());
          return response;
        } catch {
          return cache.match(request);
        }

      case 'CacheFirst':
        const cached = await cache.match(request);
        if (cached) return cached;

        const fetched = await fetch(request);
        await cache.put(request, fetched.clone());
        return fetched;

      case 'StaleWhileRevalidate':
        const stale = cache.match(request);
        const fresh = fetch(request).then((response) => {
          cache.put(request, response.clone());
          return response;
        });

        return (await stale) || fresh;
    }
  }

  return fetch(request);
};

const DEMO_WORKBOX_RUNTIME_HANDLER = (event) => {
  const url = new URL(event.request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(simulateWorkboxRoute(event.request));
  }
};

if (self.FEATURES?.M4_C3_WB_RUNTIME) {
  console.log('[DEMO M4-C3] 🚀 Registering Workbox runtime caching demo');
  self.addEventListener('fetch', DEMO_WORKBOX_RUNTIME_HANDLER);
}

self.M4_C3_DEMO = { simulateWorkboxRoute, WORKBOX_ROUTES };

// [DEMO: Module 4 – Clip 3 END]
