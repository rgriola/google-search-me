// Run this in the console to clean up service worker and cache


// Immediate cleanup - run this in your browser console
(async function() {
    console.log('🧹 Starting service worker cleanup...');
    
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(`Found ${registrations.length} service worker(s)`);
        
        for (let registration of registrations) {
            console.log(`Unregistering: ${registration.scope}`);
            await registration.unregister();
        }
    }
    
    // 2. Clear all caches
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`Found ${cacheNames.length} cache(s)`);
        
        for (let cacheName of cacheNames) {
            console.log(`Deleting cache: ${cacheName}`);
            await caches.delete(cacheName);
        }
    }
    
    // 3. Clear storage
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('✅ Cleanup complete! Please refresh the page.');
    alert('✅ Service worker cleanup complete! Refresh the page now.');
})();