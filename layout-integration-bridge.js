// Integration bridge between old app.js functionality and new layout
/*
This is the handlers for the interface. 
There are two event handlers for each button. one here and the other in test-layout-control-buttons.js
These should be integrated into specific handlers at some point. 
*/
document.addEventListener('DOMContentLoaded', function() {
    
    // Wait for both old and new systems to load
    const initializeIntegration = () => {
        // Connect existing search functionality to new search box
        if (window.initializeSearch && document.getElementById('searchInput')) {
            console.log('🔗 Connecting existing search to new layout');
            window.initializeSearch();
        }
        
        // Connect existing auth system
        if (window.AuthUI && document.getElementById('userInfo')) {
            console.log('🔗 Connecting existing auth to new layout');
            window.AuthUI.initialize();
        }
        
        /*
        // Connect existing location system to new sidebar
        if (window.LocationsUI && document.getElementById('savedLocationsList')) {
            console.log('🔗 Connecting existing locations to new sidebar');
            // This is initallized in Locations.js it was causing double
            // elements when 'view' is called
            //window.LocationsUI.initialize();
            // Update new layout buttons to use existing functionality
            connectLocationButtons();
        }
        */
        
        // Connect existing map system
        if (window.initMap && document.getElementById('map')) {
            console.log('🔗 Connecting existing map to new layout');
            // Map will initialize automatically
        }
    };
    
    // Connect location-related buttons to existing functionality
    function connectLocationButtons() {
        // Connect save location button
        const clickToSaveBtn = document.getElementById('clickToSaveBtn');
        if (clickToSaveBtn && window.LocationsUI) {
            clickToSaveBtn.addEventListener('click', () => {
                if (window.LocationsUI.enableClickToSave) {
                    window.LocationsUI.enableClickToSave();
                    console.log('📍 Click to save enabled via existing system');
                }
            });
        }
        
        /*
        // Connect profile button to existing modal
        const profileBtn = document.getElementById('profileBtn');
        const profileModal = document.getElementById('profileModal');
        if (profileBtn && profileModal && window.ProfileUI) {
            profileBtn.addEventListener('click', () => {
                // window.ProfileUI.showModal();
                console.log('👤 Profile modal opened via existing system');
            });
        }
        */
    }
    
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
                console.log('📊 Database view activated');
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
                console.log('🔧 Admin panel requested via custom event');
                const { AuthAdminService } = await import('./js/modules/auth/AuthAdminService.js');
                await AuthAdminService.showAdminPanel();
                console.log('✅ Admin panel opened successfully');
            } catch (error) {
                console.error('❌ Failed to open admin panel:', error);
                // Fallback to window function
                if (window.showAdminPanel) {
                    await window.showAdminPanel();
                }
            }
        });
        
        console.log('🔧 Admin panel integration enhanced');
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
                        console.log('🎯 Map centered on user location');
                    });
                }
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
    
    console.log('🌉 Layout integration bridge initialized');

    // Initialize profile integration when auth system loads
function initializeProfileIntegration() {
    // Wait for existing auth system
    if (window.AuthUI && window.AuthUI.currentUser) {
        updateUserInfoPanel();
        console.log('🔗 Profile integration connected to existing auth');
    } else {
        // Retry after 1 second if auth not ready
        setTimeout(initializeProfileIntegration, 1000);
    }
}
// Call this during bridge initialization
setTimeout(initializeProfileIntegration, 500);

});