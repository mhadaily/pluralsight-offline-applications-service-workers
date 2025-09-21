// [DEMO: Module 1 – Clip 5 START]
/**
 * DEMO: Request Interception Techniques
 *
 * This demo shows advanced request interception patterns:
 * - Conditional request interception based on URL patterns
 * - Request modification and header manipulation
 * - Response transformation and synthesis
 * - Error handling and fallback strategies
 * - Performance monitoring and analytics
 */

console.log('[DEMO M1-C5] 🌐 Request Interception demo loaded');

// ========================================
// REQUEST ANALYSIS UTILITIES
// ========================================

const analyzeRequest = (request) => {
  const url = new URL(request.url);

  return {
    url: request.url,
    method: request.method,
    mode: request.mode,
    destination: request.destination,
    pathname: url.pathname,
    origin: url.origin,
    isAPI: url.pathname.startsWith('/api/'),
    isAsset: /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/i.test(
      url.pathname
    ),
    isHTML:
      request.destination === 'document' || url.pathname.endsWith('.html'),
    isSameOrigin: url.origin === self.location.origin,
    headers: Object.fromEntries(request.headers.entries()),
  };
};

const logRequest = (analysis, action = 'INTERCEPTED') => {
  console.log(`[DEMO M1-C5] 🔍 ${action}:`, {
    method: analysis.method,
    url: analysis.pathname,
    destination: analysis.destination,
    action,
  });
};

// ========================================
// REQUEST MODIFICATION STRATEGIES
// ========================================

const modifyAPIRequest = async (request) => {
  // Clone the request to modify it
  const url = new URL(request.url);

  // Add demo tracking parameters
  url.searchParams.set('demo', 'm1-c5');
  url.searchParams.set('intercepted', Date.now());

  // Create modified request with additional headers
  const modifiedRequest = new Request(url.toString(), {
    method: request.method,
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      'X-Demo-Interceptor': 'M1-C5',
      'X-Intercept-Time': new Date().toISOString(),
    },
    body: request.body,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
  });

  console.log('[DEMO M1-C5] 🔧 Modified API request:', url.toString());
  return modifiedRequest;
};

const synthesizeResponse = (request, data, status = 200) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Demo-Source': 'M1-C5-Synthesized',
    'X-Synthesis-Time': new Date().toISOString(),
  };

  const response = new Response(JSON.stringify(data), {
    status,
    statusText: status === 200 ? 'OK' : 'Demo Response',
    headers,
  });

  console.log('[DEMO M1-C5] 🧪 Synthesized response for:', request.url);
  return response;
};

// ========================================
// CACHING WITH INTERCEPTION
// ========================================

const handleWithCacheInterception = async (request) => {
  const analysis = analyzeRequest(request);
  const cacheName = 'intercept-demo-cache';

  try {
    // Check cache first
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[DEMO M1-C5] ⚡ Serving from cache:', analysis.pathname);

      // Add cache hit header
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Demo-Cache-Hit', 'true');
      headers.set(
        'X-Cache-Time',
        cachedResponse.headers.get('date') || 'unknown'
      );

      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers,
      });
    }

    // Fetch from network with modified request
    let fetchRequest = request;
    if (analysis.isAPI) {
      fetchRequest = await modifyAPIRequest(request);
    }

    const response = await fetch(fetchRequest);

    if (response.ok) {
      // Clone for caching
      const responseClone = response.clone();

      // Add interception headers
      const headers = new Headers(response.headers);
      headers.set('X-Demo-Intercepted', 'true');
      headers.set('X-Network-Time', new Date().toISOString());

      // Cache the response
      await cache.put(request, responseClone);
      console.log('[DEMO M1-C5] 💾 Cached response for:', analysis.pathname);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  } catch (error) {
    console.error('[DEMO M1-C5] ❌ Fetch failed:', error);

    // Return fallback response
    if (analysis.isAPI) {
      return synthesizeResponse(
        request,
        {
          error: 'Network error',
          demo: 'M1-C5',
          fallback: true,
          timestamp: Date.now(),
        },
        503
      );
    }

    throw error;
  }
};

// ========================================
// RESPONSE TRANSFORMATION
// ========================================

const transformHTMLResponse = async (response) => {
  const html = await response.text();

  // Inject demo indicator into HTML
  const transformedHTML = html
    .replace(
      '</head>',
      `
    <meta name="demo-interceptor" content="M1-C5">
    <style>
      .demo-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px;
        text-align: center;
        font-size: 12px;
        z-index: 10000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      body { margin-top: 40px !important; }
    </style>
    </head>`
    )
    .replace(
      '<body>',
      `<body>
    <div class="demo-banner">
      🔍 DEMO M1-C5: Request Interception Active - HTML Response Transformed
    </div>`
    );

  return new Response(transformedHTML, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'X-Demo-Transform': 'M1-C5-HTML',
      'Content-Type': 'text/html',
    },
  });
};

const transformJSONResponse = async (response) => {
  const data = await response.json();

  // Add demo metadata to JSON responses
  const transformedData = {
    ...data,
    _demo: {
      module: 'M1-C5',
      intercepted: true,
      timestamp: Date.now(),
      originalUrl: response.url,
    },
  };

  return new Response(JSON.stringify(transformedData, null, 2), {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'X-Demo-Transform': 'M1-C5-JSON',
      'Content-Type': 'application/json',
    },
  });
};

// ========================================
// PERFORMANCE MONITORING
// ========================================

const monitorRequestPerformance = (request, startTime) => {
  const endTime = performance.now();
  const duration = endTime - startTime;
  const analysis = analyzeRequest(request);

  // Store performance data
  if (!self.M1_C5_PERFORMANCE) {
    self.M1_C5_PERFORMANCE = [];
  }

  const perfData = {
    url: analysis.pathname,
    method: analysis.method,
    destination: analysis.destination,
    duration: Math.round(duration),
    timestamp: Date.now(),
    isAPI: analysis.isAPI,
    isAsset: analysis.isAsset,
  };

  self.M1_C5_PERFORMANCE.push(perfData);

  // Keep only last 100 entries
  if (self.M1_C5_PERFORMANCE.length > 100) {
    self.M1_C5_PERFORMANCE = self.M1_C5_PERFORMANCE.slice(-100);
  }

  console.log('[DEMO M1-C5] ⏱️ Request performance:', perfData);

  return perfData;
};

// ========================================
// MAIN FETCH HANDLER
// ========================================

const DEMO_FETCH_HANDLER = (event) => {
  const analysis = analyzeRequest(event.request);

  // Skip non-same-origin requests and browser-specific requests
  if (
    !analysis.isSameOrigin ||
    event.request.url.includes('chrome-extension')
  ) {
    return;
  }

  logRequest(analysis);
  const startTime = performance.now();

  event.respondWith(
    (async () => {
      try {
        let response;

        // Route based on request type
        if (analysis.isAPI) {
          // Handle API requests with caching and modification
          response = await handleWithCacheInterception(event.request);

          // Transform JSON responses
          if (
            response.headers.get('content-type')?.includes('application/json')
          ) {
            response = await transformJSONResponse(response);
          }
        } else if (analysis.isHTML) {
          // Handle HTML requests with transformation
          response = await fetch(event.request);

          if (
            response.ok &&
            response.headers.get('content-type')?.includes('text/html')
          ) {
            response = await transformHTMLResponse(response);
          }
        } else if (analysis.isAsset) {
          // Handle assets with simple caching
          response = await handleWithCacheInterception(event.request);
        } else {
          // Pass through other requests
          response = await fetch(event.request);
          logRequest(analysis, 'PASSTHROUGH');
        }

        // Monitor performance
        monitorRequestPerformance(event.request, startTime);

        return response;
      } catch (error) {
        console.error('[DEMO M1-C5] ❌ Request handling failed:', error);

        // Return fallback for failed requests
        if (analysis.isAPI) {
          return synthesizeResponse(
            event.request,
            {
              error: 'Request failed',
              demo: 'M1-C5',
              details: error.message,
              timestamp: Date.now(),
            },
            500
          );
        }

        throw error;
      }
    })()
  );
};

// ========================================
// MESSAGE HANDLING
// ========================================

const DEMO_MESSAGE_HANDLER = (event) => {
  const { type } = event.data || {};

  if (type === 'GET_INTERCEPT_STATS') {
    console.log('[DEMO M1-C5] 📊 Intercept stats requested');

    const stats = {
      demo: 'M1-C5',
      totalRequests: self.M1_C5_PERFORMANCE?.length || 0,
      averageResponseTime:
        self.M1_C5_PERFORMANCE?.length > 0
          ? Math.round(
              self.M1_C5_PERFORMANCE.reduce(
                (sum, req) => sum + req.duration,
                0
              ) / self.M1_C5_PERFORMANCE.length
            )
          : 0,
      apiRequests:
        self.M1_C5_PERFORMANCE?.filter((req) => req.isAPI).length || 0,
      assetRequests:
        self.M1_C5_PERFORMANCE?.filter((req) => req.isAsset).length || 0,
      recentRequests: self.M1_C5_PERFORMANCE?.slice(-10) || [],
    };

    event.ports[0]?.postMessage({
      type: 'INTERCEPT_STATS',
      data: stats,
    });
  }

  if (type === 'CLEAR_INTERCEPT_CACHE') {
    console.log('[DEMO M1-C5] 🧹 Clearing intercept cache');

    caches.delete('intercept-demo-cache').then(() => {
      self.M1_C5_PERFORMANCE = [];
      console.log('[DEMO M1-C5] ✅ Intercept cache cleared');
    });
  }
};

// ========================================
// EVENT REGISTRATION
// ========================================

// Only register handlers if this demo is enabled
if (self.FEATURES?.M1_C5_INTERCEPT) {
  console.log('[DEMO M1-C5] 🚀 Registering request interception handlers');

  self.addEventListener('fetch', DEMO_FETCH_HANDLER);
  self.addEventListener('message', DEMO_MESSAGE_HANDLER);

  // Initialize performance tracking
  self.M1_C5_PERFORMANCE = [];
} else {
  console.log(
    '[DEMO M1-C5] ⏸️ Demo loaded but not enabled (set FEATURES.M1_C5_INTERCEPT = true)'
  );
}

// Export for testing
self.M1_C5_DEMO = {
  fetchHandler: DEMO_FETCH_HANDLER,
  messageHandler: DEMO_MESSAGE_HANDLER,
  analyzeRequest,
  monitorRequestPerformance,
};

// [DEMO: Module 1 – Clip 5 END]
