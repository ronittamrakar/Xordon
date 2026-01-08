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
      // '/operations' proxy removed to allow frontend routing for /operations pages
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxCYWNrdXBcXFxcQXBwIEJhY2t1cHNcXFxcWG9yZG9uXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxCYWNrdXBcXFxcQXBwIEJhY2t1cHNcXFxcWG9yZG9uXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9CYWNrdXAvQXBwJTIwQmFja3Vwcy9Yb3Jkb24vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHRlc3Q6IHtcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgIHNldHVwRmlsZXM6ICcuL3NyYy90ZXN0LXNldHVwLnRzJyxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogdHJ1ZSxcbiAgICAvLyBGb3JjZSBWaXRlIHRvIHVzZSBwb3J0IDUxNzMgYW5kIGZhaWwgaWYgaXQncyBhbHJlYWR5IHRha2VuLiBUaGlzIHByZXZlbnRzXG4gICAgLy8gYXV0b21hdGljIHBvcnQgZmFsbGJhY2sgKHdoaWNoIGNhbiBjYXVzZSBITVIvcmVsb2FkIGxvb3BzIHdoZW4gbXVsdGlwbGVcbiAgICAvLyBzZXJ2ZXJzIGFyZSBjb21wZXRpbmcgZm9yIHBvcnRzKS5cbiAgICBwb3J0OiA1MTczLFxuICAgIC8vIElmIGFub3RoZXIgcHJvY2VzcyBpcyB1c2luZyA1MTczLCBmYWlsIGluc3RlYWQgb2YgcGlja2luZyB0aGUgbmV4dCBmcmVlIHBvcnRcbiAgICAvLyBzbyBkZXZzIHNlZSBhbiBleHBsaWNpdCBlcnJvciBhbmQgY2FuIHJlc29sdmUgdGhlIGNvbmZsaWN0LlxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgLy8gRW5zdXJlIEhNUiB1c2VzIHRoZSBzYW1lIHBvcnQgZm9yIHdlYnNvY2tldCBjb25uZWN0aW9uc1xuICAgIC8vIGhtcjogeyBwb3J0OiA1MTczIH0sXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjgwMDEnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHRpbWVvdXQ6IDMwMDAwLFxuICAgICAgICAvLyBTdHJpcCB0aGUgL2FwaSBwcmVmaXggc28gdGhhdCBmcm9udGVuZCBjYWxscyBsaWtlXG4gICAgICAgIC8vICAgL2FwaS9wcm9wb3NhbC10ZW1wbGF0ZXNcbiAgICAgICAgLy8gYXJlIGZvcndhcmRlZCB0byBiYWNrZW5kIHJvdXRlXG4gICAgICAgIC8vICAgL3Byb3Bvc2FsLXRlbXBsYXRlc1xuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJycpLFxuICAgICAgICBjb25maWd1cmU6IChwcm94eSwgX29wdGlvbnMpID0+IHtcbiAgICAgICAgICBwcm94eS5vbignZXJyb3InLCAoZXJyLCBfcmVxLCByZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdwcm94eSBlcnJvcicsIGVycik7XG4gICAgICAgICAgICBpZiAocmVzICYmICFyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnUHJveHkgZXJyb3InLCBtZXNzYWdlOiBlcnIubWVzc2FnZSB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgICAsXG4gICAgICAvLyAnL29wZXJhdGlvbnMnIHByb3h5IHJlbW92ZWQgdG8gYWxsb3cgZnJvbnRlbmQgcm91dGluZyBmb3IgL29wZXJhdGlvbnMgcGFnZXNcbiAgICAgIC8vIE5PVEU6IC93ZWJmb3JtcyBwcm94eSB0byAzMDAzIHJlbW92ZWQgLSBXZWJmb3JtcyBub3cgcnVucyBuYXRpdmVseSBpbiBtYWluIGFwcFxuICAgICAgLy8gUHJveHkgWG9yZG9uRm9ybXMgQVBJIGNhbGxzIHRvIHVuaWZpZWQgYmFja2VuZFxuICAgICAgJy93ZWJmb3Jtcy1hcGknOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly8xMjcuMC4wLjE6ODAwMScsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgdGltZW91dDogMzAwMDAsXG4gICAgICAgIGNvbmZpZ3VyZTogKHByb3h5LCBfb3B0aW9ucykgPT4ge1xuICAgICAgICAgIHByb3h5Lm9uKCdlcnJvcicsIChlcnIsIF9yZXEsIHJlcykgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3dlYmZvcm1zLWFwaSBwcm94eSBlcnJvcicsIGVycik7XG4gICAgICAgICAgICBpZiAocmVzICYmICFyZXMuaGVhZGVyc1NlbnQpIHtcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnV2ViRm9ybXMgQVBJIHByb3h5IGVycm9yJywgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgICcvdXBsb2Fkcyc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovLzEyNy4wLjAuMTo4MDAxJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9XG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgZGVkdXBlOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgJ3JlYWN0JzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ25vZGVfbW9kdWxlcy9yZWFjdCcpLFxuICAgICAgJ3JlYWN0LWRvbSc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdub2RlX21vZHVsZXMvcmVhY3QtZG9tJyksXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBzb3VyY2VtYXA6IG1vZGUgPT09ICdwcm9kdWN0aW9uJywgLy8gT25seSBnZW5lcmF0ZSBzb3VyY2VtYXBzIGluIHByb2R1Y3Rpb25cbiAgICBtaW5pZnk6ICdlc2J1aWxkJywgLy8gVXNlIGVzYnVpbGQgZm9yIGZhc3RlciwgbW9yZSBtZW1vcnktZWZmaWNpZW50IG1pbmlmaWNhdGlvblxuICAgIHRhcmdldDogJ2VzbmV4dCcsIC8vIE1vZGVybiBicm93c2VycyBvbmx5IC0gc21hbGxlciBidW5kbGVzXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIC8vIFZlbmRvciBsaWJyYXJpZXNcbiAgICAgICAgICAncmVhY3QtdmVuZG9yJzogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgICd1aS12ZW5kb3InOiBbXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWFjY29yZGlvbicsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWFsZXJ0LWRpYWxvZycsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWFzcGVjdC1yYXRpbycsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWF2YXRhcicsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWNoZWNrYm94JyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtY29sbGFwc2libGUnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1jb250ZXh0LW1lbnUnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51JyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtaG92ZXItY2FyZCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWxhYmVsJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtbWVudWJhcicsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LW5hdmlnYXRpb24tbWVudScsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXBvcG92ZXInLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1wcm9ncmVzcycsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXJhZGlvLWdyb3VwJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3Qtc2Nyb2xsLWFyZWEnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1zZWxlY3QnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1zZXBhcmF0b3InLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1zbGlkZXInLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1zbG90JyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3Qtc3dpdGNoJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdGFicycsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXRvYXN0JyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdG9nZ2xlJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdG9nZ2xlLWdyb3VwJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdG9vbHRpcCcsXG4gICAgICAgICAgICAnbHVjaWRlLXJlYWN0JyxcbiAgICAgICAgICAgICdzb25uZXInXG4gICAgICAgICAgXSxcbiAgICAgICAgICAnZWRpdG9yLXZlbmRvcic6IFsncmVhY3QtcXVpbGwtbmV3JywgJ3F1aWxsJ10sXG4gICAgICAgICAgLy8gRmVhdHVyZSBjaHVua3NcbiAgICAgICAgICAnYW5hbHl0aWNzJzogWycuL3NyYy9wYWdlcy9BbmFseXRpY3MnLCAnLi9zcmMvcGFnZXMvU01TQW5hbHl0aWNzJ10sXG4gICAgICAgICAgJ2NhbXBhaWducyc6IFsnLi9zcmMvcGFnZXMvQ2FtcGFpZ25zJywgJy4vc3JjL3BhZ2VzL1NNU0NhbXBhaWducycsICcuL3NyYy9wYWdlcy9TTVNDYW1wYWlnbldpemFyZCddLFxuICAgICAgICAgICdmb3Jtcyc6IFsnLi9zcmMvcGFnZXMvRm9ybXMnLCAnLi9zcmMvcGFnZXMvRm9ybVByZXZpZXcnLCAnLi9zcmMvcGFnZXMvRm9ybVN1Ym1pdCcsICcuL3NyYy9wYWdlcy9Gb3JtUmVwbGllcyddLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIC8vIEluY3JlYXNlIGNodW5rIHNpemUgd2FybmluZyBsaW1pdCB0byAxTUJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgLy8gT3B0aW1pemUgZGVwZW5kZW5jaWVzXG4gICAgY29tbW9uanNPcHRpb25zOiB7XG4gICAgICBpbmNsdWRlOiBbL25vZGVfbW9kdWxlcy9dLFxuICAgICAgdHJhbnNmb3JtTWl4ZWRFc01vZHVsZXM6IHRydWUsXG4gICAgfSxcbiAgfSxcbiAgLy8gT3B0aW1pemUgZGVwZW5kZW5jaWVzIGZvciBiZXR0ZXIgY2FjaGluZyBhbmQgbWVtb3J5IHVzYWdlXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcbiAgICAgICdyZWFjdCcsXG4gICAgICAncmVhY3QtZG9tJyxcbiAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcbiAgICAgICdAdGFuc3RhY2svcmVhY3QtcXVlcnknLFxuICAgIF0sXG4gICAgZXhjbHVkZTogWydAcmFkaXgtdWkvcmVhY3QtaWNvbnMnXSwgLy8gRXhjbHVkZSBsYXJnZSBpY29uIGxpYnJhcmllcyBmcm9tIHByZS1idW5kbGluZ1xuICB9LFxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFnUixTQUFTLG9CQUFvQjtBQUM3UyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBSXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsTUFBTTtBQUFBLElBQ0osU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsWUFBWTtBQUFBLEVBQ2Q7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUlOLE1BQU07QUFBQTtBQUFBO0FBQUEsSUFHTixZQUFZO0FBQUE7QUFBQTtBQUFBLElBR1osT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFLVCxTQUFTLENBQUNBLFVBQVNBLE1BQUssUUFBUSxVQUFVLEVBQUU7QUFBQSxRQUM1QyxXQUFXLENBQUMsT0FBTyxhQUFhO0FBQzlCLGdCQUFNLEdBQUcsU0FBUyxDQUFDLEtBQUss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
