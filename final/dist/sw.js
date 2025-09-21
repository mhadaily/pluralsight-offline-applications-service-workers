/**
 * Travel Planner - Service Worker
 * Main service worker with toggleable demo imports
 *
 * To enable demos:
 * 1. Uncomment the corresponding importScripts line below
 * 2. Or set the feature flag to true in config.js
 *
 * All demos are disabled by default for clean app experience
 */

// Import configuration and helpers
// Vite serves the `src` folder as the web root, so service worker should
// import from root paths (e.g. /sw-config.js) rather than /src/sw-config.js
// Note: Using sw-config.js (classic script) instead of config.js (ES module)
importScripts('/sw-config.js');
importScripts('/sw-helpers.js');

// ========================================
// DEMO IMPORTS - UNCOMMENT TO ENABLE
// ========================================

// Module 1 - Service Worker Lifecycle
// importScripts('/demos/m1-c3-lifecycle/index.js');
// importScripts('/demos/m1-c4-register-activate/index.js');
// importScripts('/demos/m1-c5-intercept/index.js');

// Module 2 - Caching Strategies
// importScripts('/demos/m2-c1-cache-api/index.js');
// importScripts('/demos/m2-c2-caching-strategies/index.js');
// importScripts('/demos/m2-c3-apply-strategies/index.js');
// importScripts('/demos/m2-c4-indexeddb-intro/index.js');
// importScripts('/demos/m2-c5-indexeddb-demo/index.js');

// Module 3 - Application Shell
// importScripts('/demos/m3-c1-app-shell/index.js');
// importScripts('/demos/m3-c2-nav-preload/index.js');
// importScripts('/demos/m3-c3-offline-fallback/index.js');
// importScripts('/demos/m3-c4-updates-broadcast/index.js');
// importScripts('/demos/m3-c5-cleanup-unregister/index.js');

// Module 4 - Workbox Integration
// importScripts('/demos/m4-c1-why-workbox/index.js');
// importScripts('/demos/m4-c2-workbox-precaching/index.js');
// importScripts('/demos/m4-c3-workbox-runtime/index.js');
// importScripts('/demos/m4-c4-workbox-navigation-fallback/index.js');

// Module 5 - Advanced Web APIs
// importScripts('/demos/m5-c1-background-sync/index.js');
// importScripts('/demos/m5-c2-periodic-sync/index.js');
// importScripts('/demos/m5-c3-streams/index.js');

// ========================================
// BASE SERVICE WORKER FUNCTIONALITY
// ========================================

/**
 * Service Worker Install Event
 * Base functionality - extended by demos when enabled
 */
self.addEventListener('install', (event) => {
  console.log('[SW] 🔧 Installing service worker...');

  // Skip waiting by default for faster activation
  self.skipWaiting();
});

/**
 * Service Worker Activate Event
 * Base functionality - extended by demos when enabled
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] ✅ Service worker activated');

  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
});

/**
 * Fetch Event Handler
 * Base functionality - extended by demos when enabled
 */
self.addEventListener('fetch', (event) => {
  // Base handler - does nothing by default
  // Demos will add their own fetch handling when enabled

  // For debugging - log fetch requests when no demos are active
  if (
    event.request.url.includes(self.location.origin) &&
    !event.request.url.includes('chrome-extension')
  ) {
    console.log('[SW] 🌐 Fetch (passthrough):', event.request.url);
  }
});

/**
 * Message Event Handler
 * Handle messages from main thread
 */
self.addEventListener('message', (event) => {
  console.log('[SW] 💬 Received message:', event.data);

  const { type, data } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      console.log('[SW] ⏭️ Skip waiting requested (from client)');
      try {
        self.skipWaiting();
        console.log('[SW] ⏭️ skipWaiting() called');
      } catch (err) {
        console.warn('[SW] ❌ skipWaiting() failed', err);
      }
      break;

    case 'CLEAR_CACHES':
      console.log('[SW] 🧹 Clear caches requested');
      event.waitUntil(clearAllCaches());
      break;

    case 'UNREGISTER':
      console.log('[SW] 🗑️ Unregister requested');
      event.waitUntil(self.registration.unregister());
      break;

    case 'GET_STATUS':
      console.log('[SW] 📊 Status requested');
      event.ports[0]?.postMessage({
        type: 'STATUS_RESPONSE',
        data: getServiceWorkerStatus(),
      });
      break;

    default:
      console.log('[SW] ❓ Unknown message type:', type);
  }
});

/**
 * Push Event Handler (for background sync demos)
 */
self.addEventListener('push', (event) => {
  console.log('[SW] 📬 Push event received');

  const options = {
    body: event.data ? event.data.text() : 'Push notification received',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'travel-planner-push',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification('Travel Planner', options)
  );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🔔 Notification clicked');

  event.notification.close();

  // Focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

/**
 * Background Sync Handler (for background sync demos)
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] 🔄 Background sync event:', event.tag);

  if (event.tag === 'background-sync-demo') {
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * Periodic Background Sync Handler (for periodic sync demos)
 */
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] ⏰ Periodic background sync event:', event.tag);

  if (event.tag === 'periodic-sync-demo') {
    event.waitUntil(doPeriodicSync());
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Clear all caches
 */
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map((cacheName) => {
      console.log('[SW] 🗑️ Deleting cache:', cacheName);
      return caches.delete(cacheName);
    });

    await Promise.all(deletePromises);
    console.log('[SW] ✅ All caches cleared');

    // Notify clients
    notifyClients({
      type: 'CACHES_CLEARED',
      data: { count: cacheNames.length },
    });
  } catch (error) {
    console.error('[SW] ❌ Failed to clear caches:', error);
  }
}

/**
 * Get service worker status
 */
function getServiceWorkerStatus() {
  return {
    version: '1.0.0',
    scope: self.registration.scope,
    state: self.serviceWorker?.state || 'unknown',
    updateViaCache: self.registration.updateViaCache,
    features: self.FEATURES || {},
    timestamp: Date.now(),
  };
}

/**
 * Notify all clients
 */
async function notifyClients(message) {
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach((client) => {
      client.postMessage(message);
    });
  } catch (error) {
    console.error('[SW] ❌ Failed to notify clients:', error);
  }
}

/**
 * Background sync demo handler
 */
async function doBackgroundSync() {
  try {
    console.log('[SW] 🔄 Performing background sync...');

    // Simulate background work
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Notify clients
    notifyClients({
      type: 'BACKGROUND_SYNC_COMPLETE',
      data: { timestamp: Date.now() },
    });

    console.log('[SW] ✅ Background sync completed');
  } catch (error) {
    console.error('[SW] ❌ Background sync failed:', error);
  }
}

/**
 * Periodic background sync demo handler
 */
async function doPeriodicSync() {
  try {
    console.log('[SW] ⏰ Performing periodic sync...');

    // Simulate periodic work (e.g., check for new deals)
    const response = await fetch('/api/deals').catch(() => null);

    if (response?.ok) {
      const deals = await response.json();
      console.log('[SW] 📊 Periodic sync: found', deals.length, 'deals');

      // Notify clients of new data
      notifyClients({
        type: 'PERIODIC_SYNC_COMPLETE',
        data: { dealsCount: deals.length, timestamp: Date.now() },
      });
    }

    console.log('[SW] ✅ Periodic sync completed');
  } catch (error) {
    console.error('[SW] ❌ Periodic sync failed:', error);
  }
}

// ========================================
// INITIALIZATION
// ========================================

console.log('[SW] 🚀 Service Worker script loaded');
console.log('[SW] 🏷️ Scope:', self.registration?.scope);
console.log(
  '[SW] ⚙️ Features available:',
  Object.keys(self.FEATURES || {}).length
);

// Log enabled features for debugging
if (self.FEATURES) {
  const enabledFeatures = Object.entries(self.FEATURES)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature);

  if (enabledFeatures.length > 0) {
    console.log('[SW] ✨ Enabled features:', enabledFeatures);
  } else {
    console.log('[SW] 📝 No demo features enabled (clean mode)');
  }
}
