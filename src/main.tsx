import './lib/polyfills';
import React from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Silence console output in production to keep DevTools clean.
// UI error handling (toasts/fallbacks) remains unchanged.
if (!import.meta.env.DEV) {
  const noop = () => { };
  console.log = noop;
  console.info = noop;
  console.warn = noop;
  console.error = noop;
  console.debug = noop;

  // Capture global errors and send to backend
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      // Ignore resizing errors
      if (event.message === 'ResizeObserver loop limit exceeded') return;

      // Ignore browser extension errors
      if (
        event.message.includes('FN_NOT_FOUND') ||
        event.message.includes('siteFrame') ||
        event.message.includes('cardFrame') ||
        event.message.includes('passkey')
      ) return;

      // Send to backend (debounced/fire-and-forget)
      fetch('/api/system/tools/client-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'error',
          message: event.message,
          stack: event.error?.stack,
          url: window.location.href
        })
      }).catch(() => { });
    });

    window.addEventListener('unhandledrejection', (event) => {
      // Ignore browser extension errors
      const reason = String(event.reason);
      if (
        reason.includes('FN_NOT_FOUND') ||
        reason.includes('siteFrame') ||
        reason.includes('cardFrame') ||
        reason.includes('passkey') ||
        reason.includes('dashlane')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      fetch('/api/system/tools/client-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rejection',
          message: event.reason?.message || reason,
          stack: event.reason?.stack,
          url: window.location.href
        })
      }).catch(() => { });
    });
  }
}




const DEBUG_STARTUP = import.meta.env.VITE_DEBUG_STARTUP === 'true';

if (DEBUG_STARTUP) {
  console.log('[startup] main.tsx loaded');
  console.log('[startup] readyState:', document.readyState);
}
console.log("CRITICAL: APP VERSION 4 LOADED");
if (import.meta.env.DEV) {
  // @ts-ignore
  window.React1 = React;
  console.log('[DEBUG] React version:', React.version);
}

// Register Service Worker for PWA (Offline Support)
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { });
  });
}


const rootElement = document.getElementById('root')

try {
  if (!rootElement) {
    throw new Error('Root element not found')
  }

  if (DEBUG_STARTUP) console.log('[startup] creating React root');
  const root = createRoot(rootElement)


  const helmetContext = {};

  if (DEBUG_STARTUP) console.log('[startup] rendering <App />');
  root.render(
    <HelmetProvider context={helmetContext}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  )

  if (DEBUG_STARTUP) console.log('[startup] mounted');
} catch (error) {
  console.error('❌ Failed to mount React application:', error)
  // Show error in the page for debugging
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 50px; background: white; color: black; border: 2px solid red;">
        <h1>🚨 React App Mount Error</h1>
        <p>Failed to mount React application:</p>
        <pre style="background: #f0f0f0; padding: 10px; overflow: auto;">${error}</pre>
        <p>Check the browser console for more details.</p>
      </div>
    `
  }
}
