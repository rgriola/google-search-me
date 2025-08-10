/**
 * Mobile App Google Maps Callback
 * External script to handle Google Maps API callback and avoid CSP violations
 */

window.initMobileApp = function() {
    console.log('🗺️ Google Maps API loaded, initializing mobile app...');
    
    // Set a flag that Google Maps is ready
    window.googleMapsReady = true;
    
    // If mobile app is already initialized, call its callback
    if (window.mobileApp && window.mobileApp.onMapsAPIReady) {
        window.mobileApp.onMapsAPIReady();
    }
    
    // If mobile app is waiting to be initialized, trigger initialization
    if (window.mobileAppReady && !window.mobileApp) {
        console.log('📱 Triggering mobile app initialization...');
        // Dispatch a custom event to trigger mobile app initialization
        window.dispatchEvent(new CustomEvent('googleMapsReady'));
    }
};
