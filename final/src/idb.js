/**
 * IndexedDB Helper Functions
 * Database operations for travel ideas and offline storage
 */

import { CONFIG } from './config.js';

let dbInstance = null;

/**
 * Open IndexedDB database
 * @param {string} name - Database name
 * @param {number} version - Database version
 * @param {Object} options - Options with onUpgrade callback
 * @returns {Promise<IDBDatabase>} Database instance
 */
export async function openDB(
  name = CONFIG.IDB_NAME,
  version = CONFIG.IDB_VERSION,
  options = {}
) {
  return new Promise((resolve, reject) => {
    console.log(`[IDB] 🗄️ Opening database: ${name} v${version}`);

    const request = indexedDB.open(name, version);

    request.onerror = () => {
      console.error('[IDB] ❌ Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[IDB] ✅ Database opened successfully');
      const db = request.result;

      // Handle version change while app is open
      db.onversionchange = () => {
        console.log('[IDB] 🔄 Database version changed, closing...');
        db.close();
        window.location.reload();
      };

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      console.log('[IDB] 🔧 Database upgrade needed');
      const db = event.target.result;

      // Create ideas store if it doesn't exist
      if (!db.objectStoreNames.contains('ideas')) {
        console.log('[IDB] 📋 Creating ideas object store');
        const ideasStore = db.createObjectStore('ideas', {
          keyPath: 'id',
          autoIncrement: true,
        });

        // Create indexes
        ideasStore.createIndex('timestamp', 'timestamp', { unique: false });
        ideasStore.createIndex('text', 'text', { unique: false });

        console.log('[IDB] ✅ Ideas store created with indexes');
      }

      // Call custom upgrade handler if provided
      if (options.onUpgrade) {
        options.onUpgrade(db, event);
      }
    };
  });
}

/**
 * Get database instance (singleton pattern)
 * @returns {Promise<IDBDatabase>} Database instance
 */
async function getDB() {
  if (!dbInstance) {
    dbInstance = await openDB();
  }
  return dbInstance;
}

/**
 * Execute transaction with error handling
 * @param {string} storeName - Object store name
 * @param {string} mode - Transaction mode ('readonly' or 'readwrite')
 * @param {Function} callback - Transaction callback
 * @returns {Promise} Transaction result
 */
async function executeTransaction(storeName, mode, callback) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);

      transaction.onerror = () => {
        console.error(`[IDB] ❌ Transaction error:`, transaction.error);
        reject(transaction.error);
      };

      transaction.oncomplete = () => {
        console.log(`[IDB] ✅ Transaction completed: ${storeName} (${mode})`);
      };

      const result = await callback(store, transaction);
      resolve(result);
    } catch (error) {
      console.error(`[IDB] ❌ Transaction failed:`, error);
      reject(error);
    }
  });
}

// ========================================
// IDEAS STORE OPERATIONS
// ========================================

/**
 * Add a new travel idea
 * @param {string} text - Idea text
 * @returns {Promise<Object>} Added idea with generated ID
 */
export async function addIdea(text) {
  console.log('[IDB] ➕ Adding idea:', text);

  const idea = {
    text: text.trim(),
    timestamp: Date.now(),
    synced: false, // For background sync demos
  };

  return executeTransaction('ideas', 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.add(idea);

      request.onsuccess = () => {
        const addedIdea = { ...idea, id: request.result };
        console.log('[IDB] ✅ Idea added with ID:', request.result);
        resolve(addedIdea);
      };

      request.onerror = () => {
        console.error('[IDB] ❌ Failed to add idea:', request.error);
        reject(request.error);
      };
    });
  });
}

/**
 * Get all travel ideas
 * @param {Object} options - Query options
 * @param {string} options.orderBy - Field to order by ('timestamp' or 'text')
 * @param {string} options.direction - Order direction ('asc' or 'desc')
 * @param {number} options.limit - Maximum number of results
 * @returns {Promise<Array>} Array of ideas
 */
export async function getAllIdeas(options = {}) {
  console.log('[IDB] 📋 Getting all ideas');

  const { orderBy = 'timestamp', direction = 'desc', limit } = options;

  return executeTransaction('ideas', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      let request;

      if (orderBy === 'timestamp') {
        const index = store.index('timestamp');
        request = index.openCursor(
          null,
          direction === 'desc' ? 'prev' : 'next'
        );
      } else {
        request = store.openCursor();
      }

      const ideas = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor && (!limit || ideas.length < limit)) {
          ideas.push(cursor.value);
          cursor.continue();
        } else {
          console.log(`[IDB] ✅ Retrieved ${ideas.length} ideas`);
          resolve(ideas);
        }
      };

      request.onerror = () => {
        console.error('[IDB] ❌ Failed to get ideas:', request.error);
        reject(request.error);
      };
    });
  });
}

/**
 * Get idea by ID
 * @param {number} id - Idea ID
 * @returns {Promise<Object|null>} Idea or null if not found
 */
export async function getIdeaById(id) {
  console.log('[IDB] 🔍 Getting idea by ID:', id);

  return executeTransaction('ideas', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onsuccess = () => {
        const idea = request.result;
        console.log('[IDB] ✅ Idea retrieved:', idea ? 'found' : 'not found');
        resolve(idea || null);
      };

      request.onerror = () => {
        console.error('[IDB] ❌ Failed to get idea:', request.error);
        reject(request.error);
      };
    });
  });
}

/**
 * Update idea
 * @param {number} id - Idea ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated idea
 */
export async function updateIdea(id, updates) {
  console.log('[IDB] ✏️ Updating idea:', id, updates);

  return executeTransaction('ideas', 'readwrite', async (store) => {
    // Get existing idea
    const existingIdea = await new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });

    if (!existingIdea) {
      throw new Error(`Idea with ID ${id} not found`);
    }

    // Merge updates
    const updatedIdea = { ...existingIdea, ...updates };

    // Update in store
    return new Promise((resolve, reject) => {
      const request = store.put(updatedIdea);

      request.onsuccess = () => {
        console.log('[IDB] ✅ Idea updated');
        resolve(updatedIdea);
      };

      request.onerror = () => {
        console.error('[IDB] ❌ Failed to update idea:', request.error);
        reject(request.error);
      };
    });
  });
}

/**
 * Delete idea by ID
 * @param {number} id - Idea ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteIdea(id) {
  console.log('[IDB] 🗑️ Deleting idea:', id);

  return executeTransaction('ideas', 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('[IDB] ✅ Idea deleted');
        resolve(true);
      };

      request.onerror = () => {
        console.error('[IDB] ❌ Failed to delete idea:', request.error);
        reject(request.error);
      };
    });
  });
}

/**
 * Clear all ideas
 * @returns {Promise<boolean>} Success status
 */
export async function clearIdeas() {
  console.log('[IDB] 🧹 Clearing all ideas');

  return executeTransaction('ideas', 'readwrite', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[IDB] ✅ All ideas cleared');
        resolve(true);
      };

      request.onerror = () => {
        console.error('[IDB] ❌ Failed to clear ideas:', request.error);
        reject(request.error);
      };
    });
  });
}

/**
 * Search ideas by text
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching ideas
 */
export async function searchIdeas(query) {
  console.log('[IDB] 🔍 Searching ideas:', query);

  const allIdeas = await getAllIdeas();
  const searchQuery = query.toLowerCase();

  const matches = allIdeas.filter((idea) =>
    idea.text.toLowerCase().includes(searchQuery)
  );

  console.log(`[IDB] ✅ Found ${matches.length} matching ideas`);
  return matches;
}

/**
 * Get unsynced ideas (for background sync)
 * @returns {Promise<Array>} Unsynced ideas
 */
export async function getUnsyncedIdeas() {
  console.log('[IDB] 🔄 Getting unsynced ideas');

  return executeTransaction('ideas', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      const unsyncedIdeas = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          const idea = cursor.value;
          if (!idea.synced) {
            unsyncedIdeas.push(idea);
          }
          cursor.continue();
        } else {
          console.log(`[IDB] ✅ Found ${unsyncedIdeas.length} unsynced ideas`);
          resolve(unsyncedIdeas);
        }
      };

      request.onerror = () => {
        console.error('[IDB] ❌ Failed to get unsynced ideas:', request.error);
        reject(request.error);
      };
    });
  });
}

/**
 * Mark idea as synced
 * @param {number} id - Idea ID
 * @returns {Promise<boolean>} Success status
 */
export async function markIdeaSynced(id) {
  console.log('[IDB] ✅ Marking idea as synced:', id);

  try {
    await updateIdea(id, { synced: true });
    return true;
  } catch (error) {
    console.error('[IDB] ❌ Failed to mark idea as synced:', error);
    return false;
  }
}

// ========================================
// DATABASE UTILITIES
// ========================================

/**
 * Get database statistics
 * @returns {Promise<Object>} Database statistics
 */
export async function getDBStats() {
  console.log('[IDB] 📊 Getting database statistics');

  try {
    const ideas = await getAllIdeas();
    const unsyncedCount = ideas.filter((idea) => !idea.synced).length;

    return {
      totalIdeas: ideas.length,
      unsyncedIdeas: unsyncedCount,
      syncedIdeas: ideas.length - unsyncedCount,
      lastActivity:
        ideas.length > 0 ? Math.max(...ideas.map((i) => i.timestamp)) : null,
      dbName: CONFIG.IDB_NAME,
      dbVersion: CONFIG.IDB_VERSION,
    };
  } catch (error) {
    console.error('[IDB] ❌ Failed to get database stats:', error);
    return { error: error.message };
  }
}

/**
 * Export all data for backup
 * @returns {Promise<Object>} Exported data
 */
export async function exportData() {
  console.log('[IDB] 📤 Exporting data');

  try {
    const ideas = await getAllIdeas();

    return {
      version: '1.0',
      timestamp: Date.now(),
      data: {
        ideas,
      },
    };
  } catch (error) {
    console.error('[IDB] ❌ Failed to export data:', error);
    throw error;
  }
}

/**
 * Import data from backup
 * @param {Object} data - Data to import
 * @returns {Promise<boolean>} Success status
 */
export async function importData(data) {
  console.log('[IDB] 📥 Importing data');

  try {
    if (!data.data || !data.data.ideas) {
      throw new Error('Invalid data format');
    }

    // Clear existing data
    await clearIdeas();

    // Import ideas
    for (const idea of data.data.ideas) {
      // Remove ID to let auto-increment assign new ones
      const { id, ...ideaData } = idea;
      await addIdea(ideaData.text);
    }

    console.log(`[IDB] ✅ Imported ${data.data.ideas.length} ideas`);
    return true;
  } catch (error) {
    console.error('[IDB] ❌ Failed to import data:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export function closeDB() {
  if (dbInstance) {
    console.log('[IDB] 🔒 Closing database connection');
    dbInstance.close();
    dbInstance = null;
  }
}

// ========================================
// ERROR HANDLING
// ========================================

/**
 * Check if IndexedDB is supported
 * @returns {boolean} Support status
 */
export function isIndexedDBSupported() {
  return 'indexedDB' in window;
}

/**
 * Handle quota exceeded error
 * @param {Error} error - Error object
 */
export function handleQuotaError(error) {
  if (error.name === 'QuotaExceededError') {
    console.warn('[IDB] ⚠️ Storage quota exceeded');
    // Could implement cleanup logic here
    return true;
  }
  return false;
}

console.log('[IDB] 🗄️ IndexedDB helper module loaded');
