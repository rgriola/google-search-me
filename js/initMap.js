/**
 * Global initMap function for Google Maps API
 * This file ensures initMap is available globally before Google Maps loads
 */

// Import Auth module for centralized token management
import { Auth } from './modules/auth/Auth.js';

// should look into a better way to write this 8-14-202
window.initMap = async function() {

    console.log('🚀 Initializing Google Search Me Application');
    
    // Initialize Google Maps with default location (Atlanta, GA - Turner Studios)
    const defaultLocation = { lat: 33.783, lng: -84.392 };
    
    try {
        // Dynamically import modules with cache busting
        const timestamp = Date.now() + Math.random();
        const { initializeAllModules } = await import(`./main.js?v=${timestamp}`);
        const { MapService } = await import(`./modules/maps/MapService.js?v=${timestamp}`);
        const { GPSPermissionService } = await import(`./modules/maps/GPSPermissionService.js?v=${timestamp}`);
        const { StateDebug } = await import(`./modules/state/AppState.js?v=${timestamp}`);
        
        // Initialize map service FIRST (sets up autocomplete service)
        await MapService.initialize('map', {
            zoom: 13,
            center: defaultLocation,
            mapTypeControl: true,
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
        
        await initializeAllModules();
        
        // Make GPS Permission Service available globally
        window.GPSPermissionService = GPSPermissionService;
        console.log('✅ Application modules initialized');
        
        // Verify map controls are visible after initialization
        setTimeout(() => {
            const gpsBtn = document.getElementById('gpsLocationBtn');
            const clusterBtn = document.getElementById('clusteringToggleBtn');
            const clickToSaveBtn = document.getElementById('mapClickToSaveBtn');
            
            console.log('Map controls check:', {
                gps: !!gpsBtn,
                cluster: !!clusterBtn,
                clickToSave: !!clickToSaveBtn
            });
        }, 1000);
        
        // Log initial state for debugging
        StateDebug.logState();
        
    } catch (error) {
        console.error('❌ Error initializing Google Maps:', error.message);
        
        // Check for authentication/session issues
        const isAuthError = (error.message.includes('currentUser') && error.message.includes('token')) || 
                           (error.message.includes('session') && error.message.includes('expired')) ||
                           (error.message.includes('unauthorized') || error.message.includes('401'));
        
        if (isAuthError) {
            console.log('🔄 Authentication issue detected, redirecting to login...');
            Auth.clearTokens();
            sessionStorage.clear();
            
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
            // Maps/initialization error
            console.log('🗺️ Google Maps initialization failed - Maps API or module loading error');
            
            try {
                const timestamp = Date.now();
                const { AuthNotificationService } = await import(`./modules/auth/AuthNotificationService.js?v=${timestamp}`);
                AuthNotificationService.showNotification('Failed to initialize Google Maps. Please refresh the page.', 'error');
            } catch (uiError) {
                console.error('Could not show error notification:', uiError);
                alert('Failed to initialize Google Maps. Please refresh the page.');
            }
        }
    }
};

console.log('✅ Global initMap function registered');