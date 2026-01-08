export type Logger = {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
};

export function createLogger(scope: string, localStorageFlag = 'debug_console'): Logger {
  const shouldLog = import.meta.env.DEV && localStorage.getItem(localStorageFlag) === '1';

  const prefix = scope ? `[${scope}]` : '';

  const log = (...args: any[]) => {
    if (shouldLog) console.log(prefix, ...args);
  };

  const warn = (...args: any[]) => {
    if (shouldLog) console.warn(prefix, ...args);
  };

  const error = (...args: any[]) => {
    if (shouldLog) console.error(prefix, ...args);
  };

  return { log, warn, error };
}
