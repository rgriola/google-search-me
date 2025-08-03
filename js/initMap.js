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
    //const defaultLocation = { lat: 37.7749, lng: -122.4194 };
    const defaultLocation = { lat: 33.78303466147125, lng: -84.39278598970333 }; // Atlanta, GA
    // This is Turner Studios.
    
    try {
        // Dynamically import modules with cache busting - force new timestamp
        const timestamp = Date.now() + Math.random();
        console.log('🔄 Loading modules with timestamp:', timestamp);
        console.log('🔍 Cache busting - forcing fresh module loads');
        const { initializeAllModules } = await import(`./main.js?v=${timestamp}`);
        const { MapService } = await import(`./modules/maps/MapService.js?v=${timestamp}`);
        const { GPSPermissionService } = await import(`./modules/maps/GPSPermissionService.js?v=${timestamp}`);
        const { StateDebug } = await import(`./modules/state/AppState.js?v=${timestamp}`);
        
        // Initialize map service FIRST (this sets up autocomplete service)
        await MapService.initialize('map', {
            zoom: 13,
            center: defaultLocation,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: false,
            gestureHandling: 'cooperative'
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
        
        // Make GPS Permission Service available globally
        window.GPSPermissionService = GPSPermissionService;
        console.log('📍 GPS Permission Service available globally');
        
        // Verify map controls are visible after initialization
        setTimeout(() => {
            const gpsBtn = document.getElementById('gpsLocationBtn');
            const clusterBtn = document.getElementById('clusteringToggleBtn');
            const clickToSaveBtn = document.getElementById('mapClickToSaveBtn');
            
            console.log('🔍 Map controls visibility check:');
            console.log('   GPS button:', !!gpsBtn, gpsBtn ? 'visible' : 'missing');
            console.log('   Cluster button:', !!clusterBtn, clusterBtn ? 'visible' : 'missing');
            console.log('   Click-to-save button:', !!clickToSaveBtn, clickToSaveBtn ? 'visible' : 'missing');
            
            if (gpsBtn) {
                const style = window.getComputedStyle(gpsBtn);
                console.log('   GPS button computed style - display:', style.display, 'visibility:', style.visibility, 'z-index:', style.zIndex);
            }
        }, 1000);
        
        // Log initial state for debugging
        StateDebug.logState();
        
    } catch (error) {
        console.error('❌ Error initializing Google Maps:', error);
        
        // Check if this is an authentication/session issue
        const isAuthError = error.message.includes('currentUser') || 
                           error.message.includes('token') || 
                           error.message.includes('session') ||
                           error.message.includes('not defined');
        
        if (isAuthError) {
            console.log('🔄 Authentication issue detected, redirecting to login...');
            // Clear any stale tokens/sessions
            localStorage.removeItem('authToken');
            sessionStorage.clear();
            
            // Redirect to login page for fresh authentication
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1000);
            
            // Show user-friendly message
            try {
                const timestamp = Date.now();
                const { AuthNotificationService } = await import(`./modules/auth/AuthNotificationService.js?v=${timestamp}`);
                AuthNotificationService.showNotification('Session expired. Redirecting to login...', 'info');
            } catch (uiError) {
                alert('Session expired. Redirecting to login...');
            }
        } else {
            // Show general error notification
            try {
                const timestamp = Date.now();
                const { AuthNotificationService } = await import(`./modules/auth/AuthNotificationService.js?v=${timestamp}`);
                AuthNotificationService.showNotification('Failed to initialize application. Please refresh the page.', 'error');
            } catch (uiError) {
                console.error('Could not show error notification:', uiError);
                alert('Failed to initialize application. Please refresh the page.');
            }
        }
    }
};

console.log('✅ Global initMap function registered');