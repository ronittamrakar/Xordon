import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Trigger restart: 2026-01-06T22:05:00-RELOAD-DEPS


export default defineConfig(({ mode }) => ({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        secure: false,
        ws: true,
        timeout: 30000,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.log('proxy error', err);
            if (res && !res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
            }
          });
        },
      },
      '/webforms-api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.log('webforms-api proxy error', err);
            if (res && !res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'WebForms API proxy error', message: err.message }));
            }
          });
        },
      },
      '/uploads': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        secure: false,
      },
    }
  },
  plugins: [
    react(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: mode === 'production',
    minify: 'esbuild',
    target: 'esnext',
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core Framework - MUST stay together to avoid "Invalid Hook Call"
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router/') ||
            id.includes('node_modules/react-router-dom/') ||
            id.includes('node_modules/@remix-run/router/')
          ) {
            return 'framework';
          }

          // UI libraries - heavy components split separately
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide-icons';
          }
          if (id.includes('node_modules/sonner')) {
            return 'sonner';
          }

          // All other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@remix-run/router',
      '@tanstack/react-query',
      'react-grid-layout/legacy',
      'react-resizable',
      'reactflow',
      'recharts',
      'lucide-react',
      'date-fns',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
    ],
    // force: true, // Removed to prevent 504 errors on reload
    esbuildOptions: {
      target: 'esnext',
    },
  },
  cacheDir: 'node_modules/.vite',
}));
