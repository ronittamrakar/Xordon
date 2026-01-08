/**
 * Performance Monitoring Utilities
 * Tracks and optimizes application performance
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();

  /**
   * Mark the start of a performance measurement
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * Measure and record the duration from a mark
   */
  measure(name: string): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No mark found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    this.marks.delete(name);
    return duration;
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics and marks
   */
  clear(): void {
    this.metrics = [];
    this.marks.clear();
  }

  /**
   * Log slow operations (> threshold ms)
   */
  logSlowOperations(threshold: number = 1000): void {
    const slowOps = this.metrics.filter(m => m.duration > threshold);
    if (slowOps.length > 0) {
      console.warn('Slow operations detected:', slowOps);
    }
  }
}

export const perfMonitor = new PerformanceMonitor();

/**
 * Debounce function to limit rate of function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit rate of function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load component with retry logic
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries: number = 3
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    for (let i = 0; i < retries; i++) {
      try {
        return await componentImport();
      } catch (error) {
        if (i === retries - 1) throw error;
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
    throw new Error('Failed to load component after retries');
  });
}

/**
 * Memoize expensive function calls
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Batch multiple API calls
 */
export class RequestBatcher {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private readonly batchSize: number;
  private readonly delayMs: number;

  constructor(batchSize: number = 5, delayMs: number = 100) {
    this.batchSize = batchSize;
    this.delayMs = delayMs;
  }

  add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      await Promise.all(batch.map(fn => fn()));
      
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delayMs));
      }
    }

    this.processing = false;
  }
}

import React from 'react';
