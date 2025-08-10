/**
 * Mobile App Google Maps Callback
 * External script to handle Google Maps API callback and avoid CSP violations
 */

window.initMobileApp = function() {
    console.log('🗺️ Google Maps API loaded, initializing mobile app...');
    if (window.mobileApp && window.mobileApp.onMapsAPIReady) {
        window.mobileApp.onMapsAPIReady();
    }
};
