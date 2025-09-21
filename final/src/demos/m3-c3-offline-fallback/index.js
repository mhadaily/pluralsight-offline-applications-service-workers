// [DEMO: Module 3 – Clip 3 START]
/**
 * Offline Fallback Demo
 * Provides offline pages when network is unavailable
 */

console.log('[DEMO M3-C3] 📴 Offline fallback demo loaded');

// Install offline fallback resources
self.addEventListener('install', (event) => {
  console.log('[DEMO M3-C3] 🔧 Installing offline fallback resources');

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open('tp-offline-fallback-v1');
        await cache.addAll([
          '/offline.html',
          '/fallback-image.png',
          '/src/styles.css', // Ensure offline page is styled
        ]);

        console.log('[DEMO M3-C3] ✅ Offline fallback resources cached');
      } catch (error) {
        console.error(
          '[DEMO M3-C3] ❌ Failed to cache offline resources:',
          error
        );
      }
    })()
  );
});

// Handle fetch requests with offline fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle requests for our origin
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          console.log('[DEMO M3-C3] 🌐 Navigation request:', url.pathname);

          // Try to use preloadResponse first (navigation preload)
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            console.log('[DEMO M3-C3] ⚡ Using preload response');
            return preloadResponse;
          }

          // Fallback to regular fetch
          const networkResponse = await fetch(request);
          console.log('[DEMO M3-C3] ✅ Network response successful');
          return networkResponse;
        } catch (error) {
          console.log(
            '[DEMO M3-C3] 📴 Network failed, serving offline page:',
            error.message
          );

          // Serve offline fallback page
          const cache = await caches.open('tp-offline-fallback-v1');
          const offlinePage = await cache.match('/offline.html');

          if (offlinePage) {
            console.log('[DEMO M3-C3] 📄 Serving offline.html');
            return offlinePage;
          }

          // Last resort - create a basic offline response
          return new Response(
            `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Offline - Travel Planner</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: system-ui, sans-serif; 
                text-align: center; 
                padding: 2rem; 
                background: #f9fafb;
                color: #1f2937;
              }
              .container { 
                max-width: 400px; 
                margin: 2rem auto; 
                padding: 2rem; 
                background: white; 
                border-radius: 8px; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .icon { font-size: 4rem; margin-bottom: 1rem; }
              a { 
                display: inline-block; 
                margin-top: 1rem; 
                padding: 0.75rem 1.5rem; 
                background: #2563eb; 
                color: white; 
                text-decoration: none; 
                border-radius: 6px; 
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">✈️</div>
              <h1>You're Offline</h1>
              <p>Check your connection and try again.</p>
              <a href="/">Retry</a>
            </div>
          </body>
          </html>
        `,
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
          );
        }
      })()
    );

    return; // Important: return here to avoid falling through
  }

  // Handle image requests with fallback
  if (request.destination === 'image') {
    event.respondWith(
      (async () => {
        try {
          console.log('[DEMO M3-C3] 🖼️ Image request:', url.pathname);
          return await fetch(request);
        } catch (error) {
          console.log(
            '[DEMO M3-C3] 📴 Image failed, serving fallback:',
            error.message
          );

          // Try to serve fallback image
          const cache = await caches.open('tp-offline-fallback-v1');
          const fallbackImage = await cache.match('/fallback-image.png');

          if (fallbackImage) {
            console.log('[DEMO M3-C3] 🖼️ Serving fallback image');
            return fallbackImage;
          }

          // Create a simple SVG fallback
          const svgFallback = `
          <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f3f4f6"/>
            <text x="50%" y="50%" font-family="system-ui" font-size="14" 
                  text-anchor="middle" dy=".3em" fill="#6b7280">
              Image unavailable
            </text>
          </svg>
        `;

          return new Response(svgFallback, {
            status: 200,
            headers: {
              'Content-Type': 'image/svg+xml',
              'Cache-Control': 'no-cache',
            },
          });
        }
      })()
    );

    return;
  }

  // Handle API requests with meaningful offline responses
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        try {
          console.log('[DEMO M3-C3] 🔌 API request:', url.pathname);
          return await fetch(request);
        } catch (error) {
          console.log(
            '[DEMO M3-C3] 📴 API failed, serving offline response:',
            error.message
          );

          // Provide meaningful offline API responses
          let offlineData = {};

          if (url.pathname.includes('/deals')) {
            offlineData = {
              error: 'offline',
              message: 'Unable to fetch deals while offline',
              cached: true,
              data: [],
            };
          } else {
            offlineData = {
              error: 'offline',
              message: 'Service unavailable while offline',
              timestamp: Date.now(),
            };
          }

          return new Response(JSON.stringify(offlineData), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
              'Content-Type': 'application/json',
              'X-Offline': 'true',
            },
          });
        }
      })()
    );
  }
});

// Cleanup old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(
        (name) =>
          name.startsWith('tp-offline-fallback-') &&
          name !== 'tp-offline-fallback-v1'
      );

      if (oldCaches.length > 0) {
        console.log('[DEMO M3-C3] 🧹 Cleaning up old offline fallback caches');
        await Promise.all(oldCaches.map((name) => caches.delete(name)));
      }
    })()
  );
});

console.log('[DEMO M3-C3] 📴 Offline fallback demo ready');
// [DEMO: Module 3 – Clip 3 END]
