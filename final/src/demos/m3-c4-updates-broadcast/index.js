// [DEMO: Module 3 – Clip 4 START]
/**
 * DEMO: Update Notifications and Broadcasting
 *
 * This demo shows how to handle service worker updates:
 * - Detecting new service worker versions
 * - Broadcasting update notifications
 * - User-prompted updates
 * - Seamless update experiences
 */

console.log('[DEMO M3-C4] 📢 Update Broadcasting demo loaded');

const broadcastUpdateAvailable = () => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        demo: 'M3-C4',
        message: 'A new version is available',
        timestamp: Date.now(),
      });
    });
  });
  console.log('[DEMO M3-C4] 📢 Update notification broadcast');
};

const DEMO_UPDATE_HANDLER = (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[DEMO M3-C4] ⏭️ Skip waiting requested');
    self.skipWaiting();

    // Broadcast activation
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SW_ACTIVATED',
          demo: 'M3-C4',
          timestamp: Date.now(),
        });
      });
    });
  }
};

if (self.FEATURES?.M3_C4_UPDATES_BROADCAST) {
  console.log('[DEMO M3-C4] 🚀 Registering update broadcast handlers');

  self.addEventListener('install', () => {
    // Don't auto-skip waiting to demonstrate update flow
    console.log(
      '[DEMO M3-C4] 🔧 New version installed, waiting for activation'
    );
    broadcastUpdateAvailable();
  });

  self.addEventListener('message', DEMO_UPDATE_HANDLER);
}

self.M3_C4_DEMO = { broadcastUpdateAvailable, DEMO_UPDATE_HANDLER };

// [DEMO: Module 3 – Clip 4 END]
