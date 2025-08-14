/**
 * Service Worker Killer Script
 * Run this in the browser console to completely disable mobile service workers
 */

console.log('🛠️ Starting Mobile Service Worker Cleanup...');

// Function to unregister all service workers
async function killAllServiceWorkers() {
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log(`📋 Found ${registrations.length} service worker(s)`);
            
            for (let registration of registrations) {
                console.log(`🗑️ Unregistering: ${registration.scope}`);
                const unregistered = await registration.unregister();
                
                if (unregistered) {
                    console.log(`✅ Successfully unregistered: ${registration.scope}`);
                } else {
                    console.log(`❌ Failed to unregister: ${registration.scope}`);
                }
            }
            
            if (registrations.length === 0) {
                console.log('✅ No service workers to unregister');
            }
        } catch (error) {
            console.error('❌ Error during service worker cleanup:', error);
        }
    } else {
        console.log('ℹ️ Service workers not supported');
    }
}

// Function to clear all caches
async function clearAllCaches() {
    if ('caches' in window) {
        try {
            const cacheNames = await caches.keys();
            console.log(`📦 Found ${cacheNames.length} cache(s)`);
            
            for (let cacheName of cacheNames) {
                console.log(`🗑️ Deleting cache: ${cacheName}`);
                const deleted = await caches.delete(cacheName);
                
                if (deleted) {
                    console.log(`✅ Deleted cache: ${cacheName}`);
                } else {
                    console.log(`❌ Failed to delete cache: ${cacheName}`);
                }
            }
            
            if (cacheNames.length === 0) {
                console.log('✅ No caches to clear');
            }
        } catch (error) {
            console.error('❌ Error during cache cleanup:', error);
        }
    } else {
        console.log('ℹ️ Cache API not supported');
    }
}

// Function to clear storage
function clearStorage() {
    try {
        const localCount = Object.keys(localStorage).length;
        const sessionCount = Object.keys(sessionStorage).length;
        
        localStorage.clear();
        sessionStorage.clear();
        
        console.log(`✅ Cleared ${localCount} localStorage items`);
        console.log(`✅ Cleared ${sessionCount} sessionStorage items`);
    } catch (error) {
        console.error('❌ Error clearing storage:', error);
    }
}

// Run the cleanup
async function cleanup() {
    console.log('🚀 Starting cleanup process...');
    
    await killAllServiceWorkers();
    await clearAllCaches();
    clearStorage();
    
    console.log('✅ Cleanup complete! Refresh the page to verify.');
    console.log('📋 Manual verification:');
    console.log('   1. F12 → Application → Service Workers (should be empty)');
    console.log('   2. F12 → Application → Storage (should be cleared)');
    console.log('   3. No more mobile-service-worker.js errors in console');
}

// Execute cleanup
cleanup();

// Export functions for manual use
window.serviceWorkerCleanup = {
    killAllServiceWorkers,
    clearAllCaches,
    clearStorage,
    cleanup
};

console.log('💡 You can also run these manually:');
console.log('   - serviceWorkerCleanup.killAllServiceWorkers()');
console.log('   - serviceWorkerCleanup.clearAllCaches()');
console.log('   - serviceWorkerCleanup.clearStorage()');
console.log('   - serviceWorkerCleanup.cleanup()');
