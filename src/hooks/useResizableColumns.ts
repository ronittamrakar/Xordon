import { useState, useEffect, useCallback } from 'react';

interface UseResizableColumnsProps {
  tableKey: string;
  defaultWidths?: { [key: string]: number };
  minWidth?: number;
  maxWidth?: number;
}

export function useResizableColumns({
  tableKey,
  defaultWidths = {},
  minWidth = 50,
  maxWidth = 500,
}: UseResizableColumnsProps) {
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>(() => {
    try {
      const stored = localStorage.getItem(`table-widths-${tableKey}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load column widths from localStorage:', error);
    }
    return defaultWidths;
  });

  useEffect(() => {
    try {
      localStorage.setItem(`table-widths-${tableKey}`, JSON.stringify(columnWidths));
    } catch (error) {
      console.warn('Failed to save column widths to localStorage:', error);
    }
  }, [tableKey, columnWidths]);

  const updateColumnWidth = useCallback((columnKey: string, width: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: Math.max(minWidth, Math.min(maxWidth, width)),
    }));
  }, [minWidth, maxWidth]);

  const resetColumnWidths = useCallback(() => {
    setColumnWidths(defaultWidths);
    try {
      localStorage.removeItem(`table-widths-${tableKey}`);
    } catch (error) {
      console.warn('Failed to remove column widths from localStorage:', error);
    }
  }, [tableKey, defaultWidths]);

  const getColumnWidth = useCallback((columnKey: string, defaultWidth: number = 150) => {
    return columnWidths[columnKey] || defaultWidth;
  }, [columnWidths]);

  return {
    columnWidths,
    updateColumnWidth,
    resetColumnWidths,
    getColumnWidth,
  };
}
