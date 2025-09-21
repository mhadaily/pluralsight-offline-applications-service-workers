# Travel Planner Offline

**This repo is to support my course "Offline Applications with Service Workers" on [Pluralsight](https://pluralsight.com)**

A beautiful, production-quality Progressive Web App (PWA) built with Vite and vanilla JavaScript. Features comprehensive Service Worker demos, offline functionality, and modern caching strategies.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start both API and UI servers simultaneously
npm start

# Open http://localhost:3000
```

**Alternative (run separately):**

```bash
# Start the mock API server (Terminal 1)
npm run api

# Start the development server (Terminal 2)
npm run dev
```

## 📖 Overview

# Start both API and UI servers simultaneously

npm start

# Open <http://localhost:3000>

```

**Alternative (run separately):**

```bash
# Start the mock API server (Terminal 1)
npm run api

# Start the development server (Terminal 2)
npm run dev
```

## � HTTPS Configuration

This project is configured to run with HTTPS for testing Service Worker features that require secure contexts.

### Generate SSL Certificates

To run with HTTPS, you need to generate SSL certificates first:

```bash
# Create certificates directory
mkdir certs

# Generate self-signed certificate (valid for 365 days)
openssl req -x509 -newkey rsa:2048 -nodes -keyout certs/key.pem -out certs/cert.pem -days 365
```

When prompted, you can enter any values or press Enter to use defaults. For `Common Name`, you can use `localhost`.

### Running with HTTPS

After generating certificates, start the development server:

```bash
npm start  # or npm run dev
```

The app will be available at `https://localhost:3000`

**Note:** Your browser may show a security warning for self-signed certificates. Click "Advanced" and "Proceed to localhost" to continue.

### Disable HTTPS (Optional)

If you prefer to run without HTTPS, edit `vite.config.js` and change:

```javascript
server: {
  port: 3000,
  https: {
    key: fs.readFileSync(path.resolve(__dirname, 'certs/key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, 'certs/cert.pem')),
  },
  // ...rest of config
}
```

To:

```javascript
server: {
  port: 3000,
  // Remove or comment out the https configuration
  // ...rest of config
}
```

**Important:**  Service Worker features only work with HTTPs in production browsers. but Localhost with HTTP should be ok for development

## �📖 Overview

This application demonstrates **offline-first web development** with Service Workers, featuring:

- **🎯 Production-ready PWA** with clean, responsive design
- **📦 Modular demo system** - enable features one by one
- **🔧 Complete caching strategies** (Cache First, Network First, Stale While Revalidate)
- **💾 IndexedDB integration** for offline data storage
- **🌊 Streaming responses** with the Streams API
- **⚡ Background sync** and periodic sync capabilities
- **🎨 Modern UI** with light/dark theme support

## 🏗️ Architecture

### Core Files

```text
src/
├── index.html          # Main app shell
├── app.js              # Application entry point
├── config.js           # Feature flags and configuration
├── sw.js               # Service Worker with toggleable demos
├── sw-helpers.js       # Caching strategies and utilities
├── idb.js              # IndexedDB operations
├── ui.js               # UI helpers and toast notifications
├── routes.js           # Client-side routing
└── styles.css          # Modern CSS with themes
```

### Demo System

```text
src/demos/
├── m1-c3-lifecycle/           # SW Lifecycle events
├── m2-c3-apply-strategies/    # Caching strategies
├── m3-c3-offline-fallback/    # Offline fallback pages
├── m5-c3-streams/             # Streaming responses
└── [22 more demos...]         # Complete demo collection
```

## 🎮 How to Enable Demos

The app runs **cleanly by default** with no demo features enabled. To activate demos:

### Method 1: Uncomment Imports (Recommended)

1. Open `src/sw.js`
2. Uncomment the desired demo import:

```javascript
// Vite is configured with `root: 'src'`, so use root-relative paths (no `/src` prefix):
// importScripts('/demos/m1-c3-lifecycle/index.js');
importScripts('/demos/m1-c3-lifecycle/index.js'); // ✅ Enabled
```

3. Refresh the page

### Method 2: Feature Flags

1. Open `src/config.js`
2. Set the feature flag to `true`:

   ```javascript
   export const FEATURES = {
     M1_C3_LIFECYCLE: true, // ✅ Enabled
     // ... other features
   };
   ```

3. Refresh the page

## 📋 Available Demos

### Module 1: Service Worker Lifecycle

- **m1-c3-lifecycle** - Install, activate, and fetch events
- **m1-c4-register-activate** - Registration and activation patterns
- **m1-c5-intercept** - Request interception techniques

### Module 2: Caching Strategies

- **m2-c1-cache-api** - Basic Cache API operations
- **m2-c2-caching-strategies** - Strategy implementations
- **m2-c3-apply-strategies** - Real-world caching patterns
- **m2-c4-indexeddb-intro** - IndexedDB basics
- **m2-c5-indexeddb-demo** - Full IndexedDB integration

### Module 3: Application Shell

- **m3-c1-app-shell** - App shell caching pattern
- **m3-c2-nav-preload** - Navigation preloading
- **m3-c3-offline-fallback** - Offline page fallbacks
- **m3-c4-updates-broadcast** - Update notifications
- **m3-c5-cleanup-unregister** - Cache cleanup and SW unregistration

### Module 4: Workbox Integration

- **m4-c1-why-workbox** - Workbox benefits demonstration
- **m4-c2-workbox-precaching** - Precaching with Workbox
- **m4-c3-workbox-runtime** - Runtime caching strategies
- **m4-c4-workbox-navigation-fallback** - Navigation fallbacks

### Module 5: Advanced APIs

- **m5-c1-background-sync** - Background synchronization
- **m5-c2-periodic-sync** - Periodic background sync
- **m5-c3-streams** - Streaming responses and real-time data

## 🛠️ Development

### NPM Scripts

```bash
npm start       # Start both API and UI servers (recommended)
npm run dev     # Vite dev server only (http://localhost:3000)
npm run api     # JSON server API only (http://localhost:3001)
npm run build   # Production build
npm run preview # Preview production build
npm run lint    # ESLint code checking
```

### Development Workflow

1. **Start everything:** `npm start` (runs both API and UI)
2. Open DevTools → Application tab
3. Enable a demo in `src/sw.js`
4. Refresh and observe behavior in DevTools

**Alternative workflow:**

1. Start servers separately: `npm run api` and `npm run dev`
2. Follow steps 2-4 above

## 🔍 DevTools Tips

### Service Workers

- **Application → Service Workers** - View registration status
- **Network → Offline** - Test offline functionality
- **Console** - Watch for `[SW]` and `[DEMO]` logs

### Caching

- **Application → Storage → Cache Storage** - Inspect cached resources
- **Network tab** - See cache hits vs network requests
- **Size column** - Identify cached responses

### IndexedDB

- **Application → Storage → IndexedDB** - Browse stored data
- **Console** - Use `window.travelApp.getIdeas()` to inspect data

### Performance

- **Lighthouse** - PWA score and performance metrics
- **Performance tab** - Analyze loading patterns
- **Coverage tab** - Identify unused code

## 🌐 API Endpoints

The mock API server provides:

```bash
GET  /api/deals         # Travel deals
GET  /api/deals/:id     # Specific deal
GET  /api/categories    # Deal categories
GET  /api/health        # Health check
```

## 📱 Progressive Web App Features

### Installation

- **Add to Home Screen** support on mobile
- **Desktop installation** on Chromium browsers
- **Offline functionality** once installed

### Manifest

- Custom icons and splash screens
- Standalone display mode
- Theme color and background color
- App shortcuts for quick access

### Service Worker Features

- **Offline-first** caching strategies
- **Background sync** for data synchronization
- **Push notifications** (when enabled)
- **Update management** with user prompts

## 🎨 UI Features

### Design System

- **CSS variables** for consistent theming
- **Light/dark mode** via `prefers-color-scheme`
- **Responsive design** mobile-first approach
- **Accessibility** with proper ARIA labels and focus management

### Components

- **Toast notifications** for user feedback
- **Loading states** and skeleton screens
- **Update banners** for SW updates
- **Error boundaries** for graceful failures

### Navigation

- **Hash-based routing** for SPA behavior
- **Active link highlighting**
- **Keyboard navigation** support
- **Back/forward button** support

## 🧪 Testing Scenarios

### Offline Testing

1. Enable **Network → Offline** in DevTools
2. Navigate between pages
3. Add travel ideas
4. Check offline fallbacks

### Caching Testing

1. Enable caching demo
2. Load page with Network tab open
3. Refresh and observe cache hits
4. Clear cache and reload

### Update Testing

1. Modify `src/sw.js`
2. Refresh page
3. Observe update banner
4. Click "Refresh" to activate

### Performance Testing

1. Run Lighthouse audit
2. Check PWA score
3. Analyze loading waterfall
4. Test on slow networks

## 🔧 Configuration

### Feature Flags

All demos are controlled by feature flags in `src/config.js`:

```javascript
export const FEATURES = {
  M1_C3_LIFECYCLE: false, // Lifecycle demo
  M2_C3_APPLY_STRATEGIES: false, // Caching strategies
  M3_C3_OFFLINE_FALLBACK: false, // Offline fallbacks
  // ... more features
};
```

### Service Worker

Toggle demos by uncommenting imports in `src/sw.js`:

```javascript
// Uncomment to enable (use root-relative paths):
// importScripts('/demos/m1-c3-lifecycle/index.js');
```

## 📚 Learning Resources

### Service Workers (SW)

- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Google Web Fundamentals](https://developers.google.com/web/fundamentals/primers/service-workers)

### Caching Strategies

- [Workbox Strategies](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)

### Progressive Web Apps

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

## 🐛 Troubleshooting

### Service Worker Not Updating

1. Go to **Application → Service Workers**
2. Check "Update on reload"
3. Click "Unregister" and refresh

Note: If you see console errors like "Failed to load script /src/config.js" or
"importScripts failed", ensure your service worker uses root-relative paths
(for example, `/config.js` not `/src/config.js`) when Vite is configured with
`root: 'src'` (see `vite.config.js`).

### Cache Issues

1. Open **Application → Storage**
2. Click "Clear storage"
3. Refresh the page

### Demo Not Working

1. Check browser console for errors
2. Verify demo is uncommented in `src/sw.js`
3. Ensure page was refreshed after changes

### Build Issues

1. Clear `node_modules` and reinstall
2. Check Node.js version (18+ required)
3. Verify all files are saved

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🤝 Contributing

This is a demo project for educational purposes. Feel free to:

- Fork and experiment
- Report issues
- Suggest improvements
- Create additional demos

---

**Happy coding!** 🚀 Explore the demos, experiment with Service Workers, and build amazing offline-first web applications.
