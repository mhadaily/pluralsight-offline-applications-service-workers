// [DEMO: Module 4 – Clip 1 START]
/**
 * DEMO: Why Workbox - Benefits and Introduction
 *
 * This demo shows Workbox advantages:
 * - Simplified service worker development
 * - Built-in caching strategies
 * - Precaching and runtime caching
 * - Better error handling and debugging
 */

console.log('[DEMO M4-C1] 📦 Workbox Benefits demo loaded');

// Import Workbox modules (commented for demo - would need actual CDN or build)
// importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Simulate Workbox functionality for demo purposes
const simulateWorkboxBenefits = () => {
  console.log('[DEMO M4-C1] ✨ Simulating Workbox benefits:');
  console.log('[DEMO M4-C1] 📦 - Simplified caching strategies');
  console.log('[DEMO M4-C1] 🔧 - Automated precaching');
  console.log('[DEMO M4-C1] 🛡️ - Built-in error handling');
  console.log('[DEMO M4-C1] 📊 - Performance optimizations');
  console.log('[DEMO M4-C1] 🔍 - Better debugging tools');
};

const DEMO_WORKBOX_FETCH_HANDLER = (event) => {
  if (event.request.url.includes('/demo/m4-c1/benefits')) {
    event.respondWith(
      new Response(
        JSON.stringify({
          demo: 'M4-C1',
          benefits: [
            'Reduced boilerplate code',
            'Proven caching strategies',
            'Automated precaching',
            'Better error handling',
            'Performance optimizations',
            'Extensive debugging tools',
          ],
          workboxVersion: '7.0.0',
          timestamp: Date.now(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  }
};

if (self.FEATURES?.M4_C1_WHY_WORKBOX) {
  console.log('[DEMO M4-C1] 🚀 Registering Workbox benefits demo');

  self.addEventListener('fetch', DEMO_WORKBOX_FETCH_HANDLER);
  simulateWorkboxBenefits();
}

self.M4_C1_DEMO = { simulateWorkboxBenefits, DEMO_WORKBOX_FETCH_HANDLER };

// [DEMO: Module 4 – Clip 1 END]
