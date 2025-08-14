/**
 * Client-side environment configuration
 * Detects current environment and provides appropriate API URLs
 * CONSOLIDATED: All deployment, caching, and feature configuration
 */

// Application version - update with each deployment
const APP_VERSION = '1.2.0';
const BUILD_TIMESTAMP = '20250814-1532';

// Environment detection
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('dev');

const isProduction = !isDevelopment;

// Debug logging
console.log('🌍 Environment Detection:', {
  hostname: window.location.hostname,
  isDevelopment,
  isProduction,
  version: APP_VERSION
});

// Configuration by environment (simplified - only dev and production)
const config = {
  development: {
    API_BASE_URL: 'http://localhost:3000/api',
    FEATURES: {
      DEBUG_TOOLS: true,
      ANALYTICS: false,
      ENABLE_SERVICE_WORKER: false,
      ENABLE_OFFLINE_MODE: false,
      ENABLE_PUSH_NOTIFICATIONS: false,
      ENABLE_BACKGROUND_SYNC: false
    },
    LOG_LEVEL: 'DEBUG',
    ENABLE_ERROR_REPORTING: false,
    CACHE_CONFIG: {
      CLEAR_ON_LOAD: true, // Clear caches in development
      OLD_CACHE_RETENTION_DAYS: 1,
      MAX_CACHE_VERSIONS: 1
    }
  },
  production: {
    API_BASE_URL: 'https://google-search-me.onrender.com/api',
    FEATURES: {
      DEBUG_TOOLS: false,
      ANALYTICS: true,
      ENABLE_SERVICE_WORKER: false,
      ENABLE_OFFLINE_MODE: false,
      ENABLE_PUSH_NOTIFICATIONS: false,
      ENABLE_BACKGROUND_SYNC: false
    },
    LOG_LEVEL: 'ERROR',
    ENABLE_ERROR_REPORTING: true,
    CACHE_CONFIG: {
      CLEAR_ON_LOAD: false,
      OLD_CACHE_RETENTION_DAYS: 7,
      MAX_CACHE_VERSIONS: 3,
      CLEANUP_PREFIXES: [
        'mobile-app-',
        'temp-',
        'old-',
        'test-'
      ]
    }
  }
};

// Export the appropriate config based on detected environment
export const environment = isDevelopment ? config.development : config.production;

// Add version and deployment info to environment
environment.APP_VERSION = APP_VERSION;
environment.BUILD_TIMESTAMP = BUILD_TIMESTAMP;
environment.CURRENT_ENV = isDevelopment ? 'development' : 'production';

// Debug logging
console.log('🔧 Environment Config loaded:', {
  selected: isDevelopment ? 'development' : 'production',
  API_BASE_URL: environment.API_BASE_URL,
  version: APP_VERSION,
  hostname: window.location.hostname,
  features: environment.FEATURES
});

// Export environment detection helpers
export const environmentUtils = {
  isDevelopment,
  isProduction,
  
  // Cache busting utilities
  getCacheBusterQuery: () => `v=${APP_VERSION}-${BUILD_TIMESTAMP}`,
  getVersionedAssetUrl: (assetPath) => {
    const separator = assetPath.includes('?') ? '&' : '?';
    return `${assetPath}${separator}v=${APP_VERSION}-${BUILD_TIMESTAMP}`;
  },
  
  // Environment-specific logging
  log: (level, message, data = null) => {
    const logLevel = environment.LOG_LEVEL;
    const levels = { DEBUG: 0, WARN: 1, ERROR: 2 };
    
    if (levels[level] >= levels[logLevel]) {
      const prefix = `[${environment.CURRENT_ENV.toUpperCase()}]`;
      if (data) {
        console[level.toLowerCase()](`${prefix} ${message}`, data);
      } else {
        console[level.toLowerCase()](`${prefix} ${message}`);
      }
    }
  }
};

// Export default configuration
export default environment;
