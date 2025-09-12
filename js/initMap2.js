/**
 * Global initMap function for Google Maps API
 * Cleaner, more maintainable approach with proper separation of concerns
 */

import { Auth } from './modules/auth/Auth.js';
//import { AppInitializer } from './modules/core/AppInitializer.js';
import { ErrorHandler } from './utils/ErrorHandler.js';
import { NotificationService } from './modules/ui/NotificationService.js';

// Default configuration
const CONFIG = {
    defaultLocation: { lat: 33.783, lng: -84.392 }, // Atlanta, GA - Turner Studios
    mapOptions: {
        zoom: 13,
        disableDefaultUI: false,
        mapTypeControl: true,
        //mapTypeControlOptions: {
       //     style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      //  },
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        gestureHandling: 'cooperative',
        //zoomControl: boolean,
       // cameraControl: true,
        //mapTypeControl: boolean,
       // scaleControl: true,
        //streetViewControl: boolean,
       // rotateControl: true,
        //fullscreenControl: boolean
    },
    timeouts: {
        redirect: 1000,
        controlsCheck: 1000
    }
};

/**
 * Main initialization function - cleaner and more focused
 */
window.initMap = async function() {
    console.log('🚀 Initializing Google Search Me Application');
    
    try {

        // 2. Initialize Google Maps
        //await initializeGoogleMaps();

        // 3. Initialize application modules
        await initializeApplicationModules();

        // 1. Initialize core systems
        await initializeCoreServices();
        
        // 2. Initialize Google Maps
        await initializeGoogleMaps();

        
        console.log('✅ Application fully initialized');
        
    } catch (error) {
        await handleInitializationError(error);
    }
};

/**
 * Initialize all application modules
 */
async function initializeApplicationModules() {

    const timestamp = Date.now() + Math.random();
    const { initializeAllModules } = await import(`./main.js?v=${timestamp}`);
    await initializeAllModules();

    // Make GPS Service globally available (if needed)
    const { GPSPermissionService } = await import(`./modules/maps/GPSPermissionService.js?`);
    window.GPSPermissionService = GPSPermissionService;
    
    console.log('✅ Application modules initialized');
}

/**
 * Initialize Google Maps service
 */
async function initializeGoogleMaps() {

    const { MapService } = await import(`./modules/maps/MapService.js?`);

    let loc = { lat: 33.783, lng: -84.392 }; // Atlanta, GA - Turner Studios

    console.log("User Permission : ", window.GPSPermissionService.hasStoredGPSPermission());
    
    //checks for user permission to use GPS location
    if (!window.GPSPermissionService.hasStoredGPSPermission()) {
            // If Permission Granted Use USER GPS location
            loc = await MapService.getCurrentLocation();
        }
    
            await MapService.initialize('map', {
            center: loc,
            ...CONFIG.mapOptions
        });

        // Add or update GPS location marker
        MapService.addGPSLocationMarker(loc);


    console.log('✅ Google Maps initialized');
}

/**
 * Initialize core services that everything depends on
 */
async function initializeCoreServices() {
    // Ensure DOM is ready
    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve);
        });
    }
    
    // Initialize notification system early
    await NotificationService.initialize();
    
    console.log('✅ Core services initialized');
}

/**
 * Handle initialization errors with proper error classification
 */
async function handleInitializationError(error) {
    console.error('❌ Application initialization failed:', error);
    
    const errorType = ErrorHandler.classifyError(error);
    
    switch (errorType) {
        case 'AUTH_ERROR':
            await handleAuthenticationError(error);
            break;
        case 'MAPS_ERROR':
            await handleMapsError(error);
            break;
        case 'MODULE_ERROR':
            await handleModuleError(error);
            break;
        default:
            await handleGenericError(error);
    }
}

/**
 * Handle authentication-related errors
 */
async function handleAuthenticationError(error) {
    console.log('🔄 Authentication issue detected, redirecting to login...');
    
    // Clean up auth state
    Auth.clearTokens();
    sessionStorage.clear();
    
    // Show notification and redirect
    await NotificationService.show('Session expired. Redirecting to login...', 'info');

    setTimeout(() => {
        window.location.href = '/login.html';
    }, CONFIG.timeouts.redirect);
}

/**
 * Handle Google Maps API errors
 */
async function handleMapsError(error) {
    console.log('🗺️ Google Maps initialization failed');

    await NotificationService.show(
        'Failed to initialize Google Maps. Please refresh the page.',
        'error'
    );
}

/**
 * Handle module loading errors
 */
async function handleModuleError(error) {
    console.log('📦 Module loading failed');

    await NotificationService.show(
        'Application modules failed to load. Please refresh the page.',
        'error'
    );
}

/**
 * Handle generic errors
 */
async function handleGenericError(error) {
    await NotificationService.show(
        'Application failed to initialize. Please refresh the page.', 
        'error'
    );
}

console.log('✅ Global initMap function registered');