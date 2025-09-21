// [DEMO: Module 4 – Clip 2 START]
/**
 * DEMO: Workbox Precaching
 *
 * This demo shows Workbox precaching capabilities:
 * - Manifest-based precaching
 * - Cache versioning and updates
 * - Efficient resource management
 */

console.log('[DEMO M4-C2] 🗂️ Workbox Precaching demo loaded');

// Simulate Workbox precaching
const PRECACHE_MANIFEST = [
  { url: '/src/app.js', revision: 'abc123' },
  { url: '/src/styles.css', revision: 'def456' },
  { url: '/src/config.js', revision: 'ghi789' },
];

const simulateWorkboxPrecaching = async () => {
  console.log('[DEMO M4-C2] 📦 Simulating Workbox precaching');

  const cache = await caches.open('workbox-precache-v1');

  for (const item of PRECACHE_MANIFEST) {
    console.log(
      '[DEMO M4-C2] ➕ Precaching:',
      item.url,
      'revision:',
      item.revision
    );
    try {
      await cache.add(item.url);
    } catch (error) {
      console.warn('[DEMO M4-C2] ⚠️ Failed to precache:', item.url);
    }
  }

  console.log('[DEMO M4-C2] ✅ Precaching completed');
};

if (self.FEATURES?.M4_C2_WB_PRECACHING) {
  console.log('[DEMO M4-C2] 🚀 Initializing Workbox precaching demo');

  self.addEventListener('install', (event) => {
    event.waitUntil(simulateWorkboxPrecaching());
  });
}

self.M4_C2_DEMO = { simulateWorkboxPrecaching, PRECACHE_MANIFEST };

// [DEMO: Module 4 – Clip 2 END]
