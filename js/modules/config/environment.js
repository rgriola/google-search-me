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

// this is js/modules/config/environment.js

import { debug, DEBUG } from '../../debug.js';
import ScriptInitManager from '../../utils/ScriptInitManager.js';
const FILE = 'MODULE_CONFIG_ENVIRONMENT';

// Application version - update with each deployment
const APP_VERSION = '1.2.1755401200'; // Updated with server cache fix
const BUILD_TIMESTAMP = '1755401200'; // Dynamic timestamp - server cache fix

// Environment detection
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('dev');

const isProduction = !isDevelopment;

// Force cache bust on production by checking URL params
const forceRefresh = window.location.search.includes('refresh=true') ||
                    window.location.search.includes('nocache=true');

// Debug logging of environment detection
debug(FILE, '🌍 Environment Detection:', {
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
// Add DEBUG flag to environment for other modules to use
environment.DEBUG = DEBUG;

// Debug logging of loaded configuration
debug(FILE, '🔧 Environment Config loaded:', {
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
          // Only log cache clearing when debug is enabled
          if (DEBUG) debug(FILE, `🧹 Clearing cache: ${name}`);
          caches.delete(name);
        });
      });
    }
    
    // Clear local storage cache items
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.includes('cache') || key.includes('v1.') || key.includes('old'))) {
        localStorage.removeItem(key);
        if (DEBUG) debug(FILE, `🧹 Cleared localStorage: ${key}`);
      }
    }
    
    // Clear session storage
    sessionStorage.clear();
    
    // Log completion message
    if (DEBUG) debug(FILE, '🧹 Browser cache clearing completed');
  },
  
  // Check if cache should be cleared
  shouldClearCache: () => {
    return forceRefresh || 
           (isProduction && environment.CACHE_CONFIG.AGGRESSIVE_CACHE_BUST) ||
           (isDevelopment && environment.CACHE_CONFIG.CLEAR_ON_LOAD);
  },
  
  /**
   * Environment-specific logging that respects both the DEBUG flag and LOG_LEVEL
   * @param {string} level - Log level: DEBUG, WARN, or ERROR
   * @param {string} message - Message to log
   * @param {any} data - Optional data to log
   */
  log: (level, message, data = null) => {
    // Skip all logging if DEBUG is false, except for ERRORs which are always important
    if (!DEBUG && level !== 'ERROR') return;
    
    const logLevel = environment.LOG_LEVEL;
    const levels = { DEBUG: 0, WARN: 1, ERROR: 2 };
    
    // Only log if the current level is same or higher priority than environment setting
    if (levels[level] >= levels[logLevel]) {
      const prefix = `${environment.CURRENT_ENV.toUpperCase()}`;
      const logType = level.toLowerCase();
      
      if (data) {
        debug(FILE, `[${prefix}] ${message}`, data, logType);
      } else {
        debug(FILE, `[${prefix}] ${message}`, null, logType);
      }
    }
  }
};

// Export default configuration
export default environment;

// Register with ScriptInitManager for the initialization system
if (ScriptInitManager) {
  ScriptInitManager.register('Environment', {
    environment,
    environmentUtils,
    APP_VERSION,
    BUILD_TIMESTAMP,
    isDevelopment,
    isProduction
  });
  debug(FILE, '✅ Environment module registered with ScriptInitManager');
} else {
  debug(FILE, '⚠️ ScriptInitManager not available, environment module not registered', 'warn');
  
  // Fallback registration when script init manager loads later
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (window.ScriptInitManager) {
        window.ScriptInitManager.register('Environment', {
          environment,
          environmentUtils,
          APP_VERSION,
          BUILD_TIMESTAMP,
          isDevelopment,
          isProduction
        });
        debug(FILE, '✅ Environment module registered with ScriptInitManager (delayed)');
      }
    }, 100);
  });
}
