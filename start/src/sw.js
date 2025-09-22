importScripts('/precache-manifest.js');

const HTML_CACHE = 'tp-html-cache-v1';
const STATIC_CACHE = 'tp-static-cache-v1';
const IMAGE_CACHE = 'tp-image-cache-v1';

const DB_NAME = 'tp-idb-demo';
const DB_VERSION = 1;
const STORE = 'kv';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putKV(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ key, value, timestamp: Date.now() });
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function getKV(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => {
      db.close();
      resolve(req.result);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

const SHELL_CACHE = 'app-shell-v2';
const SHELL_ASSETS = self.__WB_MANIFEST.map((entry) => entry.url);

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(SHELL_ASSETS);
    })()
  );

  //self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE]);
      const names = await caches.keys();
      await Promise.all(
        names

          .filter((n) => !keep.has(n))

          .map(
            (n) => (console.log('[AppShell] 🧹 delete', n), caches.delete(n))
          )
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/precache-manifest.js')) {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  if (url.pathname.endsWith('.html') || req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);

        try {
          const res = await fetch(req);

          if (res.ok) {
            cache.put(req, res.clone());
          }
          return res;
        } catch (err) {
          const hit = await cache.match(req);
          if (hit) return hit;

          const offline = await cache.match('/offline.html');
          return (
            offline || new Response('Offline (no cached page)', { status: 503 })
          );
        }
      })()
    );
    return;
  }

  if (['style', 'script', 'font'].includes(req.destination)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        const hit = await cache.match(req);

        if (hit) {
          return hit;
        }

        const res = await fetch(req);

        if (res && res.ok) {
          await cache.put(req, res.clone());
        }

        return res;
      })()
    );
    return;
  }

  if (req.destination === 'image') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(IMAGE_CACHE);
        const hit = await cache.match(req);

        event.waitUntil(
          (async () => {
            try {
              const res = await fetch(req);
              if (res.ok) {
                await cache.put(req, res.clone());
                console.log('[SW] 🔄 SWR updated:', req.url);
              }
            } catch {}
          })()
        );

        if (hit) {
          return hit;
        }

        try {
          const res = await fetch(req);
          if (res.ok) await cache.put(req, res.clone());
          return res;
        } catch {
          return new Response('', { status: 504 });
        }
      })()
    );
    return;
  }

  // ==== /api/deals interception ==============================================
  if (url.pathname.startsWith('/api/deals')) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);

          const clone = res.clone();

          event.waitUntil(
            (async () => {
              try {
                const data = await clone.json();
                await putKV('deals', data);
              } catch {}
            })()
          );

          return res;
        } catch (err) {
          const cached = await getKV('deals');

          if (cached?.value) {
            return new Response(JSON.stringify(cached.value), {
              status: 200,
              headers: { 'content-type': 'application/json; charset=utf-8' },
            });
          }

          return new Response(
            JSON.stringify({ offline: true, message: 'No cached deals' }),
            {
              status: 503,
              headers: { 'content-type': 'application/json; charset=utf-8' },
            }
          );
        }
      })()
    );
  }
});

self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      try {
        self.skipWaiting();
      } catch (err) {
        console.warn('[SW] ❌ skipWaiting() failed', err);
      }
      break;
  }
});

// self.registration.unregister().then((success) => {
//   if (success) {
//     console.log('[DEMO M3-C5] ✅ Service worker unregistered');

//     // Notify clients
//     self.clients.matchAll().then((clients) => {
//       clients.forEach((client) => {
//         client.postMessage({
//           type: 'SW_UNREGISTERED',
//           demo: 'M3-C5',
//           timestamp: Date.now(),
//         });
//       });
//     });

//     // clean all caches
//     caches.keys().then((keys) => {
//       keys.map((name) => {
//         console.log('[DEMO M3-C5] 🗑️ Deleting old cache:', name);
//         return caches.delete(name);
//       });
//     });
//   }
// });
