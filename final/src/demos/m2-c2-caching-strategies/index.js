// [DEMO: Module 2 – Clip 2 START]
/**
 * DEMO: Caching Strategies Implementation
 *
 * This demo implements and demonstrates various caching strategies:
 * - Cache First (Cache Falling Back to Network)
 * - Network First (Network Falling Back to Cache)
 * - Stale While Revalidate
 * - Network Only
 * - Cache Only
 * - Custom hybrid strategies
 */

console.log('[DEMO M2-C2] ⚡ Caching Strategies demo loaded');

// ========================================
// STRATEGY IMPLEMENTATIONS
// ========================================

/**
 * Cache First Strategy
 * Try cache first, fall back to network if not found
 */
const cacheFirstStrategy = async (request, cacheName = 'cache-first-demo') => {
  console.log('[DEMO M2-C2] 📦 Cache First for:', request.url);

  try {
    // 1. Try to get from cache first
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[DEMO M2-C2] ⚡ Cache hit:', request.url);

      // Add cache hit headers for debugging
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Cache-Status', 'HIT');
      headers.set('X-Cache-Strategy', 'Cache-First');
      headers.set('X-Served-From', 'Cache');

      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers,
      });
    }

    // 2. Cache miss - fetch from network
    console.log(
      '[DEMO M2-C2] 🌐 Cache miss, fetching from network:',
      request.url
    );
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // 3. Cache the response for future use
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      console.log('[DEMO M2-C2] 💾 Cached network response:', request.url);

      // Add cache miss headers
      const headers = new Headers(networkResponse.headers);
      headers.set('X-Cache-Status', 'MISS');
      headers.set('X-Cache-Strategy', 'Cache-First');
      headers.set('X-Served-From', 'Network');

      return new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers,
      });
    }

    return networkResponse;
  } catch (error) {
    console.error('[DEMO M2-C2] ❌ Cache First strategy failed:', error);
    throw error;
  }
};

/**
 * Network First Strategy
 * Try network first, fall back to cache if network fails
 */
const networkFirstStrategy = async (
  request,
  cacheName = 'network-first-demo'
) => {
  console.log('[DEMO M2-C2] 🌐 Network First for:', request.url);

  try {
    // 1. Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      console.log('[DEMO M2-C2] ✅ Network success:', request.url);

      // 2. Update cache with fresh response
      const cache = await caches.open(cacheName);
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      console.log(
        '[DEMO M2-C2] 💾 Updated cache with fresh response:',
        request.url
      );

      // Add network success headers
      const headers = new Headers(networkResponse.headers);
      headers.set('X-Cache-Status', 'REFRESH');
      headers.set('X-Cache-Strategy', 'Network-First');
      headers.set('X-Served-From', 'Network');

      return new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers,
      });
    }

    throw new Error(`Network response not ok: ${networkResponse.status}`);
  } catch (error) {
    console.log('[DEMO M2-C2] ⚠️ Network failed, trying cache:', error.message);

    // 3. Network failed - try cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log(
        '[DEMO M2-C2] 📦 Serving stale content from cache:',
        request.url
      );

      // Add stale content headers
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Cache-Status', 'STALE');
      headers.set('X-Cache-Strategy', 'Network-First');
      headers.set('X-Served-From', 'Cache');
      headers.set('X-Network-Error', error.message);

      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers,
      });
    }

    // 4. Both network and cache failed
    console.error(
      '[DEMO M2-C2] ❌ Both network and cache failed for:',
      request.url
    );
    throw error;
  }
};

/**
 * Stale While Revalidate Strategy
 * Serve from cache immediately, update cache in background
 */
const staleWhileRevalidateStrategy = async (
  request,
  cacheName = 'swr-demo'
) => {
  console.log('[DEMO M2-C2] 🔄 Stale While Revalidate for:', request.url);

  const cache = await caches.open(cacheName);

  // 1. Get cached response immediately
  const cachedResponse = await cache.match(request);

  // 2. Start network request in background (don't await)
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        console.log('[DEMO M2-C2] 🔄 Background update for:', request.url);
        await cache.put(request, response.clone());

        // Notify clients about the update
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'CACHE_UPDATED',
              url: request.url,
              strategy: 'stale-while-revalidate',
            });
          });
        });
      }
      return response;
    })
    .catch((error) => {
      console.warn('[DEMO M2-C2] ⚠️ Background update failed:', error);
    });

  // 3. Return cached response if available
  if (cachedResponse) {
    console.log('[DEMO M2-C2] ⚡ Serving stale content:', request.url);

    const headers = new Headers(cachedResponse.headers);
    headers.set('X-Cache-Status', 'STALE');
    headers.set('X-Cache-Strategy', 'Stale-While-Revalidate');
    headers.set('X-Served-From', 'Cache');
    headers.set('X-Background-Update', 'true');

    return new Response(cachedResponse.body, {
      status: cachedResponse.status,
      statusText: cachedResponse.statusText,
      headers,
    });
  }

  // 4. No cached response - wait for network
  console.log('[DEMO M2-C2] 🌐 No cache, waiting for network:', request.url);
  const networkResponse = await networkPromise;

  if (networkResponse && networkResponse.ok) {
    const headers = new Headers(networkResponse.headers);
    headers.set('X-Cache-Status', 'MISS');
    headers.set('X-Cache-Strategy', 'Stale-While-Revalidate');
    headers.set('X-Served-From', 'Network');

    return new Response(networkResponse.body, {
      status: networkResponse.status,
      statusText: networkResponse.statusText,
      headers,
    });
  }

  throw new Error('Both cache and network failed');
};

/**
 * Custom Hybrid Strategy
 * Use different strategies based on request type and context
 */
const hybridStrategy = async (request) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  console.log('[DEMO M2-C2] 🎯 Hybrid strategy routing for:', pathname);

  // Route to appropriate strategy based on resource type
  if (pathname.startsWith('/api/')) {
    // API requests: Network First (fresh data preferred)
    console.log('[DEMO M2-C2] 🌐 API request -> Network First');
    return networkFirstStrategy(request, 'hybrid-api-cache');
  } else if (pathname.endsWith('.css') || pathname.endsWith('.js')) {
    // Static assets: Cache First (performance critical)
    console.log('[DEMO M2-C2] 📦 Static asset -> Cache First');
    return cacheFirstStrategy(request, 'hybrid-static-cache');
  } else if (
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg')
  ) {
    // Images: Cache First with long TTL
    console.log('[DEMO M2-C2] 🖼️ Image -> Cache First');
    return cacheFirstStrategy(request, 'hybrid-images-cache');
  } else if (pathname.startsWith('/views/') || pathname.endsWith('.html')) {
    // HTML content: Stale While Revalidate (balance of speed and freshness)
    console.log('[DEMO M2-C2] 📄 HTML content -> Stale While Revalidate');
    return staleWhileRevalidateStrategy(request, 'hybrid-html-cache');
  } else {
    // Default: Stale While Revalidate
    console.log('[DEMO M2-C2] 🔄 Default -> Stale While Revalidate');
    return staleWhileRevalidateStrategy(request, 'hybrid-default-cache');
  }
};

// ========================================
// STRATEGY PERFORMANCE MONITORING
// ========================================

const trackStrategyPerformance = (strategy, url, startTime, cacheStatus) => {
  const endTime = performance.now();
  const duration = Math.round(endTime - startTime);

  if (!self.M2_C2_PERFORMANCE) {
    self.M2_C2_PERFORMANCE = {};
  }

  if (!self.M2_C2_PERFORMANCE[strategy]) {
    self.M2_C2_PERFORMANCE[strategy] = [];
  }

  const perfData = {
    url,
    duration,
    cacheStatus,
    timestamp: Date.now(),
  };

  self.M2_C2_PERFORMANCE[strategy].push(perfData);

  // Keep only last 50 entries per strategy
  if (self.M2_C2_PERFORMANCE[strategy].length > 50) {
    self.M2_C2_PERFORMANCE[strategy] =
      self.M2_C2_PERFORMANCE[strategy].slice(-50);
  }

  console.log(`[DEMO M2-C2] ⏱️ ${strategy} performance:`, perfData);
};

// ========================================
// DEMO ROUTES
// ========================================

const createDemoRoutes = () => {
  return [
    {
      pattern: /\/demo\/m2-c2\/cache-first/,
      strategy: 'cache-first',
      handler: (request) => cacheFirstStrategy(request),
    },
    {
      pattern: /\/demo\/m2-c2\/network-first/,
      strategy: 'network-first',
      handler: (request) => networkFirstStrategy(request),
    },
    {
      pattern: /\/demo\/m2-c2\/stale-while-revalidate/,
      strategy: 'stale-while-revalidate',
      handler: (request) => staleWhileRevalidateStrategy(request),
    },
    {
      pattern: /\/demo\/m2-c2\/hybrid/,
      strategy: 'hybrid',
      handler: (request) => hybridStrategy(request),
    },
  ];
};

// ========================================
// FETCH HANDLER
// ========================================

const DEMO_FETCH_HANDLER = (event) => {
  const url = new URL(event.request.url);

  // Skip non-same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  const demoRoutes = createDemoRoutes();
  const matchedRoute = demoRoutes.find((route) =>
    route.pattern.test(url.pathname)
  );

  if (matchedRoute) {
    console.log('[DEMO M2-C2] 🎯 Route matched:', matchedRoute.strategy);

    event.respondWith(
      (async () => {
        const startTime = performance.now();

        try {
          const response = await matchedRoute.handler(event.request);
          const cacheStatus =
            response.headers.get('X-Cache-Status') || 'UNKNOWN';

          trackStrategyPerformance(
            matchedRoute.strategy,
            url.pathname,
            startTime,
            cacheStatus
          );

          return response;
        } catch (error) {
          console.error('[DEMO M2-C2] ❌ Strategy failed:', error);

          trackStrategyPerformance(
            matchedRoute.strategy,
            url.pathname,
            startTime,
            'ERROR'
          );

          // Return error response
          return new Response(
            JSON.stringify({
              error: 'Strategy failed',
              strategy: matchedRoute.strategy,
              message: error.message,
              timestamp: Date.now(),
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      })()
    );
  } else if (url.pathname === '/demo/m2-c2/stats') {
    // Return strategy performance stats
    event.respondWith(
      new Response(
        JSON.stringify({
          demo: 'M2-C2',
          performance: self.M2_C2_PERFORMANCE || {},
          timestamp: Date.now(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  }
};

// ========================================
// MESSAGE HANDLING
// ========================================

const DEMO_MESSAGE_HANDLER = (event) => {
  const { type, data } = event.data || {};

  if (type === 'GET_STRATEGY_STATS') {
    console.log('[DEMO M2-C2] 📊 Strategy stats requested');

    const stats = {};

    if (self.M2_C2_PERFORMANCE) {
      Object.keys(self.M2_C2_PERFORMANCE).forEach((strategy) => {
        const requests = self.M2_C2_PERFORMANCE[strategy];
        stats[strategy] = {
          totalRequests: requests.length,
          averageTime:
            requests.length > 0
              ? Math.round(
                  requests.reduce((sum, req) => sum + req.duration, 0) /
                    requests.length
                )
              : 0,
          cacheHits: requests.filter((req) => req.cacheStatus === 'HIT').length,
          cacheMisses: requests.filter((req) => req.cacheStatus === 'MISS')
            .length,
          staleServed: requests.filter((req) => req.cacheStatus === 'STALE')
            .length,
          recentRequests: requests.slice(-5),
        };
      });
    }

    event.ports[0]?.postMessage({
      type: 'STRATEGY_STATS',
      data: stats,
    });
  }

  if (type === 'CLEAR_STRATEGY_CACHES') {
    console.log('[DEMO M2-C2] 🧹 Clearing strategy caches');

    const cacheNames = [
      'cache-first-demo',
      'network-first-demo',
      'swr-demo',
      'hybrid-api-cache',
      'hybrid-static-cache',
      'hybrid-images-cache',
      'hybrid-html-cache',
      'hybrid-default-cache',
    ];

    Promise.all(cacheNames.map((name) => caches.delete(name))).then(() => {
      self.M2_C2_PERFORMANCE = {};
      console.log('[DEMO M2-C2] ✅ All strategy caches cleared');
    });
  }
};

// ========================================
// EVENT REGISTRATION
// ========================================

// Only register handlers if this demo is enabled
if (self.FEATURES?.M2_C2_CACHING_STRATEGIES) {
  console.log('[DEMO M2-C2] 🚀 Registering caching strategies demo handlers');

  self.addEventListener('fetch', DEMO_FETCH_HANDLER);
  self.addEventListener('message', DEMO_MESSAGE_HANDLER);

  // Initialize performance tracking
  self.M2_C2_PERFORMANCE = {};
} else {
  console.log(
    '[DEMO M2-C2] ⏸️ Demo loaded but not enabled (set FEATURES.M2_C2_CACHING_STRATEGIES = true)'
  );
}

// Export for testing
self.M2_C2_DEMO = {
  cacheFirstStrategy,
  networkFirstStrategy,
  staleWhileRevalidateStrategy,
  hybridStrategy,
  trackStrategyPerformance,
};

// [DEMO: Module 2 – Clip 2 END]
