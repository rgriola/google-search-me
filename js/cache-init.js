/**
 * Cache Management Initialization
 * Handles aggressive cache clearing for production deployments
 * SIMPLIFIED: Mobile service worker files removed, focus on browser cache management
 */

import { environmentUtils, environment } from './modules/config/environment.js';
import { CacheService } from './modules/maps/CacheService.js';

import { debug } from './debug.js';
const FILE = 'CACHE_INIT';

// Initialize cache management immediately
(async function initializeCacheManagement() {
  debug(FILE, '🚀 Initializing cache management...');
  debug(FILE, `Environment: ${environment.CURRENT_ENV}, Version: ${environment.APP_VERSION}`);
  
  // Clear caches if needed
  if (environmentUtils.shouldClearCache()) {
    debug(FILE, '🧹 Clearing all caches due to environment configuration');
    environmentUtils.clearBrowserCache();
  }
  
  // Initialize the cache service
  CacheService.init();
  
  // Add version info to DOM for debugging
  const versionInfo = document.createElement('meta');
  versionInfo.name = 'app-version';
  versionInfo.content = `${environmentUtils.getCacheBusterQuery()}`;
  document.head.appendChild(versionInfo);
  
  debug(FILE, '✅ Cache management initialized');
})();

// Export for manual cache clearing
window.clearAppCache = async () => {
  // Always log manual cache clear requests, even in production
  debug(FILE, '🧹 Manual cache clear requested');
  
  // Clear browser caches
  environmentUtils.clearBrowserCache();
  CacheService.clear();
  
  // Force hard reload
  debug(FILE, '🔄 Forcing hard reload...');
  window.location.reload(true);
};

// Only add developer helper messages in debug mode
debug(FILE, '💡 Available cache management commands:');
debug(FILE, '   clearAppCache() - Clear all caches and reload');