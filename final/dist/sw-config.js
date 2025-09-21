/**
 * Service Worker Configuration
 * Classic script version (no ES modules) for use with importScripts()
 *
 * Note: Service workers can't use ES modules with import/export,
 * so we use global variable assignments instead.
 */

// Feature flags for controlling demo functionality
// All demos are disabled by default for clean app experience
self.FEATURES = {
  // Module 1 - Service Worker Lifecycle
  M1_C3_LIFECYCLE: false,
  M1_C4_REGISTER_ACTIVATE: false,
  M1_C5_INTERCEPT: false,

  // Module 2 - Caching Strategies
  M2_C1_CACHE_API: false,
  M2_C2_CACHING_STRATEGIES: false,
  M2_C3_APPLY_STRATEGIES: false,
  M2_C4_INDEXEDDB_INTRO: false,
  M2_C5_INDEXEDDB_DEMO: false,

  // Module 3 - Application Shell
  M3_C1_APP_SHELL: false,
  M3_C2_NAV_PRELOAD: false,
  M3_C3_OFFLINE_FALLBACK: false,
  M3_C4_UPDATES_BROADCAST: false,
  M3_C5_CLEANUP_UNREGISTER: false,

  // Module 4 - Workbox Integration
  M4_C1_WHY_WORKBOX: false,
  M4_C2_WB_PRECACHING: false,
  M4_C3_WB_RUNTIME: false,
  M4_C4_WB_NAV_FALLBACK: false,

  // Module 5 - Advanced Web APIs
  M5_C1_BACKGROUND_SYNC: false,
  M5_C2_PERIODIC_SYNC: false,
  M5_C3_STREAMS: false,
};

// Application configuration
self.CONFIG = {
  APP_NAME: 'Travel Planner',
  VERSION: '1.0.0',
  API_BASE: '/api',
  CACHE_PREFIX: 'tp',
  IDB_NAME: 'travel-planner-db',
  IDB_VERSION: 1,
  // Service Worker configuration
  SW_ENABLED: false, // Service worker disabled by default
};

// Cache names configuration
// Centralized cache naming to avoid hardcoded strings
self.CACHE_NAMES = {
  // Main application caches
  APP_SHELL: `tp-app-shell-v${self.CONFIG.VERSION}`,
  STATIC_RESOURCES: `tp-static-v${self.CONFIG.VERSION}`,
  API_CACHE: `tp-api-v${self.CONFIG.VERSION}`,
  DYNAMIC_CONTENT: `tp-dynamic-v${self.CONFIG.VERSION}`,

  // Demo-specific caches
  M1_C3_LIFECYCLE: `tp-demo-m1-c3-lifecycle-v${self.CONFIG.VERSION}`,
  M1_C4_REGISTER: `tp-demo-m1-c4-register-v${self.CONFIG.VERSION}`,
  M1_C5_INTERCEPT: `tp-demo-m1-c5-intercept-v${self.CONFIG.VERSION}`,

  M2_C1_CACHE_API: `tp-demo-m2-c1-cache-api-v${self.CONFIG.VERSION}`,
  M2_C1_VERSIONED: `tp-demo-m2-c1-versioned-v${self.CONFIG.VERSION}`,
  M2_C2_STRATEGIES: `tp-demo-m2-c2-strategies-v${self.CONFIG.VERSION}`,
  M2_C3_APPLY: `tp-demo-m2-c3-apply-v${self.CONFIG.VERSION}`,
  M2_C4_INDEXEDDB: `tp-demo-m2-c4-indexeddb-v${self.CONFIG.VERSION}`,
  M2_C5_IDB_DEMO: `tp-demo-m2-c5-idb-demo-v${self.CONFIG.VERSION}`,

  M3_C1_APP_SHELL: `tp-demo-m3-c1-app-shell-v${self.CONFIG.VERSION}`,
  M3_C2_NAV_PRELOAD: `tp-demo-m3-c2-nav-preload-v${self.CONFIG.VERSION}`,
  M3_C3_OFFLINE_FALLBACK: `tp-demo-m3-c3-offline-fallback-v${self.CONFIG.VERSION}`,
  M3_C4_UPDATES: `tp-demo-m3-c4-updates-v${self.CONFIG.VERSION}`,
  M3_C5_CLEANUP: `tp-demo-m3-c5-cleanup-v${self.CONFIG.VERSION}`,

  M4_C1_WORKBOX: `tp-demo-m4-c1-workbox-v${self.CONFIG.VERSION}`,
  M4_C2_PRECACHING: `tp-demo-m4-c2-precaching-v${self.CONFIG.VERSION}`,
  M4_C3_RUNTIME: `tp-demo-m4-c3-runtime-v${self.CONFIG.VERSION}`,
  M4_C4_NAV_FALLBACK: `tp-demo-m4-c4-nav-fallback-v${self.CONFIG.VERSION}`,

  M5_C1_BACKGROUND_SYNC: `tp-demo-m5-c1-background-sync-v${self.CONFIG.VERSION}`,
  M5_C2_PERIODIC_SYNC: `tp-demo-m5-c2-periodic-sync-v${self.CONFIG.VERSION}`,
  M5_C3_STREAMS: `tp-demo-m5-c3-streams-v${self.CONFIG.VERSION}`,

  // Workbox simulation caches
  WORKBOX_IMAGES: `tp-workbox-images-v${self.CONFIG.VERSION}`,
  WORKBOX_STATIC: `tp-workbox-static-v${self.CONFIG.VERSION}`,
  WORKBOX_API: `tp-workbox-api-v${self.CONFIG.VERSION}`,

  // Strategy-specific caches
  HTML_CACHE: `tp-html-cache-v${self.CONFIG.VERSION}`,
  STATIC_CACHE: `tp-static-cache-v${self.CONFIG.VERSION}`,
  IMAGE_CACHE: `tp-image-cache-v${self.CONFIG.VERSION}`,
  MISC_CACHE: `tp-misc-cache-v${self.CONFIG.VERSION}`,
};
