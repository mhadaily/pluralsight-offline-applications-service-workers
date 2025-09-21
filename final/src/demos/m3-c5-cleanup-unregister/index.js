// [DEMO: Module 3 – Clip 5 START]
/**
 * DEMO: Cache Cleanup and Service Worker Unregistration
 *
 * This demo shows proper cleanup techniques:
 * - Cache versioning and cleanup
 * - Service worker unregistration
 * - Resource cleanup strategies
 * - Memory management
 */

console.log('[DEMO M3-C5] 🧹 Cleanup and Unregistration demo loaded');

const cleanupOldCaches = async () => {
  console.log('[DEMO M3-C5] 🧹 Starting cache cleanup');

  const cacheNames = await caches.keys();
  const currentCaches = [
    self.CACHE_NAMES?.APP_SHELL || 'app-shell-v1.0.0',
    self.CACHE_NAMES?.API_CACHE || 'api-cache-v1',
    self.CACHE_NAMES?.STATIC_RESOURCES || 'static-v1',
  ];

  const deletePromises = cacheNames
    .filter((name) => !currentCaches.includes(name))
    .map((name) => {
      console.log('[DEMO M3-C5] 🗑️ Deleting old cache:', name);
      return caches.delete(name);
    });

  await Promise.all(deletePromises);
  console.log('[DEMO M3-C5] ✅ Cache cleanup completed');
};

const DEMO_CLEANUP_MESSAGE_HANDLER = (event) => {
  const { type } = event.data || {};

  if (type === 'CLEANUP_CACHES') {
    console.log('[DEMO M3-C5] 🧹 Manual cache cleanup requested');
    cleanupOldCaches();
  }

  if (type === 'UNREGISTER_SW') {
    console.log('[DEMO M3-C5] 🗑️ Service worker unregistration requested');

    self.registration.unregister().then((success) => {
      if (success) {
        console.log('[DEMO M3-C5] ✅ Service worker unregistered');

        // Notify clients
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SW_UNREGISTERED',
              demo: 'M3-C5',
              timestamp: Date.now(),
            });
          });
        });
      }
    });
  }
};

if (self.FEATURES?.M3_C5_CLEANUP_UNREGISTER) {
  console.log('[DEMO M3-C5] 🚀 Registering cleanup demo handlers');

  self.addEventListener('activate', (event) => {
    event.waitUntil(cleanupOldCaches());
  });

  self.addEventListener('message', DEMO_CLEANUP_MESSAGE_HANDLER);
}

self.M3_C5_DEMO = { cleanupOldCaches, DEMO_CLEANUP_MESSAGE_HANDLER };

// [DEMO: Module 3 – Clip 5 END]
