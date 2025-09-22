// [DEMO: Module 3 – Clip 1 START]
/**
 * DEMO: Application Shell Architecture
 *
 * This demo implements the App Shell pattern:
 * - Core UI structure caching
 * - Dynamic content loading
 * - Shell update strategies
 * - Performance optimization
 * - Offline shell experience
 */

console.log('[DEMO M3-C1] 🏗️ App Shell Architecture demo loaded');

// ========================================
// APP SHELL CONFIGURATION
// ========================================

const APP_SHELL_CACHE = self.CACHE_NAMES?.M3_C1_APP_SHELL || 'app-shell-v1.0.0';
// these must be final production assets
const APP_SHELL_RESOURCES = [
  '/',
  '/src/index.html',
  '/src/app.js',
  '/src/styles.css',
  '/src/ui.js',
  '/src/routes.js',
  '/src/config.js',
  '/public/manifest.json',
  '/public/offline.html',
  '/src/views/home.html',
  '/src/views/ideas.html',
  '/src/views/deals.html',
  '/src/views/settings.html',
];

const DYNAMIC_CONTENT_CACHE =
  self.CACHE_NAMES?.DYNAMIC_CONTENT || 'dynamic-content-v1.0.0';

// ========================================
// APP SHELL CACHING STRATEGY
// ========================================

const cacheAppShell = async () => {
  console.log('[DEMO M3-C1] 📦 Caching app shell resources');

  try {
    const cache = await caches.open(APP_SHELL_CACHE);

    console.log('[DEMO M3-C1] ➕ Adding shell resources to cache');
    await cache.addAll(APP_SHELL_RESOURCES);

    console.log('[DEMO M3-C1] ✅ App shell cached successfully');

    // Add timestamp to track when shell was cached
    await cache.put(
      '/shell-info',
      new Response(
        JSON.stringify({
          cached: Date.now(),
          version: '1.0.0',
          resources: APP_SHELL_RESOURCES.length,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    return true;
  } catch (error) {
    console.error('[DEMO M3-C1] ❌ Failed to cache app shell:', error);
    throw error;
  }
};

const serveAppShell = async (request) => {
  console.log('[DEMO M3-C1] 🏗️ Serving app shell for:', request.url);

  try {
    const cache = await caches.open(APP_SHELL_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[DEMO M3-C1] ⚡ Serving from app shell cache');

      // Add app shell headers
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Served-From', 'App-Shell');
      headers.set('X-Cache-Strategy', 'App-Shell-Pattern');
      headers.set('X-Shell-Version', '1.0.0');

      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers,
      });
    }

    // Fallback to network if not in shell cache
    console.log('[DEMO M3-C1] 🌐 App shell miss, fetching from network');
    return fetch(request);
  } catch (error) {
    console.error('[DEMO M3-C1] ❌ App shell serving failed:', error);

    // Return offline shell as ultimate fallback
    return serveOfflineShell();
  }
};

const serveOfflineShell = () => {
  console.log('[DEMO M3-C1] 📱 Serving offline app shell');

  const offlineHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Travel Planner - Offline</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .offline-shell {
          max-width: 400px;
          padding: 40px;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { margin: 0 0 20px 0; font-size: 24px; }
        p { margin: 0 0 20px 0; opacity: 0.9; line-height: 1.6; }
        .status { 
          background: rgba(255,255,255,0.2); 
          padding: 10px; 
          border-radius: 10px;
          font-family: monospace;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="offline-shell">
        <div class="icon">✈️</div>
        <h1>Travel Planner</h1>
        <p>You're currently offline, but the app shell is ready!</p>
        <p>This minimal shell ensures the app loads instantly when you're back online.</p>
        <div class="status">
          DEMO M3-C1: App Shell Pattern Active
        </div>
      </div>
    </body>
    </html>
  `;

  return new Response(offlineHTML, {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'text/html',
      'X-Served-From': 'Offline-Shell',
      'X-Demo': 'M3-C1',
    },
  });
};

// ========================================
// DYNAMIC CONTENT MANAGEMENT
// ========================================

const cacheDynamicContent = async (request, response) => {
  console.log('[DEMO M3-C1] 💾 Caching dynamic content:', request.url);

  try {
    const cache = await caches.open(DYNAMIC_CONTENT_CACHE);
    await cache.put(request, response.clone());

    console.log('[DEMO M3-C1] ✅ Dynamic content cached');
    return response;
  } catch (error) {
    console.error('[DEMO M3-C1] ❌ Failed to cache dynamic content:', error);
    return response;
  }
};

const serveDynamicContent = async (request) => {
  console.log('[DEMO M3-C1] 📄 Serving dynamic content for:', request.url);

  try {
    // Try network first for dynamic content
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      console.log('[DEMO M3-C1] 🌐 Fresh dynamic content from network');
      return cacheDynamicContent(request, networkResponse);
    }

    throw new Error('Network response not ok');
  } catch (error) {
    console.log(
      '[DEMO M3-C1] ⚠️ Network failed, trying cache for dynamic content'
    );

    // Fallback to cached dynamic content
    const cache = await caches.open(DYNAMIC_CONTENT_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[DEMO M3-C1] 📦 Serving stale dynamic content from cache');

      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Served-From', 'Dynamic-Cache');
      headers.set('X-Content-Status', 'Stale');

      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers,
      });
    }

    // Ultimate fallback for API requests
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({
          error: 'Content unavailable offline',
          demo: 'M3-C1',
          message: 'This content is not available in offline mode',
          fallback: true,
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    throw error;
  }
};

// ========================================
// SHELL UPDATE MANAGEMENT
// ========================================

const updateAppShell = async (newVersion = '1.0.1') => {
  console.log('[DEMO M3-C1] 🔄 Updating app shell to version:', newVersion);

  try {
    const newCacheName = `app-shell-v${newVersion}`;
    const newCache = await caches.open(newCacheName);

    // Cache updated resources
    await newCache.addAll(APP_SHELL_RESOURCES);

    // Add new version info
    await newCache.put(
      '/shell-info',
      new Response(
        JSON.stringify({
          cached: Date.now(),
          version: newVersion,
          resources: APP_SHELL_RESOURCES.length,
          updated: true,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    // Delete old shell cache
    await caches.delete(APP_SHELL_CACHE);

    console.log('[DEMO M3-C1] ✅ App shell updated successfully');

    // Notify clients about the update
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'APP_SHELL_UPDATED',
        version: newVersion,
        demo: 'M3-C1',
      });
    });

    return true;
  } catch (error) {
    console.error('[DEMO M3-C1] ❌ App shell update failed:', error);
    throw error;
  }
};

// ========================================
// PERFORMANCE MONITORING
// ========================================

const trackShellPerformance = (request, startTime, source) => {
  const endTime = performance.now();
  const duration = Math.round(endTime - startTime);

  if (!self.M3_C1_PERFORMANCE) {
    self.M3_C1_PERFORMANCE = [];
  }

  const perfData = {
    url: request.url,
    source,
    duration,
    timestamp: Date.now(),
  };

  self.M3_C1_PERFORMANCE.push(perfData);

  // Keep only last 50 entries
  if (self.M3_C1_PERFORMANCE.length > 50) {
    self.M3_C1_PERFORMANCE = self.M3_C1_PERFORMANCE.slice(-50);
  }

  console.log('[DEMO M3-C1] ⏱️ Shell performance:', perfData);
};

// ========================================
// ROUTING LOGIC
// ========================================

const isAppShellRequest = (request) => {
  const url = new URL(request.url);

  // App shell resources
  if (APP_SHELL_RESOURCES.includes(url.pathname)) {
    return true;
  }

  // HTML documents (navigation requests)
  if (
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    url.pathname.endsWith('.html')
  ) {
    return true;
  }

  return false;
};

const isDynamicContent = (request) => {
  const url = new URL(request.url);

  // API requests
  if (url.pathname.startsWith('/api/')) {
    return true;
  }

  // Dynamic data endpoints
  if (url.pathname.includes('/data/') || url.pathname.includes('/content/')) {
    return true;
  }

  return false;
};

// ========================================
// MAIN FETCH HANDLER
// ========================================

const DEMO_FETCH_HANDLER = (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle demo-specific routes
  if (url.pathname === '/demo/m3-c1/shell-info') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(APP_SHELL_CACHE);
        return cache.match('/shell-info') || new Response('{}');
      })()
    );
    return;
  }

  if (url.pathname === '/demo/m3-c1/update-shell') {
    event.respondWith(
      (async () => {
        await updateAppShell();
        return new Response(
          JSON.stringify({
            demo: 'M3-C1',
            message: 'App shell updated',
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

  const startTime = performance.now();

  if (isAppShellRequest(request)) {
    console.log('[DEMO M3-C1] 🏗️ App shell request detected');

    event.respondWith(
      serveAppShell(request).then((response) => {
        trackShellPerformance(request, startTime, 'app-shell');
        return response;
      })
    );
  } else if (isDynamicContent(request)) {
    console.log('[DEMO M3-C1] 📄 Dynamic content request detected');

    event.respondWith(
      serveDynamicContent(request).then((response) => {
        trackShellPerformance(request, startTime, 'dynamic-content');
        return response;
      })
    );
  }
};

// ========================================
// INITIALIZATION
// ========================================

const initializeAppShell = async () => {
  console.log('[DEMO M3-C1] 🎬 Initializing app shell demo');

  try {
    await cacheAppShell();
    console.log('[DEMO M3-C1] ✅ App shell initialization complete');
  } catch (error) {
    console.error('[DEMO M3-C1] ❌ App shell initialization failed:', error);
  }
};

// ========================================
// EVENT REGISTRATION
// ========================================

// Only register handlers if this demo is enabled
if (self.FEATURES?.M3_C1_APP_SHELL) {
  console.log('[DEMO M3-C1] 🚀 Registering app shell demo handlers');

  self.addEventListener('fetch', DEMO_FETCH_HANDLER);

  // Initialize on install
  self.addEventListener('install', (event) => {
    if (self.FEATURES?.M3_C1_APP_SHELL) {
      event.waitUntil(initializeAppShell());
    }
  });

  // Initialize performance tracking
  self.M3_C1_PERFORMANCE = [];
} else {
  console.log(
    '[DEMO M3-C1] ⏸️ Demo loaded but not enabled (set FEATURES.M3_C1_APP_SHELL = true)'
  );
}

// Export for testing
self.M3_C1_DEMO = {
  cacheAppShell,
  serveAppShell,
  serveOfflineShell,
  cacheDynamicContent,
  serveDynamicContent,
  updateAppShell,
  isAppShellRequest,
  isDynamicContent,
};

// [DEMO: Module 3 – Clip 1 END]
