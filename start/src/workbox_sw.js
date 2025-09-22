importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js'
);

workbox.setConfig({
  debug: true,
});

self.skipWaiting();
workbox.core.clientsClaim();

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

workbox.routing.registerRoute(
  ({ request, url }) =>
    request.destination === 'image' ||
    /\.(?:png|jpg|jpeg|gif|webp|svg)$/.test(url.pathname),

  new workbox.strategies.CacheFirst({
    cacheName: 'tp-images-v1',
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  }),
  'GET'
);

workbox.routing.registerRoute(
  ({ url, request }) =>
    request.method === 'GET' &&
    url.origin === self.location.origin &&
    url.pathname.startsWith('/api/'),

  new workbox.strategies.NetworkFirst({
    cacheName: 'tp-api-v1',
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
        purgeOnQuotaError: true,
      }),
    ],
  }),
  'GET'
);

workbox.routing.registerRoute(
  ({ request, url }) =>
    request.mode === 'navigate' || url.pathname.endsWith('.html'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'tp-html-v1',
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      }),
    ],
  })
);
workbox.routing.setCatchHandler(async ({ event }) => {
    const req = event.request;
    const url = new URL(req.url);

    if (req?.mode === 'navigate' || url.pathname.endsWith('.html')) {
      return workbox.precaching.matchPrecache('offline.html');
    }
  return new Response('Offline (no fallback available for this request)', {
    status: 503,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
});
