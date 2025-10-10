// Integration bridge between old app.js functionality and new layout
/*
This is the handlers for the interface. 
There are two event handlers for each button. one here and the other in test-layout-control-buttons.js
These should be integrated into specific handlers at some point. 
*/

import { debug } from './debug.js';
import ScriptInitManager from './utils/ScriptInitManager.js';
const FILE = 'LAYOUT_BRIDGE';

document.addEventListener('DOMContentLoaded', function() {
    
    // Wait for both old and new systems to load
    const initializeIntegration = () => {
        // Connect existing search functionality to new search box
        if (window.initializeSearch && document.getElementById('searchInput')) {
            debug(FILE, '🔗 Connecting existing search to new layout');
            window.initializeSearch();
            }
        
        // Connect existing auth system
        if (window.AuthUI && document.getElementById('userInfo')) {
            debug(FILE, '🔗 Connecting existing auth to new layout');
            window.AuthUI.initialize();
            }
        
        // Connect existing map system
        if (window.initMap && document.getElementById('map')) {
            debug(FILE, '🔗 Connecting existing map to new layout');
            // Map will initialize automatically
            }
    };
    
    // Enhanced button handlers that use existing functionality
    function enhanceDataLocationButton() {
        const dataLocationButton = document.getElementById('data-location-button');
        if (dataLocationButton) {
            dataLocationButton.addEventListener('click', () => {
                // Use existing locations system if available
                if (window.sidebarContentManager) {
                    window.sidebarContentManager.switchToView('database');
                } else if (window.LocationsUI && window.LocationsUI.showAllLocations) {
                    window.LocationsUI.showAllLocations();
                }
                debug(FILE, '📊 Database view activated');
            });
        }
    }
    
    // NEW: Enhanced admin panel integration
    function enhanceAdminPanelIntegration() {
        // Make admin functionality available globally if it isn't already
        if (!window.showAdminPanel && window.Auth && window.Auth.showAdminPanel) {
            window.showAdminPanel = window.Auth.showAdminPanel;
        }
        
        // Listen for admin panel requests from new UI components
        document.addEventListener('adminPanelRequested', async (event) => {
            try {
                debug(FILE, '🔧 Admin panel requested via custom event');
                const { AuthAdminService } = await import('./modules/auth/AuthAdminService.js');
                await AuthAdminService.showAdminPanel();
                debug(FILE, '✅ Admin panel opened successfully');
            } catch (error) {
                debug(FILE, '❌ Failed to open admin panel:', error, 'error');
                // Fallback to window function
                if (window.showAdminPanel) {
                    await window.showAdminPanel();
                }
            }
        });
        debug(FILE, '🔧 Admin panel integration enhanced');
    }
    
    function enhanceCenterMapButton() {
        const centerMapButton = document.getElementById('center-map-button');
        if (centerMapButton) {
            centerMapButton.addEventListener('click', () => {
                // Use existing map centering if available
                if (window.MapService && window.MapService.centerOnUserLocation) {
                    window.MapService.centerOnUserLocation();
                    
                } else if (window.map && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((position) => {
                        const pos = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        window.map.setCenter(pos);
                        debug(FILE, '🎯 Map centered on user location');
                    });
                }   
                // reset saved locations
                window.SidebarManager.returnToDefault();
                window.SidebarManager.restoreFromWide();
            });
        }
    }
    
    // Initialize when DOM is ready
    setTimeout(initializeIntegration, 1000); // Give existing scripts time to load
    
    // Enhance buttons with existing functionality
    enhanceDataLocationButton();
    enhanceCenterMapButton();
    enhanceAdminPanelIntegration();
    
    debug(FILE, '🌉 Layout integration bridge initialized');

    // Function to update user info panel based on current auth state
    function updateUserInfoPanel() {
        if (window.AuthUI && window.AuthUI.currentUser) {
            const userInfoElement = document.getElementById('userInfo');
            if (userInfoElement) {
                // Let the AuthUI handle this
                if (typeof window.AuthUI.updateUserUI === 'function') {
                    window.AuthUI.updateUserUI(userInfoElement);
                    debug(FILE, '👤 User info panel updated');
                }
            }
        }
    }
    
    // Initialize profile integration when auth system loads
    function initializeProfileIntegration() {
        // Wait for existing auth system
        if (window.AuthUI && window.AuthUI.currentUser) {
            updateUserInfoPanel();
            debug(FILE, '🔗 Profile integration connected to existing auth');
        } else {
            // Retry after 1 second if auth not ready
            setTimeout(initializeProfileIntegration, 1000);
        }
    }
    // Call this during bridge initialization
    setTimeout(initializeProfileIntegration, 500);
});