/**
 * Mobile App - Advanced Mobile Features Implementation
 * Import existing modules
 */
import { AuthService } from './modules/auth/AuthService.js';
import { StateManager } from './modules/state/AppState.js';
import { AuthUICore } from './modules/auth/AuthUICore.js';
import { MapService } from './modules/maps/MapService.js';
import { LocationsAPI } from './modules/locations/LocationsAPI.js';
import { MarkerService } from './modules/maps/MarkerService.js';
import { MobileCameraUI } from './modules/mobile/MobileCameraUI.js';

/**
 * Mobile App Controller
 * Handles mobile-first interface for Google Search Me application
 * Dependencies: AuthService, MapService, LocationsAPI, MarkerService, MobileCameraUI
 */

// Mobile App Controller Class
class MobileApp {
    constructor() {
        this.currentTab = 'map';
        this.isSearchActive = false;
        this.fabsExpanded = false;
        this.currentUser = null;
        this.isAuthenticated = false;
        this.savedLocations = [];
        this.map = null;
        this.cameraUI = new MobileCameraUI();
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Mobile App...');
        
        // Register service worker for offline support
        await this.registerServiceWorker();
        
        // Initialize authentication first
        await this.initializeAuth();
        
        // Initialize non-map features first
        await this.initializeLocationData();
        
        // Setup offline status monitoring
        this.setupOfflineMonitoring();
        
        // Setup UI and events (non-map)
        this.bindEvents();
        this.setupGestures();
        
        // Initialize filter summary
        this.updateFilterSummary();
        
        // Wait for Google Maps API to be ready before initializing map
        if (typeof google !== 'undefined' && google.maps) {
            await this.initializeMap();
        } else {
            console.log('⏳ Waiting for Google Maps API callback...');
        }
        
        console.log('✅ Mobile App initialized');
    }

    /**
     * Called when Google Maps API is ready
     */
    async onMapsAPIReady() {
        console.log('🗺️ Google Maps API ready, initializing map...');
        try {
            await this.initializeMap();
            console.log('✅ Map initialization complete');
        } catch (error) {
            console.error('❌ Map initialization failed:', error);
        }
    }

    async initializeAuth() {
        console.log('🔐 Initializing authentication...');
        
        try {
            // Initialize AuthService
            await AuthService.initialize();
            
            // Check current authentication state
            const authState = StateManager.getAuthState();
            console.log('🔍 Auth state:', authState);
            
            if (authState.currentUser && authState.authToken) {
                this.currentUser = authState.currentUser;
                this.isAuthenticated = true;
                this.updateUserButton(this.currentUser);
                console.log('✅ User authenticated:', this.currentUser.username);
            } else {
                console.log('ℹ️ No authenticated user found');
                this.showLoginPrompt();
            }
        } catch (error) {
            console.error('❌ Authentication initialization failed:', error);
            this.showLoginPrompt();
        }
    }

    updateUserButton(user) {
        const userBtn = document.getElementById('mobileUserBtn');
        if (userBtn && user) {
            // Show first letter of username or first name
            const initial = (user.firstName || user.username || 'U').charAt(0).toUpperCase();
            userBtn.textContent = initial;
            userBtn.title = `${user.firstName || user.username || 'User'} - Tap for profile`;
            
            // Add click handler for profile/logout
            userBtn.addEventListener('click', () => {
                this.showUserMenu();
            });
        }
    }

    showLoginPrompt() {
        const userBtn = document.getElementById('mobileUserBtn');
        if (userBtn) {
            userBtn.textContent = '?';
            userBtn.title = 'Tap to login';
            
            // Add click handler for login
            userBtn.addEventListener('click', () => {
                this.redirectToLogin();
            });
        }
    }

    showUserMenu() {
        // Simple user menu for now - can be enhanced later
        const actions = [
            { text: 'Profile', action: () => this.showProfileView() },
            { text: 'Logout', action: () => this.logout() },
            { text: 'Cancel', action: () => {} }
        ];
        
        // Create a simple action sheet
        const actionText = actions.map(a => a.text).join('\n');
        const choice = prompt(`User Menu:\n\n${actionText}\n\nChoose action (1-${actions.length}):`);
        
        const index = parseInt(choice) - 1;
        if (index >= 0 && index < actions.length) {
            actions[index].action();
        }
    }

    async logout() {
        try {
            await AuthService.logout();
            this.currentUser = null;
            this.isAuthenticated = false;
            this.showLoginPrompt();
            console.log('✅ User logged out');
            
            // Optionally redirect to login
            if (confirm('Logged out successfully. Go to login page?')) {
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('❌ Logout failed:', error);
            alert('Logout failed. Please try again.');
        }
    }

    redirectToLogin() {
        window.location.href = '/login.html';
    }

    /**
     * Redirect to email verification page
     * @param {string} reason - Verification reason (login_required, registration, etc.)
     */
    redirectToEmailVerification(reason = 'login_required') {
        const url = `/verify-email.html?reason=${reason}`;
        console.log(`📧 Redirecting to email verification: ${url}`);
        window.location.href = url;
    }

    async initializeMap() {
        console.log('🗺️ Initializing Google Maps for mobile...');
        
        try {
            // Wait for Google Maps API to be ready
            if (typeof google === 'undefined') {
                console.log('⏳ Waiting for Google Maps API...');
                await this.waitForGoogleMapsAPI();
            }
            
            // Initialize map with mobile-optimized settings
            const map = await MapService.initialize('mobileMap', {
                zoom: 15,
                center: { lat: 33.783, lng: -84.393 }, // Atlanta default
                gestureHandling: 'greedy', // Better for mobile
                zoomControl: false,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                disableDefaultUI: true, // Clean mobile interface
                styles: [
                    {
                        featureType: 'poi.business',
                        stylers: [{ visibility: 'off' }]
                    }
                ]
            });
            
            console.log('✅ Google Maps initialized for mobile');
            this.map = map;
            
            // Initialize map services for mobile
            await this.initializeMapServices();
            
            // Setup mobile-specific map interactions
            this.setupMobileMapInteractions();
            
        } catch (error) {
            console.error('❌ Map initialization failed:', error);
            this.showMapError();
        }
    }

    async waitForGoogleMapsAPI() {
        return new Promise((resolve) => {
            const checkGoogle = () => {
                if (typeof google !== 'undefined' && google.maps) {
                    resolve();
                } else {
                    setTimeout(checkGoogle, 100);
                }
            };
            checkGoogle();
        });
    }

    async initializeMapServices() {
        console.log('🔧 Initializing map services for mobile...');
        
        try {
            // Initialize ClickToSaveService
            const { ClickToSaveService } = await import('./modules/maps/ClickToSaveService.js');
            window.ClickToSaveService = ClickToSaveService;
            ClickToSaveService.initialize();
            console.log('✅ ClickToSaveService initialized');
            
            // Initialize MarkerService clustering
            MarkerService.initializeClusteringControls();
            console.log('✅ MarkerService clustering initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize map services:', error);
        }
    }

    setupMobileMapInteractions() {
        if (!this.map) return;
        
        // Add mobile-specific map event listeners
        this.map.addListener('click', (event) => {
            console.log('📍 Map clicked at:', event.latLng.toString());
            // Could trigger add location flow here
        });
        
        // Hide header when map is being dragged (more screen space)
        this.map.addListener('dragstart', () => {
            document.getElementById('mobileHeader').classList.add('hidden');
        });
        
        this.map.addListener('dragend', () => {
            setTimeout(() => {
                document.getElementById('mobileHeader').classList.remove('hidden');
            }, 1000);
        });
    }

    showMapError() {
        const mapContainer = document.getElementById('mobileMap');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
                    <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Map Loading Failed</div>
                    <div style="font-size: 14px; text-align: center;">Check your connection and refresh the page</div>
                </div>
            `;
        }
    }

    async initializeLocationData() {
        console.log('📍 Initializing location data...');
        
        try {
            // Initialize LocationsAPI
            await LocationsAPI.initialize();
            
            // Load saved locations if user is authenticated
            if (this.isAuthenticated) {
                await this.loadSavedLocations();
            }
            
            console.log('✅ Location data initialized');
        } catch (error) {
            console.error('❌ Location data initialization failed:', error);
        }
    }

    async loadSavedLocations() {
        console.log('📋 Loading saved locations...');
        
        try {
            // Get all locations from the API
            const locations = await LocationsAPI.getAllLocations();
            console.log(`✅ Loaded ${locations.length} locations`);
            
            // Store in instance for use by other methods
            this.savedLocations = locations;
            
            // Update saved locations panel
            this.renderSavedLocationsList(locations);
            
            // Add markers to map if map is ready
            if (this.map && locations.length > 0) {
                await this.addLocationMarkersToMap(locations);
            }
            
            return locations;
        } catch (error) {
            console.error('❌ Failed to load saved locations:', error);
            this.savedLocations = [];
        }
    }

    renderSavedLocationsList(locations) {
        const savedContent = document.getElementById('savedContent');
        if (!savedContent) return;
        
        if (!locations || locations.length === 0) {
            savedContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📍</div>
                    <div class="empty-state-title">No saved locations</div>
                    <div class="empty-state-description">Tap the + button to add new locations</div>
                </div>
            `;
            return;
        }
        
        // Generate location items
        const locationHTML = locations.map(location => {
            const typeBadgeColors = {
                'live-reporter': '#ff4444',
                'live-anchor': '#4285f4',
                'headquarters': '#9c27b0',
                'bureau': '#ff9800',
                'broll': '#34a853',
                'interview': '#8e44ad'
            };
            
            const badgeColor = typeBadgeColors[location.type] || '#666';
            
            return `
                <div class="location-item-mobile" data-place-id="${location.place_id || location.id}">
                    <h4>${this.escapeHtml(location.name || 'Unnamed Location')}</h4>
                    <div class="location-meta">
                        <span class="location-type-badge" style="background: ${badgeColor};">${location.type || 'location'}</span>
                        <span class="location-distance">📍</span>
                    </div>
                    <div class="location-address">${this.escapeHtml(location.formatted_address || location.address || 'No address')}</div>
                    <div class="location-actions-mobile">
                        <button class="btn-mobile primary" data-action="view" data-location-id="${location.place_id || location.id}">View</button>
                        <button class="btn-mobile" data-action="edit" data-location-id="${location.place_id || location.id}">Edit</button>
                        <button class="btn-mobile" data-action="share" data-location-id="${location.place_id || location.id}">Share</button>
                    </div>
                </div>
            `;
        }).join('');
        
        savedContent.innerHTML = locationHTML;
        
        // Add event listeners for location actions
        this.setupLocationActionListeners();
    }

    setupLocationActionListeners() {
        const savedContent = document.getElementById('savedContent');
        if (!savedContent) return;
        
        // Use event delegation for location action buttons
        savedContent.addEventListener('click', (e) => {
            if (e.target.matches('[data-action]')) {
                const action = e.target.dataset.action;
                const locationId = e.target.dataset.locationId;
                
                switch (action) {
                    case 'view':
                        this.viewLocation(locationId);
                        break;
                    case 'edit':
                        this.editLocation(locationId);
                        break;
                    case 'share':
                        this.shareLocation(locationId);
                        break;
                }
            }
        });
    }

    async addLocationMarkersToMap(locations) {
        if (!this.map || !locations) return;
        
        console.log(`🎯 Adding ${locations.length} markers to map...`);
        
        try {
            // Use existing MarkerService to add markers
            await MarkerService.updateLocationMarkers(locations);
            console.log('✅ Map markers updated');
        } catch (error) {
            console.error('❌ Failed to add markers to map:', error);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    bindEvents() {
        // Bottom navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(tab.dataset.tab);
            });
        });

        // Simple button interactions
        document.getElementById('myLocationFab').addEventListener('click', () => {
            this.goToMyLocation();
        });

        // Check if new buttons exist before adding listeners
        const clickToSaveFab = document.getElementById('clickToSaveFab');
        const clusteringFab = document.getElementById('clusteringFab');
        
        console.log('🔧 Button elements check:', {
            clickToSaveFab: !!clickToSaveFab,
            clusteringFab: !!clusteringFab
        });

        if (clickToSaveFab) {
            clickToSaveFab.addEventListener('click', () => {
                console.log('📍 Click to Save button clicked');
                this.toggleClickToSave();
            });
        } else {
            console.error('❌ clickToSaveFab element not found');
        }

        if (clusteringFab) {
            clusteringFab.addEventListener('click', () => {
                console.log('🔗 Clustering button clicked');
                this.toggleClustering();
            });
        } else {
            console.error('❌ clusteringFab element not found');
        }

        // Panel controls
        document.getElementById('panelOverlay').addEventListener('click', () => {
            this.closeAllPanels();
        });

        document.getElementById('closeSavedPanel').addEventListener('click', () => {
            this.closeSavedPanel();
        });

        document.getElementById('closeFiltersPanel').addEventListener('click', () => {
            this.closeFiltersPanel();
        });

        document.getElementById('closeProfilePanel').addEventListener('click', () => {
            this.closeProfilePanel();
        });

        // Search
        document.getElementById('mobileSearchInput').addEventListener('focus', () => {
            this.showSearchResults();
        });

        document.getElementById('mobileSearchInput').addEventListener('blur', () => {
            setTimeout(() => this.hideSearchResults(), 200);
        });

        // Filter items
        document.querySelectorAll('.filter-item').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('active');
                this.updateFilters();
            });
        });

        // Filter summary button (toggle expand/collapse)
        const filterSummaryBtn = document.getElementById('filterSummaryBtn');
        if (filterSummaryBtn) {
            filterSummaryBtn.addEventListener('click', () => {
                this.toggleFilterOptions();
            });
        }

        // Filter action buttons
        const clearAllBtn = document.getElementById('clearAllFiltersBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        const selectAllBtn = document.getElementById('selectAllFiltersBtn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.selectAllFilters();
            });
        }

        // Scroll behavior
        let lastScrollY = 0;
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const header = document.getElementById('mobileHeader');
            
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                header.classList.add('hidden');
            } else {
                header.classList.remove('hidden');
            }
            
            lastScrollY = currentScrollY;
        });
    }

    setupGestures() {
        // Swipe gestures for panels
        let startY = 0;
        let currentY = 0;
        let isSwping = false;

        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isSwping = true;
        });

        document.addEventListener('touchmove', (e) => {
            if (!isSwping) return;
            currentY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', () => {
            if (!isSwping) return;
            
            const deltaY = currentY - startY;
            const threshold = 50;
            
            if (deltaY > threshold && startY > window.innerHeight * 0.8) {
                // Swipe up from bottom - show saved locations
                this.showSavedPanel();
            } else if (deltaY < -threshold && startY < window.innerHeight * 0.2) {
                // Swipe down from top - show search
                document.getElementById('mobileSearchInput').focus();
            }
            
            isSwping = false;
        });
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        this.currentTab = tabName;

        // Handle tab-specific actions
        switch(tabName) {
            case 'map':
                this.showMapView();
                break;
            case 'saved':
                this.showSavedPanel();
                break;
            case 'filters':
                this.showFiltersPanel();
                break;
            case 'profile':
                this.showProfileView();
                break;
        }
    }

    showMapView() {
        this.closeAllPanels();
        this.hideSearchResults();
    }

    showSavedPanel() {
        document.getElementById('savedPanel').classList.add('visible');
        document.getElementById('panelOverlay').classList.add('visible');
    }

    closeSavedPanel() {
        document.getElementById('savedPanel').classList.remove('visible');
        document.getElementById('panelOverlay').classList.remove('visible');
    }

    showFiltersPanel() {
        document.getElementById('filtersPanel').classList.add('visible');
        document.getElementById('panelOverlay').classList.add('visible');
    }

    closeFiltersPanel() {
        document.getElementById('filtersPanel').classList.remove('visible');
        document.getElementById('panelOverlay').classList.remove('visible');
    }

    closeAllPanels() {
        this.closeSavedPanel();
        this.closeFiltersPanel();
        this.closeProfilePanel();
    }

    closeProfilePanel() {
        document.getElementById('profilePanel').classList.remove('visible');
        document.getElementById('panelOverlay').classList.remove('visible');
    }

    showSearchResults() {
        document.getElementById('searchResults').classList.add('visible');
        this.isSearchActive = true;
    }

    hideSearchResults() {
        document.getElementById('searchResults').classList.remove('visible');
        this.isSearchActive = false;
    }

    goToMyLocation() {
        console.log('🎯 Getting user location with GPS marker...');
        
        if (!this.map) {
            console.error('❌ Map not available for location centering');
            return;
        }
        
        // Use the same GPS functionality as desktop version
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    
                    // Center map on location
                    this.map.setCenter(pos);
                    this.map.setZoom(17);
                    
                    // Add GPS marker like desktop version
                    MapService.addGPSLocationMarker(pos);
                    console.log('✅ GPS location found and marked');
                },
                (error) => {
                    console.error('❌ Geolocation error:', error);
                    let message = 'Unable to get your location. ';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            message += 'Location access denied.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message += 'Location information unavailable.';
                            break;
                        case error.TIMEOUT:
                            message += 'Location request timed out.';
                            break;
                        default:
                            message += 'An unknown error occurred.';
                            break;
                    }
                    alert(message);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }

    toggleClickToSave() {
        console.log('📍 Toggling click to save mode...');
        
        // Import ClickToSaveService if not already available
        if (!window.ClickToSaveService) {
            import('./modules/maps/ClickToSaveService.js').then(module => {
                window.ClickToSaveService = module.ClickToSaveService;
                this.handleClickToSaveToggle();
            }).catch(error => {
                console.error('❌ Failed to load ClickToSaveService:', error);
                alert('Unable to load click-to-save functionality.');
            });
        } else {
            this.handleClickToSaveToggle();
        }
    }

    handleClickToSaveToggle() {
        try {
            window.ClickToSaveService.toggle();
            
            // Update button appearance
            const button = document.getElementById('clickToSaveFab');
            if (window.ClickToSaveService.isEnabled) {
                button.classList.add('active');
                button.title = 'Click to Save (Active - Click map to save)';
            } else {
                button.classList.remove('active');
                button.title = 'Click to Save';
            }
            
            console.log('✅ Click to save toggled:', window.ClickToSaveService.isEnabled ? 'ON' : 'OFF');
        } catch (error) {
            console.error('❌ Error toggling click to save:', error);
            alert('Error with click-to-save feature. Please try again.');
        }
    }

    toggleClustering() {
        console.log('🔗 Toggling marker clustering...');
        
        // Import MarkerService if not already available
        if (!window.MarkerService) {
            import('./modules/maps/MarkerService.js').then(module => {
                window.MarkerService = module.MarkerService;
                this.handleClusteringToggle();
            }).catch(error => {
                console.error('❌ Failed to load MarkerService:', error);
                alert('Unable to load clustering functionality.');
            });
        } else {
            this.handleClusteringToggle();
        }
    }

    handleClusteringToggle() {
        try {
            window.MarkerService.toggleClustering();
            
            // Update button appearance
            const button = document.getElementById('clusteringFab');
            // We'll need to check if clustering is enabled - for now, just toggle the visual state
            button.classList.toggle('active');
            
            if (button.classList.contains('active')) {
                button.title = 'Clustering (Active)';
            } else {
                button.title = 'Toggle Clustering';
            }
            
            console.log('✅ Marker clustering toggled');
        } catch (error) {
            console.error('❌ Error toggling clustering:', error);
            alert('Error with clustering feature. Please try again.');
        }
    }

    viewLocation(locationId) {
        console.log('👁️ Viewing location:', locationId);
        
        const location = this.savedLocations?.find(loc => 
            (loc.place_id || loc.id) === locationId
        );
        
        if (!location) {
            console.error('❌ Location not found:', locationId);
            return;
        }
        
        // Center map on location
        if (this.map && location.lat && location.lng) {
            this.map.setCenter(new google.maps.LatLng(location.lat, location.lng));
            this.map.setZoom(17);
        }
        
        // Close panel and switch to map view
        this.closeSavedPanel();
        this.switchTab('map');
    }

    editLocation(locationId) {
        console.log('✏️ Editing location:', locationId);
        alert(`Edit location ${locationId} - This will be implemented with a mobile-optimized form`);
    }

    shareLocation(locationId) {
        console.log('📤 Sharing location:', locationId);
        
        const location = this.savedLocations?.find(loc => 
            (loc.place_id || loc.id) === locationId
        );
        
        if (!location) return;
        
        // Simple share functionality
        if (navigator.share) {
            navigator.share({
                title: location.name,
                text: `Check out this location: ${location.name}`,
                url: window.location.origin + `?location=${locationId}`
            });
        } else {
            // Fallback to clipboard
            const shareText = `${location.name}\n${location.formatted_address || location.address}`;
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Location details copied to clipboard!');
            });
        }
    }

    updateFilters() {
        const activeFilters = document.querySelectorAll('.filter-item.active');
        console.log(`Active filters: ${activeFilters.length}`);
        
        // Update filter summary display
        this.updateFilterSummary();
        
        // Here you would update the map markers based on active filters
        // Note: This is a placeholder - actual filtering logic would go here
        console.log('📋 Filter update - This is a placeholder for actual filtering logic');
    }

    /**
     * Update the filter summary display
     */
    updateFilterSummary() {
        const activeFilters = document.querySelectorAll('.filter-item.active');
        const totalFilters = document.querySelectorAll('.filter-item').length;
        
        // Update summary text
        const summaryText = document.querySelector('.filter-summary-text');
        const countBadge = document.getElementById('filterCountBadge');
        const chipsContainer = document.getElementById('filterSummaryChips');
        
        if (summaryText) {
            if (activeFilters.length === 0) {
                summaryText.textContent = 'No Filters';
            } else if (activeFilters.length === totalFilters) {
                summaryText.textContent = 'All Types';
            } else {
                summaryText.textContent = `${activeFilters.length} Selected`;
            }
        }
        
        if (countBadge) {
            countBadge.textContent = activeFilters.length;
            countBadge.style.display = activeFilters.length > 0 ? 'inline' : 'none';
        }
        
        // Update filter chips
        if (chipsContainer) {
            chipsContainer.innerHTML = '';
            
            if (activeFilters.length > 0 && activeFilters.length < totalFilters) {
                activeFilters.forEach(filter => {
                    const chip = document.createElement('div');
                    chip.className = 'filter-chip';
                    
                    const icon = filter.querySelector('.filter-icon');
                    const label = filter.querySelector('.filter-label');
                    
                    chip.innerHTML = `
                        <div class="filter-chip-icon" style="background: ${icon.style.background};">
                            ${icon.textContent}
                        </div>
                        <span>${label.textContent}</span>
                    `;
                    
                    chipsContainer.appendChild(chip);
                });
            }
        }
    }

    /**
     * Toggle filter options visibility
     */
    toggleFilterOptions() {
        const container = document.getElementById('filterOptionsContainer');
        const expandIcon = document.getElementById('filterExpandIcon');
        
        if (container && expandIcon) {
            const isExpanded = container.classList.contains('expanded');
            
            if (isExpanded) {
                container.classList.remove('expanded');
                expandIcon.classList.remove('expanded');
            } else {
                container.classList.add('expanded');
                expandIcon.classList.add('expanded');
            }
            
            console.log(`📋 Filter options ${isExpanded ? 'collapsed' : 'expanded'}`);
        }
    }

    /**
     * Clear all filters
     */
    clearAllFilters() {
        document.querySelectorAll('.filter-item').forEach(item => {
            item.classList.remove('active');
        });
        this.updateFilters();
        console.log('📋 All filters cleared');
    }

    /**
     * Select all filters
     */
    selectAllFilters() {
        document.querySelectorAll('.filter-item').forEach(item => {
            item.classList.add('active');
        });
        this.updateFilters();
        console.log('📋 All filters selected');
    }

    showProfileView() {
        if (this.isAuthenticated && this.currentUser) {
            this.renderProfilePanel();
            this.showProfilePanel();
        } else {
            alert('Please login to view profile');
            this.redirectToLogin();
        }
    }

    showProfilePanel() {
        document.getElementById('profilePanel').classList.add('visible');
        document.getElementById('panelOverlay').classList.add('visible');
    }

    renderProfilePanel() {
        const profileContent = document.getElementById('profileContent');
        if (!profileContent || !this.currentUser) return;

        const user = this.currentUser;
        const initials = this.getUserInitials(user);

        profileContent.innerHTML = `
            <div class="profile-section">
                <div class="profile-avatar">${initials}</div>
                <div class="profile-name">${user.firstName || user.username || 'User'} ${user.lastName || ''}</div>
                <div class="profile-email">${user.email || 'No email'}</div>
            </div>

            <div class="profile-section">
                <h3>Account Information</h3>
                <div class="profile-info-item">
                    <span class="profile-info-label">Username</span>
                    <span class="profile-info-value">${user.username || 'N/A'}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Email</span>
                    <span class="profile-info-value">${user.email || 'N/A'}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">First Name</span>
                    <span class="profile-info-value">${user.firstName || 'N/A'}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Last Name</span>
                    <span class="profile-info-value">${user.lastName || 'N/A'}</span>
                </div>
                <div class="profile-info-item">
                    <span class="profile-info-label">Member Since</span>
                    <span class="profile-info-value">${user.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}</span>
                </div>
            </div>

            <div class="profile-section">
                <h3>Actions</h3>
                <button class="profile-action-btn primary" id="editProfileBtn">
                    Edit Profile
                </button>
                <button class="profile-action-btn" id="changePasswordBtn">
                    Change Password
                </button>
                <button class="profile-action-btn" id="exportDataBtn">
                    Export My Data
                </button>
                <button class="profile-action-btn danger" id="logoutFromProfileBtn">
                    Sign Out
                </button>
            </div>
        `;

        // Add event listeners for profile actions
        this.setupProfileActionListeners();
    }

    setupProfileActionListeners() {
        const profileContent = document.getElementById('profileContent');
        if (!profileContent) return;

        // Edit Profile
        const editBtn = profileContent.querySelector('#editProfileBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editProfile();
            });
        }

        // Change Password
        const changePasswordBtn = profileContent.querySelector('#changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.changePassword();
            });
        }

        // Export Data
        const exportBtn = profileContent.querySelector('#exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportUserData();
            });
        }

        // Logout
        const logoutBtn = profileContent.querySelector('#logoutFromProfileBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    getUserInitials(user) {
        if (user.firstName && user.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        } else if (user.firstName) {
            return user.firstName.charAt(0).toUpperCase();
        } else if (user.username) {
            return user.username.charAt(0).toUpperCase();
        } else if (user.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return '?';
    }

    editProfile() {
        alert('Edit Profile - This will open a mobile-optimized profile editing form');
        // TODO: Implement mobile profile editing
    }

    changePassword() {
        alert('Change Password - This will open a mobile-optimized password change form');
        // TODO: Implement mobile password change
    }

    async exportUserData() {
        try {
            alert('Preparing your data export...');
            // TODO: Implement data export functionality
        } catch (error) {
            console.error('❌ Data export failed:', error);
            alert('Failed to export data. Please try again.');
        }
    }

    /**
     * Open camera for location photo capture
     * @param {string} placeId - Location place ID
     */
    openCameraForLocation(placeId) {
        console.log('📸 Opening camera for location:', placeId);
        
        if (!placeId) {
            console.error('❌ No place ID provided for camera');
            return;
        }

        // Close any open panels first
        this.closeAllPanels();
        this.collapseSecondaryFabs();
        
        // Open camera UI
        this.cameraUI.openCamera(placeId);
    }

    /**
     * Handle camera closed event
     * @param {Array} capturedPhotos - Photos captured during session
     */
    onCameraClosed(capturedPhotos) {
        console.log(`📸 Camera closed with ${capturedPhotos.length} photos captured`);
        
        if (capturedPhotos.length > 0) {
            // Refresh location data to show new photos
            this.loadSavedLocations();
            
            // Show success message
            const message = `${capturedPhotos.length} photo(s) added successfully!`;
            if (window.NotificationService) {
                window.NotificationService.show(message, 'success');
            }
        }
    }

    /**
     * Add camera button to location actions
     * @param {string} locationId - Location ID
     */
    showLocationActions(locationId) {
        // Enhanced location actions with camera option
        const actions = [
            { text: '📸 Add Photo', action: () => this.openCameraForLocation(locationId) },
            { text: '👁️ View Details', action: () => this.viewLocation(locationId) },
            { text: '✏️ Edit Location', action: () => this.editLocation(locationId) },
            { text: '📤 Share Location', action: () => this.shareLocation(locationId) },
            { text: '❌ Cancel', action: () => {} }
        ];
        
        // Create action sheet
        const actionText = actions.map((a, i) => `${i + 1}. ${a.text}`).join('\n');
        const choice = prompt(`Location Actions:\n\n${actionText}\n\nChoose action (1-${actions.length}):`);
        
        const index = parseInt(choice) - 1;
        if (index >= 0 && index < actions.length) {
            actions[index].action();
        }
    }

    /**
     * Register service worker for offline support and background sync
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                console.log('📱 Registering service worker...');
                
                const registration = await navigator.serviceWorker.register('/mobile-service-worker.js', {
                    scope: '/'
                });
                
                console.log('✅ Service Worker registered:', registration.scope);
                
                // Listen for service worker messages
                navigator.serviceWorker.addEventListener('message', (event) => {
                    this.handleServiceWorkerMessage(event.data);
                });
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    console.log('🔄 Service Worker update found');
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('✨ New service worker available');
                            this.showUpdateAvailableNotification();
                        }
                    });
                });
                
                this.serviceWorkerRegistration = registration;
                
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        } else {
            console.log('📱 Service Worker not supported');
        }
    }

    /**
     * Setup offline status monitoring
     */
    setupOfflineMonitoring() {
        // Update UI based on online status
        const updateOnlineStatus = () => {
            const isOnline = navigator.onLine;
            console.log(`🌐 Network status: ${isOnline ? 'Online' : 'Offline'}`);
            
            // Update UI indicator
            this.updateOfflineIndicator(!isOnline);
            
            // Show notification when going offline/online
            if (!isOnline) {
                this.showOfflineNotification();
            } else {
                this.showOnlineNotification();
            }
        };

        // Listen for online/offline events
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        // Initial status check
        updateOnlineStatus();
    }

    /**
     * Handle messages from service worker
     * @param {Object} message - Message from service worker
     */
    handleServiceWorkerMessage(message) {
        console.log('📱 Service Worker message:', message);
        
        switch (message.type) {
            case 'UPLOAD_COMPLETED':
                this.handleBackgroundUploadCompleted(message);
                break;
            case 'CACHE_UPDATED':
                console.log('📦 Cache updated');
                break;
            default:
                console.log('📱 Unknown service worker message:', message.type);
        }
    }

    /**
     * Handle completed background upload
     * @param {Object} uploadInfo - Upload completion info
     */
    handleBackgroundUploadCompleted(uploadInfo) {
        console.log('✅ Background upload completed:', uploadInfo.uploadId);
        
        // Show success notification
        if (window.NotificationService) {
            window.NotificationService.show('Photo uploaded successfully!', 'success');
        }
        
        // Refresh locations to show new photo
        this.loadSavedLocations();
    }

    /**
     * Update offline indicator in UI
     * @param {boolean} isOffline - Whether app is offline
     */
    updateOfflineIndicator(isOffline) {
        // Add/remove offline class to body
        document.body.classList.toggle('offline', isOffline);
        
        // Update offline indicator if it exists
        const offlineIndicator = document.getElementById('offline-indicator');
        if (offlineIndicator) {
            offlineIndicator.style.display = isOffline ? 'block' : 'none';
        }
    }

    /**
     * Show offline notification
     */
    showOfflineNotification() {
        if (window.NotificationService) {
            window.NotificationService.show(
                'App is now offline. Photos will be uploaded when connection is restored.',
                'warning',
                5000
            );
        }
    }

    /**
     * Show online notification
     */
    showOnlineNotification() {
        if (window.NotificationService) {
            window.NotificationService.show('Connection restored!', 'success', 3000);
        }
    }

    /**
     * Show update available notification
     */
    showUpdateAvailableNotification() {
        if (window.NotificationService) {
            window.NotificationService.show(
                'App update available. Refresh to update.',
                'info',
                0, // Don't auto-hide
                [
                    {
                        text: 'Refresh',
                        action: () => window.location.reload()
                    },
                    {
                        text: 'Later',
                        action: () => {}
                    }
                ]
            );
        }
    }

    /**
     * Queue photo for background upload when offline
     * @param {Object} photoData - Photo data to queue
     * @param {string} locationId - Location ID
     * @param {Object} options - Upload options
     */
    queuePhotoForBackgroundUpload(photoData, locationId, options = {}) {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'QUEUE_PHOTO_UPLOAD',
                data: {
                    photoData,
                    locationId,
                    options,
                    timestamp: Date.now()
                }
            });
            
            console.log('📱 Photo queued for background upload');
            
            if (window.NotificationService) {
                window.NotificationService.show(
                    'Photo queued for upload when online',
                    'info',
                    3000
                );
            }
        }
    }

    /**
     * Get offline status and queued uploads count
     */
    async getOfflineStatus() {
        return new Promise((resolve) => {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                const messageChannel = new MessageChannel();
                
                messageChannel.port1.onmessage = (event) => {
                    resolve(event.data);
                };
                
                navigator.serviceWorker.controller.postMessage({
                    type: 'GET_OFFLINE_STATUS'
                }, [messageChannel.port2]);
            } else {
                resolve({ isOffline: !navigator.onLine, queuedUploads: 0 });
            }
        });
    }
}

// Initialize mobile app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Always initialize mobile app on mobile-app.html page
    if (window.location.pathname.includes('mobile-app.html') || window.innerWidth <= 768) {
        console.log('📱 Mobile app page detected, initializing mobile app...');
        window.mobileAppReady = true;
        
        // Check if Google Maps is already loaded
        if (typeof google !== 'undefined' && google.maps) {
            console.log('🗺️ Google Maps already loaded, initializing mobile app...');
            window.mobileApp = new MobileApp();
        } else if (window.googleMapsReady) {
            console.log('🗺️ Google Maps ready flag detected, initializing mobile app...');
            window.mobileApp = new MobileApp();
        } else {
            console.log('⏳ Waiting for Google Maps API to load...');
            // Listen for Google Maps ready event
            window.addEventListener('googleMapsReady', () => {
                console.log('🗺️ Google Maps ready event received, initializing mobile app...');
                window.mobileApp = new MobileApp();
            });
        }
    } else {
        console.log('🖥️ Desktop device detected, mobile app not initialized');
    }
});

// Export for global access
export { MobileApp };
