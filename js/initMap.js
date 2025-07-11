/**
 * Global initMap function for Google Maps API
 * This file ensures initMap is available globally before Google Maps loads
 */

/**
 * Global initMap function required by Google Maps API
 */
window.initMap = async function() {
    console.log('🚀 Initializing Google Search Me Application');
    
    // Initialize Google Maps with default location (San Francisco)
    const defaultLocation = { lat: 37.7749, lng: -122.4194 };
    
    try {
        // Dynamically import modules with cache busting
        const timestamp = Date.now();
        const { initializeAllModules } = await import(`/js/main.js?v=${timestamp}`);
        const { MapService } = await import(`/js/modules/maps/MapService.js?v=${timestamp}`);
        const { StateDebug } = await import(`/js/modules/state/AppState.js?v=${timestamp}`);
        
        // Initialize map service FIRST (this sets up autocomplete service)
        await MapService.initialize('map', {
            zoom: 13,
            center: defaultLocation,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true
        });
        
        console.log('✅ Google Maps initialized');
        
        // Ensure DOM is ready, then initialize all application modules
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        console.log('✅ DOM is ready, initializing modules...');
        await initializeAllModules();
        
        // Log initial state for debugging
        StateDebug.logState();
        
    } catch (error) {
        console.error('❌ Error initializing Google Maps:', error);
        // Show error notification
        try {
            const timestamp = Date.now();
            const { AuthUI } = await import(`/js/modules/auth/AuthUI.js?v=${timestamp}`);
            AuthUI.showNotification('Failed to initialize Google Maps. Please refresh the page.', 'error');
        } catch (uiError) {
            console.error('Could not show error notification:', uiError);
            alert('Failed to initialize Google Maps. Please refresh the page.');
        }
    }
};

console.log('✅ Global initMap function registered');