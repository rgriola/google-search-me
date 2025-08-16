/**
 * Cache Management Initialization
 * Handles aggressive cache clearing for production deployments
 */

import { environmentUtils } from './modules/config/environment.js';
import { CacheService } from './modules/maps/CacheService.js';

// Initialize cache management immediately
(function initializeCacheManagement() {
  console.log('🚀 Initializing cache management...');
  
  // Clear caches if needed
  if (environmentUtils.shouldClearCache()) {
    console.log('🧹 Clearing all caches due to environment configuration');
    environmentUtils.clearBrowserCache();
  }
  
  // Initialize the cache service
  CacheService.init();
  
  // Add version info to DOM for debugging
  const versionInfo = document.createElement('meta');
  versionInfo.name = 'app-version';
  versionInfo.content = `${environmentUtils.getCacheBusterQuery()}`;
  document.head.appendChild(versionInfo);
  
  console.log('✅ Cache management initialized');
})();

// Export for manual cache clearing
window.clearAppCache = () => {
  console.log('🧹 Manual cache clear requested');
  environmentUtils.clearBrowserCache();
  CacheService.clear();
  window.location.reload(true);
};

// Add cache clear button to console for debugging
console.log('💡 To manually clear cache, run: clearAppCache()');
