/**
 * Main application entry point
 * Replaces the original script.js with modular architecture
 */

// Import centralized state management
import { AppState, StateManager, StateDebug } from './modules/state/AppState.js';

// Import authentication modules
import { AuthService } from './modules/auth/AuthService.js';
import { Auth } from './modules/auth/Auth.js';
import { AuthUICore } from './modules/auth/AuthUICore.js';
import { AuthModalService } from './modules/auth/AuthModalService.js';
import { AuthNotificationService } from './modules/auth/AuthNotificationService.js';
import { AuthFormHandlers } from './modules/auth/AuthFormHandlers.js';

// Import maps modules (Phase 3)
import { MapService } from './modules/maps/MapService.js';
import { SearchService } from './modules/maps/SearchService.js';
import { SearchUI } from './modules/maps/SearchUI.js';
import { MarkerService } from './modules/maps/MarkerService.js';
import { ClickToSaveService } from './modules/maps/ClickToSaveService.js';

// Import locations modules (Phase 4 - NEW!)
import { LocationsService } from './modules/locations/LocationsService.js';
import { LocationsUI } from './modules/locations/LocationsUI.js';
import { LocationsHandlers } from './modules/locations/LocationsHandlers.js';

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
        
        // Phase 2: Authentication modules
        await Auth.initialize();
        
        // Validate authentication state early
        const currentUser = StateManager.getUser();
        if (!currentUser) {
            console.log('⚠️ No authenticated user found during initialization');
            // This is not necessarily an error - user might not be logged in
            // But we should ensure the UI handles this gracefully
        } else {
            console.log('✅ Authenticated user found:', currentUser.email);
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
        
        // Phase 4: Locations modules (NEW!)
        await LocationsService.initialize();
        LocationsUI.initialize();
        LocationsHandlers.initialize();
        
        // Setup inter-module event handlers
        setupEventHandlers();
        
        console.log('✅ All modules initialized successfully');
        
        // MISSING: Test server connection on page load
        setTimeout(async () => {
            try {
                const isConnected = await window.testServerConnection();
                if (!isConnected) {
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
    
    // UI enhancement handlers
    setupUIEnhancements();
    
    console.log('✅ Inter-module event handlers setup complete');
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
                    await LocationsUI.editLocation(placeId);
                } else if (action === 'delete') {
                    await LocationsHandlers.deleteLocation(placeId);
                }
            } catch (error) {
                console.error(`Error handling ${action} action:`, error);
                AuthNotificationService.showNotification(`Error ${action}ing location`, 'error');
            }
        }
    });
    
    // Listen for custom events from ClickToSaveService
    document.addEventListener('location-save-requested', async (event) => {
        const { locationData } = event.detail;
        
        try {
            await LocationsService.saveLocation(locationData);
            AuthNotificationService.showNotification('Location saved successfully!', 'success');
            
            // Refresh the locations list
            await LocationsUI.refreshLocationsList();
        } catch (error) {
            console.error('Error saving location:', error);
            AuthNotificationService.showNotification('Failed to save location', 'error');
        }
    });
    
    console.log('✅ Click-to-save event handlers configured');
}

/**
 * Setup UI enhancement handlers
 */
function setupUIEnhancements() {
    // Restore sidebar state from localStorage
    restoreSidebarState();
    
    // Handle responsive behavior
    setupResponsiveBehavior();
    
    // Setup keyboard shortcuts
    setupGlobalKeyboardShortcuts();
    
    console.log('✅ UI enhancements configured');
}

/**
 * Restore sidebar state from localStorage
 */
function restoreSidebarState() {
    try {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        const sidebar = document.querySelector('.sidebar');
        
        if (isCollapsed && sidebar) {
            sidebar.classList.add('collapsed');
        }
    } catch (error) {
        console.error('Error restoring sidebar state:', error);
    }
}

/**
 * Setup responsive behavior for mobile devices
 */
function setupResponsiveBehavior() {
    // Handle window resize
    window.addEventListener('resize', () => {
        // Auto-collapse sidebar on small screens
        const sidebar = document.querySelector('.sidebar');
        if (window.innerWidth <= 768 && sidebar && !sidebar.classList.contains('collapsed')) {
            // Don't auto-collapse, let user control
        }
    });
    
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
                
            case 'h':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    // Toggle sidebar
                    LocationsUI.toggleSidebar();
                }
                break;
        }
    });
}

/**
 * Show error notification
 */
function showErrorNotification(message) {
    console.error('Error:', message);
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
    window.AuthService = AuthService;
    window.AuthUI = AuthUI;
    window.MapService = MapService;
    window.SearchService = SearchService;
    window.SearchUI = SearchUI;
    window.MarkerService = MarkerService;
    window.LocationsService = LocationsService;
    window.LocationsUI = LocationsUI;
    window.LocationsHandlers = LocationsHandlers;
    window.initializeAllModules = initializeAllModules;
    
    // MISSING: Set global API_BASE_URL for backward compatibility
    window.API_BASE_URL = 'http://localhost:3000/api';
    
    // MISSING: Expose global functions for HTML onclick handlers and compatibility
    window.saveCurrentLocation = () => LocationsHandlers.saveCurrentLocation();
    window.deleteSavedLocation = (placeId) => LocationsHandlers.deleteSavedLocation(placeId);
    window.deleteSavedLocationFromInfo = (placeId) => LocationsHandlers.deleteSavedLocationFromInfo(placeId);
    window.goToPopularLocation = (placeId, lat, lng) => LocationsHandlers.goToPopularLocation(placeId, lat, lng);
    window.showLoginForm = () => AuthModalService.showAuthModal('login');
    window.showRegisterForm = () => AuthModalService.showAuthModal('register');
    window.logout = () => {
        // Redirect to logout page
        window.location.href = '/logout.html';
    };
    window.resendVerificationEmail = () => console.log('resendVerificationEmail - needs implementation');
    window.checkConsoleForVerificationLink = () => AuthNotificationService.checkConsoleForVerificationLink();
    window.hideEmailVerificationBanner = () => AuthNotificationService.hideEmailVerificationBanner();
    window.resendVerificationFromProfile = (email) => console.log('resendVerificationFromProfile - needs implementation');
    window.showAdminPanel = async () => {
        const { loadAdminService } = await import('./modules/auth/Auth.js');
        const AuthAdminService = await loadAdminService();
        AuthAdminService.showAdminPanel();
    };
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
        const { LocationsService } = await import('./modules/locations/LocationsService.js');
        await LocationsService.forceResetLocations();
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