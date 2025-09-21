// [DEMO: Module 4 – Clip 4 START]
/**
 * DEMO: Workbox Navigation Fallback
 *
 * This demo shows Workbox navigation fallback handling:
 * - SPA routing support
 * - Offline navigation
 * - Fallback page strategies
 */

console.log('[DEMO M4-C4] 🧭 Workbox Navigation Fallback demo loaded');

const NAVIGATION_FALLBACK_CACHE = 'navigation-fallback';
const FALLBACK_URL = '/public/offline.html';

const handleNavigationFallback = async (event) => {
  if (event.request.mode === 'navigate') {
    console.log('[DEMO M4-C4] 🧭 Navigation request detected');

    try {
      // Try network first
      const response = await fetch(event.request);

      if (response.ok) {
        console.log('[DEMO M4-C4] ✅ Navigation successful');
        return response;
      }

      throw new Error('Navigation failed');
    } catch (error) {
      console.log('[DEMO M4-C4] ⚠️ Navigation failed, serving fallback');

      // Serve cached fallback
      const cache = await caches.open(NAVIGATION_FALLBACK_CACHE);
      const fallback = await cache.match(FALLBACK_URL);

      if (fallback) {
        return fallback;
      }

      // Ultimate fallback
      return new Response(
        `
        <!DOCTYPE html>
        <html><head><title>Offline</title></head>
        <body>
          <h1>You're offline</h1>
          <p>This page isn't available offline.</p>
        </body></html>
      `,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }
  }
};

const DEMO_NAV_FALLBACK_HANDLER = (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigationFallback(event));
  }
};

if (self.FEATURES?.M4_C4_WB_NAV_FALLBACK) {
  console.log('[DEMO M4-C4] 🚀 Registering navigation fallback demo');

  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(NAVIGATION_FALLBACK_CACHE).then((cache) => {
        return cache.add(FALLBACK_URL);
      })
    );
  });

  self.addEventListener('fetch', DEMO_NAV_FALLBACK_HANDLER);
}

self.M4_C4_DEMO = { handleNavigationFallback };

// [DEMO: Module 4 – Clip 4 END]
