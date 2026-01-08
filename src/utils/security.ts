/**
 * Security Utilities
 * Additional security helpers for authentication and data protection
 */

/**
 * Generate a cryptographically secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a string using SubtleCrypto (SHA-256)
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate password strength
 */
export interface PasswordStrength {
  score: number; // 0-4
  isValid: boolean;
  feedback: string[];
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else if (password.length >= 8) {
    score++;
  }

  if (password.length >= 12) {
    score++;
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Password must contain both uppercase and lowercase letters');
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Password must contain at least one number');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    feedback.push('Password must contain at least one special character');
  }

  return {
    score: Math.min(score, 4),
    isValid: score >= 3 && password.length >= 8,
    feedback,
  };
}

/**
 * Check if a value is a valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a value is a valid phone number
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-().]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Sanitize filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars
    .replace(/\.\.+/g, '.') // Remove parent directory references
    .slice(0, 255); // Limit length
}

/**
 * Check if content type is allowed for upload
 */
export function isAllowedContentType(contentType: string, allowedTypes: string[]): boolean {
  return allowedTypes.some(allowed => {
    if (allowed.endsWith('/*')) {
      const baseType = allowed.slice(0, -2);
      return contentType.startsWith(baseType);
    }
    return contentType === allowed;
  });
}

/**
 * Rate limit tracker for client-side operations
 */
export class ClientRateLimiter {
  private attempts: Map<string, number[]> = new Map();

  /**
   * Check if an action is rate limited
   * @param key - Unique identifier for the action
   * @param maxAttempts - Maximum attempts allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if allowed, false if rate limited
   */
  check(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false; // Rate limited
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.attempts.clear();
  }
}

export const rateLimiter = new ClientRateLimiter();

/**
 * Secure local storage wrapper with encryption support
 */
export class SecureStorage {
  private prefix: string;

  constructor(prefix: string = 'app_') {
    this.prefix = prefix;
  }

  /**
   * Store data in local storage
   */
  set(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      console.error('Failed to store data:', error);
    }
  }

  /**
   * Retrieve data from local storage
   */
  get<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return defaultValue;
    }
  }

  /**
   * Remove data from local storage
   */
  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  /**
   * Clear all data with this prefix
   */
  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const secureStorage = new SecureStorage('xordon_');
