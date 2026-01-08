import { useEffect, useCallback, useRef } from 'react';

export type KeyboardShortcut = {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean; // Command key on Mac
    callback: (event: KeyboardEvent) => void;
    description?: string;
    preventDefault?: boolean;
};

export interface UseKeyboardShortcutsOptions {
    shortcuts: KeyboardShortcut[];
    enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
    const shortcutsRef = useRef(shortcuts);

    // Update ref when shortcuts change
    useEffect(() => {
        shortcutsRef.current = shortcuts;
    }, [shortcuts]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        // Don't trigger shortcuts when typing in input fields (unless explicitly allowed)
        const target = event.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable;

        for (const shortcut of shortcutsRef.current) {
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
            const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
            const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
            const altMatch = shortcut.alt ? event.altKey : !event.altKey;
            const metaMatch = shortcut.meta ? event.metaKey : true;

            if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
                // Allow certain shortcuts even in input fields (like Ctrl+S)
                const allowInInput = shortcut.ctrl && ['s', 'z', 'y'].includes(shortcut.key.toLowerCase());

                if (!isInput || allowInInput) {
                    if (shortcut.preventDefault !== false) {
                        event.preventDefault();
                    }
                    shortcut.callback(event);
                    break;
                }
            }
        }
    }, [enabled]);

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown, enabled]);

    return {
        shortcuts: shortcutsRef.current,
    };
}

// Helper function to get keyboard shortcut display text
export function getShortcutText(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    if (shortcut.ctrl || shortcut.meta) {
        parts.push(isMac ? '⌘' : 'Ctrl');
    }
    if (shortcut.shift) {
        parts.push(isMac ? '⇧' : 'Shift');
    }
    if (shortcut.alt) {
        parts.push(isMac ? '⌥' : 'Alt');
    }

    parts.push(shortcut.key.toUpperCase());

    return parts.join(isMac ? '' : '+');
}
