// [DEMO: Module 3 – Clip 2 START]
/**
 * DEMO: Navigation Preloading
 *
 * This demo implements navigation preloading techniques:
 * - Service Worker navigation preload API
 * - Smart preloading strategies
 * - Performance optimization
 * - Resource prioritization
 */

console.log('[DEMO M3-C2] 🚀 Navigation Preloading demo loaded');

const DEMO_NAV_PRELOAD_HANDLER = (event) => {
  if (event.request.mode === 'navigate') {
    console.log('[DEMO M3-C2] 🧭 Navigation request with preload');

    event.respondWith(
      (async () => {
        try {
          // Use preloaded response if available
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            console.log('[DEMO M3-C2] ⚡ Using preloaded response');
            return preloadResponse;
          }

          // Fallback to regular fetch
          return fetch(event.request);
        } catch (error) {
          console.error('[DEMO M3-C2] ❌ Navigation failed:', error);
          throw error;
        }
      })()
    );
  }
};

// Enable navigation preload when demo is active
if (self.FEATURES?.M3_C2_NAV_PRELOAD) {
  console.log('[DEMO M3-C2] 🚀 Enabling navigation preload');

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      self.registration.navigationPreload.enable().then(() => {
        console.log('[DEMO M3-C2] ✅ Navigation preload enabled');
      })
    );
  });

  self.addEventListener('fetch', DEMO_NAV_PRELOAD_HANDLER);
}

self.M3_C2_DEMO = { DEMO_NAV_PRELOAD_HANDLER };

// [DEMO: Module 3 – Clip 2 END]
