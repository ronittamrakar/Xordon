import '@testing-library/jest-dom/vitest';

// JSDOM (used by Vitest) doesn't implement pointer capture APIs; Radix UI
// components may call hasPointerCapture during interactions which will
// throw in the test environment. Provide a no-op shim for tests.
if (typeof window !== 'undefined') {
  if (typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.hasPointerCapture !== 'function') {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    HTMLElement.prototype.hasPointerCapture = function () { return false; } as any;
  }

  // Mock ResizeObserver for Radix UI components
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;

  // Mock matchMedia for components that use it
  window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {},
      addEventListener: function() {},
      removeEventListener: function() {},
      dispatchEvent: function() { return false; },
    };
  };
}
