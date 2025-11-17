/**
 * Google Maps initialization handler
 * Clean, modular approach with proper error handling and separation of concerns
 */

// Static imports for better performance and bundling
import { Auth } from './modules/auth/Auth.js';
import { debug } from './debug.js';
import { loadGoogleMapsAPI } from './utils/GoogleMapsLoader.js';

const FILE = 'INITMAP';

// Configuration constants
const CONFIG = {
    DEFAULT_LOCATION: { lat: 33.783, lng: -84.392 }, // Atlanta, GA - Turner Studios
    MAP_OPTIONS: {
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
        gestureHandling: 'cooperative'
    },
    REDIRECT_DELAY: 1000
};

/**
 * Application initialization class - better than global functions
 */
class AppInitializer {
    constructor() {
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    /**
     * Load required modules with proper error handling
     */
    async loadModules() {
        try {
            // Use static imports when possible, dynamic only when needed
            const [
                { initializeAllModules },
                { MapService },
                { GPSPermissionService },
                { StateDebug }
            ] = await Promise.all([
                import('./main.js'),
                import('./modules/maps/MapService.js'),
                import('./modules/maps/GPSPermissionService.js'),
                import('./modules/state/AppState.js')
            ]);

            return { initializeAllModules, MapService, GPSPermissionService, StateDebug };
        } catch (error) {
            debug(FILE, 'Failed to load modules:', error, 'error');
            throw new Error(`Module loading failed: ${error.message}`);
        }
    }

    /**
     * Initialize Google Maps
     */
    async initializeMap(MapService) {
        await MapService.initialize('map', {
            center: CONFIG.DEFAULT_LOCATION,
            ...CONFIG.MAP_OPTIONS
        });
        debug(FILE, '✅ Google Maps initialized');
    }

    /**
     * Wait for DOM to be ready and map element to exist
     */
    async waitForDOM() {
        // Wait for DOM content to load
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve, { once: true });
            });
        }
        
        // Wait for map element to be available (with timeout)
        const mapElement = await this.waitForElement('map', 5000);
        if (!mapElement) {
            throw new Error('Map element with ID "map" not found after DOM ready. Check if you\'re on the correct page (app.html).');
        }
        
        debug(FILE, '✅ Map element found in DOM');
    }
    
    /**
     * Wait for a specific element to appear in DOM
     */
    async waitForElement(elementId, timeout = 5000) {
        return new Promise((resolve) => {
            const element = document.getElementById(elementId);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver(() => {
                const element = document.getElementById(elementId);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // Timeout fallback
            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeout);
        });
    }

    /**
     * Handle authentication errors
     */
    async handleAuthError() {
        debug(FILE, '🔄 Authentication issue detected, redirecting to login...');
        Auth.clearTokens();
        sessionStorage.clear();

        // Show notification without dynamic import
        try {
            const { AuthNotificationService } = await import('./modules/auth/AuthNotificationService.js');
            AuthNotificationService.showNotification('Session expired. Redirecting to login...', 'info');
        } catch {
            alert('Session expired. Redirecting to login...');
        }

        setTimeout(() => {
            window.location.href = '/login.html';
        }, CONFIG.REDIRECT_DELAY);
    }

    /**
     * Handle general initialization errors
     */
    async handleInitError(error) {
        debug(FILE, '🗺️ Initialization failed:', error.message, 'error');
        
        try {
            const { AuthNotificationService } = await import('./modules/auth/AuthNotificationService.js');
            AuthNotificationService.showNotification('Failed to initialize application. Please refresh the page.', 'error');
        } catch {
            alert('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Check if error is authentication related
     */
    isAuthError(error) {
        const authKeywords = ['currentUser', 'token', 'session', 'expired', 'unauthorized', '401'];
        return authKeywords.some(keyword => error.message.toLowerCase().includes(keyword.toLowerCase()));
    }

    /**
     * Main initialization method
     */
    async initialize() {
        if (this.initialized) {
            debug(FILE, 'App already initialized', 'warn');
            return;
        }

        debug(FILE, '🚀 Initializing Google Search Me Application');
        
        // Debug: Log initial state
        debug(FILE, '🔍 Initial Debug Info:', {
            documentReady: document.readyState,
            hasBody: !!document.body,
            hasMapElement: !!document.getElementById('map'),
            currentURL: window.location.href
        });

        try {
            // Wait for DOM readiness FIRST
            await this.waitForDOM();
            debug(FILE, '✅ DOM is ready');
            
            // Load Google Maps API securely from server
            debug(FILE, '🗺️ Loading Google Maps API...');
            await loadGoogleMapsAPI();
            debug(FILE, '✅ Google Maps API loaded');
            
            // Load all required modules
            const { initializeAllModules, MapService, GPSPermissionService, StateDebug } = await this.loadModules();

            // Initialize map after Google Maps API is loaded
            await this.initializeMap(MapService);

            // Initialize all application modules
            await initializeAllModules();

            // Expose GPS service globally (consider using a service locator pattern instead)
            window.GPSPermissionService = GPSPermissionService;
            debug(FILE, '✅ Application modules initialized');

            // Debug logging
            StateDebug.logState();

            this.initialized = true;

        } catch (error) {
            debug(FILE, '❌ Error initializing application:', error.message, 'error');

            if (this.isAuthError(error)) {
                await this.handleAuthError();
            } else {
                await this.handleInitError(error);
            }

            // Retry logic for transient errors
            if (this.retryCount < this.maxRetries && !this.isAuthError(error)) {
                this.retryCount++;
                debug(FILE, `🔄 Retrying initialization (${this.retryCount}/${this.maxRetries})`);
                setTimeout(() => this.initialize(), 2000);
            }
        }
    }
}

// Create global instance and initialize
const appInitializer = new AppInitializer();

// Auto-initialize when DOM is ready (no longer depends on Google Maps callback)
function autoInitialize() {
    // Safety check: Only initialize if map element exists
    if (!document.getElementById('map')) {
        debug(FILE, '⚠️ No map element found. Skipping initialization.', 'warn');
        debug(FILE, 'ℹ️ Current page:', window.location.pathname, 'info');
        return;
    }
    
    appInitializer.initialize();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitialize);
} else {
    // DOM already loaded
    autoInitialize();
}

debug(FILE, '✅ Auto-initialization configured');