import { defineConfig } from 'vite';
import {
  copyFileSync,
  existsSync,
  writeFileSync,
  mkdirSync,
  readFileSync,
} from 'fs';
import { resolve } from 'path';
import { createHash } from 'crypto';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve('./src/index.html'),
    },
    manifest: true, // Generate manifest for service worker
  },
  plugins: [
    {
      name: 'copy-sw-files-and-generate-precache',
      generateBundle(options, bundle) {
        // First, let's generate hashed view files and get their names
        const viewFiles = [
          'home.html',
          'ideas.html',
          'deals.html',
          'streams.html',
          'settings.html',
        ];
        const hashedViewFiles = [];

        viewFiles.forEach((file) => {
          const srcPath = resolve('src', 'views', file);

          if (existsSync(srcPath)) {
            // Read file content to create hash
            const content = readFileSync(srcPath, 'utf8');
            const hash = createHash('md5')
              .update(content)
              .digest('hex')
              .substring(0, 8);

            // Create hashed filename
            const baseName = file.replace('.html', '');
            const hashedName = `${baseName}-${hash}.html`;

            hashedViewFiles.push(`/views/${hashedName}`);
          }
        });

        // Generate precache manifest for service worker
        const precacheManifest = [];

        // Add the main HTML file
        precacheManifest.push({
          url: '/',
          revision: Date.now().toString(),
        });

        // Add all generated assets (JS, CSS)
        Object.keys(bundle).forEach((fileName) => {
          const file = bundle[fileName];
          if (file.type === 'asset' || file.type === 'chunk') {
            // Skip the vite manifest and source maps
            if (
              !fileName.includes('manifest.json') &&
              !fileName.includes('.map') &&
              fileName !== '.vite/manifest.json'
            ) {
              precacheManifest.push({
                url: `/${fileName}`,
                revision: null, // Vite already handles versioning with hashes
              });
            }
          }
        });

        // Add hashed view files (no revision needed since filename includes hash)
        hashedViewFiles.forEach((viewFile) => {
          precacheManifest.push({
            url: viewFile,
            revision: null,
          });
        });

        // Add static assets from public folder (these need revisions since they're not hashed)
        const staticAssets = [
          '/manifest.json',
          '/offline.html',
          '/icons/icon-192.png',
          '/icons/icon-192.svg',
          '/icons/icon-512.png',
          '/icons/icon-512.svg',
          '/fallback-image.png',
          '/fallback-image.svg',
          '/view-manifest.js', // Add view manifest for offline access
        ];

        staticAssets.forEach((asset) => {
          precacheManifest.push({
            url: asset,
            revision: Date.now().toString(),
          });
        });

        // Write the precache manifest
        const manifestContent = `// Auto-generated precache manifest
self.__WB_MANIFEST = ${JSON.stringify(precacheManifest, null, 2)};`;

        writeFileSync(resolve('dist', 'precache-manifest.js'), manifestContent);
        console.log(
          '[Build] ✅ Generated precache manifest with',
          precacheManifest.length,
          'assets'
        );
      },

      writeBundle() {
        // Copy service worker files to dist root
        const swFiles = ['sw.js', 'sw-helpers.js', 'sw-config.js'];

        swFiles.forEach((file) => {
          const srcPath = resolve('src', file);
          const distPath = resolve('dist', file);

          if (existsSync(srcPath)) {
            copyFileSync(srcPath, distPath);
            console.log(`[Build] ✅ Copied ${file} to dist root`);
          }
        });

        // Copy view files with content-based hashing
        const viewsDir = resolve('dist', 'views');

        // Create views directory if it doesn't exist
        if (!existsSync(viewsDir)) {
          mkdirSync(viewsDir, { recursive: true });
        }

        const viewFiles = [
          'home.html',
          'ideas.html',
          'deals.html',
          'streams.html',
          'settings.html',
        ];

        const viewManifest = {};

        viewFiles.forEach((file) => {
          const srcPath = resolve('src', 'views', file);

          if (existsSync(srcPath)) {
            // Read file content to create hash
            const content = readFileSync(srcPath, 'utf8');
            const hash = createHash('md5')
              .update(content)
              .digest('hex')
              .substring(0, 8);

            // Create hashed filename
            const baseName = file.replace('.html', '');
            const hashedName = `${baseName}-${hash}.html`;
            const distPath = resolve('dist', 'views', hashedName);

            // Copy file with hashed name
            copyFileSync(srcPath, distPath);
            console.log(
              `[Build] ✅ Copied views/${file} to views/${hashedName}`
            );

            // Store mapping for router to use
            viewManifest[baseName] = hashedName;
          }
        });

        // Write view manifest for router
        const manifestContent = `// Auto-generated view manifest
window.__VIEW_MANIFEST = ${JSON.stringify(viewManifest, null, 2)};`;

        writeFileSync(resolve('dist', 'view-manifest.js'), manifestContent);
        console.log('[Build] ✅ Generated view manifest');
      },
    },
  ],
  preview: {
    port: 3000,
  },
});
