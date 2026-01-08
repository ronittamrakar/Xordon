/**
 * Environment Configuration
 * Centralized configuration management
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_URL || '/api',
    timeout: 30000,
    retryAttempts: 3,
  },

  // Feature Flags
  features: {
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableSentry: import.meta.env.VITE_ENABLE_SENTRY === 'true',
    enableDebugMode: import.meta.env.DEV,
  },

  // Security
  security: {
    tokenKey: 'auth_token',
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Performance
  performance: {
    enableCaching: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    debounceDelay: 300,
    throttleDelay: 1000,
  },

  // Upload Limits
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },

  // Pagination
  pagination: {
    defaultPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100],
  },
} as const;

export default config;
