/**
 * Enhanced Vertical Resizer with Collapse Functionality
 * Controls layout adjustments, sidebar behavior, and floating buttons
 */

import { debug, DEBUG } from '../debug.js';
import ScriptInitManager from '../utils/ScriptInitManager.js';

// File identifier for debug logging
const FILE = '[LAYOUT-CONTROL]';

document.addEventListener('DOMContentLoaded', function() {

    const resizer = document.getElementById('vertical-resizer');
    const container = document.querySelector('.container');
    const mapContainer = document.querySelector('.map-container');
    const rightSidebar = document.getElementById('right-sidebar-overlay');
    const collapseButton = document.getElementById('collapse-sidebar');
    const expandButton = document.getElementById('expand-button');
    const floatingButtonGroup = document.getElementById('floating-button-group');
    const layerButton = document.getElementById('layer-button');
    const saveLocationButton = document.getElementById('save-location-button');

    // Add event listeners for LEFT sidebar buttons
    const mapButton = document.getElementById('map-button');
    const dataLocationButton = document.getElementById('data-location-button');
    const centerMapButton = document.getElementById('center-map-button');
    const profileButton = document.getElementById('profile-button');

    if(mapButton){
        debug(FILE, 'Map Button is Good');
    }    

    if(dataLocationButton){
        debug(FILE, 'data-location-button is Good');
    }

    if(centerMapButton){
        debug(FILE, 'Center Map Button is Good');
    }


    // Add Call backs for click events
    mapButton.addEventListener('click', handleMapButton);
    dataLocationButton.addEventListener('click', handleDataLocationButton);
    centerMapButton.addEventListener('click', handleCenterMapButton);

    let isResizing = false;
    let startX = 0;
    let startMapWidth = 0;
    let startSidebarWidth = 0;
    let lastSidebarWidth = 25; // Store last width percentage for restore
    let isCollapsed = false; // Track collapse state

    // State tracking for toggles
    let buttonStates = {
        map: false,
        dataLocation: false,
        centerMap: false,
        profile: false
    };


    // ✅ NEW: Dynamic Sidebar Manager System
    const SidebarManager = {
        
        // Reset entire screen to initial default layout
        resetToInitialLayout() {
            debug(FILE, '🔄 Resetting to initial layout...');

            // 1. Reset sidebar width
            if (isCollapsed) {
                expandSidebar();
            } else {
                // Reset to exact default dimensions
                const defaultSidebarWidth = 25;
                const defaultMapWidth = 75;
            
                mapContainer.style.width = defaultMapWidth + '%';
                rightSidebar.style.width = defaultSidebarWidth + '%';
                resizer.style.right = defaultSidebarWidth + '%';
                lastSidebarWidth = defaultSidebarWidth;
            
                updateFloatingButtonPosition();
            }

            // 2. Show floating button group and reset sidebar to default panel
            document.getElementById('floating-button-group').classList.remove('hidden');
            SidebarManager.returnToDefault();
            
            // 3. Reset all button states
            Object.keys(buttonStates).forEach(key => buttonStates[key] = false);
            resetButtonVisualStates();
            
            // 4. Reset UI elements
            const userInfo = document.querySelector('.user-info-sidebar');
            if (userInfo) {
                userInfo.classList.add('hidden');
                userInfo.classList.remove('visible');
            }
            
            // 5. Reset floating buttons
            layerButton.classList.remove('active');
            layerButton.style.background = '';
            layerButton.style.boxShadow = '';
            
            // 6. Disable save location mode if active
            if (saveLocationButton.classList.contains('active')) {
                disableSaveLocationMode();
            }
            
            // 8. Reset profile button in LayoutController
            if (window.layoutController && window.layoutController.buttonStates) {
                window.layoutController.buttonStates.profile = false;
                
                const profileButton = document.getElementById('profile-button');
                if (profileButton) {
                    const button = profileButton.querySelector('button');
                    if (button) {
                        button.classList.remove('active');
                        button.style.background = 'rgba(255, 255, 255, 0.2)';
                    }
                }
            }
            
            // 9. Reset map to default location
            zoomToUSACenter();
            
            debug(FILE, '✅ Layout reset to initial state complete');
        },
        
        returnToDefault() {
            debug(FILE, '🔧 SidebarManager.returnToDefault() called - clearing sidebar content');
            // NOTE saved-locations-panel is always present. It is either "active" "block"  or "" "none"
            // Clear any remaining dynamic content while preserving default panels

            const notice = document.getElementById('notification-confirm');
            if(notice){
                notice.remove();
            }

            const panelToBeResetID = ['profile-panel', 'view-location-panel', 'edit-location-panel', 'save-location-panel'];

            panelToBeResetID.forEach(panelId => {
                const panel = document.getElementById(panelId);
                if (panel) {
                    Array.from(panel.children).forEach(child => {
                    child.remove();
                        });
                    panel.classList.remove('active');
                    }
                });
            
            // 3. Ensure saved-locations-panel is active and visible
            const savedLocationsPanel = document.getElementById('saved-locations-panel');
            if (savedLocationsPanel) {
                savedLocationsPanel.classList.add('active');
                savedLocationsPanel.style.display = 'block';
                debug(FILE, '✅ Saved locations panel restored to active state');
                }
            
            // 5. Refresh the saved locations list to ensure it's properly displayed
            if (window.Locations && window.Locations.refreshLocationsList) {
                window.Locations.refreshLocationsList()
                    .then(() => debug(FILE, '✅ Saved locations list refreshed'))
                    .catch(error => {
                        debug(FILE, '❌ Error refreshing locations list:', error, 'error');
                    });
            } else {
                debug(FILE, '⚠️ window.Locations.refreshLocationsList not available', 'warn');
            }
            
            debug(FILE, '✅ Sidebar returned to default saved locations view');
        },
        
        // ✅ NEW: Wide expansion for detailed panels
        expandSidebarWide() {
        debug(FILE, '🔧 expandSidebarWide() called - starting wide expansion...');
        
        // Check if required elements exist
        if (!rightSidebar || !mapContainer || !resizer || !container) {
            debug(FILE, '❌ Required elements not found for wide expanding sidebar', 'error');
            return;
        }

        // Store current width before wide expansion (if not already collapsed)
        if (!isCollapsed && rightSidebar.style.width) {
            const currentWidthStr = rightSidebar.style.width.replace('%', '');
            const currentWidth = parseFloat(currentWidthStr);
            if (currentWidth > 0 && currentWidth < 70) { // Only store if it's a normal width
                lastSidebarWidth = currentWidth;
            }
        }
        
        removeCSSclassesForCollapsedstate();

        const floatingButtonGroup = document.getElementById('floating-button-group');
        floatingButtonGroup.classList.add('hidden');
        
        // Set wide expansion: 70% sidebar, 30% map
        const wideSidebarWidth = 96;
        const wideMapWidth = 0;
        
        debug(FILE, `🔧 Wide expanding sidebar to ${wideSidebarWidth}%, map to ${wideMapWidth}%`);
        
        // Apply wide dimensions
        mapContainer.style.width = wideMapWidth + '%';
        rightSidebar.style.width = wideSidebarWidth + '%';
        resizer.style.right = wideSidebarWidth + '%';
        
        // Update state tracking
        isCollapsed = false;
        updateButtonText();
        
        // Update floating button position for wide layout
        const widePosition = `calc(${wideSidebarWidth}% + 20px)`;
       //widePosition = '25%';
        floatingButtonGroup.style.right = widePosition;
        debug(FILE, `🔧 Wide layout positioning: ${widePosition}`);
        
        // Update floating button position using centralized function
        setTimeout(() => {
            updateFloatingButtonPosition();
        }, 50);
        
        debug(FILE, 'Sidebar wide expanded to:', wideSidebarWidth + '%');
        },
        
        // ✅ NEW: Restore from wide expansion
        restoreFromWide() {
            debug(FILE, '🔧 SidebarManager.restoreFromWide() called');
            expandSidebar();
        },
        
        // ✅ NEW: Regular expansion
        expand() {
            debug(FILE, '🔧 SidebarManager.expand() called');
            expandSidebar();
        },
        
        // ✅ NEW: Collapse sidebar
        collapse() {
            debug(FILE, '🔧 SidebarManager.collapse() called');
            collapseSidebar();
        },   
    };  // end window.SidebarManager
    
    // Event listeners setup
    if (resizer) {
        debug(FILE, 'resizer:' + resizer);
        resizer.addEventListener('mousedown', initResize);
    } else {
        debug(FILE, '❌ Vertical resizer element not found', 'error');
        }
    
    // Close button in sidebar header - Enhanced to work with SidebarManager
    const closeButton = document.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            debug(FILE, '❌ Sidebar close button clicked');
            // Reset all button states
            // Profile button handled by LayoutController, no action needed here
            window.SidebarManager.resetToInitialLayout();
            // Then collapse the sidebar
            collapseSidebar();
        });
    }

    // Add event listeners for new floating buttons
    layerButton.addEventListener('click', handleLayerToggle);
    saveLocationButton.addEventListener('click', handleSaveLocation);
    
    // THIS MAKES THE EXPAND BUTTON WORK
    if (expandButton) {
        expandButton.addEventListener('click', toggleSidebar); // ✅ Toggle function
        debug(FILE, '✅ Expand button event listener added');
    } else {  
            // Warning (uses console.warn)
            debug(FILE, '❌ Expand Button not found', 'warn');
        }
    
    // Add collapse button event listener
    if (collapseButton) {
        collapseButton.addEventListener('click', toggleSidebar);
        debug(FILE, '✅ Collapse button event listener added');
    } else {
         debug(FILE, '⚠️ Collapse button not found', 'warn');
        }


    function removeCSSclassesForCollapsedstate(){
        // Remove CSS classes for collapsed state
            rightSidebar.classList.remove('collapsed');
            mapContainer.classList.remove('full-width');
            resizer.classList.remove('hidden');
            container.classList.remove('sidebar-collapsed');
    }


    // ✅ text for collaspe button
    function updateButtonText() {
        if (isCollapsed) {
            expandButton.textContent = '<'; // Show expand direction
            expandButton.setAttribute('aria-label', 'Expand sidebar');
        } else {
            // this is the close button. 
            expandButton.textContent = '>'; // Show collapse direction  
            expandButton.setAttribute('aria-label', 'Collapse sidebar');
        }
    }
    
    // Consolidated button handler for toggle buttons
    function handleToggleButton(buttonType, button, activeColor, inactiveColor, logMessage) {
        buttonStates[buttonType] = !buttonStates[buttonType];
        
        if (buttonStates[buttonType]) {
            button.classList.add('active');
            button.style.background = activeColor;
            debug(FILE, `${logMessage} activated`);
        } else {
            button.classList.remove('active');
            button.style.background = inactiveColor;
            debug(FILE, `${logMessage} deactivated`);
        }
        
        showTemporaryText(logMessage.split(' ')[1] + ' ' + logMessage.split(' ')[2], buttonStates[buttonType]);
    }
    
    // Function to update floating button group position - LEFT OF RESIZER
    function updateFloatingButtonPosition() {
        // Check if required elements exist
        if (!floatingButtonGroup || !resizer) {
            debug(FILE, '⚠️ Required elements not found for floating button positioning', 'warn');
            return;
        }
        
        if (DEBUG && isCollapsed) {
            debug(FILE, '🔍 Positioning floating buttons for collapsed state');
        }
        
        if (isCollapsed) {
            // When collapsed, position near right edge
            floatingButtonGroup.style.right = '20px';
            debug(FILE, '🔄 Floating buttons positioned for collapsed state: 20px from right');
        } else {
            // When expanded, position LEFT of the vertical resizer with offset
            
            // Get the resizer's current position (percentage from right)
            const resizerRightStyle = resizer.style.right || '25%';
            const resizerRightPercentage = parseFloat(resizerRightStyle.replace('%', ''));
            
            // Calculate button position: resizer position + 78px offset (48px button + 30px gap)
            const buttonOffset = 0; // pixels needed for button clearance << controls offset 
            const containerWidth = window.innerWidth;
            const buttonOffsetPercentage = (buttonOffset / containerWidth) * 100;
            
            // Position buttons to the left of resizer with safe offset
            const buttonRightPercentage = resizerRightPercentage + buttonOffsetPercentage;
            
            // Ensure buttons don't go off the left edge (minimum 20px from left)
            const minRightPercentage = ((containerWidth - 20) / containerWidth) * 100; // Leave 20px from left edge
            const maxRightPercentage = 95; // Don't go beyond 95% from right
            
            const safeRightPercentage = Math.max(resizerRightPercentage + 2, Math.min(maxRightPercentage, buttonRightPercentage));
            
            floatingButtonGroup.style.right = `${safeRightPercentage.toFixed(1)}%`;
            
            // Add visual feedback when position is adjusted
            if (Math.abs(safeRightPercentage - buttonRightPercentage) > 0.1) {
                floatingButtonGroup.classList.add('position-clamped');
            } else {
                floatingButtonGroup.classList.remove('position-clamped');
                }
        }
    }
    
    // Update button position on window resize
    window.addEventListener('resize', updateFloatingButtonPosition);

    // Helper function to reset all button visual states
    function resetButtonVisualStates() {
        // Reset data location button
        const dataBtn = dataLocationButton.querySelector('button');
        if (dataBtn) {
            dataBtn.classList.remove('active');
            dataBtn.style.background = 'rgba(0, 0, 0, 0.2)';
        }
        
        // Reset center map button
        const centerBtn = centerMapButton.querySelector('button');
        if (centerBtn) {
            centerBtn.classList.remove('active');
            centerBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        }
        
        // Reset profile button
        const profileBtn = profileButton.querySelector('button');
        if (profileBtn) {
            profileBtn.classList.remove('active');
            profileBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        }
        
        // Map button will be handled separately in handleMapButton
    }
    
    // Initialize resize operation
    function initResize(e) {
        // Check if required elements exist
        if (!mapContainer || !rightSidebar || !container) {
            debug(FILE, '❌ Required elements not found for resizing', 'error');
            return;
        }
        
        isResizing = true;
        startX = e.clientX;
        startMapWidth = mapContainer.offsetWidth;
        startSidebarWidth = rightSidebar.offsetWidth;
        
        // Add visual feedback during resize
        container.classList.add('resizing');
        resizer.classList.add('resizing');
        
        // Add global mouse event listeners for smooth dragging
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
        
        e.preventDefault();
    }
    
    // Handle resize dragging - fixed to allow proper expansion and prevent resizer disappearing
    function doResize(e) {
    if (!isResizing) return;
    
        const deltaX = e.clientX - startX;
        const containerWidth = container.offsetWidth;
        
        // Calculate new widths
        const newMapWidth = startMapWidth + deltaX;
        const newSidebarWidth = containerWidth - newMapWidth;
        
        // Enhanced constraints - allow sidebar to expand much more and map to shrink more
        const minSidebarWidth = 0;
        const maxSidebarWidth = containerWidth * .95; // Allow sidebar to take 95% width
        const minMapWidth = containerWidth * .05; // Allow map to shrink to 5% width
        const maxMapWidth = containerWidth; // Map can be full width when sidebar collapsed
        
    // Apply constraints with better logic
    if (newSidebarWidth >= minSidebarWidth && newSidebarWidth <= maxSidebarWidth && 
        newMapWidth >= minMapWidth && newMapWidth <= maxMapWidth) {
        
        const mapPercentage = (newMapWidth / containerWidth) * 100;
        const sidebarPercentage = (newSidebarWidth / containerWidth) * 100;
        
        // Handle collapse when sidebar gets very small (lower threshold)
        if (sidebarPercentage < 15) {
            collapseSidebar();
            return;
            }
        
        // Apply new dimensions
        mapContainer.style.width = mapPercentage + '%';
        rightSidebar.style.width = sidebarPercentage + '%';
        
        // FIXED: Better resizer positioning - keep it visible and at the boundary
        // Position resizer at the left edge of the sidebar (boundary between map and sidebar)
        const resizerPosition = Math.max(1, sidebarPercentage); // Minimum 1% to keep visible
        resizer.style.right = resizerPosition + '%';
        
        // Ensure resizer stays visible when sidebar is very wide
        if (sidebarPercentage > 95) {
            // When sidebar is very wide, position resizer slightly inside from left edge
            resizer.style.right = '95%';
            }
        
        // Update floating button group position using centralized function
        updateFloatingButtonPosition();
        
        // Store current width for restore functionality (only store reasonable widths)
        if (sidebarPercentage >= 5 && sidebarPercentage <= 90) {
            lastSidebarWidth = sidebarPercentage;
            }
    
        }
    }
    
    // Stop resize operation and cleanup
    function stopResize() {
        isResizing = false;
        
        // Remove visual feedback
        container.classList.remove('resizing');
        resizer.classList.remove('resizing');
        
        // Remove global mouse event listeners
        document.removeEventListener('mousemove', doResize);
        document.removeEventListener('mouseup', stopResize);
        
        // Update final position to ensure accuracy
        updateFloatingButtonPosition();
    }
    
    // Collapse sidebar to give map full width
    function collapseSidebar() {
        // Check if required elements exist
        if (!rightSidebar || !mapContainer || !resizer || !container) {
            debug(FILE, '❌ Required elements not found for collapsing sidebar', 'error');
            return;
            }
        
        // Add CSS classes for styling
        rightSidebar.classList.add('collapsed');
        mapContainer.classList.add('full-width');
        resizer.classList.add('hidden');
        container.classList.add('sidebar-collapsed');
        
        // Animate to full width
        mapContainer.style.width = '100%';
        rightSidebar.style.width = '0%';
        
        // Update state tracking
        isCollapsed = true; // ✅ Track state
        updateButtonText(); // ✅ Update button text
        
        // Update floating button position using centralized function
        updateFloatingButtonPosition();
        
        debug(FILE, 'Sidebar collapsed'); // Debug
    }
    
    // Expand sidebar back to previous or default size
    function expandSidebar() {
        debug(FILE, '🔧 expandSidebar() called - starting expansion...');
        
        // Check if required elements exist
        if (!rightSidebar || !mapContainer || !resizer || !container) {
            debug(FILE, '❌ Required elements not found for expanding sidebar', 'error');
            return;
            }
        
        // Remove CSS classes
        rightSidebar.classList.remove('collapsed');
        mapContainer.classList.remove('full-width');
        resizer.classList.remove('hidden');
        container.classList.remove('sidebar-collapsed');
        
        // Restore to last width or default 25%
        const restoreWidth = lastSidebarWidth > 0 ? lastSidebarWidth : 25;
        const mapWidth = 100 - restoreWidth;
        
        debug(FILE, `🔧 Restoring sidebar to ${restoreWidth}%, map to ${mapWidth}%`);
        
        // Apply restored dimensions
        mapContainer.style.width = mapWidth + '%';
        rightSidebar.style.width = restoreWidth + '%';
        resizer.style.right = restoreWidth + '%';
        
        // Update state tracking
        isCollapsed = false; // ✅ Track state
        updateButtonText(); // ✅ Update button text
        
        // Immediate call - force positioning using known restore width
        const immediatePosition = `calc(${restoreWidth}% + 20px)`;
        floatingButtonGroup.style.right = immediatePosition;
        
        // Update floating button position using centralized function with longer delay
        setTimeout(() => {
            updateFloatingButtonPosition();
        }, 50);
    }
        
    // ✅ NEW: Toggle function for expand button
    function toggleSidebar() {
        if (isCollapsed) {
            expandSidebar();
        } else {
            collapseSidebar();
            }
    }

    // Simple zoom to USA center function
    function zoomToUSACenter() {
        debug(FILE, '🇺🇸 Zooming to USA center...');
        // Center of United States (geographic center)
            const usaCenter = {
                lat: 35.8283, // Latitude
                lng: -98.5795, // Longitude
                zoom: 4.5
            };
        
        // Fix: properly define the parameter before passing it
        const offsetForInfoWindow = false;
        return MapService.centerMap(usaCenter.lat, usaCenter.lng, usaCenter.zoom, offsetForInfoWindow);
    }
    
    // Handle USA zoom button functionality (formerly layer button)
    function handleLayerToggle() {
    debug(FILE, '🇺🇸 USA zoom button clicked');
    
    // Visual feedback for the zoom action
    layerButton.classList.add('active');
    layerButton.style.background = 'rgba(34, 197, 94, 0.8)'; // Green for action
    layerButton.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.4)';
    
    // Show loading feedback
    showTemporaryText('Zooming to USA', true, 'right');
    
    // Perform the simple zoom action
    const success = zoomToUSACenter();
    
    if (success) {
        // Show success feedback
        setTimeout(() => {
            showTemporaryText('All Locations', true, 'right');
        }, 500);
    }
    
    // Reset button after action
    setTimeout(() => {
        layerButton.classList.remove('active');
        layerButton.style.background = '';
        layerButton.style.boxShadow = '';
    }, 1000);
    }
    
    // Handle save location button functionality - Enhanced with MapControlsManager patterns
    function handleSaveLocation() {

        // it appears these functions are not calling the info box so 
        // The event handler is either missing or not calling the save-location-dialog
        // I can't see the save-location-dialog.  This needs to be addressed. 
        // 1) reset to default
        // 2) expand Map
        // 3) show google geo location box - Save dialog Box
        // 4) Make sure Data is processed into dialog box
        // 4a)  all user data is validated - should be the same as edit - dialog
        // 5) photo upload is active
        // 6) Save works. 

        // this is the last thing we need to do before we can start stipping the project of 
        // legacy code and upload it to Render 

    debug(FILE, '📍 Save Location Clicked');
    
    // Check authentication first (from MapControlsManager pattern)
    if (!isUserAuthenticated()) {
        showAuthRequiredMessage();
        return;
    }
    
    // Toggle active state
    const isCurrentlyActive = saveLocationButton.classList.contains('active');
    
    if (!isCurrentlyActive) {
        // Activate save mode
        try {
            saveLocationButton.classList.add('active');
            showTemporaryText('Save Location', true);
            
            // Enhanced visual feedback for active state
            saveLocationButton.style.background = 'rgba(249, 115, 22, 1)';
            saveLocationButton.style.boxShadow = '0 0 20px rgba(249, 115, 22, 0.4)';
            
            // Enable ClickToSaveService with proper error handling
            if (window.ClickToSaveService) {
                // Only initialize once if not already done
                if (!window.ClickToSaveService.mapClickListener && typeof window.ClickToSaveService.initialize === 'function') {
                    debug(FILE, '🔧 First-time initialization of ClickToSaveService');
                    window.ClickToSaveService.initialize();
                }
                
                // Enable the service
                if (typeof window.ClickToSaveService.enable === 'function') {
                    window.ClickToSaveService.enable();  // <<< save location clicked. 
                    debug(FILE, '✅ Click-to-save service enabled');
                } else {
                    throw new Error('ClickToSaveService.enable method not available');
                    }
            } else {
                throw new Error('ClickToSaveService not available on window object');
            }
            
        } catch (error) {
            debug(FILE, '❌ Error enabling save location mode:', error, 'error');
            showNotification('Failed to enable click-to-save mode', 'error');
            
            // Reset button state on error
            saveLocationButton.classList.remove('active');
            saveLocationButton.style.background = '';
            saveLocationButton.style.boxShadow = '';
        }
        
    } else {
        // Manual disable if clicked while active
        disableSaveLocationMode();
    }
    }

    // Helper function to disable save location mode with proper cleanup
    function disableSaveLocationMode() {
    try {
        // Disable ClickToSaveService properly
        if (window.ClickToSaveService && typeof window.ClickToSaveService.disable === 'function') {
            window.ClickToSaveService.disable();
            debug(FILE, '✅ Click-to-save service disabled');
        }
        
        // Reset visual state
        saveLocationButton.classList.remove('active');
        saveLocationButton.style.background = '';
        saveLocationButton.style.boxShadow = '';
        showTemporaryText('Save Location', false);
        
        debug(FILE, 'Save location mode disabled');
        
    } catch (error) {
        debug(FILE, '❌ Error disabling save location mode:', error, 'error');
        showNotification('Error disabling click-to-save mode', 'error');
    }
    }

    // Authentication check (from MapControlsManager pattern)
    function isUserAuthenticated() {
    try {
        // Check multiple auth sources
        if (window.AuthUI && window.AuthUI.currentUser) {
            return true;
        }
        if (window.Auth && window.Auth.isAuthenticated) {
            return window.Auth.isAuthenticated();
        }
        if (window.StateManager) {
            const authState = window.StateManager.getAuthState();
            return authState && authState.isAuthenticated;
        }
        return false;
    } catch (error) {
        debug(FILE, '❌ Error checking authentication:', error, 'error');
        return false;
    }
    }

    // Consolidated notification function
    function showNotification(message, type = 'info') {
        try {
            if (window.NotificationService) {
                window.NotificationService[`show${type.charAt(0).toUpperCase()}${type.slice(1)}`](message);
            } else if (window.showToast) {
                window.showToast(message, type);
            } else {
                if (type === 'error') {
                    debug(FILE, message, 'error');
                } else if (type === 'warning') {
                    debug(FILE, message, 'warn');
                } else {
                    debug(FILE, message);
                }
                alert(`${type.toUpperCase()}: ${message}`);
            }
        } catch (error) {
            debug(FILE, 'Notification error:', error, 'error');
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Show auth required message (from MapControlsManager pattern)
    function showAuthRequiredMessage() {
        showNotification('Please log in to use the click-to-save feature', 'warning');
    }
    
    // ✅ Initialize button text and position on load
    updateButtonText();

    // ✅ Ensure proper initial positioning after DOM elements are rendered
    setTimeout(() => {
        updateFloatingButtonPosition();
    }, 100); // Small delay to ensure DOM is fully rendered

    // ✅ Also update position after images/content load
    window.addEventListener('load', () => {
        updateFloatingButtonPosition();
    });
        
    // Touch support for mobile devices
    resizer.addEventListener('touchstart', function(e) {
        if (e.touches[0]) {
            const touch = e.touches[0];
            initResize({
                clientX: touch.clientX,
                preventDefault: () => e.preventDefault()
            });
        }
    });
    
    // Handle touch move events for mobile resize
    document.addEventListener('touchmove', function(e) {
        if (isResizing && e.touches[0]) {
            doResize({
                clientX: e.touches[0].clientX
            });
        }
    });
    
    // Handle touch end to stop resize
    document.addEventListener('touchend', stopResize);

    // Create and manage temporary text display
    function showTemporaryText(buttonName, isActive, position = 'left') {
    // Remove any existing temporary text
    const existingText = document.querySelector('.temp-button-text');
    if (existingText) {
        existingText.remove();
    }

    // Create new temporary text element
    const tempText = document.createElement('div');
    tempText.className = 'temp-button-text';
    tempText.textContent = `${buttonName}${isActive ? ' ON' : ' OFF'}`;
    
    // Position based on which type of button triggered it
    if (position === 'left' || buttonName.includes('Map Reset') || buttonName.includes('Data Collection') || buttonName.includes('Center Map') || buttonName.includes('User Profile')) {
        // Position for left sidebar buttons
        tempText.style.position = 'fixed';
        tempText.style.top = '20px';
        tempText.style.left = '70px'; // Right of the left sidebar
    } else {
        // Position for floating buttons (layer and save location)
        tempText.style.position = 'fixed';
        tempText.style.top = '20px';
        tempText.style.right = '120px'; // Left of the floating buttons
    }
    
    tempText.style.zIndex = '1003'; // Above floating buttons
    tempText.style.background = isActive ? 'rgba(34, 197, 94, 0.9)' : 'rgba(248, 113, 113, 0.9)';
    tempText.style.color = 'white';
    tempText.style.padding = '8px 12px';
    tempText.style.borderRadius = '6px';
    tempText.style.fontSize = '14px';
    tempText.style.fontWeight = '600';
    tempText.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    tempText.style.backdropFilter = 'blur(10px)';
    tempText.style.transition = 'all 0.3s ease';
    tempText.style.transform = 'translateX(-10px)';
    //tempText.style.opacity = '0';

    // Add to document
    document.body.appendChild(tempText);

    // Animate in
    setTimeout(() => {
        tempText.style.transform = 'translateX(0)';
        tempText.style.opacity = '1';
    }, 10);

    // Remove after 2.5 seconds
    setTimeout(() => {
        tempText.style.transform = 'translateX(-10px)';
        tempText.style.opacity = '0';
        setTimeout(() => {
            if (tempText.parentNode) {
                tempText.remove();
            }
        }, 300);
    }, 2500);
    }

    // Button event handlers
    function handleMapButton() {
        // Remove toggle behavior - this button now always performs reset
        // needs to remove active from any element class and reset to the inital 
        // setting. 
        debug(FILE, '🗺️ Map reset button clicked - Resetting to default layout');
        
        // Perform the comprehensive reset
        window.SidebarManager.resetToInitialLayout();
        
        // Visual feedback for the reset action
        const button = mapButton.querySelector('button');
              // Brief active state to show reset action
              button.classList.add('active');
              button.style.background = 'rgba(34, 197, 94, 0.8)'; // Green for reset action
        
        // Show reset feedback text
        showTemporaryText('App Reset', true);
        
        // Return button to normal state after brief feedback
        setTimeout(() => {
            button.classList.remove('active');
            button.style.background = 'rgba(255, 255, 255, 0.2)';
        }, 1000); // Extended feedback time for reset action
        
        // Note: buttonStates.map handled in resetToInitialLayout function
    }

    // Data Location button handler Shows Data from a User Map Click
    function handleDataLocationButton() {
        const button = dataLocationButton.querySelector('button');
        handleToggleButton('dataLocation', button, 'rgba(59, 130, 246, 0.8)', 'rgba(0, 0, 0, 0.2)', '📍 Data Location button');
    }

    function handleCenterMapButton() {
        const button = centerMapButton.querySelector('button');
        handleToggleButton('centerMap', button, 'rgba(249, 115, 22, 0.8)', 'rgba(255, 255, 255, 0.2)', '🎯 Center Map button');
    }

    // Initialize button text display function
    updateButtonText();
    updateFloatingButtonPosition();
    
    // Export debug functionality for potential external use
    if (DEBUG) {
        window.layoutDebug = {
            logButtonStates: function() {
                debug(FILE, 'Current button states:', buttonStates);
            },
            logSidebarState: function() {
                debug(FILE, 'Sidebar state:', {
                    isCollapsed,
                    lastSidebarWidth,
                    currentWidth: rightSidebar ? rightSidebar.style.width : 'unknown'
                });
            },
            toggleDebug: function(enable) {
                // This won't actually change DEBUG during runtime
                // since it's a const, but included for completeness
                debug(FILE, `Debug mode would be set to: ${enable}`);
            }
        };
    }
    
   // window.SidebarManager = SidebarManager;

    // Register SidebarManager with ScriptInitManager
    window.SidebarManager = SidebarManager; // Keep for backward compatibility
    
    // Register with the initialization manager
    ScriptInitManager.register('SidebarManager', SidebarManager, true);
    
    debug(FILE, '✅ SidebarManager registered with ScriptInitManager');

});// End of DOMContentLoaded

// Export a function to get SidebarManager that works regardless of DOM load state
export async function getSidebarManager() {
    return await ScriptInitManager.waitFor('SidebarManager');
}

// For immediate synchronous access (may return null if not ready)
export function getSidebarManagerSync() {
    return ScriptInitManager.get('SidebarManager');
}

// Export the manager itself to allow consumers to use waitFor directly
export { default as ScriptInitManager } from '../utils/ScriptInitManager.js';
