// [DEMO: Module 5 – Clip 1 START]
/**
 * DEMO: Background Synchronization
 *
 * This demo implements background sync functionality:
 * - Offline action queuing
 * - Background sync registration
 * - Sync event handling
 * - Retry mechanisms
 */

console.log('[DEMO M5-C1] 🔄 Background Sync demo loaded');

// Background sync queue management
const SYNC_QUEUE_STORE = 'bg-sync-queue';
const SYNC_TAG = 'demo-background-sync';

const addToSyncQueue = async (action, data) => {
  console.log('[DEMO M5-C1] ➕ Adding to sync queue:', action);

  // Store in IndexedDB for persistence
  const request = indexedDB.open('demo-sync-db', 1);

  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
      db.createObjectStore(SYNC_QUEUE_STORE, {
        keyPath: 'id',
        autoIncrement: true,
      });
    }
  };

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);

    store.add({
      action,
      data,
      timestamp: Date.now(),
      retries: 0,
    });

    console.log('[DEMO M5-C1] ✅ Added to sync queue');
    db.close();
  };
};

const processSyncQueue = async () => {
  console.log('[DEMO M5-C1] 🔄 Processing sync queue');

  const request = indexedDB.open('demo-sync-db', 1);

  request.onsuccess = async (event) => {
    const db = event.target.result;
    const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);

    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = async () => {
      const items = getAllRequest.result;
      console.log('[DEMO M5-C1] 📋 Found', items.length, 'items in sync queue');

      for (const item of items) {
        try {
          await processQueueItem(item);

          // Remove successful item
          store.delete(item.id);
          console.log('[DEMO M5-C1] ✅ Processed and removed:', item.action);
        } catch (error) {
          console.error(
            '[DEMO M5-C1] ❌ Failed to process:',
            item.action,
            error
          );

          // Update retry count
          item.retries = (item.retries || 0) + 1;

          if (item.retries < 3) {
            store.put(item);
            console.log('[DEMO M5-C1] 🔄 Retry count updated:', item.retries);
          } else {
            store.delete(item.id);
            console.log(
              '[DEMO M5-C1] ❌ Max retries reached, removing:',
              item.action
            );
          }
        }
      }

      db.close();
    };
  };
};

const processQueueItem = async (item) => {
  console.log('[DEMO M5-C1] ⚙️ Processing queue item:', item.action);

  switch (item.action) {
    case 'CREATE_IDEA':
      return fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      });

    case 'UPDATE_IDEA':
      return fetch(`/api/ideas/${item.data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      });

    case 'DELETE_IDEA':
      return fetch(`/api/ideas/${item.data.id}`, {
        method: 'DELETE',
      });

    default:
      console.log('[DEMO M5-C1] ⚠️ Unknown action:', item.action);
  }
};

// Background sync event handler
const DEMO_SYNC_HANDLER = (event) => {
  console.log('[DEMO M5-C1] 🔄 Background sync event:', event.tag);

  if (event.tag === SYNC_TAG) {
    event.waitUntil(
      processSyncQueue()
        .then(() => {
          console.log('[DEMO M5-C1] ✅ Background sync completed');

          // Notify clients
          return self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'BACKGROUND_SYNC_COMPLETE',
                demo: 'M5-C1',
                timestamp: Date.now(),
              });
            });
          });
        })
        .catch((error) => {
          console.error('[DEMO M5-C1] ❌ Background sync failed:', error);
        })
    );
  }
};

// Register background sync
const registerBackgroundSync = async () => {
  try {
    await self.registration.sync.register(SYNC_TAG);
    console.log('[DEMO M5-C1] ✅ Background sync registered');
  } catch (error) {
    console.error(
      '[DEMO M5-C1] ❌ Background sync registration failed:',
      error
    );
  }
};

// Message handler for manual sync operations
const DEMO_BG_SYNC_MESSAGE_HANDLER = (event) => {
  const { type, data } = event.data || {};

  if (type === 'QUEUE_FOR_SYNC') {
    console.log('[DEMO M5-C1] 📥 Received sync request:', data);

    addToSyncQueue(data.action, data.payload).then(() => {
      registerBackgroundSync();
    });
  }

  if (type === 'FORCE_SYNC') {
    console.log('[DEMO M5-C1] 🔄 Force sync requested');
    processSyncQueue();
  }
};

// Demo initialization
const initializeBackgroundSyncDemo = () => {
  console.log('[DEMO M5-C1] 🎬 Initializing background sync demo');

  // Add some demo sync items
  setTimeout(() => {
    addToSyncQueue('CREATE_IDEA', {
      text: 'Background sync demo idea',
      destination: 'Demo Land',
      priority: 'low',
    });

    registerBackgroundSync();
  }, 2000);
};

if (self.FEATURES?.M5_C1_BACKGROUND_SYNC) {
  console.log('[DEMO M5-C1] 🚀 Registering background sync demo handlers');

  self.addEventListener('sync', DEMO_SYNC_HANDLER);
  self.addEventListener('message', DEMO_BG_SYNC_MESSAGE_HANDLER);

  // Initialize demo
  initializeBackgroundSyncDemo();
}

self.M5_C1_DEMO = {
  addToSyncQueue,
  processSyncQueue,
  processQueueItem,
  registerBackgroundSync,
};

// [DEMO: Module 5 – Clip 1 END]
