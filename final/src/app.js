/**
 * Travel Planner - Main Application Entry Point
 * Handles service worker registration, routing, and core app functionality
 */

import { FEATURES, CONFIG } from './config.js';
import { router } from './routes.js';
import { showToast, showLoading, hideLoading } from './ui.js';

class TravelPlannerApp {
  constructor() {
    this.swRegistration = null;
    this.updateChannel = null;
    this.ideas = []; // In-memory storage (will switch to IndexedDB when demo is enabled)
    this.isOnline = navigator.onLine;

    this.init();
  }

  async init() {
    try {
      showLoading();

      // Initialize app components
      await this.setupEventListeners();

      // Only register service worker if enabled in config
      if (CONFIG.SW_ENABLED) {
        console.log('🚀 Service Worker enabled, registering...');
        await this.registerServiceWorker();
        await this.setupBroadcastChannel();
      } else {
        console.log(
          '⏸️ Service Worker disabled in config, starting without offline functionality'
        );
      }

      // Load initial data BEFORE initializing router
      await this.loadInitialData();

      // Initialize router AFTER data is loaded
      await this.initializeRouter();

      hideLoading();
      console.log(
        '✅ Travel Planner initialized successfully (SW enabled:',
        CONFIG.SW_ENABLED,
        ')'
      );
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      hideLoading();
    }
  }

  /**
   * Register service worker for offline functionality
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      this.swRegistration = registration;

      console.log('✅ Service Worker registered:', {
        scope: registration.scope,
        active: !!registration.active,
        waiting: !!registration.waiting,
        installing: !!registration.installing,
      });

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker update found');
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              console.log(
                '📦 New Service Worker installed, waiting to activate'
              );
              this.showUpdateBanner();
            }
          });
        }
      });

      // Check for existing update waiting
      if (registration.waiting) {
        this.showUpdateBanner();
      }
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }

  /**
   * Setup BroadcastChannel for SW communication
   */
  async setupBroadcastChannel() {
    if (!('BroadcastChannel' in window)) {
      console.warn('⚠️ BroadcastChannel not supported');
      return;
    }

    this.updateChannel = new BroadcastChannel('sw-updates');

    this.updateChannel.addEventListener('message', (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'SW_UPDATED':
          console.log('📡 Received SW update notification');
          this.showUpdateBanner();
          break;
        case 'CACHE_UPDATED':
          console.log('📡 Cache updated:', data);
          break;
        case 'OFFLINE_READY':
          showToast('App is ready for offline use', 'success');
          break;
        default:
          console.log('📡 Unknown message:', event.data);
      }
    });
  }

  /**
   * Setup application event listeners
   */
  async setupEventListeners() {
    // Online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      showToast('You are back online', 'success');
      console.log('🌐 App is online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      showToast('You are now offline', 'warning');
      console.log('📴 App is offline');
    });

    // Update banner controls
    document.getElementById('update-btn')?.addEventListener('click', () => {
      this.activateUpdate();
    });

    document.getElementById('dismiss-update')?.addEventListener('click', () => {
      this.hideUpdateBanner();
    });

    // Delegated listeners: in case the banner DOM is re-rendered later
    document.addEventListener('click', (e) => {
      const updateBtn = e.target.closest && e.target.closest('#update-btn');
      if (updateBtn) {
        e.preventDefault();
        this.activateUpdate();
        return;
      }

      const dismiss = e.target.closest && e.target.closest('#dismiss-update');
      if (dismiss) {
        e.preventDefault();
        this.hideUpdateBanner();
      }
    });

    // Settings page controls (if we're on settings)
    this.setupSettingsControls();
  }

  /**
   * Set theme explicitly: 'dark' or 'light' (or null to follow system)
   */
  setTheme(theme) {
    try {
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem('theme');
      }
    } catch (e) {
      // ignore storage errors
    }
  }

  /**
   * Toggle theme between dark and light (persists choice)
   */
  toggleTheme() {
    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark';
    this.setTheme(isDark ? 'light' : 'dark');
    showToast(
      isDark ? 'Switched to light theme' : 'Switched to dark theme',
      'info'
    );
  }

  /**
   * Setup settings page controls
   */
  setupSettingsControls() {
    // Clear caches button
    document.addEventListener('click', async (e) => {
      if (e.target.id === 'clear-caches') {
        e.preventDefault();
        await this.clearCaches();
      }

      if (e.target.id === 'unregister-sw') {
        e.preventDefault();
        await this.unregisterServiceWorker();
      }
    });
  }

  /**
   * Initialize router for SPA navigation
   */
  async initializeRouter() {
    // Handle initial route
    await router.handleRoute();

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      router.handleRoute();
    });

    // Handle navigation clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link) {
        e.preventDefault();
        const route = link.getAttribute('href').substring(1);
        router.navigate(route);
      }
    });
  }

  /**
   * Load initial application data
   */
  async loadInitialData() {
    try {
      // Load sample ideas (will be replaced by IndexedDB when enabled)
      this.ideas = [
        { id: 1, text: 'Weekend in Paris', timestamp: Date.now() - 86400000 },
        {
          id: 2,
          text: 'Hiking in the Alps',
          timestamp: Date.now() - 172800000,
        },
        {
          id: 3,
          text: 'Beach vacation in Bali',
          timestamp: Date.now() - 259200000,
        },
      ];

      console.log('📊 Initial data loaded');
    } catch (error) {
      console.error('❌ Failed to load initial data:', error);
    }
  }

  /**
   * Get ideas (switches between memory and IndexedDB based on feature flag)
   */
  async getIdeas() {
    if (FEATURES.M2_C5_INDEXEDDB_DEMO) {
      // Import and use IndexedDB when demo is enabled
      const { getAllIdeas } = await import('./idb.js');
      return await getAllIdeas();
    }
    return this.ideas;
  }

  /**
   * Add idea (switches between memory and IndexedDB based on feature flag)
   */
  async addIdea(text) {
    if (FEATURES.M2_C5_INDEXEDDB_DEMO) {
      // Import and use IndexedDB when demo is enabled
      const { addIdea } = await import('./idb.js');
      return await addIdea(text);
    }

    // Use in-memory storage
    const idea = {
      id: Date.now(),
      text,
      timestamp: Date.now(),
    };
    this.ideas.unshift(idea);
    return idea;
  }

  /**
   * Clear all ideas
   */
  async clearIdeas() {
    if (FEATURES.M2_C5_INDEXEDDB_DEMO) {
      const { clearIdeas } = await import('./idb.js');
      await clearIdeas();
    } else {
      this.ideas = [];
    }
  }

  /**
   * Show update banner
   */
  showUpdateBanner() {
    const banner = document.getElementById('update-banner');
    if (banner) {
      banner.classList.remove('hidden');
    }
  }

  /**
   * Hide update banner
   */
  hideUpdateBanner() {
    const banner = document.getElementById('update-banner');
    if (banner) {
      banner.classList.add('hidden');
    }
  }

  /**
   * Activate service worker update
   */
  async activateUpdate() {
    try {
      // If there is a waiting service worker, tell it to skip waiting
      const updateBtn = document.getElementById('update-btn');
      const banner = document.getElementById('update-banner');

      // Provide immediate feedback in the UI
      if (updateBtn) {
        updateBtn.disabled = true;
        updateBtn.textContent = 'Activating...';
      }
      if (banner) {
        // keep banner visible but indicate progress
        banner.classList.add('animate-pulse');
      }

      if (this.swRegistration?.waiting) {
        this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Wait for the new service worker to take control (controllerchange)
        const timeout = 5000; // 5s timeout for controller change
        let timedOut = false;

        await Promise.race([
          new Promise((resolve) => {
            function onControllerChange() {
              navigator.serviceWorker.removeEventListener(
                'controllerchange',
                onControllerChange
              );
              resolve();
            }

            navigator.serviceWorker.addEventListener(
              'controllerchange',
              onControllerChange
            );
          }),
          new Promise((resolve) =>
            setTimeout(() => {
              timedOut = true;
              resolve();
            }, timeout)
          ),
        ]);

        if (timedOut) {
          console.warn('⚠️ Controller change timed out, reloading as fallback');
          showToast('Activated update (fallback reload)', 'info');
        } else {
          showToast('Update activated — reloading', 'success');
        }

        // Hide banner and reload
        if (banner) banner.classList.add('hidden');
        window.location.reload();
      } else {
        // No waiting worker — just reload as a fallback
        if (banner) banner.classList.add('hidden');
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Failed to activate update:', error);
      // Ensure we still reload so the user can get the latest content
      showToast('Failed to activate update — reloading', 'error');
      window.location.reload();
    }
  }

  /**
   * Clear all caches via service worker
   */
  async clearCaches() {
    try {
      if (this.swRegistration?.active) {
        this.swRegistration.active.postMessage({ type: 'CLEAR_CACHES' });
        showToast('All caches cleared successfully', 'success');
        console.log('🧹 Caches cleared');
      } else {
        // Fallback: clear caches directly if SW not available
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        showToast('Caches cleared (direct)', 'success');
      }
    } catch (error) {
      console.error('❌ Failed to clear caches:', error);
      showToast('Failed to clear caches', 'error');
    }
  }

  /**
   * Enable service worker dynamically
   */
  async enableServiceWorker() {
    if (this.swRegistration) {
      console.log('⚠️ Service Worker already registered');
      showToast('Service Worker already enabled', 'info');
      return;
    }

    try {
      console.log('🚀 Enabling Service Worker...');
      await this.registerServiceWorker();
      await this.setupBroadcastChannel();

      // Update the config to reflect enabled state
      CONFIG.SW_ENABLED = true;

      showToast('Service Worker enabled successfully', 'success');
      console.log('✅ Service Worker enabled');
    } catch (error) {
      console.error('❌ Failed to enable Service Worker:', error);
      showToast('Failed to enable Service Worker', 'error');
    }
  }

  /**
   * Unregister service worker
   */
  async unregisterServiceWorker() {
    try {
      if (this.swRegistration) {
        await this.swRegistration.unregister();
        showToast('Service Worker unregistered', 'success');
        console.log('🗑️ Service Worker unregistered');

        // Reload to complete unregistration
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      console.error('❌ Failed to unregister SW:', error);
      showToast('Failed to unregister Service Worker', 'error');
    }
  }

  /**
   * Get app status for debugging
   */
  getStatus() {
    return {
      online: this.isOnline,
      serviceWorker: {
        registered: !!this.swRegistration,
        scope: this.swRegistration?.scope,
        state: this.swRegistration?.active?.state,
      },
      features: FEATURES,
      ideas: this.ideas.length,
    };
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.travelApp = new TravelPlannerApp();

    // Ensure app is ready before any routing happens
    console.log('✅ App initialization complete');

    // Dispatch a custom event to signal app is ready
    window.dispatchEvent(new CustomEvent('app-ready'));
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
  }
});

// Export for global access (useful for debugging)
export { TravelPlannerApp };
