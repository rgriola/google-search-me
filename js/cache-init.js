/**
 * Cache Management Initialization
 * Handles aggressive cache clearing for production deployments
 * SIMPLIFIED: Mobile service worker files removed, focus on browser cache management
 */

import { environmentUtils, environment } from './modules/config/environment.js';
import { CacheService } from './modules/maps/CacheService.js';

// Debug configuration based on environment
const DEBUG = !environmentUtils.isProduction;

/**
 * Debug logging function - only logs when DEBUG is true
 * @param {...any} args - Arguments to log
 */
function debug(...args) {
  if (DEBUG) {
    console.log('[CACHE]', ...args);
  }
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
  console.log('🧹 Manual cache clear requested');
  
  // Clear browser caches
  environmentUtils.clearBrowserCache();
  CacheService.clear();
  
  // Force hard reload
  console.log('🔄 Forcing hard reload...');
  window.location.reload(true);
};

// Only add developer helper messages in debug mode
if (DEBUG) {
  console.log('💡 Available cache management commands:');
  console.log('   clearAppCache() - Clear all caches and reload');
}
