/**
 * Global Polyfills and Error Suppression
 * Handles browser extension/bridge compatibility issues.
 * 
 * IMPORTANT: This must be loaded as early as possible to prevent FN_NOT_FOUND errors
 */

// Immediately define polyfills before anything else runs
(function () {
    if (typeof window === 'undefined') return;

    const logMock = (name: string) => {
        // Silently handle mock calls
    };

    // Define all browser extension APIs immediately
    // @ts-ignore - Force override to ensure these exist
    window.siteFrame = {
        closeSiteFrame: () => { logMock('siteFrame.closeSiteFrame'); return Promise.resolve(); }
    };

    // @ts-ignore
    window.cardFrame = {
        closeCardFrame: () => { logMock('cardFrame.closeCardFrame'); return Promise.resolve(); }
    };

    // @ts-ignore
    window.passkey = {
        closePasskeyConditionalList: () => { logMock('passkey.closePasskeyConditionalList'); return Promise.resolve(); }
    };

    // Suppress "FN_NOT_FOUND" unhandled rejections
    // These come from browser extensions (Dashlane/Password managers)
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        const reason = event.reason;

        // Convert reason to string safely
        let reasonStr = '';
        try {
            if (reason instanceof Error) {
                reasonStr = reason.message;
            } else if (typeof reason === 'string') {
                reasonStr = reason;
            } else {
                reasonStr = JSON.stringify(reason);
            }
        } catch (e) {
            reasonStr = String(reason);
        }

        // Suppress browser extension errors
        const isBrowserExtensionError =
            reasonStr.includes('FN_NOT_FOUND') ||
            reasonStr.includes('siteFrame') ||
            reasonStr.includes('cardFrame') ||
            reasonStr.includes('passkey') ||
            reasonStr.includes('dashlane');

        if (isBrowserExtensionError) {
            // Prevent the error from showing in the console
            event.preventDefault();
            // Stop other listeners from handling it
            event.stopImmediatePropagation();
        }
    });

    // Also catch any synchronous errors from these APIs
    window.addEventListener('error', (event: ErrorEvent) => {
        const message = event.message || '';
        const isBrowserExtensionError = message.includes('FN_NOT_FOUND') ||
            message.includes('siteFrame') ||
            message.includes('cardFrame') ||
            message.includes('passkey');

        if (isBrowserExtensionError) {
            event.preventDefault();
        }
    });

    // Intercept console.error to hide these specific extension errors
    const originalConsoleError = console.error;
    console.error = function (...args) {
        const message = args.join(' ');
        const isExtensionError =
            message.includes('FN_NOT_FOUND') ||
            message.includes('siteFrame') ||
            message.includes('cardFrame') ||
            message.includes('passkey');

        if (isExtensionError) return;
        originalConsoleError.apply(console, args);
    };
})();
