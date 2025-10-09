// Integration bridge between old app.js functionality and new layout
/*
This is the handlers for the interface. 
There are two event handlers for each button. one here and the other in test-layout-control-buttons.js
These should be integrated into specific handlers at some point. 
*/

// Environment detection for automatic debug configuration
const isProduction = window.location.hostname !== 'localhost' && 
                    !window.location.hostname.includes('dev');

// Debug configuration - automatically enabled in development environments
const DEBUG = !isProduction;

/**
 * Debug logging function - only logs when DEBUG is true
 * @param {...any} args - Arguments to log
 */
function debug(...args) {
     if (!DEBUG) return;
    
    // Check if the last argument is a string specifying the log type
    let logType = 'log';
    let logArgs = args;
    
    if (args.length > 0 && typeof args[args.length - 1] === 'string') {
        const possibleType = args[args.length - 1];
        if (['log', 'warn', 'error', 'info'].includes(possibleType)) {
            logType = possibleType;
            logArgs = args.slice(0, -1); // Remove the type from arguments
        }
    }

    // Add prefix to first argument if it's a string
    const prefix = '[BRIDGE] ';
    if (logArgs.length > 0 && typeof logArgs[0] === 'string') {
        logArgs[0] = prefix + logArgs[0];
    } else {
        logArgs.unshift(prefix);
    }
    
    // Use appropriate console method
    console[logType](...logArgs);
    
    /*
    // Standard log (uses console.log)
    debug('This is a regular debug message');

    // Warning (uses console.warn)
    debug('This is a warning message', 'warn');

    // Error (uses console.error)
    debug('This is an error message', 'error');

    // Info (uses console.info)
    debug('This is an info message', 'info');
    
    // With multiple arguments
    debug('User data:', userData, 'warn');

    // With object
    debug('Button state:', buttonStates, 'error');
    */
}

document.addEventListener('DOMContentLoaded', function() {
    
    // Wait for both old and new systems to load
    const initializeIntegration = () => {
        // Connect existing search functionality to new search box
        if (window.initializeSearch && document.getElementById('searchInput')) {
            debug('🔗 Connecting existing search to new layout');
            window.initializeSearch();
            }
        
        // Connect existing auth system
        if (window.AuthUI && document.getElementById('userInfo')) {
            debug('🔗 Connecting existing auth to new layout');
            window.AuthUI.initialize();
            }
        
        // Connect existing map system
        if (window.initMap && document.getElementById('map')) {
            debug('🔗 Connecting existing map to new layout');
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
                debug('📊 Database view activated');
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
                debug('🔧 Admin panel requested via custom event');
                const { AuthAdminService } = await import('./modules/auth/AuthAdminService.js');
                await AuthAdminService.showAdminPanel();
                debug('✅ Admin panel opened successfully');
            } catch (error) {
                debug('❌ Failed to open admin panel:', error, 'error');
                // Fallback to window function
                if (window.showAdminPanel) {
                    await window.showAdminPanel();
                }
            }
        });
        debug('🔧 Admin panel integration enhanced');
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
                        debug('🎯 Map centered on user location');
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
    // enhanceAdminPanelIntegration();
    
    debug('🌉 Layout integration bridge initialized');

    // Initialize profile integration when auth system loads
    function initializeProfileIntegration() {
        // Wait for existing auth system
        if (window.AuthUI && window.AuthUI.currentUser) {
            updateUserInfoPanel();
            debug('🔗 Profile integration connected to existing auth');
        } else {
            // Retry after 1 second if auth not ready
            setTimeout(initializeProfileIntegration, 1000);
        }
    }
    // Call this during bridge initialization
    setTimeout(initializeProfileIntegration, 500);
}


);