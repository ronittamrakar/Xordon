/**
 * Memory monitoring and optimization utilities
 * Helps track and optimize memory usage in the dashboard
 */

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface MemoryStats {
  usedMB: number;
  totalMB: number;
  limitMB: number;
  usagePercent: number;
  timestamp: number;
}

/**
 * Get current memory usage (browser only)
 */
export function getMemoryUsage(): MemoryStats | null {
  if (typeof window === 'undefined' || !performance.memory) {
    return null;
  }

  const memory = performance.memory as MemoryInfo;
  const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
  const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
  const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
  const usagePercent = Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100);

  return {
    usedMB,
    totalMB,
    limitMB,
    usagePercent,
    timestamp: Date.now(),
  };
}

/**
 * Log memory usage to console
 */
export function logMemoryUsage(label: string = 'Current') {
  const memory = getMemoryUsage();
  if (memory) {
    console.log(
      `[Memory] ${label}: ${memory.usedMB}MB / ${memory.totalMB}MB (${memory.usagePercent}%)`
    );
    
    if (memory.usagePercent > 80) {
      console.warn('⚠️ High memory usage detected!');
    }
    
    return memory;
  }
  return null;
}

/**
 * Check if memory usage is high
 */
export function isHighMemoryUsage(threshold: number = 80): boolean {
  const memory = getMemoryUsage();
  if (!memory) return false;
  return memory.usagePercent > threshold;
}

/**
 * Force garbage collection (if available)
 * Note: This is non-standard and may not work in all browsers
 */
export function forceGarbageCollection(): void {
  if (typeof window !== 'undefined') {
    // @ts-ignore - Non-standard API
    if (window.gc) {
      // @ts-ignore
      window.gc();
      console.log('🗑️ Garbage collection forced');
    } else {
      console.log('Garbage collection not available');
    }
  }
}

/**
 * Monitor memory usage over time
 */
export class MemoryMonitor {
  private interval: NodeJS.Timeout | null = null;
  private history: MemoryStats[] = [];
  private maxHistory: number;

  constructor(maxHistory: number = 10) {
    this.maxHistory = maxHistory;
  }

  start(intervalMs: number = 5000): void {
    if (this.interval) return;

    this.interval = setInterval(() => {
      const memory = getMemoryUsage();
      if (memory) {
        this.history.push(memory);
        if (this.history.length > this.maxHistory) {
          this.history.shift();
        }

        // Log if memory is high
        if (isHighMemoryUsage(75)) {
          console.warn('MemoryMonitor: High usage detected', memory);
        }
      }
    }, intervalMs);

    console.log('MemoryMonitor: Started monitoring');
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('MemoryMonitor: Stopped');
    }
  }

  getHistory(): MemoryStats[] {
    return [...this.history];
  }

  getAverageUsage(): number {
    if (this.history.length === 0) return 0;
    const sum = this.history.reduce((acc, stat) => acc + stat.usagePercent, 0);
    return Math.round(sum / this.history.length);
  }

  getMaxUsage(): number {
    if (this.history.length === 0) return 0;
    return Math.max(...this.history.map(h => h.usagePercent));
  }

  cleanup(): void {
    this.stop();
    this.history = [];
  }
}

/**
 * Optimize component rendering based on memory usage
 */
export function shouldOptimizeRendering(): boolean {
  const memory = getMemoryUsage();
  if (!memory) return false;
  
  // Optimize if memory usage is above 70%
  return memory.usagePercent > 70;
}

/**
 * Get recommended batch size for data processing
 */
export function getRecommendedBatchSize(): number {
  const memory = getMemoryUsage();
  if (!memory) return 50; // Default conservative size
  
  if (memory.usagePercent > 80) return 10;
  if (memory.usagePercent > 60) return 25;
  return 50;
}

/**
 * Format memory stats for display
 */
export function formatMemoryStats(stats: MemoryStats): string {
  return `${stats.usedMB}MB / ${stats.totalMB}MB (${stats.usagePercent}%)`;
}

/**
 * Memory optimization suggestions
 */
export function getOptimizationSuggestions(): string[] {
  const suggestions: string[] = [];
  const memory = getMemoryUsage();

  if (!memory) {
    suggestions.push('Memory monitoring not available in this environment');
    return suggestions;
  }

  if (memory.usagePercent > 80) {
    suggestions.push('⚠️ Critical: Memory usage is very high');
    suggestions.push('• Close unused browser tabs');
    suggestions.push('• Refresh the page to clear memory');
    suggestions.push('• Reduce number of widgets on dashboard');
  } else if (memory.usagePercent > 60) {
    suggestions.push('⚠️ Warning: Memory usage is elevated');
    suggestions.push('• Consider using the optimized dashboard');
    suggestions.push('• Enable lazy loading for widgets');
    suggestions.push('• Reduce data fetching frequency');
  } else {
    suggestions.push('✅ Memory usage is optimal');
  }

  suggestions.push('');
  suggestions.push('Current Stats:');
  suggestions.push(`• Used: ${memory.usedMB}MB`);
  suggestions.push(`• Total: ${memory.totalMB}MB`);
  suggestions.push(`• Limit: ${memory.limitMB}MB`);

  return suggestions;
}
