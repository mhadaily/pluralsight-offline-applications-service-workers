// [DEMO: Module 2 – Clip 1 START]
/**
 * DEMO: Cache API Fundamentals
 *
 * This demo demonstrates the basic Cache API operations:
 * - Cache creation and management
 * - Adding resources to cache (add, addAll, put)
 * - Retrieving resources from cache (match, matchAll)
 * - Cache inspection and debugging
 * - Cache deletion and cleanup
 */

console.log('[DEMO M2-C1] 💾 Cache API Fundamentals demo loaded');

// ========================================
// CACHE MANAGEMENT UTILITIES
// ========================================

const DEMO_CACHE_NAME =
  self.CACHE_NAMES?.M2_C1_CACHE_API || 'demo-m2-c1-cache-api';
const DEMO_VERSIONED_CACHE =
  self.CACHE_NAMES?.M2_C1_VERSIONED || 'demo-m2-c1-v1.0.0';

const createDemoCache = async () => {
  try {
    console.log('[DEMO M2-C1] 📦 Creating demo cache:', DEMO_CACHE_NAME);

    const cache = await caches.open(DEMO_CACHE_NAME);

    // Demo resources to cache
    const resourcesToCache = [
      '/src/config.js',
      '/src/ui.js',
      '/api/deals',
      new Request('/demo/synthetic-resource', {
        method: 'GET',
        headers: { 'X-Demo': 'M2-C1' },
      }),
    ];

    // Method 1: cache.add() - for single resources
    console.log('[DEMO M2-C1] ➕ Adding single resource with cache.add()');
    await cache.add('/src/styles.css');

    // Method 2: cache.addAll() - for multiple resources
    console.log(
      '[DEMO M2-C1] ➕ Adding multiple resources with cache.addAll()'
    );
    await cache.addAll(['/src/app.js', '/src/routes.js']);

    // Method 3: cache.put() - for custom responses
    console.log('[DEMO M2-C1] ➕ Adding custom response with cache.put()');
    const customResponse = new Response(
      JSON.stringify({
        demo: 'M2-C1',
        type: 'Cache API Demo',
        timestamp: Date.now(),
        message: 'This is a synthetic cached response',
      }),
      {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Source': 'M2-C1-Synthetic',
          'Cache-Control': 'max-age=3600',
        },
      }
    );

    await cache.put('/demo/m2-c1/info', customResponse);

    console.log('[DEMO M2-C1] ✅ Demo cache created successfully');
    return cache;
  } catch (error) {
    console.error('[DEMO M2-C1] ❌ Failed to create demo cache:', error);
    throw error;
  }
};

const inspectCache = async (cacheName = DEMO_CACHE_NAME) => {
  try {
    console.log('[DEMO M2-C1] 🔍 Inspecting cache:', cacheName);

    const cache = await caches.open(cacheName);

    // Get all cached requests
    const requests = await cache.keys();
    console.log('[DEMO M2-C1] 📋 Found', requests.length, 'cached requests');

    const cacheContents = [];

    for (const request of requests) {
      const response = await cache.match(request);
      const info = {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        responseStatus: response?.status,
        responseHeaders: response
          ? Object.fromEntries(response.headers.entries())
          : null,
        contentType: response?.headers.get('content-type'),
        cacheControl: response?.headers.get('cache-control'),
      };

      cacheContents.push(info);
      console.log('[DEMO M2-C1] 📄 Cached item:', info);
    }

    return {
      cacheName,
      itemCount: requests.length,
      contents: cacheContents,
    };
  } catch (error) {
    console.error('[DEMO M2-C1] ❌ Failed to inspect cache:', error);
    return null;
  }
};

const demonstrateCacheMatching = async () => {
  try {
    console.log('[DEMO M2-C1] 🎯 Demonstrating cache matching strategies');

    const cache = await caches.open(DEMO_CACHE_NAME);

    // Exact match
    const exactMatch = await cache.match('/src/app.js');
    console.log('[DEMO M2-C1] 🎯 Exact match for /src/app.js:', !!exactMatch);

    // Match with options
    const ignoreSearchMatch = await cache.match('/api/deals?demo=true', {
      ignoreSearch: true,
    });
    console.log(
      '[DEMO M2-C1] 🎯 Ignore search match for /api/deals:',
      !!ignoreSearchMatch
    );

    // matchAll for multiple matches
    const allMatches = await cache.matchAll();
    console.log('[DEMO M2-C1] 🎯 All matches count:', allMatches.length);

    // Match with custom request
    const customRequest = new Request('/demo/m2-c1/info', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const customMatch = await cache.match(customRequest);
    console.log('[DEMO M2-C1] 🎯 Custom request match:', !!customMatch);

    if (customMatch) {
      const data = await customMatch.json();
      console.log('[DEMO M2-C1] 📄 Cached data:', data);
    }
  } catch (error) {
    console.error('[DEMO M2-C1] ❌ Cache matching demo failed:', error);
  }
};

const demonstrateCacheUpdates = async () => {
  try {
    console.log('[DEMO M2-C1] 🔄 Demonstrating cache updates');

    const cache = await caches.open(DEMO_CACHE_NAME);

    // Update existing cached item
    const updatedResponse = new Response(
      JSON.stringify({
        demo: 'M2-C1',
        type: 'Updated Cache Entry',
        timestamp: Date.now(),
        message: 'This cached response has been updated',
        version: '2.0',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Source': 'M2-C1-Updated',
          'Last-Modified': new Date().toUTCString(),
        },
      }
    );

    await cache.put('/demo/m2-c1/info', updatedResponse);
    console.log('[DEMO M2-C1] ✅ Cache entry updated');

    // Verify update
    const retrievedResponse = await cache.match('/demo/m2-c1/info');
    if (retrievedResponse) {
      const data = await retrievedResponse.json();
      console.log('[DEMO M2-C1] 📄 Updated data:', data);
    }
  } catch (error) {
    console.error('[DEMO M2-C1] ❌ Cache update demo failed:', error);
  }
};

const demonstrateCacheDeletion = async () => {
  try {
    console.log('[DEMO M2-C1] 🗑️ Demonstrating cache deletion');

    const cache = await caches.open(DEMO_CACHE_NAME);

    // Delete specific item
    const deleted = await cache.delete('/src/styles.css');
    console.log('[DEMO M2-C1] 🗑️ Deleted /src/styles.css:', deleted);

    // Delete with options
    const deletedWithOptions = await cache.delete('/api/deals', {
      ignoreSearch: true,
      ignoreMethod: false,
    });
    console.log(
      '[DEMO M2-C1] 🗑️ Deleted /api/deals (ignore search):',
      deletedWithOptions
    );

    // List remaining items
    const remainingKeys = await cache.keys();
    console.log(
      '[DEMO M2-C1] 📋 Remaining cached items:',
      remainingKeys.length
    );
  } catch (error) {
    console.error('[DEMO M2-C1] ❌ Cache deletion demo failed:', error);
  }
};

const listAllCaches = async () => {
  try {
    console.log('[DEMO M2-C1] 📋 Listing all caches');

    const cacheNames = await caches.keys();
    console.log(
      '[DEMO M2-C1] 📦 Found',
      cacheNames.length,
      'caches:',
      cacheNames
    );

    const cacheInfo = [];

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();

      const info = {
        name,
        itemCount: keys.length,
        items: keys.slice(0, 5).map((req) => req.url), // First 5 items
      };

      cacheInfo.push(info);
      console.log('[DEMO M2-C1] 📦 Cache info:', info);
    }

    return cacheInfo;
  } catch (error) {
    console.error('[DEMO M2-C1] ❌ Failed to list caches:', error);
    return [];
  }
};

// ========================================
// DEMO EXECUTION FUNCTIONS
// ========================================

const runCacheAPIDemo = async () => {
  console.log('[DEMO M2-C1] 🚀 Running complete Cache API demo');

  try {
    // 1. Create and populate cache
    await createDemoCache();

    // 2. Inspect cache contents
    await inspectCache();

    // 3. Demonstrate matching strategies
    await demonstrateCacheMatching();

    // 4. Show cache updates
    await demonstrateCacheUpdates();

    // 5. Demo deletion
    await demonstrateCacheDeletion();

    // 6. List all caches
    await listAllCaches();

    console.log('[DEMO M2-C1] ✅ Cache API demo completed successfully');
  } catch (error) {
    console.error('[DEMO M2-C1] ❌ Cache API demo failed:', error);
  }
};

// ========================================
// FETCH HANDLER FOR DEMO
// ========================================

const DEMO_FETCH_HANDLER = (event) => {
  const url = new URL(event.request.url);

  // Handle demo-specific requests
  if (url.pathname === '/demo/m2-c1/run') {
    event.respondWith(
      (async () => {
        await runCacheAPIDemo();

        return new Response(
          JSON.stringify({
            demo: 'M2-C1',
            message: 'Cache API demo executed',
            timestamp: Date.now(),
            checkConsole: true,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })()
    );
    return;
  }

  // Handle cache inspection requests
  if (url.pathname === '/demo/m2-c1/inspect') {
    event.respondWith(
      (async () => {
        const inspection = await inspectCache();
        const allCaches = await listAllCaches();

        return new Response(
          JSON.stringify({
            demo: 'M2-C1',
            inspection,
            allCaches,
            timestamp: Date.now(),
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })()
    );
    return;
  }
};

// ========================================
// MESSAGE HANDLING
// ========================================

const DEMO_MESSAGE_HANDLER = (event) => {
  const { type, data } = event.data || {};

  if (type === 'RUN_CACHE_API_DEMO') {
    console.log('[DEMO M2-C1] 🎬 Cache API demo requested via message');
    runCacheAPIDemo();
  }

  if (type === 'INSPECT_CACHE_API') {
    console.log('[DEMO M2-C1] 🔍 Cache inspection requested');

    Promise.all([inspectCache(), listAllCaches()]).then(
      ([inspection, allCaches]) => {
        event.ports[0]?.postMessage({
          type: 'CACHE_API_INSPECTION',
          data: { inspection, allCaches },
        });
      }
    );
  }

  if (type === 'CLEAR_DEMO_CACHE') {
    console.log('[DEMO M2-C1] 🧹 Demo cache cleanup requested');

    caches.delete(DEMO_CACHE_NAME).then((deleted) => {
      console.log('[DEMO M2-C1] ✅ Demo cache deleted:', deleted);
      event.ports[0]?.postMessage({
        type: 'DEMO_CACHE_CLEARED',
        data: { deleted },
      });
    });
  }
};

// ========================================
// AUTO-RUN DEMO
// ========================================

const initializeCacheAPIDemo = async () => {
  console.log('[DEMO M2-C1] 🎬 Initializing Cache API demo');

  // Wait a bit then run the demo
  setTimeout(() => {
    if (self.FEATURES?.M2_C1_CACHE_API) {
      runCacheAPIDemo();
    }
  }, 2000);
};

// ========================================
// EVENT REGISTRATION
// ========================================

// Only register handlers if this demo is enabled
if (self.FEATURES?.M2_C1_CACHE_API) {
  console.log('[DEMO M2-C1] 🚀 Registering Cache API demo handlers');

  self.addEventListener('fetch', DEMO_FETCH_HANDLER);
  self.addEventListener('message', DEMO_MESSAGE_HANDLER);

  // Initialize demo
  initializeCacheAPIDemo();
} else {
  console.log(
    '[DEMO M2-C1] ⏸️ Demo loaded but not enabled (set FEATURES.M2_C1_CACHE_API = true)'
  );
}

// Export for testing
self.M2_C1_DEMO = {
  createDemoCache,
  inspectCache,
  demonstrateCacheMatching,
  demonstrateCacheUpdates,
  demonstrateCacheDeletion,
  listAllCaches,
  runCacheAPIDemo,
};

// [DEMO: Module 2 – Clip 1 END]
