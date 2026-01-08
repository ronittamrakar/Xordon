import { useEffect, useState } from 'react';

/**
 * Custom hook that debounces a value
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set up the timeout
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up the timeout if value changes before delay expires
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Custom hook that provides a debounced callback function
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns The debounced callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 500
): (...args: Parameters<T>) => void {
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [timeoutId]);

    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        const newTimeoutId = setTimeout(() => {
            callback(...args);
        }, delay);

        setTimeoutId(newTimeoutId);
    };
}
