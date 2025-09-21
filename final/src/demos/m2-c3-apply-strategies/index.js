// [DEMO: Module 2 – Clip 3 START]
/**
 * Apply Caching Strategies Demo
 * Demonstrates different caching strategies for different resource types
 */

console.log('[DEMO M2-C3] 🎯 Caching strategies demo loaded');

// Import helper functions
const { cacheFirst, networkFirst, staleWhileRevalidate } = self.swHelpers || {};

// Check if helper functions are available
if (!cacheFirst || !networkFirst || !staleWhileRevalidate) {
  console.warn(
    '[DEMO M2-C3] ⚠️ SW helpers not available, using simplified implementations'
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle requests for our origin
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  console.log('[DEMO M2-C3] 🎯 Applying caching strategy for:', url.pathname);

  // Navigation requests - Network First
  if (request.mode === 'navigate') {
    console.log('[DEMO M2-C3] 🌐 Navigation: Network First strategy');
    event.respondWith(
      networkFirst
        ? networkFirst(request, self.CACHE_NAMES?.HTML_CACHE || 'tp-html-cache')
        : handleNetworkFirst(
            request,
            self.CACHE_NAMES?.HTML_CACHE || 'tp-html-cache'
          )
    );
    return;
  }

  // Static assets (CSS, JS, fonts) - Cache First
  if (['style', 'script', 'font'].includes(request.destination)) {
    console.log('[DEMO M2-C3] 📦 Static asset: Cache First strategy');
    event.respondWith(
      cacheFirst
        ? cacheFirst(
            request,
            self.CACHE_NAMES?.STATIC_CACHE || 'tp-static-cache'
          )
        : handleCacheFirst(
            request,
            self.CACHE_NAMES?.STATIC_CACHE || 'tp-static-cache'
          )
    );
    return;
  }

  // Images - Stale While Revalidate
  if (request.destination === 'image') {
    console.log('[DEMO M2-C3] 🖼️ Image: Stale While Revalidate strategy');
    event.respondWith(
      staleWhileRevalidate
        ? staleWhileRevalidate(
            request,
            self.CACHE_NAMES?.IMAGE_CACHE || 'tp-image-cache'
          )
        : handleStaleWhileRevalidate(
            request,
            self.CACHE_NAMES?.IMAGE_CACHE || 'tp-image-cache'
          )
    );
    return;
  }

  // API requests - Network First with shorter timeout
  if (url.pathname.startsWith('/api/')) {
    console.log('[DEMO M2-C3] 🔌 API: Network First strategy (fast timeout)');
    event.respondWith(
      networkFirst
        ? networkFirst(
            request,
            self.CACHE_NAMES?.API_CACHE || 'tp-api-cache',
            1500
          )
        : handleNetworkFirst(
            request,
            self.CACHE_NAMES?.API_CACHE || 'tp-api-cache',
            1500
          )
    );
    return;
  }

  // Other resources - Stale While Revalidate
  console.log('[DEMO M2-C3] 🔄 Other: Stale While Revalidate strategy');
  event.respondWith(
    staleWhileRevalidate
      ? staleWhileRevalidate(
          request,
          self.CACHE_NAMES?.MISC_CACHE || 'tp-misc-cache'
        )
      : handleStaleWhileRevalidate(
          request,
          self.CACHE_NAMES?.MISC_CACHE || 'tp-misc-cache'
        )
  );
});

// Simplified strategy implementations (fallback when helpers not available)

async function handleCacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[DEMO M2-C3] 💾 Cache hit:', request.url);
      return cachedResponse;
    }

    console.log('[DEMO M2-C3] 🌐 Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('[DEMO M2-C3] 📦 Cached response:', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.error('[DEMO M2-C3] ❌ Cache first failed:', error);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    return (
      cachedResponse || new Response('Cache first failed', { status: 503 })
    );
  }
}

async function handleNetworkFirst(request, cacheName, timeout = 3000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const networkResponse = await fetch(request, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log('[DEMO M2-C3] 🌐 Network success, cached:', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.log('[DEMO M2-C3] 📴 Network failed, trying cache:', error.message);

    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[DEMO M2-C3] 💾 Serving from cache:', request.url);
      return cachedResponse;
    }

    return new Response('Network and cache failed', { status: 503 });
  }
}

async function handleStaleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Start network request in background
  const networkPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        console.log('[DEMO M2-C3] 🔄 Background cache update:', request.url);
      }
      return networkResponse;
    })
    .catch((error) => {
      console.error('[DEMO M2-C3] ❌ Background fetch failed:', error);
    });

  // Return cached response immediately if available
  if (cachedResponse) {
    console.log('[DEMO M2-C3] ⚡ Serving stale from cache:', request.url);
    return cachedResponse;
  }

  // Otherwise wait for network
  console.log('[DEMO M2-C3] ⏳ No cache, waiting for network:', request.url);
  try {
    return await networkPromise;
  } catch (error) {
    return new Response('Stale while revalidate failed', { status: 503 });
  }
}

console.log('[DEMO M2-C3] 🎯 Caching strategies demo ready');
// [DEMO: Module 2 – Clip 3 END]
