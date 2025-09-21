/**
 * Router for Single Page Application
 * Handles client-side routing and view loading
 */

import { updateNavigation, renderContent } from './ui.js';

class Router {
  constructor() {
    this.routes = {
      '': 'home',
      home: 'home',
      ideas: 'ideas',
      deals: 'deals',
      streams: 'streams',
      settings: 'settings',
    };
    this.appReady = false;
    this.viewManifest = null;
    this.manifestLoaded = false;

    // Listen for app ready event
    window.addEventListener('app-ready', () => {
      this.appReady = true;
    });

    // Initialize the router
    this.init();
  }

  /**
   * Initialize router and load manifest
   */
  async init() {
    await this.loadViewManifest();
    this.manifestLoaded = true;
  }

  /**
   * Load view manifest to get hashed view filenames
   * Only attempts to load in production (when Vite generates the manifest)
   */
  async loadViewManifest() {
    // Skip manifest loading in development mode
    if (import.meta.env.DEV) {
      console.log('[Router] 🔧 Development mode - skipping view manifest');
      return;
    }

    try {
      // Try to fetch the view manifest directly first
      const response = await fetch('/view-manifest.js');
      if (response.ok) {
        const manifestContent = await response.text();
        // Execute the script content to set window.__VIEW_MANIFEST
        new Function(manifestContent)();
        this.viewManifest = window.__VIEW_MANIFEST;
        console.log('[Router] ✅ Loaded view manifest:', this.viewManifest);
        return;
      }
    } catch (error) {
      console.warn('[Router] ⚠️ Failed to fetch view manifest:', error);
    }

    // Fallback to script tag method
    try {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/view-manifest.js';
        script.onload = () => {
          this.viewManifest = window.__VIEW_MANIFEST;
          console.log(
            '[Router] ✅ Loaded view manifest via script:',
            this.viewManifest
          );
          resolve();
        };
        script.onerror = () => {
          console.warn(
            '[Router] ⚠️ Could not load view manifest, using fallback paths'
          );
          resolve(); // Don't reject, just continue without manifest
        };
        document.head.appendChild(script);
      });
    } catch (error) {
      console.warn('[Router] ⚠️ Could not load view manifest:', error);
    }
  }

  /**
   * Get the actual filename for a view (with hash if available)
   */
  getViewPath(viewName) {
    if (this.viewManifest && this.viewManifest[viewName]) {
      return `views/${this.viewManifest[viewName]}`;
    }

    // Fallback to direct path (for development or if manifest fails)
    return `views/${viewName}.html`;
  } /**
   * Wait for app to be ready
   */
  async waitForApp() {
    // If app is already ready, return immediately
    if (this.appReady && window.travelApp) {
      return;
    }

    // If app exists and has initial data loaded, mark as ready
    if (window.travelApp && Array.isArray(window.travelApp.ideas)) {
      this.appReady = true;
      return;
    }

    // Wait up to 5 seconds for app to be ready
    const maxWait = 5000;
    const startTime = Date.now();

    while (!this.appReady || !window.travelApp) {
      if (Date.now() - startTime > maxWait) {
        console.warn('⚠️ App initialization timeout');
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if app exists and has data loaded
      if (window.travelApp && Array.isArray(window.travelApp.ideas)) {
        this.appReady = true;
        break;
      }
    }
  }

  /**
   * Navigate to a route
   * @param {string} route - Route to navigate to
   */
  navigate(route) {
    // Remove leading slash if present
    route = route.replace(/^\//, '');

    // Update browser URL
    window.history.pushState({}, '', `#/${route}`);

    // Handle the route
    this.handleRoute();
  }

  /**
   * Handle current route
   */
  async handleRoute() {
    // Wait for manifest to be loaded before handling routes
    if (!this.manifestLoaded) {
      console.log('[Router] ⏳ Waiting for manifest to load...');
      await this.waitForManifest();
    }

    const hash = window.location.hash.substring(1); // Remove #
    const route = hash.replace(/^\//, '') || 'home'; // Remove leading slash

    // Update active navigation
    updateNavigation(route);

    // Load and render view
    await this.loadView(route);
  }

  /**
   * Wait for manifest to be loaded
   */
  async waitForManifest() {
    const maxWait = 5000; // Wait up to 5 seconds
    const startTime = Date.now();

    while (!this.manifestLoaded && Date.now() - startTime < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (!this.manifestLoaded) {
      console.warn(
        '[Router] ⚠️ Manifest loading timeout, continuing with fallback paths'
      );
    }
  }

  /**
   * Load view for route
   * @param {string} route - Route to load view for
   */
  async loadView(route) {
    const viewName = this.routes[route] || 'home';

    try {
      // Load view template using hashed filename
      const viewPath = this.getViewPath(viewName);
      const response = await fetch(viewPath);

      if (!response.ok) {
        throw new Error(
          `Failed to load view: ${viewPath} (${response.status})`
        );
      }

      let html = await response.text();

      // Process dynamic content based on view
      html = await this.processViewContent(viewName, html);

      // Render content
      renderContent(html);

      // Setup view-specific event listeners
      await this.setupViewEvents(viewName);
    } catch (error) {
      console.error('❌ Failed to load view:', error);
      this.renderErrorView(route);
    }
  }

  /**
   * Process dynamic content for views
   * @param {string} viewName - Name of the view
   * @param {string} html - Raw HTML template
   */
  async processViewContent(viewName, html) {
    switch (viewName) {
      case 'home':
        return this.processHomeView(html);
      case 'ideas':
        return this.processIdeasView(html);
      case 'deals':
        return this.processDealsView(html);
      case 'streams':
        return this.processStreamsView(html);
      case 'settings':
        return this.processSettingsView(html);
      default:
        return html;
    }
  }

  /**
   * Process home view with dynamic content
   */
  async processHomeView(html) {
    const statsHtml = `
      <div class="grid grid-cols-3">
        <div class="card text-center">
          <div class="card-content">
            <h3 style="font-size: 2rem; color: var(--primary); margin-bottom: 0.5rem;">🌍</h3>
            <p style="font-size: 0.875rem; color: var(--text-secondary);">Countries Explored</p>
            <p style="font-size: 1.5rem; font-weight: 600;">12</p>
          </div>
        </div>
        <div class="card text-center">
          <div class="card-content">
            <h3 style="font-size: 2rem; color: var(--primary); margin-bottom: 0.5rem;">✈️</h3>
            <p style="font-size: 0.875rem; color: var(--text-secondary);">Trips Planned</p>
            <p style="font-size: 1.5rem; font-weight: 600;">28</p>
          </div>
        </div>
        <div class="card text-center">
          <div class="card-content">
            <h3 style="font-size: 2rem; color: var(--primary); margin-bottom: 0.5rem;">💰</h3>
            <p style="font-size: 0.875rem; color: var(--text-secondary);">Money Saved</p>
            <p style="font-size: 1.5rem; font-weight: 600;">$2,450</p>
          </div>
        </div>
      </div>
    `;

    return html.replace('{{STATS}}', statsHtml);
  }

  /**
   * Process ideas view with user ideas
   */
  async processIdeasView(html) {
    // Ensure app is ready before getting ideas
    await this.waitForApp();

    // Get ideas from app instance
    const app = window.travelApp;
    let ideas = [];
    let storageInfo = '💾 Stored locally with offline access';

    if (app) {
      try {
        ideas = await app.getIdeas();

        // Import config to check storage method
        const { FEATURES } = await import('./config.js');

        storageInfo = '💾 Stored locally with offline access';
      } catch (error) {
        console.error('❌ Failed to get ideas:', error);
        // Fall back to empty array if there's an error
        ideas = [];
        storageInfo = '⚠️ Storage unavailable';
      }
    } else {
      console.warn('⚠️ App not available in processIdeasView');
      storageInfo = '⏳ Loading storage...';
    }

    const ideasHtml =
      ideas.length > 0
        ? ideas
            .map(
              (idea, index) => `
          <div class="card fade-in" style="animation-delay: ${index * 0.1}s;">
            <div class="card-content">
              <p style="color: var(--text-primary); font-weight: 500; margin-bottom: 0.5rem;">${idea.text}</p>
            </div>
            <div class="card-footer" style="border-top: 1px solid var(--border-light); padding-top: 0.75rem;">
              <small style="color: var(--text-muted); font-size: 0.75rem;">Added ${this.formatDate(
                idea.timestamp
              )}</small>
            </div>
          </div>
        `
            )
            .join('')
        : `<div class="card text-center high-contrast fade-in">
               <div class="card-content">
                 <div style="font-size: 3rem; margin-bottom: 1rem;">💡</div>
                 <h3 style="color: var(--text-primary); margin-bottom: 1rem;">No travel ideas yet</h3>
                 <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Start planning your next adventure by adding your first travel idea above!</p>
                 <div style="background: var(--bg-secondary); border-radius: var(--border-radius); padding: 1rem; font-size: 0.875rem;">
                   <strong style="color: var(--text-primary);">💭 Need inspiration?</strong><br>
                   <span style="color: var(--text-secondary);">Try: "Weekend getaway to mountains", "Food tour in Tokyo", or "Beach vacation in Greece"</span>
                 </div>
               </div>
             </div>`;

    // Replace both ideas and storage info
    return html
      .replace('{{IDEAS}}', ideasHtml)
      .replace('{{STORAGE_INFO}}', storageInfo);
  }

  /**
   * Process deals view with travel deals
   */
  async processDealsView(html) {
    try {
      // Import deals service
      const { default: dealsService } = await import('./data/deals.js');

      // Get deals with fallback to mock data
      const deals = await dealsService.getDeals();

      const dealsHtml =
        deals.length > 0
          ? deals
              .map(
                (deal, index) => `
            <div class="card card-interactive fade-in" style="animation-delay: ${index * 0.1}s;">
              <div class="card-header">
                <h3 class="card-title">${deal.title}</h3>
                ${
                  deal.discountPercentage > 0
                    ? `<span style="background: var(--error); color: white; padding: 0.25rem 0.5rem; border-radius: var(--border-radius); font-size: 0.75rem; font-weight: 600;">
                    ${deal.discountPercentage}% OFF
                  </span>`
                    : ''
                }
              </div>
              <div class="card-content">
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">${deal.description}</p>
                ${deal.destination ? `<p style="color: var(--text-primary); font-weight: 500; margin-bottom: 0.5rem;">📍 ${deal.destination}</p>` : ''}
                ${deal.rating > 0 ? `<p style="color: var(--text-muted); font-size: 0.875rem;">⭐ ${deal.rating}/5 (${deal.reviewCount} reviews)</p>` : ''}
              </div>
              <div class="card-footer">
                <div>
                  ${
                    deal.originalPrice && deal.originalPrice > deal.price
                      ? `<span style="text-decoration: line-through; color: var(--text-muted); font-size: 0.875rem;">$${deal.originalPrice}</span><br>`
                      : ''
                  }
                  <span style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">$${deal.price}</span>
                </div>
                <button class="btn btn-primary btn-sm">Book Now</button>
              </div>
            </div>
          `
              )
              .join('')
          : `<div class="card text-center high-contrast fade-in">
               <div class="card-content">
                 <div style="font-size: 3rem; margin-bottom: 1rem;">🏝️</div>
                 <h3 style="color: var(--text-primary); margin-bottom: 1rem;">No deals available</h3>
                 <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Check back later for amazing travel deals!</p>
                 <div style="background: var(--bg-secondary); border-radius: var(--border-radius); padding: 1rem; font-size: 0.875rem;">
                   <strong style="color: var(--text-primary);">🔔 Want notifications?</strong><br>
                   <span style="color: var(--text-secondary);">We'll notify you when new deals are available</span>
                 </div>
               </div>
             </div>`;

      return html.replace('{{DEALS}}', dealsHtml);
    } catch (error) {
      console.error('❌ Failed to load deals:', error);

      const errorHtml = `
        <div class="card text-center high-contrast">
          <div class="card-content">
            <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--error);">⚠️</div>
            <h3 style="color: var(--text-primary); margin-bottom: 1rem;">Unable to load deals</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
              ${
                navigator.onLine
                  ? 'There was a problem connecting to our servers. Please try again.'
                  : 'You appear to be offline. Please check your connection and try again.'
              }
            </p>
            <button class="btn btn-primary" onclick="window.location.reload()">
              🔄 Try Again
            </button>
          </div>
        </div>`;

      return html.replace('{{DEALS}}', errorHtml);
    }
  }

  /**
   * Process streams view
   */
  async processStreamsView(html) {
    const streamExamples = `
      <div class="grid grid-cols-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">HTML Streaming</h3>
          </div>
          <div class="card-content">
            <p>Experience server-side rendering with streaming HTML responses.</p>
          </div>
          <div class="card-footer">
            <a href="/stream/html" class="btn btn-primary btn-sm" target="_blank">Try Demo</a>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Data Streaming</h3>
          </div>
          <div class="card-content">
            <p>Watch data load progressively with streaming APIs.</p>
          </div>
          <div class="card-footer">
            <button class="btn btn-secondary btn-sm" disabled>Coming Soon</button>
          </div>
        </div>
      </div>
    `;

    return html.replace('{{STREAM_EXAMPLES}}', streamExamples);
  }

  /**
   * Process settings view
   */
  async processSettingsView(html) {
    // Ensure app is ready before getting status
    await this.waitForApp();

    // Get app status for debugging info
    const app = window.travelApp;
    const status = app ? app.getStatus() : { online: navigator.onLine };

    const statusHtml = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">App Status</h3>
        </div>
        <div class="card-content">
          <p><strong>Online:</strong> ${status.online ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Ideas Count:</strong> ${status.ideas || 0}</p>
        </div>
      </div>
    `;

    return html.replace('{{STATUS}}', statusHtml);
  }

  /**
   * Setup view-specific event listeners
   * @param {string} viewName - Name of the view
   */
  async setupViewEvents(viewName) {
    switch (viewName) {
      case 'ideas':
        this.setupIdeasEvents();
        break;
      case 'deals':
        this.setupDealsEvents();
        break;
      case 'settings':
        this.setupSettingsEvents();
        break;
    }
  }

  /**
   * Setup deals view events
   */
  setupDealsEvents() {
    // Hide loading text since deals are now loaded
    const statusEl = document.getElementById('connection-status');
    if (statusEl && statusEl.classList.contains('loading-text')) {
      statusEl.classList.remove('loading-text');

      // Update status based on connection
      function updateStatus() {
        if (navigator.onLine) {
          statusEl.textContent = 'Online - Fresh deals';
        } else {
          statusEl.textContent = 'Offline - Cached deals';
        }
      }

      updateStatus();
      window.addEventListener('online', updateStatus);
      window.addEventListener('offline', updateStatus);
    }
  }

  /**
   * Setup ideas view events
   */
  setupIdeasEvents() {
    // Update storage info dynamically
    this.updateStorageInfo();

    const form = document.getElementById('idea-form');
    const input = document.getElementById('idea-input');

    if (form && input) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const text = input.value.trim();
        if (!text) return;

        try {
          const app = window.travelApp;
          if (app) {
            await app.addIdea(text);
            input.value = '';

            // Reload the view to show new idea
            await this.loadView('ideas');
          }
        } catch (error) {
          console.error('❌ Failed to add idea:', error);
        }
      });
    }

    // Clear ideas button
    const clearBtn = document.getElementById('clear-ideas');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all ideas?')) {
          try {
            const app = window.travelApp;
            if (app) {
              await app.clearIdeas();
              await this.loadView('ideas');
            }
          } catch (error) {
            console.error('❌ Failed to clear ideas:', error);
          }
        }
      });
    }
  }

  /**
   * Update storage info display
   */
  async updateStorageInfo() {
    const storageInfoEl = document.getElementById('storage-info');
    if (!storageInfoEl) return;

    try {
      const { FEATURES } = await import('./config.js');

      storageInfoEl.textContent = '💾 Stored locally with offline access';
    } catch (error) {
      console.error('❌ Failed to update storage info:', error);
      storageInfoEl.textContent = '💾 Stored locally with offline access';
    }
  }

  /**
   * Setup settings view events
   */
  setupSettingsEvents() {
    // Event listeners are handled in app.js setupSettingsControls()
    // This is intentionally empty but could be extended
  }

  /**
   * Render error view
   * @param {string} route - Failed route
   */
  renderErrorView(route) {
    const errorHtml = `
      <div class="container">
        <div class="card text-center">
          <div class="card-content">
            <h2>Page Not Found</h2>
            <p>The page "${route}" could not be found.</p>
            <a href="#/" class="btn btn-primary">Go Home</a>
          </div>
        </div>
      </div>
    `;
    renderContent(errorHtml);
  }

  /**
   * Format date helper
   * @param {number|Date} date - Date to format
   */
  formatDate(date) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'today';
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return d.toLocaleDateString();
    }
  }
}

// Create and export router instance
export const router = new Router();
