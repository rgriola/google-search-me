// Import centralized state management
// this is loaded by initMap.js

import { StateManager, StateDebug } from './modules/state/AppState.js';

// Import security utilities
import { SecurityUtils } from './utils/SecurityUtils.js';

// Import Auth module for centralized authentication
import { Auth } from './modules/auth/Auth.js';

// Import environment configuration
import { environment } from './modules/config/environment.js';

// Environment configuration loaded during import

// Import maps modules (Phase 3)
import { MapService } from './modules/maps/MapService.js';
import { SearchService } from './modules/maps/SearchService.js';
import { SearchUI } from './modules/maps/SearchUI.js';
import { MarkerService } from './modules/maps/MarkerService.js';
import { ClickToSaveService } from './modules/maps/ClickToSaveService.js';
import MapControlsManager from './modules/maps/MapControlsManager.js?v=fixed-regex';

// Import locations modules (Phase 4 - STREAMLINED!)
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
            console.error('❌ Environment configuration not loaded');
            throw new Error('Environment configuration not available');
        }

        if (environment.CACHE_CONFIG.CLEAR_ON_LOAD) {
            console.log('🧹 Development mode: Clearing caches');
            await clearDevelopmentCaches();
        } else {
            await manageProductionCaches();
        }
        
        console.log('📦 Initializing application modules...');
        
        // Phase 2: Authentication initialization
        console.log('🔐 Initializing authentication...');
        await Auth.initialize();
        
        // Initialize AdminModalManager for global access
        console.log('🎛️ Initializing Admin Modal Manager...');
        try {
            const { AuthAdminService } = await import('./modules/auth/AuthAdminService.js');
            await AuthAdminService.initialize();
            console.log('✅ Admin Modal Manager initialized');
        } catch (error) {
            console.warn('⚠️ AdminModalManager initialization failed:', error);
        }
        
        // Validate authentication state
        const authState = StateManager.getAuthState();
        const currentUser = authState?.currentUser;
        
        if (currentUser) {
            console.log('✅ Authenticated user found:', currentUser.email || currentUser.username);
            const { AuthUICore } = await import('./modules/auth/AuthUICore.js');
            AuthUICore.updateAuthUI();
        } else {
            console.log('⚠️ No authenticated user found');
            // Check for token without user data (indicates auth issue)
            const token = Auth.getToken();
            if (token) {
                console.error('🚨 Auth token present but no user data - verification failed');
            }
        }
        
        // Phase 3: Initialize core map services
        console.log('🗺️ Initializing map services...');
        await Promise.all([
            SearchService.initialize(),
            SearchUI.initialize(),
            MarkerService.initialize(),
            ClickToSaveService.initialize()
        ]);
        
        // Phase 4: Initialize locations system
        console.log('📍 Initializing locations...');
        await Locations.initialize();
        
        // Export services to window for global access
        console.log('🌐 Exporting services to window object...');
       
        window.StateManager = StateManager;
        window.StateDebug = StateDebug;
        window.Auth = Auth;
        
        // Access services through Auth coordinator
        const authServices = Auth.getServices();
        window.AuthService = authServices.AuthService;
        window.AuthUICore = authServices.AuthUICore;
        window.AuthModalService = authServices.AuthModalService;
        window.AuthNotificationService = authServices.AuthNotificationService;
        
        // Export map services
        window.MapService = MapService;
        window.SearchService = SearchService;
        window.SearchUI = SearchUI;
        window.MarkerService = MarkerService;
        window.ClickToSaveService = ClickToSaveService;
        //window.GPSPermissionService = GPSPermissionService;
       
        window.initializeAllModules = initializeAllModules;
        
        // Setup inter-module event handlers
        setupEventHandlers();
        
        console.log('✅ All modules initialized successfully');
        
        // Test server connection in background (non-blocking)
        setTimeout(async () => {
            try {
                const isConnected = await window.testServerConnection();
                if (!isConnected) {
                    const { AuthNotificationService } = Auth.getServices();
                    AuthNotificationService.showNotification('Server connection issues detected. Some features may not work properly.', 'warning');
                }
            } catch (error) {
                console.error('Error testing server connection:', error);
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error initializing modules:', error);
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
                console.log(`🧹 Clearing ${cacheNames.length} cache(s)`);
                await Promise.all(cacheNames.map(name => caches.delete(name)));
                console.log('✅ Development caches cleared');
            }
        } else {
            console.log('ℹ️ Cache API not supported');
        }
        
        // Clean up service workers in development
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            if (registrations.length > 0) {
                console.log(`🧹 Cleaning ${registrations.length} service worker(s)`);
                for (let registration of registrations) {
                    await registration.unregister();
                }
            }
        }
        
    } catch (error) {
        console.warn('⚠️ Error during development cache cleanup:', error);
        // Don't fail the app if cache cleanup fails
    }
}

/**
 * Production cache management for deployment
 * Handles versioned cache cleanup and optimization
 */
async function manageProductionCaches() {
    if (!('caches' in window)) {
        return; // Cache API not supported
    }
    
    try {
        const APP_VERSION = environment.APP_VERSION;
        const CURRENT_CACHE_PREFIX = `app-cache-${APP_VERSION}`;
        const cacheConfig = environment.CACHE_CONFIG;
        
        const cacheNames = await caches.keys();
        
        // Find old app caches (different versions)
        const oldAppCaches = cacheNames.filter(name => 
            name.startsWith('app-cache-') && !name.startsWith(CURRENT_CACHE_PREFIX)
        );
        
        if (oldAppCaches.length > 0) {
            console.log(`🧹 Cleaning ${oldAppCaches.length} old cache version(s)`);
            await Promise.all(oldAppCaches.map(name => caches.delete(name)));
        }
        
        // Clean up caches with configured prefixes
        if (cacheConfig.CLEANUP_PREFIXES) {
            const tempCaches = cacheNames.filter(name => 
                cacheConfig.CLEANUP_PREFIXES.some(prefix => name.includes(prefix))
            );
            
            if (tempCaches.length > 0) {
                console.log(`🧹 Cleaning ${tempCaches.length} temporary cache(s)`);
                await Promise.all(tempCaches.map(name => caches.delete(name)));
            }
        }
        
    } catch (error) {
        console.warn('⚠️ Error during production cache management:', error);
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
    
    console.log('✅ Event handlers initialized');
}

/**
 * Setup change password form handler in profile modal
 * PHASE 1: Migrated to PasswordUIService for centralized UI handling
 */
async function setupChangePasswordHandler() {
    try {
        // Import the new PasswordUIService
        const { PasswordUIService } = await import('./modules/ui/PasswordUIService.js');
        
        // Initialize the service
        PasswordUIService.initialize();
        
        // Get Auth notification services for error/success display
        const { AuthNotificationService } = Auth.getServices();
        
        // Setup the password form with centralized UI service
        PasswordUIService.setupChangePasswordHandler({
            Auth: Auth,
            showError: (message) => {
                AuthNotificationService.showNotification(message, 'error');
            },
            showSuccess: (message) => {
                AuthNotificationService.showNotification(message, 'success');
            }
        });
        
        console.log('✅ Password UI handler setup via PasswordUIService');
        
    } catch (error) {
        console.error('❌ Error setting up password UI handler:', error);
        // Fallback to legacy implementation if PasswordUIService fails
        setupChangePasswordHandlerLegacy();
    }
}

/**
 * Minimal legacy password handler (fallback only)
 * @deprecated Use PasswordUIService.setupChangePasswordHandler instead
 */
function setupChangePasswordHandlerLegacy() {
    const form = document.getElementById('changePasswordForm');
    if (!form) return;
    
    // Basic form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword')?.value;
        const newPassword = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmNewPassword')?.value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('All password fields are required');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        
        try {
            const { AuthService } = await import('./modules/auth/AuthService.js');
            const result = await AuthService.changePassword(currentPassword, newPassword);
            
            if (result?.success) {
                alert('Password changed successfully!');
                form.reset();
            } else {
                alert(result?.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Password change error:', error);
            alert('Network error. Please try again.');
        }
    });
    
    console.log('✅ Legacy password form handler attached');
}

// Password UI logic moved to PasswordUIService.js for centralized management

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
            console.error('Error displaying search result:', error);
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
            console.error('Error displaying selected place:', error);
            showErrorNotification('Error displaying selected place');
        }
    });

    // Listen for search errors
    document.addEventListener('search-error', (event) => {
        const { error, query } = event.detail;
        console.error('Search error:', error);
        showErrorNotification(`Search failed: ${error.message}`);
    });

    console.log('✅ Search event handlers configured');
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
                    console.error('❌ ClickToSaveService not available');
                    const { AuthNotificationService } = Auth.getServices();
                    AuthNotificationService.showNotification('Click-to-save service is unavailable. Please refresh the page.', 'error');
                    return;
                }

                try {
                    ClickToSaveService.toggle();
                } catch (error) {
                    console.error('❌ Error in ClickToSaveService.toggle:', error);
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
                console.error('❌ ClickToSaveService not properly loaded');
                return;
            }
            
            try {
                ClickToSaveService.toggle();
            } catch (error) {
                console.error('❌ Error toggling click-to-save:', error);
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
                console.error(`Error handling ${action} action:`, error);
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
            console.error('Error saving location:', error);
            const { AuthNotificationService } = Auth.getServices();
            AuthNotificationService.showNotification('Failed to save location', 'error');
            
            // Dispatch error event to reset UI states
            document.dispatchEvent(new CustomEvent('location-save-error', {
                detail: { error, locationData },
                bubbles: true
            }));
        }
    });
    
    console.log('✅ Click-to-save event handlers configured');
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
    console.error('Error:', message);
    const { AuthNotificationService } = Auth.getServices();
    AuthNotificationService.showNotification(message, 'error');
}

/**
 * Handle application errors globally
 */
function setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        
        // Don't show notification for every error, but log it
        if (event.reason && event.reason.message) {
            console.error('Error details:', event.reason.message);
        }
        
        // Prevent the default handling (which would log to console)
        event.preventDefault();
    });
    
    // Handle general JavaScript errors
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        
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
    // Services are already exported earlier in initializeAllModules()
    // Only add development-specific test functions here
    
    // Core testing functions
    window.testClickToSave = () => {
        if (ClickToSaveService && typeof ClickToSaveService.toggle === 'function') {
            try {
                ClickToSaveService.toggle();
                console.log('✅ Click-to-save test successful');
                const { AuthNotificationService } = Auth.getServices();
                AuthNotificationService.showNotification('✅ Click-to-save test successful!', 'success');
            } catch (error) {
                console.error('❌ Test failed:', error);
                const { AuthNotificationService } = Auth.getServices();
                AuthNotificationService.showNotification(`❌ Test failed: ${SecurityUtils.escapeHtml(error.message)}`, 'error');
            }
        } else {
            console.error('❌ ClickToSaveService not available');
        }
    };
    
    // Set global API_BASE_URL based on environment
    window.API_BASE_URL = environment.API_BASE_URL;
    
    // Expose global functions for legacy compatibility and fallback scenarios
    window.saveCurrentLocation = () => Locations.saveCurrentLocation();
    window.deleteSavedLocation = (placeId) => Locations.deleteLocation(placeId);
    window.goToPopularLocation = (placeId, lat, lng) => Locations.goToPopularLocation(placeId, lat, lng);
    window.showLoginForm = () => authServices.AuthModalService.showAuthModal('login');
    window.showRegisterForm = () => authServices.AuthModalService.showAuthModal('register');
    window.logout = () => {
        // Redirect to logout page
        window.location.href = '/logout.html';
    };
    window.resendVerificationEmail = () => console.warn('resendVerificationEmail not implemented');
    window.checkConsoleForVerificationLink = () => authServices.AuthNotificationService.checkConsoleForVerificationLink();
    window.hideEmailVerificationBanner = () => authServices.AuthNotificationService.hideEmailVerificationBanner();
    window.resendVerificationFromProfile = (email) => console.warn('resendVerificationFromProfile not implemented');
    window.showAdminPanel = () => Auth.showAdminPanel().catch(err => {
        console.error('Admin panel error:', err);
        authServices.AuthNotificationService.showError('Failed to load admin panel');
    });
    window.debugAdminPanel = async () => {
        const authState = StateManager.getAuthState();
        console.log('Auth State:', !!authState?.authToken);
        
        try {
            const response = await fetch(`${window.API_BASE_URL}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${authState.authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            console.log('Admin API response:', Array.isArray(data) ? `${data.length} users` : 'Error');
            
        } catch (error) {
            console.error('Admin API error:', error);
        }
    };
    
    // MISSING: Server connection test
    window.testServerConnection = async () => {
        try {
            const response = await fetch(`${window.API_BASE_URL || 'http://localhost:3000/api'}/health`);
            if (response.ok) {
                console.log('✅ Server connection successful');
                return true;
            } else {
                console.warn('⚠️ Server responded with non-OK status:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Server connection failed:', error);
            return false;
        }
    };
    
    // Login flow debug
    window.debugLoginFlow = async () => {
        console.log('=== LOGIN FLOW DEBUG ===');
        
        const debugInfo = Auth.getAuthDebugInfo();
        const authState = StateManager.getAuthState();
        
        console.log('Auth tokens:', {
            hasAuthToken: debugInfo.hasAuthToken,
            hasSessionToken: debugInfo.hasSessionToken
        });
        console.log('Current user:', StateManager.getUser());
        
        try {
            const isValid = await Auth.getServices().AuthService.verifyAuthToken();
            console.log('Auth verification result:', isValid);
        } catch (error) {
            console.log('Auth verification error:', error);
        }
        
        console.log('=== END DEBUG ===');
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
        console.log('All local data cleared');
    };
    
    window.debugLocationData = () => {
        console.log('Location data:', {
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
            console.error('❌ PasswordUIService unavailable:', error);
            alert(`Password Error: ${message}`);
        }
    };
    
    window.showPasswordSuccess = async (message) => {
        try {
            const { PasswordUIService } = await import('./modules/ui/PasswordUIService.js');
            PasswordUIService.showPasswordSuccess(message);
        } catch (error) {
            console.error('❌ PasswordUIService unavailable:', error);
            alert(`Password Success: ${message}`);
        }
    };
}

// Architecture: Password UI centralized in PasswordUIService.js with backward compatibility

// Export for use by other modules (clean exports only)
export {
    initializeAllModules,
    StateManager,
    StateDebug
};