import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

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
        dedupe: ['react', 'react-dom', 'react-router-dom'],
        alias: {
            "@": path.resolve(__dirname, "./src"),
            'react': path.resolve(__dirname, 'node_modules/react'),
            'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        },
    },
    build: {
        sourcemap: mode === 'production',
        minify: 'esbuild',
        target: 'esnext',
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Core React libraries
                    if (id.includes('node_modules/react') ||
                        id.includes('node_modules/react-dom') ||
                        id.includes('node_modules/react-router-dom')) {
                        return 'react-core';
                    }

                    // Radix UI components
                    if (id.includes('node_modules/@radix-ui')) {
                        return 'ui-radix';
                    }

                    // Lucide icons
                    if (id.includes('node_modules/lucide-react')) {
                        return 'icons';
                    }

                    // React Query
                    if (id.includes('node_modules/@tanstack/react-query')) {
                        return 'react-query';
                    }

                    // Charts
                    if (id.includes('node_modules/recharts')) {
                        return 'charts';
                    }

                    // Forms
                    if (id.includes('node_modules/react-hook-form') ||
                        id.includes('node_modules/@hookform') ||
                        id.includes('node_modules/zod')) {
                        return 'forms';
                    }

                    // Rich text editor
                    if (id.includes('node_modules/react-quill-new') ||
                        id.includes('node_modules/quill')) {
                        return 'editor';
                    }

                    // Date utilities
                    if (id.includes('node_modules/date-fns')) {
                        return 'date-utils';
                    }

                    // DND Kit
                    if (id.includes('node_modules/@dnd-kit')) {
                        return 'dnd-kit';
                    }

                    // Feature-based chunking for app code
                    if (id.includes('/src/pages/')) {
                        // CRM Module
                        if (id.includes('/pages/crm/')) {
                            return 'feature-crm';
                        }

                        // Outreach Module
                        if (id.includes('/pages/Campaigns') ||
                            id.includes('/pages/Templates') ||
                            id.includes('/pages/Sequences') ||
                            id.includes('/pages/SMS')) {
                            return 'feature-outreach';
                        }

                        // Finance Module
                        if (id.includes('/pages/finance/')) {
                            return 'feature-finance';
                        }

                        // HR Module
                        if (id.includes('/pages/hr/')) {
                            return 'feature-hr';
                        }

                        // Marketing Module
                        if (id.includes('/pages/growth/') ||
                            id.includes('/pages/marketing/')) {
                            return 'feature-marketing';
                        }

                        // Helpdesk Module
                        if (id.includes('/pages/Ticket') ||
                            id.includes('/pages/Helpdesk') ||
                            id.includes('/pages/CSAT') ||
                            id.includes('/pages/SLA')) {
                            return 'feature-helpdesk';
                        }

                        // WebForms Module
                        if (id.includes('/pages/webforms/')) {
                            return 'feature-webforms';
                        }

                        // Operations Module
                        if (id.includes('/pages/operations/') ||
                            id.includes('/pages/Appointments') ||
                            id.includes('/pages/Jobs')) {
                            return 'feature-operations';
                        }

                        // Calls Module
                        if (id.includes('/pages/calls/')) {
                            return 'feature-calls';
                        }

                        // Marketplace Module
                        if (id.includes('/pages/marketplace/')) {
                            return 'feature-marketplace';
                        }

                        // Core pages (Dashboard, Settings, etc.)
                        return 'feature-core';
                    }

                    // Components
                    if (id.includes('/src/components/')) {
                        // Layout components
                        if (id.includes('/components/layout/') ||
                            id.includes('/components/ui/')) {
                            return 'components-ui';
                        }

                        // Feature-specific components
                        return 'components-feature';
                    }

                    // Other node_modules
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                },
            },
        },
        chunkSizeWarningLimit: 1000,
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
            '@tanstack/react-query',
        ],
        exclude: ['@radix-ui/react-icons'],
    },
}));
