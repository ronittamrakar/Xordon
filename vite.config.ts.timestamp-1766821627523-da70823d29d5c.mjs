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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxCYWNrdXBcXFxcQXBwIEJhY2t1cHNcXFxcWG9yZG9uXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxCYWNrdXBcXFxcQXBwIEJhY2t1cHNcXFxcWG9yZG9uXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9CYWNrdXAvQXBwJTIwQmFja3Vwcy9Yb3Jkb24vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHRlc3Q6IHtcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgIHNldHVwRmlsZXM6ICcuL3NyYy90ZXN0LXNldHVwLnRzJyxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogdHJ1ZSxcbiAgICAvLyBGb3JjZSBWaXRlIHRvIHVzZSBwb3J0IDUxNzMgYW5kIGZhaWwgaWYgaXQncyBhbHJlYWR5IHRha2VuLiBUaGlzIHByZXZlbnRzXG4gICAgLy8gYXV0b21hdGljIHBvcnQgZmFsbGJhY2sgKHdoaWNoIGNhbiBjYXVzZSBITVIvcmVsb2FkIGxvb3BzIHdoZW4gbXVsdGlwbGVcbiAgICAvLyBzZXJ2ZXJzIGFyZSBjb21wZXRpbmcgZm9yIHBvcnRzKS5cbiAgICBwb3J0OiA1MTczLFxuICAgIC8vIElmIGFub3RoZXIgcHJvY2VzcyBpcyB1c2luZyA1MTczLCBmYWlsIGluc3RlYWQgb2YgcGlja2luZyB0aGUgbmV4dCBmcmVlIHBvcnRcbiAgICAvLyBzbyBkZXZzIHNlZSBhbiBleHBsaWNpdCBlcnJvciBhbmQgY2FuIHJlc29sdmUgdGhlIGNvbmZsaWN0LlxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgLy8gRW5zdXJlIEhNUiB1c2VzIHRoZSBzYW1lIHBvcnQgZm9yIHdlYnNvY2tldCBjb25uZWN0aW9uc1xuICAgIC8vIGhtcjogeyBwb3J0OiA1MTczIH0sXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjgwMDEnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHdzOiB0cnVlLFxuICAgICAgICB0aW1lb3V0OiAzMDAwMCxcbiAgICAgICAgLy8gU3RyaXAgdGhlIC9hcGkgcHJlZml4IHNvIHRoYXQgZnJvbnRlbmQgY2FsbHMgbGlrZVxuICAgICAgICAvLyAgIC9hcGkvcHJvcG9zYWwtdGVtcGxhdGVzXG4gICAgICAgIC8vIGFyZSBmb3J3YXJkZWQgdG8gYmFja2VuZCByb3V0ZVxuICAgICAgICAvLyAgIC9wcm9wb3NhbC10ZW1wbGF0ZXNcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sICcnKSxcbiAgICAgICAgY29uZmlndXJlOiAocHJveHksIF9vcHRpb25zKSA9PiB7XG4gICAgICAgICAgcHJveHkub24oJ2Vycm9yJywgKGVyciwgX3JlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygncHJveHkgZXJyb3InLCBlcnIpO1xuICAgICAgICAgICAgaWYgKHJlcyAmJiAhcmVzLmhlYWRlcnNTZW50KSB7XG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNTAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1Byb3h5IGVycm9yJywgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgfVxuICAgICAgLFxuICAgICAgLy8gJy9vcGVyYXRpb25zJyBwcm94eSByZW1vdmVkIHRvIGFsbG93IGZyb250ZW5kIHJvdXRpbmcgZm9yIC9vcGVyYXRpb25zIHBhZ2VzXG4gICAgICAvLyBOT1RFOiAvd2ViZm9ybXMgcHJveHkgdG8gMzAwMyByZW1vdmVkIC0gV2ViZm9ybXMgbm93IHJ1bnMgbmF0aXZlbHkgaW4gbWFpbiBhcHBcbiAgICAgIC8vIFByb3h5IFhvcmRvbkZvcm1zIEFQSSBjYWxscyB0byB1bmlmaWVkIGJhY2tlbmRcbiAgICAgICcvd2ViZm9ybXMtYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjgwMDEnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIHRpbWVvdXQ6IDMwMDAwLFxuICAgICAgICBjb25maWd1cmU6IChwcm94eSwgX29wdGlvbnMpID0+IHtcbiAgICAgICAgICBwcm94eS5vbignZXJyb3InLCAoZXJyLCBfcmVxLCByZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd3ZWJmb3Jtcy1hcGkgcHJveHkgZXJyb3InLCBlcnIpO1xuICAgICAgICAgICAgaWYgKHJlcyAmJiAhcmVzLmhlYWRlcnNTZW50KSB7XG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNTAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1dlYkZvcm1zIEFQSSBwcm94eSBlcnJvcicsIG1lc3NhZ2U6IGVyci5tZXNzYWdlIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICAnL3VwbG9hZHMnOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly8xMjcuMC4wLjE6ODAwMScsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfVxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGRlZHVwZTogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgICdyZWFjdCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdub2RlX21vZHVsZXMvcmVhY3QnKSxcbiAgICAgICdyZWFjdC1kb20nOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnbm9kZV9tb2R1bGVzL3JlYWN0LWRvbScpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgc291cmNlbWFwOiBtb2RlID09PSAncHJvZHVjdGlvbicsIC8vIE9ubHkgZ2VuZXJhdGUgc291cmNlbWFwcyBpbiBwcm9kdWN0aW9uXG4gICAgbWluaWZ5OiAnZXNidWlsZCcsIC8vIFVzZSBlc2J1aWxkIGZvciBmYXN0ZXIsIG1vcmUgbWVtb3J5LWVmZmljaWVudCBtaW5pZmljYXRpb25cbiAgICB0YXJnZXQ6ICdlc25leHQnLCAvLyBNb2Rlcm4gYnJvd3NlcnMgb25seSAtIHNtYWxsZXIgYnVuZGxlc1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAvLyBWZW5kb3IgbGlicmFyaWVzXG4gICAgICAgICAgJ3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAndWktdmVuZG9yJzogW1xuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1hY2NvcmRpb24nLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1hbGVydC1kaWFsb2cnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1hc3BlY3QtcmF0aW8nLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1hdmF0YXInLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1jaGVja2JveCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWNvbGxhcHNpYmxlJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtY29udGV4dC1tZW51JyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtZGlhbG9nJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtZHJvcGRvd24tbWVudScsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWhvdmVyLWNhcmQnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1sYWJlbCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LW1lbnViYXInLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1uYXZpZ2F0aW9uLW1lbnUnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1wb3BvdmVyJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtcHJvZ3Jlc3MnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1yYWRpby1ncm91cCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNjcm9sbC1hcmVhJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3Qtc2VsZWN0JyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3Qtc2VwYXJhdG9yJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3Qtc2xpZGVyJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3Qtc2xvdCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXN3aXRjaCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXRhYnMnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10b2FzdCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXRvZ2dsZScsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXRvZ2dsZS1ncm91cCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXRvb2x0aXAnLFxuICAgICAgICAgICAgJ2x1Y2lkZS1yZWFjdCcsXG4gICAgICAgICAgICAnc29ubmVyJ1xuICAgICAgICAgIF0sXG4gICAgICAgICAgJ2VkaXRvci12ZW5kb3InOiBbJ3JlYWN0LXF1aWxsLW5ldycsICdxdWlsbCddLFxuICAgICAgICAgIC8vIEZlYXR1cmUgY2h1bmtzXG4gICAgICAgICAgJ2FuYWx5dGljcyc6IFsnLi9zcmMvcGFnZXMvQW5hbHl0aWNzJywgJy4vc3JjL3BhZ2VzL1NNU0FuYWx5dGljcyddLFxuICAgICAgICAgICdjYW1wYWlnbnMnOiBbJy4vc3JjL3BhZ2VzL0NhbXBhaWducycsICcuL3NyYy9wYWdlcy9TTVNDYW1wYWlnbnMnLCAnLi9zcmMvcGFnZXMvU01TQ2FtcGFpZ25XaXphcmQnXSxcbiAgICAgICAgICAnZm9ybXMnOiBbJy4vc3JjL3BhZ2VzL0Zvcm1zJywgJy4vc3JjL3BhZ2VzL0Zvcm1QcmV2aWV3JywgJy4vc3JjL3BhZ2VzL0Zvcm1TdWJtaXQnLCAnLi9zcmMvcGFnZXMvRm9ybVJlcGxpZXMnXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICAvLyBJbmNyZWFzZSBjaHVuayBzaXplIHdhcm5pbmcgbGltaXQgdG8gMU1CXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgIC8vIE9wdGltaXplIGRlcGVuZGVuY2llc1xuICAgIGNvbW1vbmpzT3B0aW9uczoge1xuICAgICAgaW5jbHVkZTogWy9ub2RlX21vZHVsZXMvXSxcbiAgICAgIHRyYW5zZm9ybU1peGVkRXNNb2R1bGVzOiB0cnVlLFxuICAgIH0sXG4gIH0sXG4gIC8vIE9wdGltaXplIGRlcGVuZGVuY2llcyBmb3IgYmV0dGVyIGNhY2hpbmcgYW5kIG1lbW9yeSB1c2FnZVxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbXG4gICAgICAncmVhY3QnLFxuICAgICAgJ3JlYWN0LWRvbScsXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbScsXG4gICAgICAnQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5JyxcbiAgICBdLFxuICAgIGV4Y2x1ZGU6IFsnQHJhZGl4LXVpL3JlYWN0LWljb25zJ10sIC8vIEV4Y2x1ZGUgbGFyZ2UgaWNvbiBsaWJyYXJpZXMgZnJvbSBwcmUtYnVuZGxpbmdcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ1IsU0FBUyxvQkFBb0I7QUFDN1MsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLE1BQU07QUFBQSxJQUNKLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLFlBQVk7QUFBQSxFQUNkO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFJTixNQUFNO0FBQUE7QUFBQTtBQUFBLElBR04sWUFBWTtBQUFBO0FBQUE7QUFBQSxJQUdaLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLElBQUk7QUFBQSxRQUNKLFNBQVM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBS1QsU0FBUyxDQUFDQSxVQUFTQSxNQUFLLFFBQVEsVUFBVSxFQUFFO0FBQUEsUUFDNUMsV0FBVyxDQUFDLE9BQU8sYUFB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
