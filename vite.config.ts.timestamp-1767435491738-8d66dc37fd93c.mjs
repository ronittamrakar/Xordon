// vite.config.ts
import { defineConfig } from "file:///D:/Backup/App%20Backups/Xordon/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Backup/App%20Backups/Xordon/node_modules/@vitejs/plugin-react/dist/index.js";
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
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
        secure: false,
        ws: true,
        timeout: 3e4,
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
      "react": path.resolve(__vite_injected_original_dirname, "./node_modules/react"),
      "react-dom": path.resolve(__vite_injected_original_dirname, "./node_modules/react-dom")
    }
  },
  build: {
    sourcemap: mode === "production",
    minify: "esbuild",
    target: "esnext",
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/@radix-ui")) {
            return "radix-ui";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "lucide-icons";
          }
          if (id.includes("node_modules/sonner")) {
            return "sonner";
          }
          if (id.includes("node_modules/recharts")) {
            return "recharts";
          }
          if (id.includes("node_modules/quill") || id.includes("node_modules/react-quill")) {
            return "quill-editor";
          }
          if (id.includes("node_modules/@dnd-kit")) {
            return "dnd-kit";
          }
          if (id.includes("node_modules/@tanstack/react-query")) {
            return "react-query";
          }
          if (id.includes("node_modules/date-fns")) {
            return "date-fns";
          }
          if (id.includes("node_modules")) {
            return "vendor";
          }
        }
      }
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "react-grid-layout/legacy",
      "react-resizable",
      "reactflow",
      "recharts",
      "lucide-react",
      "date-fns"
    ],
    // force: true, // Removed to prevent 504 errors on reload
    esbuildOptions: {
      target: "esnext"
    }
  },
  cacheDir: "node_modules/.vite"
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxCYWNrdXBcXFxcQXBwIEJhY2t1cHNcXFxcWG9yZG9uXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxCYWNrdXBcXFxcQXBwIEJhY2t1cHNcXFxcWG9yZG9uXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9CYWNrdXAvQXBwJTIwQmFja3Vwcy9Yb3Jkb24vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcblxyXG4vLyBUcmlnZ2VyIHJlc3RhcnQ6IDIwMjYtMDEtMDNUMTA6MzA6MDAtRklYLVJFQUNULUFMSUFTXHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcclxuICB0ZXN0OiB7XHJcbiAgICBnbG9iYWxzOiB0cnVlLFxyXG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXHJcbiAgICBzZXR1cEZpbGVzOiAnLi9zcmMvdGVzdC1zZXR1cC50cycsXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6IHRydWUsXHJcbiAgICBwb3J0OiA1MTczLFxyXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly8xMjcuMC4wLjE6ODAwMScsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgICAgd3M6IHRydWUsXHJcbiAgICAgICAgdGltZW91dDogMzAwMDAsXHJcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sICcnKSxcclxuICAgICAgICBjb25maWd1cmU6IChwcm94eSwgX29wdGlvbnMpID0+IHtcclxuICAgICAgICAgIHByb3h5Lm9uKCdlcnJvcicsIChlcnIsIF9yZXEsIHJlcykgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncHJveHkgZXJyb3InLCBlcnIpO1xyXG4gICAgICAgICAgICBpZiAocmVzICYmICFyZXMuaGVhZGVyc1NlbnQpIHtcclxuICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1Byb3h5IGVycm9yJywgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICAnL3dlYmZvcm1zLWFwaSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjgwMDEnLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIHRpbWVvdXQ6IDMwMDAwLFxyXG4gICAgICAgIGNvbmZpZ3VyZTogKHByb3h5LCBfb3B0aW9ucykgPT4ge1xyXG4gICAgICAgICAgcHJveHkub24oJ2Vycm9yJywgKGVyciwgX3JlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd3ZWJmb3Jtcy1hcGkgcHJveHkgZXJyb3InLCBlcnIpO1xyXG4gICAgICAgICAgICBpZiAocmVzICYmICFyZXMuaGVhZGVyc1NlbnQpIHtcclxuICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1dlYkZvcm1zIEFQSSBwcm94eSBlcnJvcicsIG1lc3NhZ2U6IGVyci5tZXNzYWdlIH0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAgJy91cGxvYWRzJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly8xMjcuMC4wLjE6ODAwMScsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgIH0sXHJcbiAgICB9XHJcbiAgfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gIF0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgZGVkdXBlOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgICAgXCJyZWFjdFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3JlYWN0XCIpLFxyXG4gICAgICBcInJlYWN0LWRvbVwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3JlYWN0LWRvbVwiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgc291cmNlbWFwOiBtb2RlID09PSAncHJvZHVjdGlvbicsXHJcbiAgICBtaW5pZnk6ICdlc2J1aWxkJyxcclxuICAgIHRhcmdldDogJ2VzbmV4dCcsXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDUwMCxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiAoaWQpID0+IHtcclxuICAgICAgICAgIC8vIFVJIGxpYnJhcmllcyAtIGhlYXZ5IGNvbXBvbmVudHMgc3BsaXQgc2VwYXJhdGVseVxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMvQHJhZGl4LXVpJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdyYWRpeC11aSc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcy9sdWNpZGUtcmVhY3QnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ2x1Y2lkZS1pY29ucyc7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcy9zb25uZXInKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3Nvbm5lcic7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gRGF0YSB2aXN1YWxpemF0aW9uIC0gSEVBVlkgbGlicmFyeSwgaXNvbGF0ZSBpdFxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMvcmVjaGFydHMnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3JlY2hhcnRzJztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBSaWNoIHRleHQgZWRpdG9yIC0gSEVBVlkgbGlicmFyeSwgaXNvbGF0ZSBpdFxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMvcXVpbGwnKSB8fCBpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzL3JlYWN0LXF1aWxsJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdxdWlsbC1lZGl0b3InO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIERyYWcgYW5kIGRyb3AgLSBIRUFWWSBsaWJyYXJ5LCBpc29sYXRlIGl0XHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcy9AZG5kLWtpdCcpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnZG5kLWtpdCc7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gVGFuU3RhY2sgUXVlcnlcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzL0B0YW5zdGFjay9yZWFjdC1xdWVyeScpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAncmVhY3QtcXVlcnknO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIERhdGUgaGFuZGxpbmdcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzL2RhdGUtZm5zJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdkYXRlLWZucyc7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQWxsIG90aGVyIG5vZGVfbW9kdWxlc1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcic7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBjb21tb25qc09wdGlvbnM6IHtcclxuICAgICAgaW5jbHVkZTogWy9ub2RlX21vZHVsZXMvXSxcclxuICAgICAgdHJhbnNmb3JtTWl4ZWRFc01vZHVsZXM6IHRydWUsXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbXHJcbiAgICAgICdyZWFjdCcsXHJcbiAgICAgICdyZWFjdC1kb20nLFxyXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbScsXHJcbiAgICAgICdAdGFuc3RhY2svcmVhY3QtcXVlcnknLFxyXG4gICAgICAncmVhY3QtZ3JpZC1sYXlvdXQvbGVnYWN5JyxcclxuICAgICAgJ3JlYWN0LXJlc2l6YWJsZScsXHJcbiAgICAgICdyZWFjdGZsb3cnLFxyXG4gICAgICAncmVjaGFydHMnLFxyXG4gICAgICAnbHVjaWRlLXJlYWN0JyxcclxuICAgICAgJ2RhdGUtZm5zJyxcclxuICAgIF0sXHJcbiAgICAvLyBmb3JjZTogdHJ1ZSwgLy8gUmVtb3ZlZCB0byBwcmV2ZW50IDUwNCBlcnJvcnMgb24gcmVsb2FkXHJcbiAgICBlc2J1aWxkT3B0aW9uczoge1xyXG4gICAgICB0YXJnZXQ6ICdlc25leHQnLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIGNhY2hlRGlyOiAnbm9kZV9tb2R1bGVzLy52aXRlJyxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdSLFNBQVMsb0JBQW9CO0FBQzdTLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxNQUFNO0FBQUEsSUFDSixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixZQUFZO0FBQUEsRUFDZDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IsSUFBSTtBQUFBLFFBQ0osU0FBUztBQUFBLFFBQ1QsU0FBUyxDQUFDQSxVQUFTQSxNQUFLLFFBQVEsVUFBVSxFQUFFO0FBQUEsUUFDNUMsV0FBVyxDQUFDLE9BQU8sYUFBYTtBQUM5QixnQkFBTSxHQUFHLFNBQVMsQ0FBQyxLQUFLLE1BQU0sUUFBUTtBQUNwQyxvQkFBUSxJQUFJLGVBQWUsR0FBRztBQUM5QixnQkFBSSxPQUFPLENBQUMsSUFBSSxhQUFhO0FBQzNCLGtCQUFJLFVBQVUsS0FBSyxFQUFFLGdCQUFnQixtQkFBbUIsQ0FBQztBQUN6RCxr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
