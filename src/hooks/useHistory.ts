import { useState, useCallback, useRef } from 'react';

export interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

export interface UseHistoryReturn<T> {
    state: T;
    setState: (newState: T | ((prev: T) => T)) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    clear: () => void;
}

const MAX_HISTORY_LENGTH = 50;

export function useHistory<T>(initialState: T): UseHistoryReturn<T> {
    const [history, setHistory] = useState<HistoryState<T>>({
        past: [],
        present: initialState,
        future: [],
    });

    // Track if we're in the middle of an undo/redo operation
    const isUndoRedoRef = useRef(false);

    const setState = useCallback((newState: T | ((prev: T) => T)) => {
        // Don't add to history if we're in an undo/redo operation
        if (isUndoRedoRef.current) {
            return;
        }

        setHistory((currentHistory) => {
            const resolvedState = typeof newState === 'function'
                ? (newState as (prev: T) => T)(currentHistory.present)
                : newState;

            // Don't add to history if state hasn't changed
            if (JSON.stringify(resolvedState) === JSON.stringify(currentHistory.present)) {
                return currentHistory;
            }

            const newPast = [...currentHistory.past, currentHistory.present];

            // Limit history length
            if (newPast.length > MAX_HISTORY_LENGTH) {
                newPast.shift();
            }

            return {
                past: newPast,
                present: resolvedState,
                future: [], // Clear future when new state is set
            };
        });
    }, []);

    const undo = useCallback(() => {
        setHistory((currentHistory) => {
            if (currentHistory.past.length === 0) {
                return currentHistory;
            }

            isUndoRedoRef.current = true;

            const previous = currentHistory.past[currentHistory.past.length - 1];
            const newPast = currentHistory.past.slice(0, currentHistory.past.length - 1);

            setTimeout(() => {
                isUndoRedoRef.current = false;
            }, 0);

            return {
                past: newPast,
                present: previous,
                future: [currentHistory.present, ...currentHistory.future],
            };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory((currentHistory) => {
            if (currentHistory.future.length === 0) {
                return currentHistory;
            }

            isUndoRedoRef.current = true;

            const next = currentHistory.future[0];
            const newFuture = currentHistory.future.slice(1);

            setTimeout(() => {
                isUndoRedoRef.current = false;
            }, 0);

            return {
                past: [...currentHistory.past, currentHistory.present],
                present: next,
                future: newFuture,
            };
        });
    }, []);

    const clear = useCallback(() => {
        setHistory((currentHistory) => ({
            past: [],
            present: currentHistory.present,
            future: [],
        }));
    }, []);

    return {
        state: history.present,
        setState,
        undo,
        redo,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        clear,
    };
}
