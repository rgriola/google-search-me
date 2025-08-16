/**
 * Client-side environment configuration
 * Detects current environment and provides appropriate API URLs
 * CONSOLIDATED: All deployment, caching, and feature configuration
 * 
 * Usage Instructions:
 * 1. Run the version update script: chmod +x update-version.sh && ./update-version.sh
 * 2. Deploy to production
 * 3. Users will get fresh version automatically
 * 
 * Manual cache clearing (browser console): clearAppCache()
 * URL-based cache clearing: ?refresh=true or ?nocache=true
 */

// Application version - update with each deployment
const APP_VERSION = '1.2.1755310728'; // Updated version to bust cache
const BUILD_TIMESTAMP = '1755310728'; // Dynamic timestamp

// Environment detection
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('dev');

const isProduction = !isDevelopment;

// Force cache bust on production by checking URL params
const forceRefresh = window.location.search.includes('refresh=true') ||
                    window.location.search.includes('nocache=true');

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
      CLEAR_ON_LOAD: forceRefresh, // Clear cache if forced refresh
      OLD_CACHE_RETENTION_DAYS: 1, // Reduced from 7 days to 1 day
      MAX_CACHE_VERSIONS: 1, // Reduced from 3 to 1 to prevent stale cache
      AGGRESSIVE_CACHE_BUST: true, // New flag for production cache busting
      CLEANUP_PREFIXES: [
        'mobile-app-',
        'temp-',
        'old-',
        'test-',
        'cache-',
        'v1.'
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
  forceRefresh,
  
  // Enhanced cache busting utilities
  getCacheBusterQuery: () => {
    const timestamp = isProduction ? BUILD_TIMESTAMP : Date.now();
    return `v=${APP_VERSION}&t=${timestamp}`;
  },
  
  getVersionedAssetUrl: (assetPath) => {
    const separator = assetPath.includes('?') ? '&' : '?';
    const timestamp = isProduction ? BUILD_TIMESTAMP : Date.now();
    return `${assetPath}${separator}v=${APP_VERSION}&t=${timestamp}`;
  },
  
  // Force clear browser cache
  clearBrowserCache: () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          console.log('🧹 Clearing cache:', name);
          caches.delete(name);
        });
      });
    }
    
    // Clear local storage cache items
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.includes('cache') || key.includes('v1.') || key.includes('old'))) {
        localStorage.removeItem(key);
        console.log('🧹 Cleared localStorage:', key);
      }
    }
    
    // Clear session storage
    sessionStorage.clear();
    console.log('🧹 Browser cache clearing completed');
  },
  
  // Check if cache should be cleared
  shouldClearCache: () => {
    return forceRefresh || 
           (isProduction && environment.CACHE_CONFIG.AGGRESSIVE_CACHE_BUST) ||
           (isDevelopment && environment.CACHE_CONFIG.CLEAR_ON_LOAD);
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
