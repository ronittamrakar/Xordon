/**
 * Production Logger
 * Only logs errors in production, full logging in development
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

interface LogContext {
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private logBuffer: Array<{level: string; message: string; context?: LogContext; timestamp: number}> = [];
  private maxBufferSize = 100;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: 'log' | 'warn' | 'error' | 'info'): boolean {
    if (isDevelopment) return true;
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  private addToBuffer(level: string, message: string, context?: LogContext): void {
    this.logBuffer.push({
      level,
      message,
      context,
      timestamp: Date.now()
    });

    // Keep buffer size limited
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  log(message: string, context?: LogContext): void {
    this.addToBuffer('log', message, context);
    if (this.shouldLog('log')) {
      console.log(`[LOG] ${message}`, context || '');
    }
  }

  info(message: string, context?: LogContext): void {
    this.addToBuffer('info', message, context);
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, context || '');
    }
  }

  warn(message: string, context?: LogContext): void {
    this.addToBuffer('warn', message, context);
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, context || '');
    }
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    };

    this.addToBuffer('error', message, errorContext);
    
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, errorContext);
    }

    // In production, send to error tracking service
    if (isProduction) {
      this.sendToErrorTrackingService(message, errorContext);
    }
  }

  private sendToErrorTrackingService(message: string, context: LogContext): void {
    // TODO: Integrate with Sentry, LogRocket, or similar service
    // For now, just queue it for potential API call
    try {
      // Example: Send to backend error logging endpoint
      const endpoint = '/api/logs/error';
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(() => {
        // Silently fail to avoid infinite loops
      });
    } catch {
      // Ignore errors in error reporting
    }
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count: number = 50): typeof this.logBuffer {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clear log buffer
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }
}

export const logger = Logger.getInstance();

// Replace console methods in production to capture all logs
if (isProduction) {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  };

  console.log = (...args) => logger.log(args.join(' '));
  console.warn = (...args) => logger.warn(args.join(' '));
  console.error = (...args) => logger.error(args.join(' '));
  console.info = (...args) => logger.info(args.join(' '));
}

export default logger;
