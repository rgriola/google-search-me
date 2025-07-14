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
        const { initializeAllModules } = await import(`./main.js?v=${timestamp}`);
        const { MapService } = await import(`./modules/maps/MapService.js?v=${timestamp}`);
        const { StateDebug } = await import(`./modules/state/AppState.js?v=${timestamp}`);
        
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