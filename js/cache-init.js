/**
 * Cache Management Initialization
 * Handles aggressive cache clearing for production deployments
 * SIMPLIFIED: Mobile service worker files removed, focus on browser cache management
 */

import { environmentUtils } from './modules/config/environment.js';
import { CacheService } from './modules/maps/CacheService.js';

// Initialize cache management immediately
(async function initializeCacheManagement() {
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
window.clearAppCache = async () => {
  console.log('🧹 Manual cache clear requested');
  
  // Clear browser caches
  environmentUtils.clearBrowserCache();
  CacheService.clear();
  
  // Force hard reload
  console.log('🔄 Forcing hard reload...');
  window.location.reload(true);
};

// Add cache clear command to console for debugging
console.log('💡 Available cache management commands:');
console.log('   clearAppCache() - Clear all caches and reload');
