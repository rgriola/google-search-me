/**
 * Cache Management Initialization
 * Handles aggressive cache clearing for production deployments
 * SIMPLIFIED: Mobile service worker files removed, focus on browser cache management
 */

import { environmentUtils, environment } from './modules/config/environment.js';
import { CacheService } from './modules/maps/CacheService.js';

// Environment detection for automatic debug configuration
const isProduction = window.location.hostname !== 'localhost' && 
                    !window.location.hostname.includes('dev');

// Debug configuration - automatically enabled in development environments
const DEBUG = !isProduction;

/**
 * Debug logging function - only logs when DEBUG is true
 * @param {...any} args - Arguments to log
 */
function debug(...args) {
     if (!DEBUG) return;
    
    // Check if the last argument is a string specifying the log type
    let logType = 'log';
    let logArgs = args;
    
    if (args.length > 0 && typeof args[args.length - 1] === 'string') {
        const possibleType = args[args.length - 1];
        if (['log', 'warn', 'error', 'info'].includes(possibleType)) {
            logType = possibleType;
            logArgs = args.slice(0, -1); // Remove the type from arguments
        }
    }

    // Add prefix to first argument if it's a string
    const prefix = '[CACHE-INIT] ';
    if (logArgs.length > 0 && typeof logArgs[0] === 'string') {
        logArgs[0] = prefix + logArgs[0];
    } else {
        logArgs.unshift(prefix);
    }
    
    // Use appropriate console method
    console[logType](...logArgs);
    
    /*
    // Standard log (uses console.log)
    debug('This is a regular debug message');

    // Warning (uses console.warn)
    debug('This is a warning message', 'warn');

    // Error (uses console.error)
    debug('This is an error message', 'error');

    // Info (uses console.info)
    debug('This is an info message', 'info');
    
    // With multiple arguments
    debug('User data:', userData, 'warn');

    // With object
    debug('Button state:', buttonStates, 'error');
    */
}

// Initialize cache management immediately
(async function initializeCacheManagement() {
  debug('🚀 Initializing cache management...');
  debug(`Environment: ${environment.CURRENT_ENV}, Version: ${environment.APP_VERSION}`);
  
  // Clear caches if needed
  if (environmentUtils.shouldClearCache()) {
    debug('🧹 Clearing all caches due to environment configuration');
    environmentUtils.clearBrowserCache();
  }
  
  // Initialize the cache service
  CacheService.init();
  
  // Add version info to DOM for debugging
  const versionInfo = document.createElement('meta');
  versionInfo.name = 'app-version';
  versionInfo.content = `${environmentUtils.getCacheBusterQuery()}`;
  document.head.appendChild(versionInfo);
  
  debug('✅ Cache management initialized');
})();

// Export for manual cache clearing
window.clearAppCache = async () => {
  // Always log manual cache clear requests, even in production
  debug('🧹 Manual cache clear requested');
  //console.log('🧹 Manual cache clear requested');
  
  // Clear browser caches
  environmentUtils.clearBrowserCache();
  CacheService.clear();
  
  // Force hard reload
  debug('🔄 Forcing hard reload...');
  //console.log('🔄 Forcing hard reload...');
  window.location.reload(true);
};

// Only add developer helper messages in debug mode
debug('💡 Available cache management commands:');
debug('   clearAppCache() - Clear all caches and reload');