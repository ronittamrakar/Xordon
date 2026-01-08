// vite.config.ts
import { defineConfig } from "file:///D:/Backup/App%20Backups/Xordon/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Backup/App%20Backups/Xordon/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
var __vite_injected_original_dirname = "D:\\Backup\\App Backups\\Xordon";
var vite_config_default = defineConfig(({ mode }) => ({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test-setup.ts"
  },
  server: {
    host: true,
    // Force Vite to use port 5173 and fail if it's already taken. This prevents
    // automatic port fallback (which can cause HMR/reload loops when multiple
    // servers are competing for ports).
    port: 5173,
    // If another process is using 5173, fail instead of picking the next free port
    // so devs see an explicit error and can resolve the conflict.
    strictPort: true,
    // Ensure HMR uses the same port for websocket connections
    // hmr: { port: 5173 },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
        secure: false,
        ws: true,
        timeout: 3e4,
        // Strip the /api prefix so that frontend calls like
        //   /api/proposal-templates
        // are forwarded to backend route
        //   /proposal-templates
        rewrite: (path2) => path2.replace(/^\/api/, ""),
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, res) => {
            console.log("proxy error", err);
            if (res && !res.headersSent) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Proxy error", message: err.message }));
            }
          });
        }
      },
      "/operations": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
        secure: false,
        ws: true,
        timeout: 3e4,
        // Keep /operations prefix so backend/public/index.php can route it
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, res) => {
            console.log("proxy error", err);
            if (res && !res.headersSent) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Proxy error", message: err.message }));
            }
          });
        }
      },
      // NOTE: /webforms proxy to 3003 removed - Webforms now runs natively in main app
      // Proxy XordonForms API calls to unified backend
      "/webforms-api": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
        secure: false,
        timeout: 3e4,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, res) => {
            console.log("webforms-api proxy error", err);
            if (res && !res.headersSent) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "WebForms API proxy error", message: err.message }));
            }
          });
        }
      },
      "/uploads": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [
    react()
  ],
  resolve: {
    dedupe: ["react", "react-dom", "react-router-dom"],
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "react": path.resolve(__vite_injected_original_dirname, "node_modules/react"),
      "react-dom": path.resolve(__vite_injected_original_dirname, "node_modules/react-dom")
    }
  },
  build: {
    sourcemap: mode === "production",
    // Only generate sourcemaps in production
    minify: "esbuild",
    // Use esbuild for faster, more memory-efficient minification
    target: "esnext",
    // Modern browsers only - smaller bundles
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-label",
            "@radix-ui/react-menubar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-tooltip",
            "lucide-react",
            "sonner"
          ],
          "editor-vendor": ["react-quill-new", "quill"],
          // Feature chunks
          "analytics": ["./src/pages/Analytics", "./src/pages/SMSAnalytics"],
          "campaigns": ["./src/pages/Campaigns", "./src/pages/SMSCampaigns", "./src/pages/SMSCampaignWizard"],
          "forms": ["./src/pages/Forms", "./src/pages/FormPreview", "./src/pages/FormSubmit", "./src/pages/FormReplies"]
        }
      }
    },
    // Increase chunk size warning limit to 1MB
    chunkSizeWarningLimit: 1e3,
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  // Optimize dependencies for better caching and memory usage
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query"
    ],
    exclude: ["@radix-ui/react-icons"]
    // Exclude large icon libraries from pre-bundling
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxCYWNrdXBcXFxcQXBwIEJhY2t1cHNcXFxcWG9yZG9uXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxCYWNrdXBcXFxcQXBwIEJhY2t1cHNcXFxcWG9yZG9uXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9CYWNrdXAvQXBwJTIwQmFja3Vwcy9Yb3Jkb24vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHRlc3Q6IHtcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgIHNldHVwRmlsZXM6ICcuL3NyYy90ZXN0LXNldHVwLnRzJyxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogdHJ1ZSxcbiAgICAvLyBGb3JjZSBWaXRlIHRvIHVzZSBwb3J0IDUxNzMgYW5kIGZhaWwgaWYgaXQncyBhbHJlYWR5IHRha2VuLiBUaGlzIHByZXZlbnRzXG4gICAgLy8gYXV0b21hdGljIHBvcnQgZmFsbGJhY2sgKHdoaWNoIGNhbiBjYXVzZSBITVIvcmVsb2FkIGxvb3BzIHdoZW4gbXVsdGlwbGVcbiAgICAvLyBzZXJ2ZXJzIGFyZSBjb21wZXRpbmcgZm9yIHBvcnRzKS5cbiAgICBwb3J0OiA1MTczLFxuICAgIC8vIElmIGFub3RoZXIgcHJvY2VzcyBpcyB1c2luZyA1MTczLCBmYWlsIGluc3RlYWQgb2YgcGlja2luZyB0aGUgbmV4dCBmcmVlIHBvcnRcbiAgICAvLyBzbyBkZXZzIHNlZSBhbiBleHBsaWNpdCBlcnJvciBhbmQgY2FuIHJlc29sdmUgdGhlIGNvbmZsaWN0LlxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgLy8gRW5zdXJlIEhNUiB1c2VzIHRoZSBzYW1lIHBvcnQgZm9yIHdlYnNvY2tldCBjb25uZWN0aW9uc1xuICAgIC8vIGhtcjogeyBwb3J0OiA1MTczIH0sXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjgwMDEnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHdzOiB0cnVlLFxuICAgICAgICB0aW1lb3V0OiAzMDAwMCxcbiAgICAgICAgLy8gU3RyaXAgdGhlIC9hcGkgcHJlZml4IHNvIHRoYXQgZnJvbnRlbmQgY2FsbHMgbGlrZVxuICAgICAgICAvLyAgIC9hcGkvcHJvcG9zYWwtdGVtcGxhdGVzXG4gICAgICAgIC8vIGFyZSBmb3J3YXJkZWQgdG8gYmFja2VuZCByb3V0ZVxuICAgICAgICAvLyAgIC9wcm9wb3NhbC10ZW1wbGF0ZXNcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sICcnKSxcbiAgICAgICAgY29uZmlndXJlOiAocHJveHksIF9vcHRpb25zKSA9PiB7XG4gICAgICAgICAgcHJveHkub24oJ2Vycm9yJywgKGVyciwgX3JlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygncHJveHkgZXJyb3InLCBlcnIpO1xuICAgICAgICAgICAgaWYgKHJlcyAmJiAhcmVzLmhlYWRlcnNTZW50KSB7XG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNTAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1Byb3h5IGVycm9yJywgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgfVxuICAgICAgLFxuICAgICAgJy9vcGVyYXRpb25zJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjgwMDEnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHdzOiB0cnVlLFxuICAgICAgICB0aW1lb3V0OiAzMDAwMCxcbiAgICAgICAgLy8gS2VlcCAvb3BlcmF0aW9ucyBwcmVmaXggc28gYmFja2VuZC9wdWJsaWMvaW5kZXgucGhwIGNhbiByb3V0ZSBpdFxuICAgICAgICBjb25maWd1cmU6IChwcm94eSwgX29wdGlvbnMpID0+IHtcbiAgICAgICAgICBwcm94eS5vbignZXJyb3InLCAoZXJyLCBfcmVxLCByZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdwcm94eSBlcnJvcicsIGVycik7XG4gICAgICAgICAgICBpZiAocmVzICYmICFyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnUHJveHkgZXJyb3InLCBtZXNzYWdlOiBlcnIubWVzc2FnZSB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgLy8gTk9URTogL3dlYmZvcm1zIHByb3h5IHRvIDMwMDMgcmVtb3ZlZCAtIFdlYmZvcm1zIG5vdyBydW5zIG5hdGl2ZWx5IGluIG1haW4gYXBwXG4gICAgICAvLyBQcm94eSBYb3Jkb25Gb3JtcyBBUEkgY2FsbHMgdG8gdW5pZmllZCBiYWNrZW5kXG4gICAgICAnL3dlYmZvcm1zLWFwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovLzEyNy4wLjAuMTo4MDAxJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICB0aW1lb3V0OiAzMDAwMCxcbiAgICAgICAgY29uZmlndXJlOiAocHJveHksIF9vcHRpb25zKSA9PiB7XG4gICAgICAgICAgcHJveHkub24oJ2Vycm9yJywgKGVyciwgX3JlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnd2ViZm9ybXMtYXBpIHByb3h5IGVycm9yJywgZXJyKTtcbiAgICAgICAgICAgIGlmIChyZXMgJiYgIXJlcy5oZWFkZXJzU2VudCkge1xuICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdXZWJGb3JtcyBBUEkgcHJveHkgZXJyb3InLCBtZXNzYWdlOiBlcnIubWVzc2FnZSB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgJy91cGxvYWRzJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjgwMDEnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICB9LFxuICAgIH1cbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBkZWR1cGU6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgICAncmVhY3QnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnbm9kZV9tb2R1bGVzL3JlYWN0JyksXG4gICAgICAncmVhY3QtZG9tJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ25vZGVfbW9kdWxlcy9yZWFjdC1kb20nKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIHNvdXJjZW1hcDogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nLCAvLyBPbmx5IGdlbmVyYXRlIHNvdXJjZW1hcHMgaW4gcHJvZHVjdGlvblxuICAgIG1pbmlmeTogJ2VzYnVpbGQnLCAvLyBVc2UgZXNidWlsZCBmb3IgZmFzdGVyLCBtb3JlIG1lbW9yeS1lZmZpY2llbnQgbWluaWZpY2F0aW9uXG4gICAgdGFyZ2V0OiAnZXNuZXh0JywgLy8gTW9kZXJuIGJyb3dzZXJzIG9ubHkgLSBzbWFsbGVyIGJ1bmRsZXNcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgLy8gVmVuZG9yIGxpYnJhcmllc1xuICAgICAgICAgICdyZWFjdC12ZW5kb3InOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgJ3VpLXZlbmRvcic6IFtcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtYWNjb3JkaW9uJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtYWxlcnQtZGlhbG9nJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtYXNwZWN0LXJhdGlvJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtYXZhdGFyJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtY2hlY2tib3gnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1jb2xsYXBzaWJsZScsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWNvbnRleHQtbWVudScsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWRpYWxvZycsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnUnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1ob3Zlci1jYXJkJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtbGFiZWwnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1tZW51YmFyJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtbmF2aWdhdGlvbi1tZW51JyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtcG9wb3ZlcicsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXByb2dyZXNzJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtcmFkaW8tZ3JvdXAnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1zY3JvbGwtYXJlYScsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNlbGVjdCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNlcGFyYXRvcicsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNsaWRlcicsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNsb3QnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1zd2l0Y2gnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10YWJzJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdG9hc3QnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10b2dnbGUnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10b2dnbGUtZ3JvdXAnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10b29sdGlwJyxcbiAgICAgICAgICAgICdsdWNpZGUtcmVhY3QnLFxuICAgICAgICAgICAgJ3Nvbm5lcidcbiAgICAgICAgICBdLFxuICAgICAgICAgICdlZGl0b3ItdmVuZG9yJzogWydyZWFjdC1xdWlsbC1uZXcnLCAncXVpbGwnXSxcbiAgICAgICAgICAvLyBGZWF0dXJlIGNodW5rc1xuICAgICAgICAgICdhbmFseXRpY3MnOiBbJy4vc3JjL3BhZ2VzL0FuYWx5dGljcycsICcuL3NyYy9wYWdlcy9TTVNBbmFseXRpY3MnXSxcbiAgICAgICAgICAnY2FtcGFpZ25zJzogWycuL3NyYy9wYWdlcy9DYW1wYWlnbnMnLCAnLi9zcmMvcGFnZXMvU01TQ2FtcGFpZ25zJywgJy4vc3JjL3BhZ2VzL1NNU0NhbXBhaWduV2l6YXJkJ10sXG4gICAgICAgICAgJ2Zvcm1zJzogWycuL3NyYy9wYWdlcy9Gb3JtcycsICcuL3NyYy9wYWdlcy9Gb3JtUHJldmlldycsICcuL3NyYy9wYWdlcy9Gb3JtU3VibWl0JywgJy4vc3JjL3BhZ2VzL0Zvcm1SZXBsaWVzJ10sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgLy8gSW5jcmVhc2UgY2h1bmsgc2l6ZSB3YXJuaW5nIGxpbWl0IHRvIDFNQlxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcbiAgICAvLyBPcHRpbWl6ZSBkZXBlbmRlbmNpZXNcbiAgICBjb21tb25qc09wdGlvbnM6IHtcbiAgICAgIGluY2x1ZGU6IFsvbm9kZV9tb2R1bGVzL10sXG4gICAgICB0cmFuc2Zvcm1NaXhlZEVzTW9kdWxlczogdHJ1ZSxcbiAgICB9LFxuICB9LFxuICAvLyBPcHRpbWl6ZSBkZXBlbmRlbmNpZXMgZm9yIGJldHRlciBjYWNoaW5nIGFuZCBtZW1vcnkgdXNhZ2VcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1xuICAgICAgJ3JlYWN0JyxcbiAgICAgICdyZWFjdC1kb20nLFxuICAgICAgJ3JlYWN0LXJvdXRlci1kb20nLFxuICAgICAgJ0B0YW5zdGFjay9yZWFjdC1xdWVyeScsXG4gICAgXSxcbiAgICBleGNsdWRlOiBbJ0ByYWRpeC11aS9yZWFjdC1pY29ucyddLCAvLyBFeGNs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QUFRLGtDQUFXLE9BQU87QUFBQSxNQUNwQyxTQUFTLEtBQUssUUFBUSxrQ0FBVyxvQkFBb0I7QUFBQSxNQUNyRCxhQUFhLEtBQUssUUFBUSxrQ0FBVyx3QkFBd0I7QUFBQSxJQUMvRDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFdBQVcsU0FBUztBQUFBO0FBQUEsSUFDcEIsUUFBUTtBQUFBO0FBQUEsSUFDUixRQUFRO0FBQUE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQTtBQUFBLFVBRVosZ0JBQWdCLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFVBQ3pELGFBQWE7QUFBQSxZQUNYO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBLGlCQUFpQixDQUFDLG1CQUFtQixPQUFPO0FBQUE7QUFBQSxVQUU1QyxhQUFhLENBQUMseUJBQXlCLDBCQUEwQjtBQUFBLFVBQ2pFLGFBQWEsQ0FBQyx5QkFBeUIsNEJBQTRCLCtCQUErQjtBQUFBLFVBQ2xHLFNBQVMsQ0FBQyxxQkFBcUIsMkJBQTJCLDBCQUEwQix5QkFBeUI7QUFBQSxRQUMvRztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLHVCQUF1QjtBQUFBO0FBQUEsSUFFdkIsaUJBQWlCO0FBQUEsTUFDZixTQUFTLENBQUMsY0FBYztBQUFBLE1BQ3hCLHlCQUF5QjtBQUFBLElBQzNCO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFFQSxjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVMsQ0FBQyx1QkFBdUI7QUFBQTtBQUFBLEVBQ25DO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFsicGF0aCJdCn0K
