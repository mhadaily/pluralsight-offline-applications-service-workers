// [DEMO: Module 2 – Clip 5 START]
/**
 * DEMO: Advanced IndexedDB Integration
 *
 * This demo shows real-world IndexedDB usage patterns:
 * - Complex data models with relationships
 * - Bulk operations and transactions
 * - Data synchronization patterns
 * - Performance optimization techniques
 * - Migration and versioning strategies
 */

console.log('[DEMO M2-C5] 💽 Advanced IndexedDB demo loaded');

// ========================================
// ADVANCED DATABASE SCHEMA
// ========================================

const ADVANCED_DB_NAME = 'demo-m2-c5-advanced-idb';
const ADVANCED_DB_VERSION = 2;

const ADVANCED_STORES = {
  trips: {
    name: 'trips',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'destination', keyPath: 'destination', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'startDate', keyPath: 'startDate', unique: false },
      { name: 'userId', keyPath: 'userId', unique: false },
    ],
  },
  bookings: {
    name: 'bookings',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'tripId', keyPath: 'tripId', unique: false },
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
    ],
  },
  syncQueue: {
    name: 'syncQueue',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'action', keyPath: 'action', unique: false },
      { name: 'timestamp', keyPath: 'timestamp', unique: false },
      { name: 'synced', keyPath: 'synced', unique: false },
    ],
  },
};

// ========================================
// DATABASE MANAGEMENT
// ========================================

const openAdvancedDatabase = () => {
  return new Promise((resolve, reject) => {
    console.log('[DEMO M2-C5] 🔌 Opening advanced database:', ADVANCED_DB_NAME);

    const request = indexedDB.open(ADVANCED_DB_NAME, ADVANCED_DB_VERSION);

    request.onerror = () => {
      console.error('[DEMO M2-C5] ❌ Database open failed:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[DEMO M2-C5] ✅ Advanced database opened');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;

      console.log(
        '[DEMO M2-C5] 🔄 Database upgrade from version',
        oldVersion,
        'to',
        ADVANCED_DB_VERSION
      );

      // Version 1 -> 2 migration
      if (oldVersion < 1) {
        createInitialSchema(db);
      }

      if (oldVersion < 2) {
        addVersionTwoFeatures(db);
      }
    };
  });
};

const createInitialSchema = (db) => {
  console.log('[DEMO M2-C5] 🏗️ Creating initial schema');

  Object.values(ADVANCED_STORES).forEach((storeConfig) => {
    if (!db.objectStoreNames.contains(storeConfig.name)) {
      const store = db.createObjectStore(storeConfig.name, {
        keyPath: storeConfig.keyPath,
        autoIncrement: storeConfig.autoIncrement,
      });

      storeConfig.indexes.forEach((index) => {
        store.createIndex(index.name, index.keyPath, { unique: index.unique });
      });

      console.log('[DEMO M2-C5] ✅ Created store:', storeConfig.name);
    }
  });
};

const addVersionTwoFeatures = (db) => {
  console.log('[DEMO M2-C5] 🆕 Adding version 2 features');

  // Add new indexes or modify existing stores
  if (db.objectStoreNames.contains('trips')) {
    const transaction = db.transaction(['trips'], 'versionchange');
    const store = transaction.objectStore('trips');

    // Add new index if it doesn't exist
    if (!store.indexNames.contains('budgetRange')) {
      store.createIndex('budgetRange', 'budget', { unique: false });
      console.log('[DEMO M2-C5] ➕ Added budgetRange index');
    }
  }
};

// ========================================
// BULK OPERATIONS
// ========================================

const bulkInsertTrips = async (trips) => {
  const db = await openAdvancedDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['trips'], 'readwrite');
    const store = transaction.objectStore('trips');

    const results = [];
    let completed = 0;

    trips.forEach((trip, index) => {
      const request = store.put({
        ...trip,
        id: trip.id || `trip-${Date.now()}-${index}`,
        createdAt: Date.now(),
        version: 1,
      });

      request.onsuccess = () => {
        results.push(request.result);
        completed++;

        if (completed === trips.length) {
          console.log(
            '[DEMO M2-C5] ✅ Bulk insert completed:',
            results.length,
            'trips'
          );
          resolve(results);
        }
      };

      request.onerror = () => {
        console.error(
          '[DEMO M2-C5] ❌ Bulk insert failed for trip:',
          trip,
          request.error
        );
        reject(request.error);
      };
    });

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      console.error(
        '[DEMO M2-C5] ❌ Bulk transaction failed:',
        transaction.error
      );
      reject(transaction.error);
    };
  });
};

const bulkUpdateTrips = async (updates) => {
  const db = await openAdvancedDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['trips'], 'readwrite');
    const store = transaction.objectStore('trips');

    const results = [];
    let completed = 0;

    updates.forEach(({ id, updates: tripUpdates }) => {
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existingTrip = getRequest.result;

        if (existingTrip) {
          const updatedTrip = {
            ...existingTrip,
            ...tripUpdates,
            updatedAt: Date.now(),
            version: (existingTrip.version || 1) + 1,
          };

          const putRequest = store.put(updatedTrip);

          putRequest.onsuccess = () => {
            results.push(updatedTrip);
            completed++;

            if (completed === updates.length) {
              console.log(
                '[DEMO M2-C5] ✅ Bulk update completed:',
                results.length,
                'trips'
              );
              resolve(results);
            }
          };
        } else {
          completed++;
          if (completed === updates.length) {
            resolve(results);
          }
        }
      };
    });

    transaction.oncomplete = () => db.close();
  });
};

// ========================================
// COMPLEX QUERIES
// ========================================

const getTripsWithBookings = async () => {
  const db = await openAdvancedDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['trips', 'bookings'], 'readonly');
    const tripsStore = transaction.objectStore('trips');
    const bookingsStore = transaction.objectStore('bookings');

    const results = [];

    tripsStore.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;

      if (cursor) {
        const trip = cursor.value;

        // Get bookings for this trip
        const bookingIndex = bookingsStore.index('tripId');
        const bookingRequest = bookingIndex.getAll(trip.id);

        bookingRequest.onsuccess = () => {
          results.push({
            ...trip,
            bookings: bookingRequest.result,
          });

          cursor.continue();
        };
      } else {
        console.log(
          '[DEMO M2-C5] ✅ Complex query completed:',
          results.length,
          'trips with bookings'
        );
        resolve(results);
      }
    };

    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
};

// ========================================
// SYNC QUEUE MANAGEMENT
// ========================================

const addToSyncQueue = async (action, data) => {
  const db = await openAdvancedDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    const syncItem = {
      action,
      data,
      timestamp: Date.now(),
      synced: false,
      retries: 0,
    };

    const request = store.add(syncItem);

    request.onsuccess = () => {
      console.log('[DEMO M2-C5] ➕ Added to sync queue:', action);
      resolve({ ...syncItem, id: request.result });
    };

    request.onerror = () => {
      console.error(
        '[DEMO M2-C5] ❌ Failed to add to sync queue:',
        request.error
      );
      reject(request.error);
    };

    transaction.oncomplete = () => db.close();
  });
};

const getPendingSyncItems = async () => {
  const db = await openAdvancedDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const index = store.index('synced');
    const request = index.getAll(false);

    request.onsuccess = () => {
      console.log('[DEMO M2-C5] 📋 Pending sync items:', request.result.length);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('[DEMO M2-C5] ❌ Failed to get sync items:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => db.close();
  });
};

const markSyncItemCompleted = async (id) => {
  const db = await openAdvancedDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');

    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const item = getRequest.result;

      if (item) {
        const updatedItem = {
          ...item,
          synced: true,
          syncedAt: Date.now(),
        };

        const putRequest = store.put(updatedItem);

        putRequest.onsuccess = () => {
          console.log('[DEMO M2-C5] ✅ Sync item marked as completed:', id);
          resolve(updatedItem);
        };

        putRequest.onerror = () => reject(putRequest.error);
      } else {
        reject(new Error(`Sync item ${id} not found`));
      }
    };

    getRequest.onerror = () => reject(getRequest.error);

    transaction.oncomplete = () => db.close();
  });
};

// ========================================
// PERFORMANCE OPTIMIZATION
// ========================================

const performanceOptimizedQuery = async (filters = {}) => {
  const db = await openAdvancedDatabase();
  const startTime = performance.now();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['trips'], 'readonly');
    const store = transaction.objectStore('trips');

    let request;

    // Use appropriate index based on filters
    if (filters.destination) {
      const index = store.index('destination');
      request = index.getAll(filters.destination);
    } else if (filters.status) {
      const index = store.index('status');
      request = index.getAll(filters.status);
    } else if (filters.startDate) {
      const index = store.index('startDate');
      request = index.getAll(filters.startDate);
    } else {
      request = store.getAll();
    }

    request.onsuccess = () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(
        '[DEMO M2-C5] ⚡ Optimized query completed in',
        Math.round(duration),
        'ms'
      );
      console.log('[DEMO M2-C5] 📊 Results:', request.result.length, 'items');

      resolve({
        results: request.result,
        performance: {
          duration: Math.round(duration),
          itemCount: request.result.length,
          filters,
        },
      });
    };

    request.onerror = () => {
      console.error('[DEMO M2-C5] ❌ Optimized query failed:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => db.close();
  });
};

// ========================================
// DEMO DATA AND EXECUTION
// ========================================

const generateAdvancedSampleData = async () => {
  console.log('[DEMO M2-C5] 🎭 Generating advanced sample data');

  const sampleTrips = [
    {
      id: 'trip-001',
      destination: 'Paris',
      status: 'planned',
      startDate: '2025-06-15',
      endDate: '2025-06-22',
      budget: 2500,
      userId: 'user-001',
    },
    {
      id: 'trip-002',
      destination: 'Tokyo',
      status: 'booked',
      startDate: '2025-08-10',
      endDate: '2025-08-20',
      budget: 3500,
      userId: 'user-001',
    },
    {
      id: 'trip-003',
      destination: 'New York',
      status: 'completed',
      startDate: '2025-03-01',
      endDate: '2025-03-07',
      budget: 2000,
      userId: 'user-002',
    },
  ];

  const sampleBookings = [
    {
      id: 'booking-001',
      tripId: 'trip-001',
      type: 'flight',
      status: 'pending',
    },
    {
      id: 'booking-002',
      tripId: 'trip-001',
      type: 'hotel',
      status: 'confirmed',
    },
    {
      id: 'booking-003',
      tripId: 'trip-002',
      type: 'flight',
      status: 'confirmed',
    },
    {
      id: 'booking-004',
      tripId: 'trip-002',
      type: 'hotel',
      status: 'confirmed',
    },
  ];

  try {
    // Insert trips
    const trips = await bulkInsertTrips(sampleTrips);
    console.log('[DEMO M2-C5] ✅ Created trips:', trips.length);

    // Insert bookings
    const db = await openAdvancedDatabase();
    const transaction = db.transaction(['bookings'], 'readwrite');
    const store = transaction.objectStore('bookings');

    for (const booking of sampleBookings) {
      await new Promise((resolve) => {
        const request = store.put(booking);
        request.onsuccess = () => resolve();
      });
    }

    db.close();
    console.log('[DEMO M2-C5] ✅ Created bookings:', sampleBookings.length);

    return { trips, bookings: sampleBookings };
  } catch (error) {
    console.error('[DEMO M2-C5] ❌ Failed to generate sample data:', error);
    throw error;
  }
};

const runAdvancedDemo = async () => {
  console.log('[DEMO M2-C5] 🚀 Running advanced IndexedDB demo');

  try {
    // 1. Generate sample data
    await generateAdvancedSampleData();

    // 2. Test complex queries
    const tripsWithBookings = await getTripsWithBookings();
    console.log('[DEMO M2-C5] 🔗 Trips with bookings:', tripsWithBookings);

    // 3. Test performance optimized queries
    const parisTrips = await performanceOptimizedQuery({
      destination: 'Paris',
    });
    console.log('[DEMO M2-C5] 🗼 Paris trips:', parisTrips);

    // 4. Test sync queue
    await addToSyncQueue('CREATE_TRIP', { destination: 'London' });
    await addToSyncQueue('UPDATE_BOOKING', {
      bookingId: 'booking-001',
      status: 'confirmed',
    });

    const pendingItems = await getPendingSyncItems();
    console.log('[DEMO M2-C5] ⏳ Pending sync items:', pendingItems);

    // 5. Test bulk updates
    const updates = [
      { id: 'trip-001', updates: { status: 'confirmed', updatedBy: 'demo' } },
      { id: 'trip-002', updates: { budget: 4000, updatedBy: 'demo' } },
    ];

    await bulkUpdateTrips(updates);
    console.log('[DEMO M2-C5] ✅ Bulk updates completed');

    console.log('[DEMO M2-C5] ✅ Advanced IndexedDB demo completed');
  } catch (error) {
    console.error('[DEMO M2-C5] ❌ Advanced demo failed:', error);
  }
};

// ========================================
// EVENT REGISTRATION
// ========================================

// Only register handlers if this demo is enabled
if (self.FEATURES?.M2_C5_INDEXEDDB_DEMO) {
  console.log('[DEMO M2-C5] 🚀 Registering advanced IndexedDB demo handlers');

  // Auto-run demo after delay
  setTimeout(() => {
    runAdvancedDemo();
  }, 4000);
} else {
  console.log(
    '[DEMO M2-C5] ⏸️ Demo loaded but not enabled (set FEATURES.M2_C5_INDEXEDDB_DEMO = true)'
  );
}

// Export for testing
self.M2_C5_DEMO = {
  openAdvancedDatabase,
  bulkInsertTrips,
  bulkUpdateTrips,
  getTripsWithBookings,
  addToSyncQueue,
  getPendingSyncItems,
  markSyncItemCompleted,
  performanceOptimizedQuery,
  runAdvancedDemo,
};

// [DEMO: Module 2 – Clip 5 END]
