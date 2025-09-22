import { router } from './routes.js';
import { showToast, showLoading, hideLoading } from './ui.js';

class TravelPlannerApp {
  constructor() {
    this.swRegistration = null;
    this.ideas = [];
    this.isOnline = navigator.onLine;
    this.init();
  }

  async init() {
    try {
      showLoading();
      await this.setupEventListeners();

      // await this.unregisterServiceWorker();
      await this.registerServiceWorker();

      await this.loadInitialData();
      await this.initializeRouter();
      hideLoading();
    } catch (error) {
      console.error('App initialization failed:', error);
      hideLoading();
      // Show error message to user
      document.getElementById('main-content').innerHTML = `
        <div class="container">
          <div class="card text-center">
            <div class="card-content">
              <h2>⚠️ App Failed to Load</h2>
              <p>There was an error initializing the application.</p>
              <p><strong>Error:</strong> ${error.message}</p>
              <button class="btn btn-primary" onclick="window.location.reload()">🔄 Reload</button>
            </div>
          </div>
        </div>
      `;
    }
  }

  async unregisterServiceWorker() {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        registration.unregister().then(function () {
          console.log('Service Worker unregistered successfully.');
        });
      }
    }
  }

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      if ('periodicSync' in registration) {
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync',
        });
        if (status.state === 'granted') {
          const ONE_HOUR = 60 * 60 * 1000;
          await registration.periodicSync.register('tips-sync', {
            minInterval: ONE_HOUR,
          });
          console.log(
            '[PBS] ✅ Registered periodic sync: tips-sync (~1h requested)'
          );
        } else {
          console.log(
            'Periodic background sync permission denied or not granted.'
          );
        }
      }

      this.swRegistration = registration;

      console.log('✅ Service Worker registered:', {
        scope: registration.scope,
        active: !!registration.active,
        waiting: !!registration.waiting,
        installing: !!registration.installing,
      });

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

      if (registration.waiting) {
        this.showUpdateBanner();
      }

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_SUCCESS') {
          showToast(event.data.message, 'success');
        }
      });
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }

  showUpdateBanner() {
    const banner = document.getElementById('update-banner');
    if (banner) {
      banner.classList.remove('hidden');
    }
  }

  async setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      showToast('You are back online', 'success');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      showToast('You are now offline', 'warning');
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

    this.setupSettingsControls();
  }

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
    } catch (e) {}
  }

  toggleTheme() {
    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark';
    this.setTheme(isDark ? 'light' : 'dark');
    showToast(
      isDark ? 'Switched to light theme' : 'Switched to dark theme',
      'info'
    );
  }

  setupSettingsControls() {
    document.addEventListener('click', async (e) => {
      if (e.target.id === 'clear-caches') {
        e.preventDefault();
        showToast('No caches to clear in this simplified app', 'info');
      }
    });
  }

  async initializeRouter() {
    await router.handleRoute();
    window.addEventListener('popstate', () => {
      router.handleRoute();
    });
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link) {
        e.preventDefault();
        const route = link.getAttribute('href').substring(1);
        router.navigate(route);
      }
    });
  }

  async loadInitialData() {
    try {
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
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }

  async getIdeas() {
    return this.ideas;
  }

  async addIdea(text) {
    const idea = {
      id: Date.now(),
      text,
      timestamp: Date.now(),
    };

    if (this.isOnline) {
      this.ideas.unshift(idea);
      return idea;
    } else {
      await this.queueIdeaForSync(idea);
      this.ideas.unshift(idea);
      showToast('Idea saved offline - will sync when online', 'warning');
      return idea;
    }
  }

  async queueIdeaForSync(idea) {
    try {
      await this.saveToQueue(idea);

      if (this.swRegistration && 'sync' in this.swRegistration) {
        await this.swRegistration.sync.register('background-sync-ideas');
        console.log('📤 Background sync registered for idea:', idea.text);
      }
    } catch (error) {
      console.error('Failed to queue idea for sync:', error);
    }
  }

  async saveToQueue(idea) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TravelPlannerDB', 1);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('queuedIdeas')) {
          db.createObjectStore('queuedIdeas', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['queuedIdeas'], 'readwrite');
        const store = transaction.objectStore('queuedIdeas');
        const addRequest = store.add(idea);

        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      };
    });
  }

  async clearIdeas() {
    this.ideas = [];
  }

  async clearCaches() {
    try {
      showToast('No caches to clear in simplified app', 'info');
    } catch (error) {
      console.error('Failed to clear caches:', error);
      showToast('Failed to clear caches', 'error');
    }
  }

  getStatus() {
    return {
      online: this.isOnline,
      ideas: this.ideas.length,
    };
  }

  async activateUpdate() {
    try {
      const updateBtn = document.getElementById('update-btn');
      const banner = document.getElementById('update-banner');
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

        const timeout = 5000;
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
          showToast('Activated update (fallback reload)', 'info');
        } else {
          showToast('Update activated — reloading', 'success');
        }

        if (banner) banner.classList.add('hidden');
        window.location.reload();
      } else {
        if (banner) banner.classList.add('hidden');
        window.location.reload();
      }
    } catch (error) {
      showToast('Failed to activate update — reloading', 'error');
      window.location.reload();
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.travelApp = new TravelPlannerApp();
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
});

export { TravelPlannerApp };
