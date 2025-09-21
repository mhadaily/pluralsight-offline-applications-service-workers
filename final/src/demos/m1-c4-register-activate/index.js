// [DEMO: Module 1 – Clip 4 START]
/**
 * DEMO: Service Worker Registration and Activation Patterns
 *
 * This demo shows advanced registration patterns and activation strategies:
 * - Conditional registration based on browser support
 * - Registration update checking
 * - Handling registration failures gracefully
 * - Activation event handling with cache versioning
 * - Client claiming strategies
 */

console.log(
  '[DEMO M1-C4] 🔧 Service Worker Registration & Activation demo loaded'
);

// Enhanced registration in the main thread (this would normally be in app.js)
if ('serviceWorker' in navigator) {
  // Check for existing registration
  navigator.serviceWorker.getRegistration().then((registration) => {
    if (registration) {
      console.log(
        '[DEMO M1-C4] ✅ Service Worker already registered:',
        registration
      );

      // Check for updates
      registration.update().then(() => {
        console.log('[DEMO M1-C4] 🔄 Update check completed');
      });
    }
  });
}

// ========================================
// ENHANCED INSTALL EVENT
// ========================================

const DEMO_INSTALL_HANDLER = (event) => {
  console.log('[DEMO M1-C4] 🔧 Enhanced install event');

  event.waitUntil(
    (async () => {
      try {
        // 1. Cache versioning strategy
        const cacheVersion = self.CONFIG?.VERSION || 'v1.4.0';
        const cacheName =
          self.CACHE_NAMES?.M1_C4_REGISTER || `travel-planner-${cacheVersion}`;

        console.log('[DEMO M1-C4] 📦 Creating cache:', cacheName);

        // 2. Open cache and add critical resources
        const cache = await caches.open(cacheName);

        const criticalResources = [
          '/',
          '/src/index.html',
          '/src/app.js',
          '/src/styles.css',
          '/src/config.js',
          '/public/manifest.json',
          '/public/offline.html',
        ];

        // 3. Add resources with error handling
        const cachePromises = criticalResources.map(async (url) => {
          try {
            console.log('[DEMO M1-C4] 📥 Caching:', url);
            await cache.add(url);
          } catch (error) {
            console.warn('[DEMO M1-C4] ⚠️ Failed to cache:', url, error);
          }
        });

        await Promise.all(cachePromises);

        // 4. Set up demo-specific data
        await cache.put(
          '/demo/m1-c4-info',
          new Response(
            JSON.stringify({
              demo: 'M1-C4 Registration & Activation',
              version: cacheVersion,
              installed: new Date().toISOString(),
              features: [
                'Enhanced Registration',
                'Cache Versioning',
                'Error Handling',
              ],
            })
          )
        );

        console.log('[DEMO M1-C4] ✅ Install completed successfully');

        // 5. Optional: Skip waiting for immediate activation
        if (self.FEATURES?.M1_C4_REGISTER_ACTIVATE) {
          console.log(
            '[DEMO M1-C4] ⏭️ Skipping waiting for immediate activation'
          );
          await self.skipWaiting();
        }
      } catch (error) {
        console.error('[DEMO M1-C4] ❌ Install failed:', error);
        throw error; // Re-throw to fail the install
      }
    })()
  );
};

// ========================================
// ENHANCED ACTIVATE EVENT
// ========================================

const DEMO_ACTIVATE_HANDLER = (event) => {
  console.log('[DEMO M1-C4] ✅ Enhanced activate event');

  event.waitUntil(
    (async () => {
      try {
        // 1. Clean up old caches
        const cacheNames = await caches.keys();
        const currentVersion = 'v1.4.0';

        console.log('[DEMO M1-C4] 🧹 Found caches:', cacheNames);

        const deletePromises = cacheNames
          .filter((name) => {
            // Keep current version and non-versioned caches
            return (
              name.startsWith('travel-planner-') &&
              !name.includes(currentVersion)
            );
          })
          .map(async (name) => {
            console.log('[DEMO M1-C4] 🗑️ Deleting old cache:', name);
            return caches.delete(name);
          });

        await Promise.all(deletePromises);

        // 2. Claim all clients immediately
        console.log('[DEMO M1-C4] 👑 Claiming all clients');
        await self.clients.claim();

        // 3. Notify clients about activation
        const clients = await self.clients.matchAll({
          includeUncontrolled: true,
        });
        console.log('[DEMO M1-C4] 📢 Notifying', clients.length, 'clients');

        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            demo: 'M1-C4',
            data: {
              version: currentVersion,
              timestamp: Date.now(),
              clearedCaches: deletePromises.length,
            },
          });
        });

        // 4. Set up demo-specific state
        self.M1_C4_ACTIVATED = true;
        self.M1_C4_ACTIVATION_TIME = Date.now();

        console.log('[DEMO M1-C4] 🎉 Activation completed successfully');
      } catch (error) {
        console.error('[DEMO M1-C4] ❌ Activation failed:', error);
        throw error;
      }
    })()
  );
};

// ========================================
// ENHANCED MESSAGE HANDLING
// ========================================

const DEMO_MESSAGE_HANDLER = (event) => {
  const { type, data } = event.data || {};

  if (type === 'GET_REGISTRATION_INFO') {
    console.log('[DEMO M1-C4] 📊 Registration info requested');

    event.ports[0]?.postMessage({
      type: 'REGISTRATION_INFO',
      data: {
        demo: 'M1-C4',
        scope: self.registration.scope,
        state: 'activated',
        updateViaCache: self.registration.updateViaCache,
        activated: self.M1_C4_ACTIVATED || false,
        activationTime: self.M1_C4_ACTIVATION_TIME || null,
        version: '1.4.0',
      },
    });
  }

  if (type === 'FORCE_UPDATE') {
    console.log('[DEMO M1-C4] 🔄 Force update requested');

    self.registration
      .update()
      .then(() => {
        console.log('[DEMO M1-C4] ✅ Update completed');
      })
      .catch((error) => {
        console.error('[DEMO M1-C4] ❌ Update failed:', error);
      });
  }
};

// ========================================
// CLIENT COMMUNICATION DEMO
// ========================================

const DEMO_PERIODIC_CLIENT_UPDATE = () => {
  setInterval(async () => {
    try {
      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
      });

      if (clients.length > 0) {
        const message = {
          type: 'SW_HEARTBEAT',
          demo: 'M1-C4',
          data: {
            timestamp: Date.now(),
            clientCount: clients.length,
            cacheCount: (await caches.keys()).length,
          },
        };

        clients.forEach((client) => client.postMessage(message));
        console.log(
          '[DEMO M1-C4] 💓 Heartbeat sent to',
          clients.length,
          'clients'
        );
      }
    } catch (error) {
      console.error('[DEMO M1-C4] ❌ Heartbeat failed:', error);
    }
  }, 30000); // Every 30 seconds
};

// ========================================
// EVENT REGISTRATION
// ========================================

// Only register enhanced handlers if this demo is enabled
if (self.FEATURES?.M1_C4_REGISTER_ACTIVATE) {
  console.log('[DEMO M1-C4] 🚀 Registering enhanced event handlers');

  self.addEventListener('install', DEMO_INSTALL_HANDLER);
  self.addEventListener('activate', DEMO_ACTIVATE_HANDLER);
  self.addEventListener('message', DEMO_MESSAGE_HANDLER);

  // Start periodic client updates
  DEMO_PERIODIC_CLIENT_UPDATE();
} else {
  console.log(
    '[DEMO M1-C4] ⏸️ Demo loaded but not enabled (set FEATURES.M1_C4_REGISTER_ACTIVATE = true)'
  );
}

// Export for testing
self.M1_C4_DEMO = {
  installHandler: DEMO_INSTALL_HANDLER,
  activateHandler: DEMO_ACTIVATE_HANDLER,
  messageHandler: DEMO_MESSAGE_HANDLER,
};

// [DEMO: Module 1 – Clip 4 END]
