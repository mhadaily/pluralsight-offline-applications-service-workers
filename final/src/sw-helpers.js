/**
 * Service Worker Helper Functions
 * Caching strategies and utility functions for demos
 */

// ========================================
// CACHE MANAGEMENT HELPERS
// ========================================

/**
 * Open a cache with error handling
 * @param {string} cacheName - Name of cache to open
 * @returns {Promise<Cache>} Cache instance
 */
async function openCache(cacheName) {
  try {
    const cache = await caches.open(cacheName);
    console.log(`[SW Helper] 📦 Opened cache: ${cacheName}`);
    return cache;
  } catch (error) {
    console.error(`[SW Helper] ❌ Failed to open cache ${cacheName}:`, error);
    throw error;
  }
}

/**
 * Put request/response in cache with error handling
 * @param {string} cacheName - Name of cache
 * @param {Request|string} request - Request or URL
 * @param {Response} response - Response to cache
 */
async function put(cacheName, request, response) {
  try {
    const cache = await openCache(cacheName);
    await cache.put(request, response.clone());
    console.log(
      `[SW Helper] 💾 Cached: ${
        typeof request === 'string' ? request : request.url
      }`
    );
  } catch (error) {
    console.error(`[SW Helper] ❌ Failed to cache:`, error);
  }
}

/**
 * Match request against multiple caches
 * @param {string|string[]} cacheNames - Cache name(s) to search
 * @param {Request|string} request - Request to match
 * @returns {Promise<Response|undefined>} Cached response if found
 */
async function match(cacheNames, request) {
  const names = Array.isArray(cacheNames) ? cacheNames : [cacheNames];

  for (const cacheName of names) {
    try {
      const cache = await caches.open(cacheName);
      const response = await cache.match(request);
      if (response) {
        console.log(
          `[SW Helper] 🎯 Cache hit in ${cacheName}:`,
          typeof request === 'string' ? request : request.url
        );
        return response;
      }
    } catch (error) {
      console.error(
        `[SW Helper] ❌ Failed to match in cache ${cacheName}:`,
        error
      );
    }
  }

  console.log(
    `[SW Helper] 💨 Cache miss:`,
    typeof request === 'string' ? request : request.url
  );
  return undefined;
}

/**
 * Delete old caches based on prefix and keep list
 * @param {string} prefix - Cache name prefix
 * @param {Set<string>} keepSet - Set of cache names to keep
 */
async function deleteOldCaches(prefix, keepSet) {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(
      (name) => name.startsWith(prefix) && !keepSet.has(name)
    );

    const deletePromises = oldCaches.map((cacheName) => {
      console.log(`[SW Helper] 🗑️ Deleting old cache: ${cacheName}`);
      return caches.delete(cacheName);
    });

    await Promise.all(deletePromises);
    console.log(`[SW Helper] ✅ Cleaned up ${oldCaches.length} old caches`);
  } catch (error) {
    console.error(`[SW Helper] ❌ Failed to delete old caches:`, error);
  }
}

// ========================================
// CACHING STRATEGIES
// ========================================

/**
 * Cache First Strategy
 * Check cache first, fallback to network
 * @param {Request} request - Request to handle
 * @param {string} cacheName - Cache name to use
 * @returns {Promise<Response>} Response from cache or network
 */
async function cacheFirst(request, cacheName) {
  console.log(`[SW Strategy] 📋 Cache First → ${request.url}`);

  try {
    // Try cache first
    const cachedResponse = await match(cacheName, request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to network
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      await put(cacheName, request, networkResponse);
    }

    return networkResponse;
  } catch (error) {
    console.error(`[SW Strategy] ❌ Cache First failed:`, error);

    // Try cache as final fallback
    const cachedResponse = await match(cacheName, request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return error response
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Network First Strategy
 * Try network first, fallback to cache
 * @param {Request} request - Request to handle
 * @param {string} cacheName - Cache name to use
 * @param {number} timeout - Network timeout in ms (default: 3000)
 * @returns {Promise<Response>} Response from network or cache
 */
async function networkFirst(request, cacheName, timeout = 3000) {
  console.log(`[SW Strategy] 🌐 Network First → ${request.url}`);

  try {
    // Try network with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const networkResponse = await fetch(request, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Cache successful responses
    if (networkResponse.ok) {
      await put(cacheName, request, networkResponse);
    }

    return networkResponse;
  } catch (error) {
    console.log(
      `[SW Strategy] 📴 Network failed, trying cache:`,
      error.message
    );

    // Fallback to cache
    const cachedResponse = await match(cacheName, request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return error response
    return new Response('Network error and no cache', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Stale While Revalidate Strategy
 * Return cached response immediately, update cache in background
 * @param {Request} request - Request to handle
 * @param {string} cacheName - Cache name to use
 * @returns {Promise<Response>} Cached or network response
 */
async function staleWhileRevalidate(request, cacheName) {
  console.log(`[SW Strategy] 🔄 Stale While Revalidate → ${request.url}`);

  try {
    // Check cache
    const cachedResponse = await match(cacheName, request);

    // Start network request (don't await)
    const networkPromise = fetch(request)
      .then(async (networkResponse) => {
        if (networkResponse.ok) {
          await put(cacheName, request, networkResponse);
          console.log(`[SW Strategy] 🔄 Background cache update completed`);
        }
        return networkResponse;
      })
      .catch((error) => {
        console.error(`[SW Strategy] ❌ Background fetch failed:`, error);
      });

    // Return cached response if available, otherwise wait for network
    if (cachedResponse) {
      console.log(`[SW Strategy] ⚡ Returning stale response`);
      return cachedResponse;
    }

    console.log(`[SW Strategy] ⏳ No cache, waiting for network...`);
    return await networkPromise;
  } catch (error) {
    console.error(`[SW Strategy] ❌ Stale While Revalidate failed:`, error);
    return new Response('Strategy failed', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Network Only Strategy
 * Always fetch from network (useful for dynamic content)
 * @param {Request} request - Request to handle
 * @returns {Promise<Response>} Network response
 */
async function networkOnly(request) {
  console.log(`[SW Strategy] 🌐 Network Only → ${request.url}`);

  try {
    return await fetch(request);
  } catch (error) {
    console.error(`[SW Strategy] ❌ Network Only failed:`, error);
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Cache Only Strategy
 * Only serve from cache (useful for static assets)
 * @param {Request} request - Request to handle
 * @param {string} cacheName - Cache name to use
 * @returns {Promise<Response>} Cached response or 404
 */
async function cacheOnly(request, cacheName) {
  console.log(`[SW Strategy] 📦 Cache Only → ${request.url}`);

  const cachedResponse = await match(cacheName, request);
  if (cachedResponse) {
    return cachedResponse;
  }

  return new Response('Not found in cache', {
    status: 404,
    statusText: 'Not Found',
  });
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Check if request is cacheable
 * @param {Request} request - Request to check
 * @returns {boolean} Whether request should be cached
 */
function isCacheable(request) {
  // Don't cache non-GET requests
  if (request.method !== 'GET') {
    return false;
  }

  // Don't cache chrome-extension requests
  if (request.url.includes('chrome-extension')) {
    return false;
  }

  // Don't cache requests with no-cache header
  if (request.headers.get('cache-control')?.includes('no-cache')) {
    return false;
  }

  return true;
}

/**
 * Create cache key from request
 * @param {Request} request - Request to create key for
 * @returns {string} Cache key
 */
function createCacheKey(request) {
  const url = new URL(request.url);

  // Remove search params for static assets
  if (['style', 'script', 'font', 'image'].includes(request.destination)) {
    url.search = '';
  }

  return url.toString();
}

/**
 * Log strategy usage for debugging
 * @param {string} strategy - Strategy name
 * @param {string} url - Request URL
 * @param {string} result - Result (hit/miss/error)
 */
function logStrategy(strategy, url, result) {
  const emoji = {
    hit: '🎯',
    miss: '💨',
    error: '❌',
    fetch: '🌐',
  };

  console.log(`[SW] ${emoji[result] || '📋'} ${strategy} → ${url} (${result})`);
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} Cache statistics
 */
async function getCacheStats() {
  try {
    const cacheNames = await caches.keys();
    const stats = {};

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      stats[cacheName] = {
        entries: keys.length,
        urls: keys.map((req) => req.url),
      };
    }

    return {
      totalCaches: cacheNames.length,
      caches: stats,
    };
  } catch (error) {
    console.error('[SW Helper] ❌ Failed to get cache stats:', error);
    return { error: error.message };
  }
}

// ========================================
// EXPORTS (Global scope for SW)
// ========================================

// Make functions available globally for demos
self.swHelpers = {
  // Cache management
  openCache,
  put,
  match,
  deleteOldCaches,

  // Caching strategies
  cacheFirst,
  networkFirst,
  staleWhileRevalidate,
  networkOnly,
  cacheOnly,

  // Utilities
  isCacheable,
  createCacheKey,
  logStrategy,
  getCacheStats,
};

console.log('[SW Helper] 🛠️ Service Worker helpers loaded');
