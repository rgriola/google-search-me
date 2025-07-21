/**
 * Main application entry point
 * Replaces the original script.js with modular architecture
 */

// Import centralized state management
import { AppState, StateManager, StateDebug } from './modules/state/AppState.js';

// Import environment configuration
import { environment } from './modules/config/environment.js';

// Import authentication modules
import { Auth } from './modules/auth/Auth.js';

// Import maps modules (Phase 3)
import { MapService } from './modules/maps/MapService.js';
import { SearchService } from './modules/maps/SearchService.js';
import { SearchUI } from './modules/maps/SearchUI.js';
import { MarkerService } from './modules/maps/MarkerService.js';
import { ClickToSaveService } from './modules/maps/ClickToSaveService.js';
import { GPSPermissionService } from './modules/maps/GPSPermissionService.js';

// Import locations modules (Phase 4 - STREAMLINED!)
import { Locations } from './modules/locations/Locations.js';

/**
 * Initialize the application modules
 * This function is called by the global initMap function in initMap.js
 */

/**
 * Initialize all application modules in the correct order
 */
async function initializeAllModules() {
    try {
        console.log('📦 Loading application modules...');
        
        // Add delay for login redirect debugging as requested
        const urlParams = new URLSearchParams(window.location.search);
        const fromLogin = urlParams.get('from') === 'login' || document.referrer.includes('login.html');
        
        if (fromLogin) {
            console.log('🔍 DEBUG: Detected redirect from login page');
            console.log('🔍 DEBUG: localStorage authToken:', localStorage.getItem('authToken'));
            console.log('🔍 DEBUG: sessionStorage tokens:', sessionStorage.getItem('sessionToken'));
            
            // Add delay to see credentials in console
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('🔍 DEBUG: After 2s delay - authToken still exists:', !!localStorage.getItem('authToken'));
        }
        
        // Phase 2: Authentication modules
        console.log('🔐 Initializing authentication...');
        await Auth.initialize();
        
        // Validate authentication state early with detailed logging
        const currentUser = StateManager.getUser();
        const authState = StateManager.getAuthState();
        
        console.log('🔍 DEBUG: Full auth state after initialization:', authState);
        console.log('🔍 DEBUG: Current user after initialization:', currentUser);
        console.log('🔍 DEBUG: Auth token present:', !!authState?.authToken);
        
        if (!currentUser) {
            console.log('⚠️ No authenticated user found during initialization');
            console.log('🔍 DEBUG: Checking localStorage directly...');
            const storedToken = localStorage.getItem('authToken');
            console.log('🔍 DEBUG: Stored token exists:', !!storedToken);
            
            if (storedToken && fromLogin) {
                console.log('🔍 DEBUG: Token exists but user not loaded - retrying auth verification...');
                // Retry authentication verification with additional delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                const retrySuccess = await Auth.getServices().AuthService.verifyAuthToken();
                console.log('🔍 DEBUG: Retry verification result:', retrySuccess);
                
                if (retrySuccess) {
                    const retryUser = StateManager.getUser();
                    console.log('🔍 DEBUG: User after retry:', retryUser);
                }
            }
        } else {
            console.log('✅ Authenticated user found:', currentUser.email || currentUser.username);
        }
        
        // Phase 3: Maps modules
        SearchService.initialize();
        SearchUI.initialize();
        MarkerService.initialize();
        
        console.log('🔍 DEBUG: About to initialize ClickToSaveService...');
        console.log('🔍 DEBUG: ClickToSaveService before init:', ClickToSaveService);
        
        ClickToSaveService.initialize();
        
        console.log('🔍 DEBUG: ClickToSaveService after init:', ClickToSaveService);
        console.log('🔍 DEBUG: toggle method after init:', ClickToSaveService?.toggle);
        
        // Phase 4: Locations modules (STREAMLINED!)
        await Locations.initialize();
        
        // Setup inter-module event handlers
        setupEventHandlers();
        
        console.log('✅ All modules initialized successfully');
        
        // MISSING: Test server connection on page load
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
 * Setup inter-module event handlers for communication
 */
function setupEventHandlers() {
    // Search event handlers
    setupSearchEventHandlers();
    
    // Click-to-save event handlers
    setupClickToSaveEventHandlers();
    
    // GPS permission event handlers
    setupGPSEventHandlers();
    
    // UI enhancement handlers
    setupUIEnhancements();
    
    console.log('✅ Inter-module event handlers setup complete');
}

/**
 * Ensure GPS button exists in the DOM
 */
function ensureGPSButtonExists() {
    console.log('🔧 Ensuring GPS button exists...');
    
    // Check if button already exists
    let gpsBtn = document.getElementById('gpsLocationBtn');
    if (gpsBtn) {
        console.log('✅ GPS button already exists');
        return gpsBtn;
    }
    
    // Find or create map controls container
    let mapControls = document.querySelector('.map-controls');
    if (!mapControls) {
        const mapContainer = document.querySelector('.map-container');
        if (mapContainer) {
            mapControls = document.createElement('div');
            mapControls.className = 'map-controls';
            mapContainer.appendChild(mapControls);
            console.log('✅ Created map-controls container');
        } else {
            console.error('❌ Map container not found');
            return null;
        }
    }
    
    // Create GPS button
    gpsBtn = document.createElement('button');
    gpsBtn.id = 'gpsLocationBtn';
    gpsBtn.className = 'map-control-btn';
    gpsBtn.title = 'Center on My Location';
    gpsBtn.innerHTML = '🎯';
    
    // Ensure it's visible
    gpsBtn.style.display = 'flex';
    gpsBtn.style.visibility = 'visible';
    
    mapControls.appendChild(gpsBtn);
    console.log('✅ GPS button created and added to DOM');
    
    return gpsBtn;
}

/**
 * Setup GPS permission event handlers
 */
function setupGPSEventHandlers() {
    console.log('🎯 Setting up GPS event handlers...');
    
    // Ensure GPS button exists first
    ensureGPSButtonExists();
    
    // Function to set up GPS button with retry logic
    const setupGPSButton = () => {
        const gpsLocationBtn = document.getElementById('gpsLocationBtn');
        console.log('🎯 GPS button element found:', !!gpsLocationBtn);
        
        if (gpsLocationBtn) {
            // Remove any existing event listeners to prevent duplicates
            const newButton = gpsLocationBtn.cloneNode(true);
            gpsLocationBtn.parentNode.replaceChild(newButton, gpsLocationBtn);
            
            newButton.addEventListener('click', async () => {
                try {
                    console.log('🎯 GPS location button clicked');
                    alert('GPS button clicked! This feature will center the map on your location.'); // Temporary alert for testing
                    
                    // Check if GPS permission service is available
                    if (!window.GPSPermissionService) {
                        console.error('❌ GPS Permission Service not available');
                        alert('GPS Permission Service not available. Please refresh the page.');
                        return;
                    }
                    
                    // Center map on user location using GPS permission service
                    await MapService.centerOnUserLocation(true);
                    console.log('✅ Map centered on user location');
                    
                } catch (error) {
                    console.error('❌ Error centering on user location:', error);
                    
                    // Show user-friendly error message
                    const { AuthNotificationService } = Auth.getServices();
                    if (error.message.includes('denied')) {
                        AuthNotificationService.showNotification(
                            'Location access denied. You can enable it in your profile settings.',
                            'warning'
                        );
                    } else {
                        AuthNotificationService.showNotification(
                            'Unable to get your current location. Please try again.',
                            'error'
                        );
                    }
                }
            });
            console.log('✅ GPS button click handler attached');
            return true;
        } else {
            console.warn('⚠️ GPS button element not found in DOM');
            return false;
        }
    };
    
    // Try to set up GPS button immediately
    if (!setupGPSButton()) {
        // If not found, try again after a short delay (for dynamic content)
        console.log('🔄 Retrying GPS button setup after delay...');
        setTimeout(() => {
            if (!setupGPSButton()) {
                // Final attempt after longer delay
                setTimeout(() => {
                    if (!setupGPSButton()) {
                        console.error('❌ GPS button could not be found after multiple attempts');
                        // Try to add the button dynamically as fallback
                        addGPSButtonFallback();
                    }
                }, 2000);
            }
        }, 500);
    }
    
    // GPS permission controls in profile modal
    setupProfileGPSHandlers();
}

/**
 * Fallback: Add GPS button dynamically if not found in HTML
 */
function addGPSButtonFallback() {
    console.log('🔧 Adding GPS button as fallback...');
    
    const mapControls = document.querySelector('.map-controls');
    if (mapControls) {
        const gpsBtn = document.createElement('button');
        gpsBtn.id = 'gpsLocationBtn';
        gpsBtn.className = 'map-control-btn';
        gpsBtn.title = 'Center on My Location';
        gpsBtn.innerHTML = '🎯';
        
        mapControls.appendChild(gpsBtn);
        console.log('✅ GPS button added dynamically');
        
        // Set up the event handler for the dynamically added button
        setTimeout(() => setupGPSButton(), 100);
    } else {
        console.error('❌ Map controls container not found for fallback GPS button');
    }
}

/**
 * Setup GPS permission handlers in profile modal
 */
function setupProfileGPSHandlers() {
    const grantGpsBtn = document.getElementById('grantGpsBtn');
    const denyGpsBtn = document.getElementById('denyGpsBtn');
    const resetGpsBtn = document.getElementById('resetGpsBtn');
    
    if (grantGpsBtn) {
        grantGpsBtn.addEventListener('click', async () => {
            await updateGPSPermission('granted');
        });
    }
    
    if (denyGpsBtn) {
        denyGpsBtn.addEventListener('click', async () => {
            await updateGPSPermission('denied');
        });
    }
    
    if (resetGpsBtn) {
        resetGpsBtn.addEventListener('click', async () => {
            await updateGPSPermission('not_asked');
        });
    }
    
    // Update GPS status when profile modal opens
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            setTimeout(updateGPSPermissionStatus, 100); // Small delay for modal to open
        });
    }
}

/**
 * Update user's GPS permission status
 */
async function updateGPSPermission(permission) {
    try {
        if (!window.GPSPermissionService) {
            console.error('❌ GPS Permission Service not available');
            return;
        }
        
        const success = await window.GPSPermissionService.updateUserGPSPermission(permission);
        
        if (success) {
            const { AuthNotificationService } = Auth.getServices();
            AuthNotificationService.showNotification(
                `GPS permission set to: ${permission}`,
                'success'
            );
            
            // Update the status display
            await updateGPSPermissionStatus();
        } else {
            throw new Error('Failed to update GPS permission');
        }
        
    } catch (error) {
        console.error('❌ Error updating GPS permission:', error);
        const { AuthNotificationService } = Auth.getServices();
        AuthNotificationService.showNotification(
            'Failed to update GPS permission. Please try again.',
            'error'
        );
    }
}

/**
 * Update GPS permission status display in profile modal
 */
async function updateGPSPermissionStatus() {
    try {
        if (!window.GPSPermissionService) {
            return;
        }
        
        const status = await window.GPSPermissionService.getCurrentGPSPermissionStatus();
        const statusElement = document.getElementById('gpsPermissionStatus');
        
        if (statusElement) {
            statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
            statusElement.className = `permission-status ${status.replace('_', '-')}`;
        }
        
    } catch (error) {
        console.error('❌ Error updating GPS permission status:', error);
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
    // Handle click-to-save button clicks (both sidebar and map controls)
    document.addEventListener('click', async (event) => {
        const clickToSaveBtn = event.target.closest('.click-to-save-btn, .map-control-btn[data-action="click-to-save"]');
        
        if (clickToSaveBtn) {
            event.preventDefault();
            
            console.log('🔍 DEBUG: Click-to-save button clicked');
            console.log('🔍 DEBUG: ClickToSaveService:', ClickToSaveService);
            console.log('🔍 DEBUG: toggle method:', ClickToSaveService?.toggle);
            
            // Check if ClickToSaveService is properly loaded
            if (!ClickToSaveService || typeof ClickToSaveService.toggle !== 'function') {
                console.error('❌ ClickToSaveService not properly loaded');
                return;
            }
            
            try {
                ClickToSaveService.toggle();
                console.log('✅ Click-to-save toggled successfully');
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
    
    // Listen for custom events from ClickToSaveService
    document.addEventListener('location-save-requested', async (event) => {
        const { locationData } = event.detail;
        
        try {
            await Locations.saveLocation(locationData);
            const { AuthNotificationService } = Auth.getServices();
            AuthNotificationService.showNotification('Location saved successfully!', 'success');
            
            // Refresh handled internally by Locations module
        } catch (error) {
            console.error('Error saving location:', error);
            const { AuthNotificationService } = Auth.getServices();
            AuthNotificationService.showNotification('Failed to save location', 'error');
        }
    });
    
    console.log('✅ Click-to-save event handlers configured');
}

/**
 * Setup UI enhancement handlers
 */
function setupUIEnhancements() {
    // Handle responsive behavior
    setupResponsiveBehavior();
    
    // Setup keyboard shortcuts
    setupGlobalKeyboardShortcuts();
    
    console.log('✅ UI enhancements configured');
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
    window.StateManager = StateManager;
    window.StateDebug = StateDebug;
    window.Auth = Auth;
    // Access services through Auth coordinator
    const authServices = Auth.getServices();
    window.AuthService = authServices.AuthService;
    window.AuthUICore = authServices.AuthUICore;
    window.AuthModalService = authServices.AuthModalService;
    window.AuthNotificationService = authServices.AuthNotificationService;
    window.MapService = MapService;
    window.SearchService = SearchService;
    window.SearchUI = SearchUI;
    window.MarkerService = MarkerService;
    window.GPSPermissionService = GPSPermissionService;
    window.Locations = Locations;
    window.initializeAllModules = initializeAllModules;
    
    // Set global API_BASE_URL based on environment
    window.API_BASE_URL = environment.API_BASE_URL;
    
    // MISSING: Expose global functions for HTML onclick handlers and compatibility
    window.saveCurrentLocation = () => Locations.saveCurrentLocation();
    window.deleteSavedLocation = (placeId) => Locations.deleteSavedLocation(placeId);
    window.deleteSavedLocationFromInfo = (placeId) => Locations.deleteSavedLocationFromInfo(placeId);
    window.goToPopularLocation = (placeId, lat, lng) => Locations.goToPopularLocation(placeId, lat, lng);
    window.showLoginForm = () => authServices.AuthModalService.showAuthModal('login');
    window.showRegisterForm = () => authServices.AuthModalService.showAuthModal('register');
    window.logout = () => {
        // Redirect to logout page
        window.location.href = '/logout.html';
    };
    window.resendVerificationEmail = () => console.log('resendVerificationEmail - needs implementation');
    window.checkConsoleForVerificationLink = () => authServices.AuthNotificationService.checkConsoleForVerificationLink();
    window.hideEmailVerificationBanner = () => authServices.AuthNotificationService.hideEmailVerificationBanner();
    window.resendVerificationFromProfile = (email) => console.log('resendVerificationFromProfile - needs implementation');
    window.showAdminPanel = () => Auth.showAdminPanel().catch(err => {
        console.error('Admin panel error:', err);
        authServices.AuthNotificationService.showError('Failed to load admin panel');
    });
    window.debugUserStatus = () => console.log('debugUserStatus - needs implementation');
    window.debugAdminPanel = async () => {
        const authState = StateManager.getAuthState();
        console.log('🔍 Auth State:', authState);
        
        try {
            const response = await fetch(`${window.API_BASE_URL}/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${authState.authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            console.log('🔍 Raw API Data:', data);
            
            if (Array.isArray(data)) {
                data.forEach(user => {
                    console.log(`🔍 User ${user.id}: isActive=${user.isActive}, is_active=${user.is_active}`);
                });
            }
        } catch (error) {
            console.error('🔍 API Test Error:', error);
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
    
    // DEBUG: Login flow troubleshooting
    window.debugLoginFlow = async () => {
        console.log('🔍 === LOGIN FLOW DEBUG ===');
        console.log('🔍 Current URL:', window.location.href);
        console.log('🔍 Referrer:', document.referrer);
        
        // Check localStorage
        console.log('🔍 localStorage authToken:', localStorage.getItem('authToken') ? 'present' : 'missing');
        console.log('🔍 localStorage sessionToken:', localStorage.getItem('sessionToken') ? 'present' : 'missing');
        
        // Check state manager
        const authState = StateManager.getAuthState();
        console.log('🔍 StateManager auth state:', authState);
        console.log('🔍 StateManager current user:', StateManager.getUser());
        
        // Test auth verification
        console.log('🔍 Testing auth verification...');
        try {
            const isValid = await Auth.getServices().AuthService.verifyAuthToken();
            console.log('🔍 Auth verification result:', isValid);
            
            if (isValid) {
                const updatedUser = StateManager.getUser();
                console.log('🔍 User after verification:', updatedUser);
            }
        } catch (error) {
            console.log('🔍 Auth verification error:', error);
        }
        
        console.log('🔍 === END LOGIN FLOW DEBUG ===');
    };
}

// Development helper functions
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('dev');

if (isDevelopment) {
    window.clearAllData = () => {
        localStorage.clear();
        sessionStorage.clear();
        StateManager.setSavedLocations([]);
        console.log('All local data cleared');
    };
    
    // Debug function for force resetting location data
    window.forceResetLocations = async () => {
        await Locations.loadSavedLocations();
    };
    
    window.debugLocationData = () => {
        console.log('🔍 Current location debug info:');
        console.log('StateManager locations:', StateManager?.getSavedLocations() || 'StateManager not available');
        console.log('localStorage savedLocations:', localStorage.getItem('savedLocations'));
    };
    
    // Debug function for checking user profile state
    window.debugUserProfile = () => {
        console.log('👤 Current user profile debug:');
        const authState = StateManager.getAuthState();
        console.log('Full auth state:', authState);
        console.log('Current user:', authState?.currentUser);
        console.log('Auth token present:', !!authState?.authToken);
        
        // Check if profile modal exists and form fields
        const modal = document.getElementById('profileModal');
        const form = document.getElementById('profileFormElement');
        console.log('Profile modal exists:', !!modal);
        console.log('Profile form exists:', !!form);
        
        if (form) {
            const username = document.getElementById('profileUsername')?.value;
            const email = document.getElementById('profileEmail')?.value;
            const firstName = document.getElementById('profileFirstName')?.value;
            const lastName = document.getElementById('profileLastName')?.value;
            
            console.log('Form field values:', {
                username,
                email,
                firstName,
                lastName
            });
        }
    };
    
    window.testProfileModal = () => {
        console.log('🧪 Testing profile modal...');
        AuthModalService.showProfileModal();
        setTimeout(() => {
            window.debugUserProfile();
        }, 100);
    };
    
    // DEBUG: Add global test function for profile button
    window.testProfileButton = () => {
        console.log('🧪 Testing profile button...');
        
        const profileBtn = document.getElementById('profileBtn');
        console.log('🔍 Profile button found:', !!profileBtn);
        
        if (profileBtn) {
            console.log('📊 Profile button details:', {
                id: profileBtn.id,
                classList: Array.from(profileBtn.classList),
                parentElement: profileBtn.parentElement?.className,
                style: profileBtn.style.cssText,
                offsetParent: !!profileBtn.offsetParent
            });
            
            // Try to trigger the click manually
            console.log('🖱️ Simulating click...');
            profileBtn.click();
        }
        
        // Also test the modal directly
        const modal = document.getElementById('profileModal');
        console.log('🔍 Profile modal found:', !!modal);
        
        if (modal) {
            console.log('📊 Modal details:', {
                display: getComputedStyle(modal).display,
                visibility: getComputedStyle(modal).visibility
            });
        }
        
        // Test the auth state
        try {
            const authState = StateManager.getAuthState();
            console.log('🔍 Auth state:', authState);
        } catch (error) {
            console.log('❌ Error getting auth state:', error);
        }
    };

    console.log('🧪 Debug function added: window.testProfileButton()');
    
    window.simulateError = (message) => {
        throw new Error(message || 'Simulated error for testing');
    };
    
    window.exportAppState = () => {
        return {
            auth: StateManager.getAuthState(),
            maps: StateManager.getMapsState(),
            locations: StateManager.getSavedLocations(),
            timestamp: new Date().toISOString()
        };
    };
}

// Export for use by other modules (clean exports only)
export {
    initializeAllModules,
    StateManager,
    StateDebug
};