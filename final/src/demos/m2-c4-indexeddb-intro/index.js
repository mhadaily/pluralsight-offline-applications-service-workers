// [DEMO: Module 2 – Clip 4 START]
/**
 * DEMO: IndexedDB Introduction
 *
 * This demo introduces IndexedDB fundamentals:
 * - Database creation and versioning
 * - Object store management
 * - Transaction handling
 * - Basic CRUD operations
 * - Error handling patterns
 */

console.log('[DEMO M2-C4] 💽 IndexedDB Introduction demo loaded');

// ========================================
// DATABASE CONFIGURATION
// ========================================

const DEMO_DB_NAME = 'demo-m2-c4-idb';
const DEMO_DB_VERSION = 1;

const OBJECT_STORES = {
  todos: {
    name: 'todos',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'completed', keyPath: 'completed', unique: false },
      { name: 'priority', keyPath: 'priority', unique: false },
      { name: 'created', keyPath: 'createdAt', unique: false },
    ],
  },
  settings: {
    name: 'settings',
    keyPath: 'key',
    autoIncrement: false,
    indexes: [],
  },
};

// ========================================
// DATABASE UTILITIES
// ========================================

const openDemoDatabase = () => {
  return new Promise((resolve, reject) => {
    console.log('[DEMO M2-C4] 🔌 Opening IndexedDB database:', DEMO_DB_NAME);

    const request = indexedDB.open(DEMO_DB_NAME, DEMO_DB_VERSION);

    request.onerror = () => {
      console.error('[DEMO M2-C4] ❌ Database open failed:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[DEMO M2-C4] ✅ Database opened successfully');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      console.log('[DEMO M2-C4] 🔄 Database upgrade needed');
      const db = event.target.result;

      // Create object stores
      Object.values(OBJECT_STORES).forEach((storeConfig) => {
        if (!db.objectStoreNames.contains(storeConfig.name)) {
          console.log(
            '[DEMO M2-C4] 📦 Creating object store:',
            storeConfig.name
          );

          const store = db.createObjectStore(storeConfig.name, {
            keyPath: storeConfig.keyPath,
            autoIncrement: storeConfig.autoIncrement,
          });

          // Create indexes
          storeConfig.indexes.forEach((index) => {
            console.log('[DEMO M2-C4] 🏷️ Creating index:', index.name);
            store.createIndex(index.name, index.keyPath, {
              unique: index.unique,
            });
          });
        }
      });

      console.log('[DEMO M2-C4] ✅ Database schema updated');
    };
  });
};

// ========================================
// CRUD OPERATIONS
// ========================================

const addTodo = async (todo) => {
  const db = await openDemoDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['todos'], 'readwrite');
    const store = transaction.objectStore('todos');

    const todoItem = {
      ...todo,
      id: undefined, // Let auto-increment handle this
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const request = store.add(todoItem);

    request.onsuccess = () => {
      console.log('[DEMO M2-C4] ✅ Todo added with ID:', request.result);
      resolve({ ...todoItem, id: request.result });
    };

    request.onerror = () => {
      console.error('[DEMO M2-C4] ❌ Failed to add todo:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => db.close();
  });
};

const getTodo = async (id) => {
  const db = await openDemoDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['todos'], 'readonly');
    const store = transaction.objectStore('todos');
    const request = store.get(id);

    request.onsuccess = () => {
      console.log('[DEMO M2-C4] 📖 Retrieved todo:', request.result);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('[DEMO M2-C4] ❌ Failed to get todo:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => db.close();
  });
};

const getAllTodos = async () => {
  const db = await openDemoDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['todos'], 'readonly');
    const store = transaction.objectStore('todos');
    const request = store.getAll();

    request.onsuccess = () => {
      console.log(
        '[DEMO M2-C4] 📚 Retrieved all todos:',
        request.result.length,
        'items'
      );
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('[DEMO M2-C4] ❌ Failed to get all todos:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => db.close();
  });
};

const updateTodo = async (id, updates) => {
  const db = await openDemoDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['todos'], 'readwrite');
    const store = transaction.objectStore('todos');

    // First get the existing todo
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const existingTodo = getRequest.result;

      if (!existingTodo) {
        reject(new Error(`Todo with ID ${id} not found`));
        return;
      }

      const updatedTodo = {
        ...existingTodo,
        ...updates,
        updatedAt: Date.now(),
      };

      const putRequest = store.put(updatedTodo);

      putRequest.onsuccess = () => {
        console.log('[DEMO M2-C4] ✅ Todo updated:', id);
        resolve(updatedTodo);
      };

      putRequest.onerror = () => {
        console.error(
          '[DEMO M2-C4] ❌ Failed to update todo:',
          putRequest.error
        );
        reject(putRequest.error);
      };
    };

    getRequest.onerror = () => {
      console.error(
        '[DEMO M2-C4] ❌ Failed to get todo for update:',
        getRequest.error
      );
      reject(getRequest.error);
    };

    transaction.oncomplete = () => db.close();
  });
};

const deleteTodo = async (id) => {
  const db = await openDemoDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['todos'], 'readwrite');
    const store = transaction.objectStore('todos');
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log('[DEMO M2-C4] 🗑️ Todo deleted:', id);
      resolve(true);
    };

    request.onerror = () => {
      console.error('[DEMO M2-C4] ❌ Failed to delete todo:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => db.close();
  });
};

// ========================================
// INDEX QUERIES
// ========================================

const getTodosByCompleted = async (completed = true) => {
  const db = await openDemoDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['todos'], 'readonly');
    const store = transaction.objectStore('todos');
    const index = store.index('completed');
    const request = index.getAll(completed);

    request.onsuccess = () => {
      console.log(
        '[DEMO M2-C4] 🔍 Todos by completed status:',
        request.result.length
      );
      resolve(request.result);
    };

    request.onerror = () => {
      console.error(
        '[DEMO M2-C4] ❌ Failed to query by completed:',
        request.error
      );
      reject(request.error);
    };

    transaction.oncomplete = () => db.close();
  });
};

const getTodosByPriority = async (priority) => {
  const db = await openDemoDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['todos'], 'readonly');
    const store = transaction.objectStore('todos');
    const index = store.index('priority');
    const request = index.getAll(priority);

    request.onsuccess = () => {
      console.log('[DEMO M2-C4] 🔍 Todos by priority:', request.result.length);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error(
        '[DEMO M2-C4] ❌ Failed to query by priority:',
        request.error
      );
      reject(request.error);
    };

    transaction.oncomplete = () => db.close();
  });
};

// ========================================
// CURSOR OPERATIONS
// ========================================

const getAllTodosWithCursor = async () => {
  const db = await openDemoDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['todos'], 'readonly');
    const store = transaction.objectStore('todos');
    const request = store.openCursor();

    const todos = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;

      if (cursor) {
        console.log('[DEMO M2-C4] 👆 Cursor at:', cursor.key, cursor.value);
        todos.push(cursor.value);
        cursor.continue();
      } else {
        console.log(
          '[DEMO M2-C4] ✅ Cursor iteration complete:',
          todos.length,
          'items'
        );
        resolve(todos);
      }
    };

    request.onerror = () => {
      console.error('[DEMO M2-C4] ❌ Cursor operation failed:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => db.close();
  });
};

// ========================================
// DEMO DATA GENERATION
// ========================================

const generateSampleTodos = async () => {
  const sampleTodos = [
    { text: 'Learn IndexedDB basics', completed: false, priority: 'high' },
    { text: 'Build offline todo app', completed: false, priority: 'medium' },
    { text: 'Test database operations', completed: true, priority: 'low' },
    { text: 'Implement error handling', completed: false, priority: 'high' },
    { text: 'Add cursor operations', completed: true, priority: 'medium' },
  ];

  console.log('[DEMO M2-C4] 🎭 Generating sample todos');

  const createdTodos = [];
  for (const todo of sampleTodos) {
    try {
      const created = await addTodo(todo);
      createdTodos.push(created);
    } catch (error) {
      console.error('[DEMO M2-C4] ❌ Failed to create sample todo:', error);
    }
  }

  return createdTodos;
};

// ========================================
// COMPLETE DEMO
// ========================================

const runIndexedDBDemo = async () => {
  console.log('[DEMO M2-C4] 🚀 Running IndexedDB demo');

  try {
    // 1. Clear existing data (if any)
    await clearDemoData();

    // 2. Generate sample data
    const todos = await generateSampleTodos();
    console.log('[DEMO M2-C4] ✅ Created', todos.length, 'sample todos');

    // 3. Demonstrate retrieval
    const allTodos = await getAllTodos();
    console.log('[DEMO M2-C4] 📚 Retrieved all todos:', allTodos);

    // 4. Test index queries
    const completedTodos = await getTodosByCompleted(true);
    console.log('[DEMO M2-C4] ✅ Completed todos:', completedTodos);

    const highPriorityTodos = await getTodosByPriority('high');
    console.log('[DEMO M2-C4] 🔴 High priority todos:', highPriorityTodos);

    // 5. Test cursor operations
    const todosViaCursor = await getAllTodosWithCursor();
    console.log('[DEMO M2-C4] 👆 Todos via cursor:', todosViaCursor.length);

    // 6. Test updates
    if (todos.length > 0) {
      const updated = await updateTodo(todos[0].id, {
        text: 'Updated: Learn IndexedDB basics',
        completed: true,
      });
      console.log('[DEMO M2-C4] ✏️ Updated todo:', updated);
    }

    // 7. Test deletion
    if (todos.length > 1) {
      await deleteTodo(todos[1].id);
      console.log('[DEMO M2-C4] 🗑️ Deleted todo:', todos[1].id);
    }

    // 8. Final state
    const finalTodos = await getAllTodos();
    console.log('[DEMO M2-C4] 🏁 Final todos count:', finalTodos.length);

    console.log('[DEMO M2-C4] ✅ IndexedDB demo completed successfully');
    return finalTodos;
  } catch (error) {
    console.error('[DEMO M2-C4] ❌ IndexedDB demo failed:', error);
    throw error;
  }
};

const clearDemoData = async () => {
  try {
    const db = await openDemoDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['todos'], 'readwrite');
      const store = transaction.objectStore('todos');
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[DEMO M2-C4] 🧹 Demo data cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('[DEMO M2-C4] ❌ Failed to clear data:', request.error);
        reject(request.error);
      };

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.warn('[DEMO M2-C4] ⚠️ Clear data failed:', error);
  }
};

// ========================================
// MESSAGE HANDLING
// ========================================

const DEMO_MESSAGE_HANDLER = (event) => {
  const { type, data } = event.data || {};

  if (type === 'RUN_INDEXEDDB_DEMO') {
    console.log('[DEMO M2-C4] 🎬 IndexedDB demo requested');
    runIndexedDBDemo();
  }

  if (type === 'GET_DEMO_TODOS') {
    console.log('[DEMO M2-C4] 📚 Demo todos requested');

    getAllTodos()
      .then((todos) => {
        event.ports[0]?.postMessage({
          type: 'DEMO_TODOS',
          data: todos,
        });
      })
      .catch((error) => {
        event.ports[0]?.postMessage({
          type: 'DEMO_ERROR',
          error: error.message,
        });
      });
  }

  if (type === 'CLEAR_DEMO_DATA') {
    console.log('[DEMO M2-C4] 🧹 Clear demo data requested');
    clearDemoData();
  }
};

// ========================================
// AUTO-INITIALIZATION
// ========================================

const initializeIndexedDBDemo = async () => {
  console.log('[DEMO M2-C4] 🎬 Initializing IndexedDB demo');

  // Auto-run demo after a delay
  setTimeout(() => {
    if (self.FEATURES?.M2_C4_INDEXEDDB_INTRO) {
      runIndexedDBDemo();
    }
  }, 3000);
};

// ========================================
// EVENT REGISTRATION
// ========================================

// Only register handlers if this demo is enabled
if (self.FEATURES?.M2_C4_INDEXEDDB_INTRO) {
  console.log('[DEMO M2-C4] 🚀 Registering IndexedDB demo handlers');

  self.addEventListener('message', DEMO_MESSAGE_HANDLER);

  // Initialize demo
  initializeIndexedDBDemo();
} else {
  console.log(
    '[DEMO M2-C4] ⏸️ Demo loaded but not enabled (set FEATURES.M2_C4_INDEXEDDB_INTRO = true)'
  );
}

// Export for testing
self.M2_C4_DEMO = {
  openDemoDatabase,
  addTodo,
  getTodo,
  getAllTodos,
  updateTodo,
  deleteTodo,
  getTodosByCompleted,
  getTodosByPriority,
  getAllTodosWithCursor,
  runIndexedDBDemo,
  clearDemoData,
};

// [DEMO: Module 2 – Clip 4 END]
