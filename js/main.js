/**
 * Main application entry point
 * Replaces the original script.js with modular architecture
 */

// Import centralized state management
import { AppState, StateManager, StateDebug } from './modules/state/AppState.js';

// Import authentication modules
import { AuthService } from './modules/auth/AuthService.js';
import { AuthUI } from './modules/auth/AuthUI.js';
import { AuthHandlers } from './modules/auth/AuthHandlers.js';

// Import maps modules (Phase 3)
import { MapService } from './modules/maps/MapService.js';
import { SearchService } from './modules/maps/SearchService.js';
import { SearchUI } from './modules/maps/SearchUI.js';
import { MarkerService } from './modules/maps/MarkerService.js';

// Import locations modules (Phase 4 - NEW!)
import { LocationsService } from './modules/locations/LocationsService.js';
import { LocationsUI } from './modules/locations/LocationsUI.js';
import { LocationsHandlers } from './modules/locations/LocationsHandlers.js';

/**
 * Initialize the application
 * This function replaces the global initMap function and sets up all modules
 */
function initMap() {
    console.log('🚀 Initializing Google Search Me Application');
    
    // Initialize Google Maps with default location (San Francisco)
    /// This should change to CNN HQ or Company HQ
    const defaultLocation = { lat: 37.7749, lng: -122.4194 };
    
    try {
        // Initialize map service
        MapService.initialize('map', {
            zoom: 13,
            center: defaultLocation,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true
        });
        
        console.log('✅ Google Maps initialized');
        
        // Initialize all application modules
        initializeAllModules();
        
        // Log initial state for debugging
        StateDebug.logState();
        
    } catch (error) {
        console.error('❌ Error initializing Google Maps:', error);
        showErrorNotification('Failed to initialize Google Maps. Please refresh the page.');
    }
}

// Make initMap available globally for Google Maps API callback IMMEDIATELY
window.initMap = initMap;

/**
 * Initialize all application modules in the correct order
 */
async function initializeAllModules() {
    try {
        console.log('📦 Loading application modules...');
        
        // Phase 2: Authentication modules
        await AuthService.initialize();
        AuthUI.initialize();
        AuthHandlers.initialize();
        
        // Phase 3: Maps modules
        SearchService.initialize();
        SearchUI.initialize();
        MarkerService.initialize();
        
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
                    AuthUI.showNotification('Server connection issues detected. Some features may not work properly.', 'warning');
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
    AuthUI.showNotification(message, 'error');
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
    window.showLoginForm = () => AuthUI.showAuthModal('login');
    window.showRegisterForm = () => AuthUI.showAuthModal('register');
    window.logout = () => {
        // Redirect to logout page
        window.location.href = '/logout.html';
    };
    window.resendVerificationEmail = () => AuthHandlers.resendVerificationEmail();
    window.checkConsoleForVerificationLink = () => AuthUI.checkConsoleForVerificationLink();
    window.hideEmailVerificationBanner = () => AuthUI.hideEmailVerificationBanner();
    window.resendVerificationFromProfile = (email) => AuthHandlers.resendVerificationFromProfile(email);
    window.showAdminPanel = () => AuthUI.showAdminPanel();
    window.debugUserStatus = () => AuthUI.debugUserStatus();
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
        AuthUI.showProfileModal();
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