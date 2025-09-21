// [DEMO: Module 5 – Clip 2 START]
/**
 * DEMO: Periodic Background Synchronization
 *
 * This demo implements periodic background sync:
 * - Periodic sync registration
 * - Scheduled data updates
 * - Battery and network awareness
 * - User permission handling
 */

console.log('[DEMO M5-C2] ⏰ Periodic Background Sync demo loaded');

// Periodic sync configuration
const PERIODIC_SYNC_TAG = 'demo-periodic-sync';
const SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const performPeriodicDataUpdate = async () => {
  console.log('[DEMO M5-C2] ⏰ Performing periodic data update');

  try {
    // Check for new travel deals
    const response = await fetch('/api/deals');

    if (response.ok) {
      const deals = await response.json();
      console.log('[DEMO M5-C2] 📊 Updated deals data:', deals.length, 'deals');

      // Cache updated data
      const cache = await caches.open('periodic-sync-cache');
      await cache.put('/api/deals', response.clone());

      // Notify clients about new data
      const clients = await self.clients.matchAll();
      if (clients.length > 0) {
        clients.forEach((client) => {
          client.postMessage({
            type: 'PERIODIC_SYNC_DATA_UPDATE',
            demo: 'M5-C2',
            data: {
              deals: deals.length,
              timestamp: Date.now(),
              source: 'periodic-sync',
            },
          });
        });
      }

      // Check if deals have significantly changed
      const previousDeals = await getStoredDealsCount();
      if (Math.abs(deals.length - previousDeals) > 2) {
        console.log(
          '[DEMO M5-C2] 📢 Significant change detected, considering notification'
        );

        // Could show notification here if permissions allow
        showDataUpdateNotification(deals.length - previousDeals);
      }

      // Store current count for next comparison
      await storeDealsCount(deals.length);
    } else {
      console.warn('[DEMO M5-C2] ⚠️ Failed to fetch deals:', response.status);
    }
  } catch (error) {
    console.error('[DEMO M5-C2] ❌ Periodic sync failed:', error);
  }
};

const getStoredDealsCount = async () => {
  try {
    const cache = await caches.open('periodic-sync-cache');
    const response = await cache.match('/periodic-sync-meta');

    if (response) {
      const meta = await response.json();
      return meta.previousDealsCount || 0;
    }
  } catch (error) {
    console.warn('[DEMO M5-C2] ⚠️ Could not get stored deals count:', error);
  }

  return 0;
};

const storeDealsCount = async (count) => {
  try {
    const cache = await caches.open('periodic-sync-cache');
    await cache.put(
      '/periodic-sync-meta',
      new Response(
        JSON.stringify({
          previousDealsCount: count,
          lastUpdate: Date.now(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  } catch (error) {
    console.warn('[DEMO M5-C2] ⚠️ Could not store deals count:', error);
  }
};

const showDataUpdateNotification = (dealsDifference) => {
  const message =
    dealsDifference > 0
      ? `${dealsDifference} new travel deals available!`
      : `${Math.abs(dealsDifference)} deals have been updated`;

  console.log('[DEMO M5-C2] 🔔 Showing notification:', message);

  // Show notification (if permission granted)
  self.registration
    .showNotification('Travel Planner Update', {
      body: message,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'periodic-sync-update',
      requireInteraction: false,
      data: {
        demo: 'M5-C2',
        type: 'data-update',
        dealsDifference,
      },
    })
    .catch((error) => {
      console.log(
        '[DEMO M5-C2] ⚠️ Could not show notification:',
        error.message
      );
    });
};

// Periodic sync event handler
const DEMO_PERIODIC_SYNC_HANDLER = (event) => {
  console.log('[DEMO M5-C2] ⏰ Periodic sync event:', event.tag);

  if (event.tag === PERIODIC_SYNC_TAG) {
    event.waitUntil(
      performPeriodicDataUpdate()
        .then(() => {
          console.log('[DEMO M5-C2] ✅ Periodic sync completed successfully');
        })
        .catch((error) => {
          console.error('[DEMO M5-C2] ❌ Periodic sync failed:', error);
        })
    );
  }
};

// Register periodic background sync
const registerPeriodicSync = async () => {
  try {
    // Check if periodic background sync is supported
    if ('periodicSync' in self.registration) {
      console.log('[DEMO M5-C2] ✅ Periodic background sync supported');

      // Register periodic sync
      await self.registration.periodicSync.register(PERIODIC_SYNC_TAG, {
        minInterval: SYNC_INTERVAL,
      });

      console.log('[DEMO M5-C2] ✅ Periodic sync registered');

      // Get registered tags for debugging
      const tags = await self.registration.periodicSync.getTags();
      console.log('[DEMO M5-C2] 📋 Registered periodic sync tags:', tags);
    } else {
      console.log('[DEMO M5-C2] ⚠️ Periodic background sync not supported');

      // Fallback: set up manual periodic check using setTimeout
      setupManualPeriodicSync();
    }
  } catch (error) {
    console.error('[DEMO M5-C2] ❌ Periodic sync registration failed:', error);
    setupManualPeriodicSync();
  }
};

const setupManualPeriodicSync = () => {
  console.log('[DEMO M5-C2] 🔄 Setting up manual periodic sync fallback');

  // Check every hour if browser is active
  setInterval(
    async () => {
      const clients = await self.clients.matchAll();

      // Only sync if there are active clients
      if (clients.length > 0) {
        console.log('[DEMO M5-C2] 🔄 Manual periodic sync trigger');
        performPeriodicDataUpdate();
      }
    },
    60 * 60 * 1000
  ); // 1 hour
};

// Message handler for manual periodic sync control
const DEMO_PERIODIC_MESSAGE_HANDLER = (event) => {
  const { type, data } = event.data || {};

  if (type === 'REGISTER_PERIODIC_SYNC') {
    console.log('[DEMO M5-C2] 📝 Manual periodic sync registration requested');
    registerPeriodicSync();
  }

  if (type === 'FORCE_PERIODIC_SYNC') {
    console.log('[DEMO M5-C2] ⏰ Force periodic sync requested');
    performPeriodicDataUpdate();
  }

  if (type === 'GET_PERIODIC_SYNC_STATUS') {
    console.log('[DEMO M5-C2] 📊 Periodic sync status requested');

    Promise.resolve().then(async () => {
      let isRegistered = false;
      let supportedFeatures = {
        periodicSync: 'periodicSync' in self.registration,
        notifications: 'showNotification' in self.registration,
      };

      if (supportedFeatures.periodicSync) {
        const tags = await self.registration.periodicSync.getTags();
        isRegistered = tags.includes(PERIODIC_SYNC_TAG);
      }

      event.ports[0]?.postMessage({
        type: 'PERIODIC_SYNC_STATUS',
        data: {
          isRegistered,
          supportedFeatures,
          tag: PERIODIC_SYNC_TAG,
          interval: SYNC_INTERVAL,
        },
      });
    });
  }
};

// Demo initialization
const initializePeriodicSyncDemo = () => {
  console.log('[DEMO M5-C2] 🎬 Initializing periodic sync demo');

  // Auto-register periodic sync after a delay
  setTimeout(() => {
    registerPeriodicSync();
  }, 3000);
};

if (self.FEATURES?.M5_C2_PERIODIC_SYNC) {
  console.log('[DEMO M5-C2] 🚀 Registering periodic sync demo handlers');

  self.addEventListener('periodicsync', DEMO_PERIODIC_SYNC_HANDLER);
  self.addEventListener('message', DEMO_PERIODIC_MESSAGE_HANDLER);

  // Initialize demo
  initializePeriodicSyncDemo();
}

self.M5_C2_DEMO = {
  performPeriodicDataUpdate,
  registerPeriodicSync,
  setupManualPeriodicSync,
  showDataUpdateNotification,
};

// [DEMO: Module 5 – Clip 2 END]
