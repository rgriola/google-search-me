// Import centralized state management and debugging
import { debug, DEBUG } from './debug.js';
import ScriptInitManager from './utils/ScriptInitManager.js';
const FILE = '>> MAIN <<';

import { StateManager, StateDebug } from './modules/state/AppState.js';

// Import security utilities
import { SecurityUtils } from './utils/SecurityUtils.js';

// Import Auth module for centralized authentication
import { Auth } from './modules/auth/Auth.js';

// Import environment configuration
import { environment } from './modules/config/environment.js';

// Import maps modules
import { MapService } from './modules/maps/MapService.js';
import { SearchService } from './modules/maps/SearchService.js';
import { SearchUI } from './modules/maps/SearchUI.js';
import { MarkerService } from './modules/maps/MarkerService.js';
import { ClickToSaveService } from './modules/maps/ClickToSaveService.js';
import MapControlsManager from './modules/maps/MapControlsManager.js?v=fixed-regex';

// Import locations modules
import { Locations } from './modules/locations/Locations.js';

/**
 * Initialize the application modules
 * This function is called by the global initMap function in initMap.js
 * Optimized for faster loading and better user experience
 */
async function initializeAllModules() {
    try {
        // Environment-aware cache management
        if (!environment?.CACHE_CONFIG) {
            debug(FILE, '❌ Environment configuration not loaded', 'error');
            throw new Error('Environment configuration not available');
        }

        if (environment.CACHE_CONFIG.CLEAR_ON_LOAD) {
            debug(FILE, '🧹 Development mode: Clearing caches');
            await clearDevelopmentCaches();
        } else {
            await manageProductionCaches();
        }
        
        // Authentication initialization
        debug(FILE, '🔐 Initializing authentication...');
        await Auth.initialize();
        
        // Initialize AdminModalManager for global access
        debug(FILE, '🎛️ Initializing Admin Modal Manager...');
        try {
            const { AuthAdminService } = await import('./modules/auth/AuthAdminService.js');
            await AuthAdminService.initialize();
            debug(FILE, '✅ Admin Modal Manager initialized');
        } catch (error) {
            debug(FILE, '⚠️ AdminModalManager initialization failed:', error, 'warn');
        }
        
        // Validate authentication state
        const authState = StateManager.getAuthState();
        const currentUser = authState?.currentUser;
        
        if (currentUser) {
            debug(FILE, '✅ Authenticated user found:', currentUser.email || currentUser.username);
            const { AuthUICore } = await import('./modules/auth/AuthUICore.js');
            AuthUICore.updateAuthUI();
        } else {
            debug(FILE, '⚠️ No authenticated user found', 'warn');
            // Check for token without user data (indicates auth issue)
            const token = Auth.getToken();
            if (token) {
                debug(FILE, '🚨 Auth token present but no user data - verification failed', 'error');
            }
        }
        
        // Initialize core map services
        debug(FILE, '🗺️ Initializing map services...');
        await Promise.all([
            SearchService.initialize(),
            SearchUI.initialize(),
            MarkerService.initialize(),
            ClickToSaveService.initialize()
        ]);
        
        // Initialize locations system
        debug(FILE, '📍 Initializing locations...');
        await Locations.initialize();
        
        // Export services to window for global access
        debug(FILE, '🌐 Exporting services to window object...');
       
        window.StateManager = StateManager;
        window.StateDebug = StateDebug;
        window.Auth = Auth;
        
        // Access services through Auth coordinator
        const authServices = Auth.getServices();
        window.AuthModalService = authServices.AuthModalService;
        window.AuthNotificationService = authServices.AuthNotificationService;
        
        // Export map services
        window.MapService = MapService;
        window.MarkerService = MarkerService;
        window.ClickToSaveService = ClickToSaveService;
        
        // Setup inter-module event handlers
        setupEventHandlers();
        
        debug(FILE, '✅ All modules initialized successfully');
        
        // Test server connection in background (non-blocking)
        setTimeout(async () => {
            try {
                const isConnected = await window.testServerConnection();
            } catch (error) {
                debug(FILE, 'Error testing server connection:', error, 'error');
            }
        }, 1000);

    } catch (error) {
        debug(FILE, '❌ Error initializing modules:', error, 'error');
        showErrorNotification('Failed to initialize application. Please refresh the page.');
    }
}

/**
 * Clear caches in development mode for fresh testing
 * Only runs when isDevelopment is true
 */
async function clearDevelopmentCaches() {
    try {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            
            if (cacheNames.length > 0) {
                debug(FILE, `🧹 Clearing ${cacheNames.length} cache(s)`);
                await Promise.all(cacheNames.map(name => caches.delete(name)));
                debug(FILE, '✅ Development caches cleared');
            }
        } else {
            debug(FILE, 'ℹ️ Cache API not supported');
        }
        
        // Clean up service workers in development
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            if (registrations.length > 0) {
                debug(FILE, `🧹 Cleaning ${registrations.length} service worker(s)`);
                for (let registration of registrations) {
                    await registration.unregister();
                }
            }
        }
        
    } catch (error) {
        debug(FILE, '⚠️ Error during development cache cleanup:', error, 'warn');
        // Don't fail the app if cache cleanup fails
    }
}

/**
 * Production cache management for deployment
 * Handles versioned cache cleanup and optimization
 */
async function manageProductionCaches() {
    try {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            
            // Handle app caches - we want to keep only the current version
            const appCacheRegex = /^app-cache-v(\d+)$/;
            const appCaches = cacheNames.filter(name => appCacheRegex.test(name));
            
            if (appCaches.length > 1) {
                // Sort caches by version number (descending)
                appCaches.sort((a, b) => {
                    const versionA = parseInt(a.match(appCacheRegex)[1], 10);
                    const versionB = parseInt(b.match(appCacheRegex)[1], 10);
                    return versionB - versionA;
                });
                
                // Keep the newest cache, delete older ones
                const newestCache = appCaches[0];
                const oldAppCaches = appCaches.slice(1);
                
                debug(FILE, `🧹 Cleaning ${oldAppCaches.length} old cache version(s)`);
                await Promise.all(oldAppCaches.map(name => caches.delete(name)));
            }
            
            // Clean any temporary caches older than 24 hours
            const tempCacheRegex = /^temp-cache-(\d+)$/;
            const tempCaches = cacheNames.filter(name => tempCacheRegex.test(name));
            
            if (tempCaches.length > 0) {
                const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
                const oldTempCaches = tempCaches.filter(name => {
                    const timestamp = parseInt(name.match(tempCacheRegex)[1], 10);
                    return timestamp < oneDayAgo;
                });
                
                if (oldTempCaches.length > 0) {
                    debug(FILE, `🧹 Cleaning ${tempCaches.length} temporary cache(s)`);
                    await Promise.all(oldTempCaches.map(name => caches.delete(name)));
                }
            }
        }
    } catch (error) {
        debug(FILE, '⚠️ Error during production cache management:', error, 'warn');
        // Don't fail the app if cache management fails
    }
}

/**
 * Setup inter-module event handlers for communication
 */
function setupEventHandlers() {
    // Search event handlers
    setupSearchEventHandlers();
    
    // Click-to-save event handlers
    setupClickToSaveEventHandlers();
    
    // Initialize unified map controls
    MapControlsManager.initialize();
    
    // Setup other event handlers
    setupUIEnhancements();
    
    debug(FILE, '✅ Event handlers initialized');
}

/**
 * Setup change password form handler in profile modal
 * Uses PasswordUIService for centralized UI handling
 */
async function setupChangePasswordHandler() {
    try {
        const { PasswordUIService } = await import('./modules/ui/PasswordUIService.js');
        const { AuthNotificationService } = Auth.getServices();

        await PasswordUIService.initialize();

        PasswordUIService.setupChangePasswordHandler({
            Auth,
            showError: message => AuthNotificationService.showNotification(message, 'error'),
            showSuccess: message => AuthNotificationService.showNotification(message, 'success')
        });

        debug(FILE, '✅ Password UI handler setup via PasswordUIService');
    } catch (error) {
        debug(FILE, '❌ Error setting up password UI handler:', error, 'error');
    }
}

/**
 * Setup search event handlers for maps integration
 */
function setupSearchEventHandlers() {
    // Listen for search completion
    document.addEventListener('search-complete', async (event) => {
        const { result } = event.detail;
        
        try {
            // Show the place on the map
            await MarkerService.showPlaceOnMap(result.place, {
                showInfoWindow: true,
                zoom: 15
            });
            
        } catch (error) {
            debug(FILE, 'Error displaying search result:', error, 'error');
            showErrorNotification('Error displaying search result');
        }
    });

    // Listen for suggestion selection
    document.addEventListener('suggestion-selected', async (event) => {
        const { placeDetails } = event.detail;
        
        try {
            // Show the selected place on the map
            await MarkerService.showPlaceOnMap(placeDetails, {
                showInfoWindow: true,
                zoom: 16
            });
            
        } catch (error) {
            debug(FILE, 'Error displaying selected place:', error, 'error');
            showErrorNotification('Error displaying selected place');
        }
    });

    // Listen for search errors
    document.addEventListener('search-error', (event) => {
        const { error, query } = event.detail;
        debug(FILE, 'Search error:', error, 'error');
        showErrorNotification(`Search failed: ${error.message}`);
    });

    debug(FILE, '✅ Search event handlers configured');
}

/**
 * Setup click-to-save event handlers for maps integration
 */
function setupClickToSaveEventHandlers() {
    // Direct button handler for specific button IDs
    const setupDirectButton = (buttonId, buttonName) => {
        const button = document.getElementById(buttonId);
        
        if (button) {
            // Remove existing handlers and add new one
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', (event) => {
                event.preventDefault();

                if (!ClickToSaveService || typeof ClickToSaveService.toggle !== 'function') {
                    debug(FILE, '❌ ClickToSaveService not available', null, 'error');
                    const { AuthNotificationService } = Auth.getServices();
                    AuthNotificationService.showNotification('Click-to-save service is unavailable. Please refresh the page.', 'error');
                    return;
                }

                try {
                    ClickToSaveService.toggle();
                } catch (error) {
                    debug(FILE, '❌ Error in ClickToSaveService.toggle:', error, 'error');
                    const { AuthNotificationService } = Auth.getServices();
                    AuthNotificationService.showNotification(`Click-to-save error: ${SecurityUtils.escapeHtml(error.message)}`, 'error');
                }
            });
            
            return true;
        }
        return false;
    };
    
    // Try to set up main click-to-save button
    const mainButtonSetup = setupDirectButton('clickToSaveBtn', 'main click-to-save button');
    if (!mainButtonSetup) {
        // Retry with delay if button not found initially
        setTimeout(() => {
            setupDirectButton('clickToSaveBtn', 'main click-to-save button');
        }, 1000);
    }
    
    // Handle click-to-save button clicks (generic fallback)
    document.addEventListener('click', async (event) => {
        const clickToSaveBtn = event.target.closest('.click-to-save-btn, .map-control-btn[data-action="click-to-save"]');
        // Skip main button (handled by direct handler)
        if (clickToSaveBtn && clickToSaveBtn.id === 'clickToSaveBtn') {
            return;
        }
        
        if (clickToSaveBtn) {
            event.preventDefault();
            if (!ClickToSaveService || typeof ClickToSaveService.toggle !== 'function') {
                debug(FILE, '❌ ClickToSaveService not properly loaded', null, 'error');
                return;
            }
            
            try {
                ClickToSaveService.toggle();
            } catch (error) {
                debug(FILE, '❌ Error toggling click-to-save:', error, 'error');
            }
            
            return;
        }
        
        // Handle location action buttons (edit, delete) in popups
        const actionBtn = event.target.closest('[data-action]');
        if (actionBtn && actionBtn.closest('.location-details-popup')) {
            event.preventDefault();
            
            const action = actionBtn.getAttribute('data-action');
            const placeId = actionBtn.getAttribute('data-place-id');
            
            try {
                if (action === 'edit') {
                    await Locations.showEditLocationDialog(placeId);
                } else if (action === 'delete') {
                    await Locations.deleteLocation(placeId);
                }
            } catch (error) {
                debug(FILE, `Error handling ${action} action:`, error, 'error');
                const { AuthNotificationService } = Auth.getServices();
                AuthNotificationService.showNotification(`Error ${action}ing location`, 'error');
            }
        }
    });

    // Listen for location save events from form submissions
    document.addEventListener('location-save-requested', async (event) => {
        const { locationData } = event.detail;
        
        try {
            // Location data from form is already in correct format
            await Locations.saveLocation(locationData);
            const { AuthNotificationService } = Auth.getServices();
            AuthNotificationService.showNotification('Location saved successfully!', 'success');
            
            // Dispatch success event to reset UI states
            document.dispatchEvent(new CustomEvent('location-save-success', {
                detail: { locationData },
                bubbles: true
            }));
            
            // Refresh handled internally by Locations module
        } catch (error) {
            debug(FILE, 'Error saving location:', error, 'error');
            const { AuthNotificationService } = Auth.getServices();
            AuthNotificationService.showNotification('Failed to save location', 'error');
            
            // Dispatch error event to reset UI states
            document.dispatchEvent(new CustomEvent('location-save-error', {
                detail: { error, locationData },
                bubbles: true
            }));
        }
    });
    
    debug(FILE, '✅ Click-to-save event handlers configured');
}

/**
 * Setup UI enhancement handlers
 */
function setupUIEnhancements() {
    // Handle responsive behavior and keyboard shortcuts
    setupResponsiveBehavior();
    setupGlobalKeyboardShortcuts();
}

/**
 * Setup responsive behavior for mobile devices
 */
function setupResponsiveBehavior() {
    // Handle orientation change on mobile
    window.addEventListener('orientationchange', () => {
        // Refresh map size after orientation change
        setTimeout(() => {
            const map = MapService.getMap();
            if (map) {
                google.maps.event.trigger(map, 'resize');
            }
        }, 100);
    });
}

/**
 * Setup global keyboard shortcuts
 */
function setupGlobalKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Only handle shortcuts when not typing in input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.key) {
            case '/':
                event.preventDefault();
                // Focus main search input
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                }
                break;
                
            case 'Escape':
                // Clear all inputs and close info windows
                const inputs = document.querySelectorAll('input[type="text"]');
                inputs.forEach(input => input.blur());
                
                // Close info window
                MarkerService.closeInfoWindow();
                break;
        }
    });
}

/**
 * Show error notification
 */
function showErrorNotification(message) {
    debug(FILE, 'Error:', message, 'error');
    const { AuthNotificationService } = Auth.getServices();
    AuthNotificationService.showNotification(message, 'error');
}

/**
 * Handle application errors globally
 */
function setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        debug(FILE, 'Unhandled promise rejection:', event.reason, 'error');
        
        // Don't show notification for every error, but log it
        if (event.reason && event.reason.message) {
            debug(FILE, 'Error details:', event.reason.message, 'error');
        }
        
        // Prevent the default handling (which would log to console)
        event.preventDefault();
    });
    
    // Handle general JavaScript errors
    window.addEventListener('error', (event) => {
        debug(FILE, 'Global error:', event.error, 'error');
        
        // Only show notification for critical errors
        if (event.error && event.error.message && 
            event.error.message.includes('Google Maps')) {
            showErrorNotification('Maps functionality error occurred');
        }
    });
}

/**
 * Initialize error handling
 */
setupGlobalErrorHandling();

//=====================================================================
// DEVELOPMENT UTILITIES
//=====================================================================

// Make modules available globally for debugging
if (typeof window !== 'undefined') {
    // Core testing functions
    window.testClickToSave = () => {
        if (ClickToSaveService && typeof ClickToSaveService.toggle === 'function') {
            try {
                ClickToSaveService.toggle();
                debug(FILE, '✅ Click-to-save test successful');
                const { AuthNotificationService } = Auth.getServices();
                AuthNotificationService.showNotification('✅ Click-to-save test successful!', 'success');
            } catch (error) {
                debug(FILE, '❌ Test failed:', error, 'error');
                const { AuthNotificationService } = Auth.getServices();
                AuthNotificationService.showNotification(`❌ Test failed: ${SecurityUtils.escapeHtml(error.message)}`, 'error');
            }
        } else {
            debug(FILE, '❌ ClickToSaveService not available', null, 'error');
        }
    };
    
    // Set global API_BASE_URL based on environment
    window.API_BASE_URL = environment.API_BASE_URL;
    
    window.showAdminPanel = () => Auth.showAdminPanel().catch(err => {
        debug(FILE, 'Admin panel error:', err, 'error');
        authServices.AuthNotificationService.showError('Failed to load admin panel');
    });
    
    window.debugAdminPanel = async () => {
        const authState = StateManager.getAuthState();
        debug(FILE, 'Auth State:', !!authState?.authToken);
        
        try {
            const response = await fetch(`${window.API_BASE_URL}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${authState.authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            debug(FILE, 'Admin API response:', Array.isArray(data) ? `${data.length} users` : 'Error');
            
        } catch (error) {
            debug(FILE, 'Admin API error:', error, 'error');
        }
    };
    
    // Server connection test utility
    window.testServerConnection = async () => {
        const baseUrl = window.API_BASE_URL || 'http://localhost:3000/api';
        const healthUrl = `${baseUrl.replace(/\/$/, '')}/health`;
        try {
            const response = await fetch(healthUrl, { method: 'GET', cache: 'no-store' });
            if (response.ok) {
                debug(FILE, '✅ Server connection successful');
                return true;
            } else {
                debug(FILE, `⚠️ Server responded with status: ${response.status} ${response.statusText}`, null, 'warn');
                return false;
            }
        } catch (error) {
            debug(FILE, '❌ Server connection failed:', error, 'error');
            return false;
        }
    };
    
    // Login flow debug
    window.debugLoginFlow = async () => {
        debug(FILE, '=== LOGIN FLOW DEBUG ===');
        
        const debugInfo = Auth.getAuthDebugInfo();
        const authState = StateManager.getAuthState();
        
        debug(FILE, 'Auth tokens:', {
            hasAuthToken: debugInfo.hasAuthToken,
            hasSessionToken: debugInfo.hasSessionToken
        });
        debug(FILE, 'Current user:', StateManager.getUser());
        
        try {
            const isValid = await Auth.getServices().AuthService.verifyAuthToken();
            debug(FILE, 'Auth verification result:', isValid);
        } catch (error) {
            debug(FILE, 'Auth verification error:', error);
        }
        
        debug(FILE, '=== END DEBUG ===');
    };
}

// Development helper functions
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('dev');

if (isDevelopment) {
    // Essential development utilities
    window.clearAllData = () => {
        localStorage.clear();
        sessionStorage.clear();
        StateManager.setSavedLocations([]);
        debug(FILE, 'All local data cleared');
    };
    
    window.debugLocationData = () => {
        debug(FILE, 'Location data:', {
            stateManager: StateManager?.getSavedLocations() || 'N/A',
            localStorage: localStorage.getItem('savedLocations')
        });
    };
    
    window.exportAppState = () => {
        return {
            auth: StateManager.getAuthState(),
            maps: StateManager.getMapsState(),
            locations: StateManager.getSavedLocations(),
            timestamp: new Date().toISOString()
        };
    };
    
    // Export centralized Auth functions for testing
    window.validatePasswordRequirements = Auth.validatePasswordRequirements;
    window.validatePasswordStrength = Auth.analyzePasswordStrength;
    window.validatePasswordMatch = Auth.validatePasswordMatch;
    window.validatePasswordChangeForm = Auth.validatePasswordChangeForm;
    window.setupChangePasswordHandler = setupChangePasswordHandler;
    
    // Backward compatibility wrappers for PasswordUIService
    window.showPasswordError = async (message) => {
        try {
            const { PasswordUIService } = await import('./modules/ui/PasswordUIService.js');
            PasswordUIService.showPasswordError(message);
        } catch (error) {
            debug(FILE, '❌ PasswordUIService unavailable:', error, 'error');
            alert(`Password Error: ${message}`);
        }
    };
    
    window.showPasswordSuccess = async (message) => {
        try {
            const { PasswordUIService } = await import('./modules/ui/PasswordUIService.js');
            PasswordUIService.showPasswordSuccess(message);
        } catch (error) {
            debug(FILE, '❌ PasswordUIService unavailable:', error, 'error');
            alert(`Password Success: ${message}`);
        }
    };
}

// Export for use by other modules
export {
    initializeAllModules,
    StateManager,
    StateDebug
};