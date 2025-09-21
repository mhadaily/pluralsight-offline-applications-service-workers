# Travel Planner Offline

This repository contains a simplified Travel Planner app (originally used with a Service Worker demo).
The demo modules and service worker-related code have been removed to keep the app small and focused on the core functionality.

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

## Quick Start

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open <http://localhost:3000> to view the app.

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

This is a compact single-page application demonstrating core app features (routing, ideas management, and UI). Offline and demo features have been removed.

## 🏗️ Architecture

### Core Files

```text
src/
├── index.html          # Main app shell
├── app.js              # Application entry point
├── config.js           # Feature flags and configuration
├── idb.js              # IndexedDB operations
├── ui.js               # UI helpers and toast notifications
├── routes.js           # Client-side routing
└── styles.css          # Modern CSS with themes
```

### Demo System

The demo modules and service worker examples have been removed from this simplified repo.

Demos have been intentionally removed. No action required.

(No demos available in this simplified repository.)

## Development

### NPM Scripts

```bash
npm run dev     # Vite dev server (http://localhost:3000)
npm run api     # JSON server API only (http://localhost:3001)
npm run build   # Production build
npm run preview # Preview production build
npm run lint    # ESLint code checking
```

### Development Workflow

1. **Start everything:** `npm start` (runs both API and UI)
2. Open DevTools → Application tab
3. (Demos removed in this simplified repo)
4. Refresh and observe behavior in DevTools

**Alternative workflow:**

1. Start servers separately: `npm run api` and `npm run dev`
2. Follow steps 2-4 above (note: demo steps removed)

## 🔍 DevTools Tips

### Service Workers

Service worker features have been removed in this simplified repository.

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

Service worker update testing is not applicable in this simplified repository.

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

Service Worker functionality and demos have been removed from this repo.

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

Demos have been removed from this repository.

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
