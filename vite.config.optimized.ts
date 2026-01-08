import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from 'rollup-plugin-visualizer';

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
        hmr: { port: 5173 },
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
            '/operations': {
                target: 'http://127.0.0.1:8001',
                changeOrigin: true,
                secure: false,
                ws: true,
                timeout: 30000,
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
        }
    },
    plugins: [
        react(),
        // Bundle analyzer - generates stats.html after build
        mode === 'analyze' && visualizer({
            open: true,
            filename: 'dist/stats.html',
            gzipSize: true,
            brotliSize: true,
        }),
    ].filter(Boolean),
    resolve: {
        dedupe: ['react', 'react-dom', 'react-router-dom'],
        alias: {
            "@": path.resolve(__dirname, "./src"),
            'react': path.resolve(__dirname, 'node_modules/react'),
            'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        },
    },
    build: {
        // Optimize chunk splitting
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Vendor chunks
                    if (id.includes('node_modules')) {
                        // React ecosystem
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                            return 'react-vendor';
                        }
                        // Radix UI components
                        if (id.includes('@radix-ui')) {
                            return 'ui-vendor';
                        }
                        // Rich text editor
                        if (id.includes('quill') || id.includes('react-quill')) {
                            return 'editor-vendor';
                        }
                        // Charts
                        if (id.includes('recharts')) {
                            return 'charts-vendor';
                        }
                        // React Query
                        if (id.includes('@tanstack/react-query')) {
                            return 'query-vendor';
                        }
                        // Icons
                        if (id.includes('lucide-react')) {
                            return 'icons-vendor';
                        }
                        // Other vendors
                        return 'vendor';
                    }

                    // Feature-based chunks
                    if (id.includes('/pages/growth/')) {
                        return 'growth-features';
                    }
                    if (id.includes('/pages/crm/')) {
                        return 'crm-features';
                    }
                    if (id.includes('/pages/hr/')) {
                        return 'hr-features';
                    }
                    if (id.includes('/pages/marketplace/')) {
                        return 'marketplace-features';
                    }
                    if (id.includes('/pages/webforms/')) {
                        return 'webforms-features';
                    }
                    if (id.includes('/pages/calls/')) {
                        return 'calls-features';
                    }
                    if (id.includes('/pages/sms/')) {
                        return 'sms-features';
                    }
                },
            },
        },
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
        // Minification
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: mode === 'production', // Remove console.log in production
                drop_debugger: true,
                pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
            },
        },
        // Source maps only in development
        sourcemap: mode !== 'production',
    },
    // Optimize dependencies
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            '@tanstack/react-query',
        ],
        exclude: [
            // Exclude large dependencies that don't need pre-bundling
        ],
    },
}));
