//=====================================================================
// GLOBAL VARIABLES AND STATE MANAGEMENT
//=====================================================================

// Authentication state variables
let currentUser = null;        // Stores current logged-in user data
let authToken = null;          // JWT token for API authentication

// Google Maps API variables
let map;                       // Main Google Maps instance
let placesService;            // Google Places service for location details
let autocompleteService;      // Google Autocomplete service for search suggestions
let markers = [];             // Array to store map markers
let infoWindow;               // Info window for displaying place details

// Application state variables
let savedLocations = [];      // User's saved locations from database
let currentPlace = null;      // Currently selected place for saving
let currentUserId = null;     // User ID (for backward compatibility)
let API_BASE_URL = 'http://localhost:3000/api';  // Backend API base URL

//=====================================================================
// MAP INITIALIZATION
//=====================================================================

/**
 * Initializes the Google Maps instance and all app functionality
 * This is called by the Google Maps API after it loads
 */
function initMap() {
    // Default location (San Francisco)
    const defaultLocation = { lat: 37.7749, lng: -122.4194 };
    
    // Create the main map instance
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: defaultLocation,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]  // Hide default POI labels
            }
        ]
    });

    // Initialize Google Maps services
    placesService = new google.maps.places.PlacesService(map);
    autocompleteService = new google.maps.places.AutocompleteService();
    infoWindow = new google.maps.InfoWindow();

    // Initialize all app modules
    initializeSearch();           // Search functionality
    initializeSavedLocations();   // Saved locations sidebar
    initializeAuth();             // User authentication
    initializeUserSession();      // Legacy user session (backward compatibility)
}

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const suggestionsContainer = document.getElementById('suggestions');
    
    let currentSuggestions = [];
    let selectedSuggestionIndex = -1;

    // Search input event listeners
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keydown', handleKeyDown);
    searchButton.addEventListener('click', handleSearch);
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            hideSuggestions();
        }
    });

    async function handleSearchInput() {
        const query = searchInput.value.trim();
        
        if (query.length < 2) {
            hideSuggestions();
            return;
        }

        try {
            const predictions = await getPlacePredictions(query);
            displaySuggestions(predictions);
        } catch (error) {
            console.warn('Error fetching suggestions:', error);
            // Don't hide suggestions on error, just show empty results
            displaySuggestions([]);
        }
    }

    function handleKeyDown(e) {
        const suggestions = document.querySelectorAll('.suggestion-item');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
                updateSuggestionSelection();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
                updateSuggestionSelection();
                break;
                
            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
                    const placeId = suggestions[selectedSuggestionIndex].dataset.placeId;
                    const description = suggestions[selectedSuggestionIndex].dataset.description;
                    searchPlace(placeId, description);
                } else {
                    handleSearch();
                }
                break;
                
            case 'Escape':
                hideSuggestions();
                searchInput.blur();
                break;
        }
    }

    function updateSuggestionSelection() {
        const suggestions = document.querySelectorAll('.suggestion-item');
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle('selected', index === selectedSuggestionIndex);
        });
    }

    function handleSearch() {
        const query = searchInput.value.trim();
        if (query) {
            searchPlaceByText(query);
            hideSuggestions();
        }
    }

    function getPlacePredictions(query) {
        return new Promise((resolve, reject) => {
            autocompleteService.getPlacePredictions(
                {
                    input: query,
                    types: ['establishment', 'geocode']
                },
                (predictions, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        resolve(predictions || []);
                    } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                        // This is not an error, just no results found
                        resolve([]);
                    } else {
                        console.warn(`Places service status: ${status}`);
                        resolve([]); // Return empty array instead of rejecting
                    }
                }
            );
        });
    }

    function displaySuggestions(predictions) {
        currentSuggestions = predictions;
        selectedSuggestionIndex = -1;
        
        if (predictions.length === 0) {
            hideSuggestions();
            return;
        }

        const suggestionsHTML = predictions.map(prediction => {
            const mainText = prediction.structured_formatting.main_text;
            const secondaryText = prediction.structured_formatting.secondary_text;
            
            return `
                <div class="suggestion-item" 
                     data-place-id="${prediction.place_id}" 
                     data-description="${prediction.description}">
                    <div class="suggestion-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </div>
                    <div class="suggestion-text">
                        <div class="suggestion-main">${mainText}</div>
                        ${secondaryText ? `<div class="suggestion-secondary">${secondaryText}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        suggestionsContainer.innerHTML = suggestionsHTML;
        suggestionsContainer.classList.add('show');

        // Add click event listeners to suggestions
        suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const placeId = item.dataset.placeId;
                const description = item.dataset.description;
                searchPlace(placeId, description);
            });
        });
    }

    function hideSuggestions() {
        suggestionsContainer.classList.remove('show');
        selectedSuggestionIndex = -1;
    }

    function searchPlace(placeId, description) {
        searchInput.value = description;
        hideSuggestions();
        
        const request = {
            placeId: placeId,
            fields: ['name', 'geometry', 'formatted_address', 'rating', 'photos', 'website', 'place_id']
        };

        placesService.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                console.log('Place details from getDetails:', place);
                showPlaceOnMap(place);
            } else {
                console.error('Place details request failed:', status);
                alert('Unable to find the selected place. Please try again.');
            }
        });
    }

    function searchPlaceByText(query) {
        const request = {
            query: query,
            fields: ['name', 'geometry', 'formatted_address', 'rating', 'photos', 'place_id']
        };

        placesService.textSearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                const place = results[0];
                
                // If we have a place_id, get full details to ensure we have all fields
                if (place.place_id) {
                    const detailsRequest = {
                        placeId: place.place_id,
                        fields: ['name', 'geometry', 'formatted_address', 'rating', 'photos', 'website', 'place_id']
                    };
                    
                    placesService.getDetails(detailsRequest, (detailedPlace, detailsStatus) => {
                        if (detailsStatus === google.maps.places.PlacesServiceStatus.OK) {
                            showPlaceOnMap(detailedPlace);
                        } else {
                            // Fallback to original place if details fail
                            showPlaceOnMap(place);
                        }
                    });
                } else {
                    // If no place_id, use the original place (might have limited save functionality)
                    showPlaceOnMap(place);
                }
            } else {
                alert('No results found for your search. Please try a different query.');
            }
        });
    }

    function showPlaceOnMap(place) {
        // Clear existing markers
        clearMarkers();
        
        // Store current place for saving
        currentPlace = place;
        
        // Debug: log place object to see what fields we have
        console.log('Place object received:', place);
        console.log('Place ID:', place.place_id);
        console.log('Available fields:', Object.keys(place));

        // Center map on the place
        map.setCenter(place.geometry.location);
        map.setZoom(15);

        // Create marker
        const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name,
            animation: google.maps.Animation.DROP
        });

        markers.push(marker);

        // Create info window content
        const content = createInfoWindowContent(place);
        
        // Show info window
        infoWindow.setContent(content);
        infoWindow.open(map, marker);

        // Add click listener to marker
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
    }
}

function initializeSavedLocations() {
    // Initialize sidebar toggle
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.querySelector('.sidebar');
    
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
    
    // Initialize clear all button
    const clearAllBtn = document.getElementById('clearAllLocations');
    clearAllBtn.addEventListener('click', clearAllUserLocations);
    
    // Load saved locations from database
    loadSavedLocations();
}

async function initializeUserSession() {
    // This function is kept for backwards compatibility
    // The new authentication system handles user session management in initializeAuth()
    
    // Only generate anonymous user ID if no authentication is present
    if (!authToken && !currentUser) {
        // Try to get existing user ID from localStorage
        currentUserId = localStorage.getItem('userId');
        
        if (!currentUserId) {
            // Generate new user ID
            try {
                const response = await fetch(`${API_BASE_URL}/generate-user-id`);
                const data = await response.json();
                currentUserId = data.userId;
                localStorage.setItem('userId', currentUserId);
            } catch (error) {
                console.error('Error generating user ID:', error);
                // Fallback to local generation
                currentUserId = 'user_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('userId', currentUserId);
            }
        }
    }
}

async function loadSavedLocations() {
    // If user is authenticated, load from server
    if (authToken && currentUser) {
        try {
            const response = await fetch(`${API_BASE_URL}/user/locations`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                savedLocations = await response.json();
                renderSavedLocations();
                updateClearButtonState();
            } else {
                console.error('Failed to load saved locations');
                savedLocations = [];
                renderSavedLocations();
                updateClearButtonState();
            }
        } catch (error) {
            console.error('Error loading saved locations:', error);
            savedLocations = [];
            renderSavedLocations();
            updateClearButtonState();
        }
    } else {
        // For non-authenticated users, show empty state
        savedLocations = [];
        renderSavedLocations();
        updateClearButtonState();
    }
}

function loadSavedLocationsFromLocalStorage() {
    const saved = localStorage.getItem('savedLocations');
    if (saved) {
        savedLocations = JSON.parse(saved);
        renderSavedLocations();
        updateClearButtonState();
    }
}

async function saveCurrentLocation() {
    if (!currentPlace) {
        console.error('Cannot save location: currentPlace is missing');
        showNotification('Unable to save location. Please try searching again.', 'error');
        return;
    }
    
    // Check if user is authenticated
    if (!authToken || !currentUser) {
        showNotification('Please log in to save locations', 'warning');
        showLoginForm();
        return;
    }
    
    // Debug: log the complete place object
    console.log('Current place object:', currentPlace);
    console.log('Place object keys:', Object.keys(currentPlace));
    console.log('Place ID check:', currentPlace.place_id);
    console.log('Name check:', currentPlace.name);
    console.log('Geometry check:', currentPlace.geometry);
    
    // Validate required fields with more detailed logging
    const hasPlaceId = currentPlace.place_id !== undefined && currentPlace.place_id !== null;
    const hasName = currentPlace.name !== undefined && currentPlace.name !== null;
    const hasGeometry = currentPlace.geometry !== undefined && currentPlace.geometry !== null;
    
    console.log('Validation results:', { hasPlaceId, hasName, hasGeometry });
    
    if (!hasPlaceId || !hasName || !hasGeometry) {
        console.error('Cannot save location: missing required place fields', {
            place_id: currentPlace.place_id,
            name: currentPlace.name,
            geometry: currentPlace.geometry,
            hasPlaceId,
            hasName,
            hasGeometry
        });
        showNotification('This location cannot be saved. Please try searching again.', 'error');
        return;
    }
    
    console.log('Saving location:', currentPlace.name, 'for user:', currentUser.username);
    
    const locationData = {
        placeId: currentPlace.place_id,
        name: currentPlace.name,
        address: currentPlace.formatted_address || '',
        lat: currentPlace.geometry.location.lat(),
        lng: currentPlace.geometry.location.lng(),
        rating: currentPlace.rating || null,
        website: currentPlace.website || null,
        photoUrl: currentPlace.photos && currentPlace.photos.length > 0 
            ? currentPlace.photos[0].getUrl({ maxWidth: 150, maxHeight: 100 }) 
            : null
    };
    
    console.log('Location data to save:', locationData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/locations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(locationData)
        });
        
        const result = await response.json();
        console.log('Save response:', result);
        
        if (response.ok) {
            // Reload saved locations
            await loadSavedLocations();
            
            // Update info window to show "Already Saved"
            const content = createInfoWindowContent(currentPlace);
            infoWindow.setContent(content);
            
            // Show success message
            showNotification('Location saved successfully!');
        } else {
            console.error('Server error:', result);
            if (result.error === 'Location already saved') {
                showNotification('Location already saved!', 'warning');
            } else {
                throw new Error(result.error || 'Server error occurred');
            }
        }
    } catch (error) {
        console.error('Error saving location:', error);
        showNotification('Failed to save location. Please try again.', 'error');
    }
}

function renderSavedLocations() {
    const listContainer = document.getElementById('savedLocationsList');
    
    if (!authToken || !currentUser) {
        listContainer.innerHTML = `
            <div class="no-saved-locations">
                <p>Please log in to save and view locations</p>
                <button onclick="showLoginForm()" class="auth-btn" style="margin-top: 10px;">Login</button>
            </div>
        `;
        return;
    }
    
    if (savedLocations.length === 0) {
        listContainer.innerHTML = `
            <div class="no-saved-locations">
                <p>No saved locations yet</p>
                <p class="hint">Search for a place and click "Save Location" to add it here</p>
            </div>
        `;
        return;
    }
    
    const locationsHTML = savedLocations.map(location => {
        const savedDate = new Date(location.saved_at).toLocaleDateString();
        return `
            <div class="saved-location-item" onclick="goToSavedLocation('${location.place_id}')">
                <button class="delete-saved-location" onclick="event.stopPropagation(); deleteSavedLocation('${location.place_id}')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                </button>
                <div class="saved-location-name">${location.name}</div>
                <div class="saved-location-address">${location.address || 'No address available'}</div>
                <div class="saved-location-date">Saved on ${savedDate}</div>
            </div>
        `;
    }).join('');
    
    listContainer.innerHTML = locationsHTML;
}

function goToSavedLocation(placeId) {
    const location = savedLocations.find(loc => loc.place_id === placeId);
    if (!location) return;
    
    // Clear existing markers
    clearMarkers();
    
    // Center map on the saved location
    const position = { lat: location.lat, lng: location.lng };
    map.setCenter(position);
    map.setZoom(15);
    
    // Create marker
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: location.name,
        animation: google.maps.Animation.DROP
    });
    
    markers.push(marker);
    
    // Try to get fresh place details for save functionality
    if (location.place_id) {
        const request = {
            placeId: location.place_id,
            fields: ['name', 'geometry', 'formatted_address', 'rating', 'photos', 'website', 'place_id']
        };

        placesService.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                console.log('Saved location fresh details:', place);
                currentPlace = place;
                const content = createInfoWindowContent(place);
                infoWindow.setContent(content);
                infoWindow.open(map, marker);
            } else {
                console.warn('Could not get fresh details for saved location, using stored data');
                // Fallback to stored data
                const content = createSavedLocationInfoContent(location);
                infoWindow.setContent(content);
                infoWindow.open(map, marker);
            }
        });
    } else {
        // Use stored data if no place_id
        const content = createSavedLocationInfoContent(location);
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
    }
    
    // Add click listener to marker
    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });
}

function createSavedLocationInfoContent(location) {
    let content = `<div style="max-width: 250px;">`;
    
    // Add photo if available
    if (location.photo_url) {
        content += `<img src="${location.photo_url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">`;
    }
    
    content += `<h3 style="margin: 0 0 8px 0; color: #1a73e8;">${location.name}</h3>`;
    
    if (location.address) {
        content += `<p style="margin: 0 0 8px 0; color: #5f6368; font-size: 14px;">${location.address}</p>`;
    }
    
    if (location.rating) {
        const stars = '★'.repeat(Math.floor(location.rating)) + '☆'.repeat(5 - Math.floor(location.rating));
        content += `<p style="margin: 0 0 8px 0; color: #fbbc04; font-size: 14px;">${stars} ${location.rating}</p>`;
    }
    
    if (location.website) {
        content += `<p style="margin: 0 0 8px 0;"><a href="${location.website}" target="_blank" style="color: #1a73e8; text-decoration: none; font-size: 14px;">Visit Website</a></p>`;
    }
    
    const savedDate = new Date(location.saved_at).toLocaleDateString();
    content += `<p style="margin: 0 0 8px 0; color: #9aa0a6; font-size: 12px;">Saved on ${savedDate}</p>`;
    
    content += `<button onclick="deleteSavedLocationFromInfo('${location.place_id}')" style="background: #ea4335; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
        Remove from Saved
    </button>`;
    
    content += `</div>`;
    return content;
}

async function deleteSavedLocation(placeId) {
    if (!authToken || !currentUser) {
        showNotification('Please log in to manage saved locations', 'warning');
        return;
    }
    
    if (!confirm('Are you sure you want to remove this saved location?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/locations/${placeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            // Reload saved locations
            await loadSavedLocations();
            showNotification('Location removed successfully!');
        } else {
            const result = await response.json();
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error deleting location:', error);
        showNotification('Failed to remove location. Please try again.', 'error');
    }
}

function deleteSavedLocationFromInfo(placeId) {
    deleteSavedLocation(placeId);
    infoWindow.close();
}

async function clearAllUserLocations() {
    if (!authToken || !currentUser) {
        showNotification('Please log in to manage saved locations', 'warning');
        return;
    }
    
    if (savedLocations.length === 0) return;
    
    if (!confirm('Are you sure you want to remove all your saved locations? This action cannot be undone.')) return;
    
    try {
        // Delete all user's saved locations
        const deletePromises = savedLocations.map(location => 
            fetch(`${API_BASE_URL}/user/locations/${location.place_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            })
        );
        
        await Promise.all(deletePromises);
        
        // Reload saved locations
        await loadSavedLocations();
        showNotification('All locations cleared successfully!');
    } catch (error) {
        console.error('Error clearing locations:', error);
        showNotification('Failed to clear all locations. Please try again.', 'error');
    }
}

function updateClearButtonState() {
    const clearBtn = document.getElementById('clearAllLocations');
    clearBtn.disabled = savedLocations.length === 0;
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    
    let backgroundColor;
    switch (type) {
        case 'success':
            backgroundColor = '#4caf50';
            break;
        case 'warning':
            backgroundColor = '#ff9800';
            break;
        case 'error':
            backgroundColor = '#f44336';
            break;
        default:
            backgroundColor = '#4caf50';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add a popular locations section to the sidebar
async function addPopularLocationsSection() {
    try {
        const response = await fetch(`${API_BASE_URL}/locations/popular`);
        if (response.ok) {
            const popularLocations = await response.json();
            
            if (popularLocations.length > 0) {
                const sidebar = document.querySelector('.sidebar');
                const popularSection = document.createElement('div');
                popularSection.className = 'popular-locations-section';
                popularSection.innerHTML = `
                    <div class="popular-locations-header">
                        <h4>Popular Locations</h4>
                        <small>${popularLocations.length} locations saved by multiple users</small>
                    </div>
                    <div class="popular-locations-list">
                        ${popularLocations.map(location => `
                            <div class="popular-location-item" onclick="goToPopularLocation('${location.place_id}', ${location.lat}, ${location.lng})">
                                <div class="popular-location-name">${location.name}</div>
                                <div class="popular-location-stats">
                                    <span class="save-count">${location.saved_count} saves</span>
                                    ${location.rating ? `<span class="rating">★ ${location.rating}</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                
                // Insert before the sidebar actions
                const sidebarActions = document.querySelector('.sidebar-actions');
                sidebar.insertBefore(popularSection, sidebarActions);
            }
        }
    } catch (error) {
        console.error('Error loading popular locations:', error);
    }
}

function goToPopularLocation(placeId, lat, lng) {
    // Clear existing markers
    clearMarkers();
    
    // Center map on the popular location
    const position = { lat, lng };
    map.setCenter(position);
    map.setZoom(15);
    
    // Create marker
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        animation: google.maps.Animation.DROP
    });
    
    markers.push(marker);
    
    // Get place details for this location
    const request = {
        placeId: placeId,
        fields: ['name', 'geometry', 'formatted_address', 'rating', 'photos', 'website', 'place_id']
    };

    placesService.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            console.log('Popular place details:', place);
            currentPlace = place;
            const content = createInfoWindowContent(place);
            infoWindow.setContent(content);
            infoWindow.open(map, marker);
        } else {
            console.error('Failed to get popular place details:', status);
        }
    });
}

// Global function for creating info window content
function createInfoWindowContent(place) {
    const isAlreadySaved = savedLocations.some(loc => loc.place_id === place.place_id);
    
    let content = `<div style="max-width: 250px;">`;
    
    // Add photo if available
    if (place.photos && place.photos.length > 0) {
        const photoUrl = place.photos[0].getUrl({ maxWidth: 250, maxHeight: 150 });
        content += `<img src="${photoUrl}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">`;
    }
    
    content += `<h3 style="margin: 0 0 8px 0; color: #1a73e8;">${place.name}</h3>`;
    
    if (place.formatted_address) {
        content += `<p style="margin: 0 0 8px 0; color: #5f6368; font-size: 14px;">${place.formatted_address}</p>`;
    }
    
    if (place.rating) {
        const stars = '★'.repeat(Math.floor(place.rating)) + '☆'.repeat(5 - Math.floor(place.rating));
        content += `<p style="margin: 0 0 8px 0; color: #fbbc04; font-size: 14px;">${stars} ${place.rating}</p>`;
    }
    
    if (place.website) {
        content += `<p style="margin: 0 0 8px 0;"><a href="${place.website}" target="_blank" style="color: #1a73e8; text-decoration: none; font-size: 14px;">Visit Website</a></p>`;
    }
    
    // Add save location button
    if (!authToken || !currentUser) {
        content += `<button onclick="showLoginForm()" class="save-location-btn">
            Login to Save Location
        </button>`;
    } else {
        content += `<button onclick="saveCurrentLocation()" class="save-location-btn" ${isAlreadySaved ? 'disabled' : ''}>
            ${isAlreadySaved ? 'Already Saved' : 'Save Location'}
        </button>`;
    }
    
    content += `</div>`;
    return content;
}

// Global function for clearing markers
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

// Initialize authentication
function initializeAuth() {
    // Check for stored authentication
    authToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    
    if (authToken && storedUser) {
        currentUser = JSON.parse(storedUser);
        updateAuthUI();
        // Verify token is still valid
        verifyAuthToken();
    } else {
        showAuthButtons();
    }
    
    // Set up event listeners
    setupAuthEventListeners();
}

async function verifyAuthToken() {
    if (!authToken) {
        showAuthButtons();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Token is valid, update user data
                currentUser = data.user;
                currentUserId = data.user.id;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                localStorage.setItem('currentUserId', currentUserId);
                updateAuthUI();
                loadSavedLocations();
            } else {
                // Token is invalid
                logout();
            }
        } else {
            // Token verification failed
            logout();
        }
    } catch (error) {
        console.error('Token verification error:', error);
        // Don't logout on network error, just show auth buttons
        showAuthButtons();
    }
}

function setupAuthEventListeners() {
    // Check if elements exist
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const profileBtn = document.getElementById('profileBtn');
    const userMenuBtn = document.getElementById('userMenuBtn');
    const welcomeText = document.getElementById('welcomeText');
    const userInfo = document.querySelector('.user-info');
    
    // Modal controls
    const authModal = document.getElementById('authModal');
    const profileModal = document.getElementById('profileModal');
    const closeBtns = document.querySelectorAll('.close');
    
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            authModal.style.display = 'none';
            profileModal.style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
        if (e.target === profileModal) {
            profileModal.style.display = 'none';
        }
    });
    
    // Auth buttons
    if (loginBtn) loginBtn.addEventListener('click', () => showLoginForm());
    if (registerBtn) registerBtn.addEventListener('click', () => showRegisterForm());
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    if (profileBtn) profileBtn.addEventListener('click', showProfile);
    
    // User menu toggle - make the entire user-info area clickable
    if (userMenuBtn) userMenuBtn.addEventListener('click', toggleUserMenu);
    if (welcomeText) welcomeText.addEventListener('click', toggleUserMenu);
    
    // Make the entire user-info area clickable
    if (userInfo) {
        userInfo.addEventListener('click', (e) => {
            // Only trigger if clicking on the user-info itself or its direct children
            // but not on the dropdown menu
            if (!e.target.closest('.user-dropdown')) {
                toggleUserMenu(e);
            }
        });
    }
    ///////////////////////////// PROBLEM ////////////////////////////////
    function toggleUserMenu(e) {
        e.stopPropagation();
        const dropdown = document.getElementById('userDropdown');
        //// DO NOT CHANGE ///////
        if (dropdown.classList.contains('show')) {
            // Hide dropdown
            dropdown.classList.remove('show');
            dropdown.style.display = 'block';
            dropdown.style.visibility = 'visible';
            dropdown.style.opacity = '1';

        } else {
            // Show dropdown (using the same logic as debugAuthState)
            dropdown.classList.add('show');
            dropdown.style.display = 'none';
            dropdown.style.visibility = 'hidden';
            dropdown.style.opacity = '0';
            
            // Add visual feedback
            document.getElementById('userMenuBtn').style.transform = 'scale(1.1)';
            setTimeout(() => {
                document.getElementById('userMenuBtn').style.transform = '';
            }, 300);
        }
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('userDropdown');
        const userMenuBtn = document.getElementById('userMenuBtn');
        const welcomeText = document.getElementById('welcomeText');
        
        // Only close if clicking outside the dropdown and not on the toggle buttons
        if (!dropdown.contains(e.target) && 
            !userMenuBtn.contains(e.target) && 
            !welcomeText.contains(e.target)) {
            // Hide dropdown with explicit styles
            dropdown.classList.remove('show');
            dropdown.style.display = 'none';
            dropdown.style.visibility = 'hidden';
            dropdown.style.opacity = '0';
        }
    });
    
    // Form switching
    document.getElementById('showRegisterForm').addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });
    
    document.getElementById('showLoginForm').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
    
    document.getElementById('showForgotPassword').addEventListener('click', (e) => {
        e.preventDefault();
        showForgotPasswordForm();
    });
    
    document.getElementById('backToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
    
    // Form submissions
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
    document.getElementById('forgotPasswordFormElement').addEventListener('submit', handleForgotPassword);
    document.getElementById('profileFormElement').addEventListener('submit', handleProfileUpdate);
    document.getElementById('changePasswordForm').addEventListener('submit', handleChangePassword);
}

// UI Functions
function showAuthButtons() {
    document.getElementById('authButtons').style.display = 'flex';
    document.getElementById('userInfo').style.display = 'none';
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    
    authButtons.style.display = 'none';
    userInfo.style.display = 'flex';
    
    const displayName = currentUser.firstName 
        ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
        : currentUser.username;
    
    document.getElementById('welcomeText').textContent = `Welcome, ${displayName}!`;
    
    // Show email verification banner if needed
    if (currentUser && !currentUser.emailVerified) {
        showEmailVerificationBanner();
    } else {
        hideEmailVerificationBanner();
    }
    
    // Show admin options if user is admin
    if (currentUser && currentUser.isAdmin) {
        // Add admin button if it doesn't exist
        if (!document.getElementById('adminBtn')) {
            const adminBtn = document.createElement('button');
            adminBtn.id = 'adminBtn';
            adminBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2v0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2v0Z"></path>
                    <path d="M6.343 7.343a2 2 0 0 1 2.828 0l1.414 1.414a2 2 0 0 1 0 2.828v0a2 2 0 0 1-2.828 0L6.343 10.17a2 2 0 0 1 0-2.828v0Z"></path>
                    <path d="M17.657 7.343a2 2 0 0 0-2.828 0l-1.414 1.414a2 2 0 0 0 0 2.828v0a2 2 0 0 0 2.828 0l1.414-1.414a2 2 0 0 0 0-2.828v0Z"></path>
                    <path d="M20.49 15h-3.98a2 2 0 0 0-1.95 1.557l-.49 1.957a.62.62 0 0 0 .6.76h7.7a.62.62 0 0 0 .6-.76l-.49-1.957A2 2 0 0 0 20.49 15v0Z"></path>
                    <path d="M8.979 15H4.51a2 2 0 0 0-1.95 1.557l-.49 1.957a.62.62 0 0 0 .6.76H9a.61.61 0 0 0 .6-.76l-.5-1.957A2 2 0 0 0 7.21 15h0"></path>
                </svg>
                Admin Panel
            `;
            adminBtn.addEventListener('click', showAdminPanel);
            
            // Add before logout
            const logoutBtn = document.getElementById('logoutBtn');
            document.getElementById('userDropdown').insertBefore(adminBtn, logoutBtn);
        }
    } else {
        // Remove admin button if it exists and user is not admin
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) {
            adminBtn.remove();
        }
    }
}

function showLoginForm() {
    document.getElementById('authModal').style.display = 'block';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    clearAuthMessages();
}

function showRegisterForm() {
    document.getElementById('authModal').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    clearAuthMessages();
}

function showForgotPasswordForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block';
    clearAuthMessages();
}

function showProfile() {
    document.getElementById('profileModal').style.display = 'block';
    loadUserProfile();
}

function clearAuthMessages() {
    const messages = document.querySelectorAll('.error-message, .success-message');
    messages.forEach(msg => msg.remove());
}

function showAuthMessage(message, type = 'error') {
    clearAuthMessages();
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    const activeForm = document.querySelector('.auth-form:not([style*="display: none"])');
    if (activeForm) {
        activeForm.insertBefore(messageDiv, activeForm.querySelector('form'));
    }
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateAuthUI();
            document.getElementById('authModal').style.display = 'none';
            
            // Reload user's saved locations
            loadSavedLocations();
            
            // Show verification message if email is not verified
            if (!currentUser.emailVerified) {
                showNotification('Login successful! Please verify your email to access all features.', 'success');
                console.log('🔗 VERIFICATION: Check your Node.js terminal for the verification link!');
                console.log('📧 EMAIL:', currentUser.email);
                showEmailVerificationBanner();
            } else {
                showNotification('Login successful!', 'success');
            }
        } else {
            showAuthMessage(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAuthMessage('Login failed. Please try again.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const firstName = document.getElementById('registerFirstName').value;
    const lastName = document.getElementById('registerLastName').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showAuthMessage('Passwords do not match');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, firstName, lastName, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateAuthUI();
            document.getElementById('authModal').style.display = 'none';
            
            // Show verification message if required
            if (data.requiresVerification) {
                showNotification('Registration successful! Please check your email to verify your account.', 'success');
                console.log('🔗 VERIFICATION: Check your Node.js terminal for the verification link!');
                console.log('📧 EMAIL:', email);
                showEmailVerificationBanner();
            } else {
                showNotification('Registration successful!', 'success');
            }
            
            // Reload user's saved locations
            loadSavedLocations();
        } else {
            showAuthMessage(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAuthMessage('Registration failed. Please try again.');
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAuthMessage('Password reset instructions sent to your email', 'success');
            // In development, log the reset token
            if (data.resetToken) {
                console.log('Reset token (for development):', data.resetToken);
                console.log('Reset URL:', `http://localhost:3000/reset-password.html?token=${data.resetToken}`);
            }
        } else {
            showAuthMessage(data.error || 'Failed to send reset email');
        }
    } catch (error) {
        console.error('Password reset error:', error);
        showAuthMessage('Failed to send reset email. Please try again.');
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const email = document.getElementById('profileEmail').value;
    const firstName = document.getElementById('profileFirstName').value;
    const lastName = document.getElementById('profileLastName').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ email, firstName, lastName })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Update current user info
            currentUser = { ...currentUser, email, firstName, lastName };
            
            // If email changed, mark as unverified
            if (data.emailChanged) {
                currentUser.emailVerified = false;
                showEmailVerificationBanner();
                showNotification('Profile updated! Please verify your new email address.', 'success');
            } else {
                showNotification('Profile updated successfully!', 'success');
            }
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateAuthUI();
            
            // Refresh profile to show current verification status
            loadUserProfile();
        } else {
            showNotification(data.error || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showNotification('Failed to update profile. Please try again.', 'error');
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmNewPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Clear password fields
            document.getElementById('changePasswordForm').reset();
            showNotification('Password changed successfully!', 'success');
        } else {
            showNotification(data.error || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showNotification('Failed to change password. Please try again.', 'error');
    }
}

async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const user = data.user;
            document.getElementById('profileUsername').value = user.username;
            document.getElementById('profileEmail').value = user.email || '';
            document.getElementById('profileFirstName').value = user.firstName || '';
            document.getElementById('profileLastName').value = user.lastName || '';
            
            // Update current user data
            currentUser.emailVerified = user.emailVerified;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Show/hide verification banner
            if (!user.emailVerified) {
                showEmailVerificationBanner();
            } else {
                hideEmailVerificationBanner();
            }
            
            // Show verification status in profile
            showEmailVerificationStatus(user.emailVerified, user.email);
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

function showEmailVerificationStatus(isVerified, email) {
    // Remove existing status
    const existingStatus = document.getElementById('emailVerificationStatus');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    const statusDiv = document.createElement('div');
    statusDiv.id = 'emailVerificationStatus';
    statusDiv.style.cssText = `
        margin-top: 10px;
        padding: 10px;
        border-radius: 6px;
        font-size: 14px;
        ${isVerified 
            ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;'
            : 'background: #fff3cd; color: #856404; border: 1px solid #ffeaa7;'
        }
    `;
    
    if (isVerified) {
        statusDiv.innerHTML = '✅ Email verified';
    } else {
        statusDiv.innerHTML = `
            ⚠️ Email not verified
            <button onclick="resendVerificationFromProfile('${email}')" style="background: none; border: none; color: #1a73e8; text-decoration: underline; cursor: pointer; margin-left: 10px;">
                Resend verification
            </button>
        `;
    }
    
    const emailField = document.getElementById('profileEmail');
    emailField.parentNode.appendChild(statusDiv);
}

async function resendVerificationFromProfile(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Verification email sent successfully!', 'success');
        } else {
            showNotification(data.error || 'Failed to send verification email', 'error');
        }
    } catch (error) {
        console.error('Resend verification error:', error);
        showNotification('Failed to send verification email. Please try again.', 'error');
    }
}

function showEmailVerificationBanner() {
    // Remove existing banner if any
    const existingBanner = document.getElementById('verificationBanner');
    if (existingBanner) {
        existingBanner.remove();
    }
    
    if (!currentUser || currentUser.emailVerified) {
        return;
    }
    
    const banner = document.createElement('div');
    banner.id = 'verificationBanner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #fff3cd;
        border-bottom: 1px solid #ffeaa7;
        padding: 12px 20px;
        text-align: center;
        z-index: 9999;
        font-size: 14px;
        color: #856404;
    `;
    
    banner.innerHTML = `
        📧 Please verify your email address to access all features. 
        <button onclick="resendVerificationEmail()" style="background: none; border: none; color: #1a73e8; text-decoration: underline; cursor: pointer; font-size: 14px; margin-left: 10px;">
            Resend email
        </button>
        <button onclick="checkConsoleForVerificationLink()" style="background: none; border: none; color: #1a73e8; text-decoration: underline; cursor: pointer; font-size: 14px; margin-left: 10px;">
            Check console for verification link
        </button>
        <button onclick="hideEmailVerificationBanner()" style="background: none; border: none; color: #856404; cursor: pointer; float: right; font-size: 16px;">
            ×
        </button>
    `;
    
    document.body.insertBefore(banner, document.body.firstChild);
    
    // Adjust main content margin
    const container = document.querySelector('.container');
    if (container) {
        container.style.marginTop = '60px';
    }
}

function hideEmailVerificationBanner() {
    const banner = document.getElementById('verificationBanner');
    if (banner) {
        banner.remove();
    }
    
    // Reset main content margin
    const container = document.querySelector('.container');
    if (container) {
        container.style.marginTop = '0';
    }
}

async function resendVerificationEmail() {
    if (!currentUser || !currentUser.email) {
        showNotification('Unable to resend verification email', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: currentUser.email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Verification email sent successfully! Check your browser console for the verification link.', 'success');
            console.log('🔗 VERIFICATION LINK: Check your Node.js terminal for the verification URL');
        } else {
            showNotification(data.error || 'Failed to send verification email', 'error');
        }
    } catch (error) {
        console.error('Resend verification error:', error);
        showNotification('Failed to send verification email. Please try again.', 'error');
    }
}

function checkConsoleForVerificationLink() {
    showNotification('Check your Node.js server terminal for the verification link!', 'warning');
    console.log('🔍 VERIFICATION HELP: Look at your Node.js terminal where you ran "npm start" - the verification link is printed there!');
    console.log('📋 EXAMPLE: Look for a line like "Verification URL: http://localhost:3000/verify-email.html?token=..."');
    console.log('🖱️ Copy that URL and paste it in your browser to verify your email');
}

// Logout function
function logout() {
    // Clear authentication data
    currentUser = null;
    authToken = null;
    currentUserId = null;
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserId');
    
    // Update UI
    showAuthButtons();
    
    // Close user dropdown
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.remove('show');
    dropdown.style.display = 'none';
    dropdown.style.visibility = 'hidden';
    dropdown.style.opacity = '0';
    
    // Clear saved locations from UI (they'll reload from server when user logs in again)
    savedLocations = [];
    displaySavedLocations();
    
    // Show success message
    showNotification('Successfully logged out', 'success');
}

// Test server connection on page load
async function testServerConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/locations`);
        if (!response.ok) {
            console.warn('Server responded with status:', response.status);
        }
    } catch (error) {
        console.error('Server connection failed:', error);
        showNotification('Server connection failed. Some features may not work.', 'warning');
    }
}

// Call test function when page loads
window.addEventListener('load', () => {
    testServerConnection();
});

// Handle API loading errors
window.gm_authFailure = function() {
    alert('Google Maps API authentication failed. Please check your API key.');
};

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (typeof google === 'undefined') {
        document.getElementById('map').innerHTML = '<div class="loading">Loading Google Maps...</div>';
    }
});

// Load popular locations when the page loads
window.addEventListener('load', () => {
    setTimeout(addPopularLocationsSection, 2000); // Load after main content
});

// Initialize authentication on page load
window.addEventListener('load', () => {
    initializeAuth();
});

// Make functions available globally for onclick handlers
window.saveCurrentLocation = saveCurrentLocation;
window.goToSavedLocation = goToSavedLocation;
window.deleteSavedLocation = deleteSavedLocation;
window.deleteSavedLocationFromInfo = deleteSavedLocationFromInfo;
window.goToPopularLocation = goToPopularLocation;
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.logout = logout;
window.resendVerificationEmail = resendVerificationEmail;
window.checkConsoleForVerificationLink = checkConsoleForVerificationLink;
window.hideEmailVerificationBanner = hideEmailVerificationBanner;
window.resendVerificationFromProfile = resendVerificationFromProfile;
window.showAdminPanel = showAdminPanel;

// Simple test function to verify dropdown works
function testDropdown() {
    const dropdown = document.getElementById('userDropdown');
    console.log('Testing dropdown toggle...');
    console.log('Dropdown element:', dropdown);
    console.log('Current classes:', dropdown.classList.toString());
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        dropdown.style.display = 'none';
        dropdown.style.visibility = 'hidden';
        dropdown.style.opacity = '0';
        console.log('Dropdown hidden');
    } else {
        dropdown.classList.add('show');
        dropdown.style.display = 'block';
        dropdown.style.visibility = 'visible';
        dropdown.style.opacity = '1';
        console.log('Dropdown shown');
    }
    
    console.log('After toggle classes:', dropdown.classList.toString());
    console.log('After toggle computed display:', getComputedStyle(dropdown).display);
}

// Admin panel function
function showAdminPanel() {
    // Close user dropdown
    document.getElementById('userDropdown').classList.remove('show');
    
    // Create or show the admin panel modal
    let adminModal = document.getElementById('adminModal');
    
    if (!adminModal) {
        // Create modal if it doesn't exist
        adminModal = document.createElement('div');
        adminModal.id = 'adminModal';
        adminModal.className = 'modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Admin Panel</h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="admin-tabs">
                    <button class="tab-btn active" data-tab="users">Manage Users</button>
                    <button class="tab-btn" data-tab="locations">Manage Locations</button>
                </div>
                <div class="admin-tab-content">
                    <div id="users-tab" class="tab-panel active">
                        <h3>Users Management</h3>
                        <div class="user-list-container">
                            <div class="loading-spinner" id="usersLoading"></div>
                            <table id="usersTable" class="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="usersList">
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div id="locations-tab" class="tab-panel">
                        <h3>Locations Management</h3>
                        <div class="location-list-container">
                            <div class="loading-spinner" id="locationsLoading"></div>
                            <table id="locationsTable" class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Address</th>
                                        <th>Saved By</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="locationsList">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        adminModal.appendChild(modalContent);
        document.body.appendChild(adminModal);
        
        // Add event listeners to the new modal
        adminModal.querySelector('.close').addEventListener('click', () => {
            adminModal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === adminModal) {
                adminModal.style.display = 'none';
            }
        });
        
        // Tab functionality
        const tabBtns = adminModal.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                
                // Update active tab button
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show selected tab
                const tabPanels = adminModal.querySelectorAll('.tab-panel');
                tabPanels.forEach(panel => panel.classList.remove('active'));
                adminModal.querySelector(`#${tabName}-tab`).classList.add('active');
                
                // Load data for selected tab
                if (tabName === 'users') {
                    loadUsersList();
                } else if (tabName === 'locations') {
                    loadLocationsList();
                }
            });
        });
    }
    
    // Show the admin modal
    adminModal.style.display = 'block';
    
    // Load initial data
    loadUsersList();
    
    // Functions to load admin data
    async function loadUsersList() {
        const loadingSpinner = document.getElementById('usersLoading');
        const usersList = document.getElementById('usersList');
        
        loadingSpinner.style.display = 'block';
        usersList.innerHTML = '';
        
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.users.length > 0) {
                    data.users.forEach(user => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${user.id}</td>
                            <td>${escapeHTML(user.username)}</td>
                            <td>${escapeHTML(user.email)}</td>
                            <td>
                                <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
                                    ${user.isActive ? 'Active' : 'Inactive'}
                                </span>
                                ${user.isAdmin ? '<span class="status-badge admin">Admin</span>' : ''}
                                ${user.emailVerified ? '<span class="status-badge verified">Verified</span>' : '<span class="status-badge unverified">Unverified</span>'}
                            </td>
                            <td>
                                <button class="action-btn view-btn" data-id="${user.id}">View</button>
                                <button class="action-btn edit-btn" data-id="${user.id}">Edit</button>
                                ${user.id !== currentUser.id ? `<button class="action-btn delete-btn" data-id="${user.id}">Delete</button>` : ''}
                            </td>
                        `;
                        
                        usersList.appendChild(row);
                    });
                    
                    // Add event listeners to action buttons
                    usersList.querySelectorAll('.view-btn').forEach(btn => {
                        btn.addEventListener('click', () => viewUser(btn.getAttribute('data-id')));
                    });
                    
                    usersList.querySelectorAll('.edit-btn').forEach(btn => {
                        btn.addEventListener('click', () => editUser(btn.getAttribute('data-id')));
                    });
                    
                    usersList.querySelectorAll('.delete-btn').forEach(btn => {
                        btn.addEventListener('click', () => deleteUser(btn.getAttribute('data-id')));
                    });
                } else {
                    usersList.innerHTML = '<tr><td colspan="5" class="no-data">No users found</td></tr>';
                }
            } else {
                const errorData = await response.json();
                showNotification(errorData.error || 'Failed to load users', 'error');
                usersList.innerHTML = '<tr><td colspan="5" class="no-data">Error loading users</td></tr>';
            }
        } catch (error) {
            console.error('Error loading users:', error);
            showNotification('An error occurred while loading users', 'error');
            usersList.innerHTML = '<tr><td colspan="5" class="no-data">Error loading users</td></tr>';
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }
    
    async function loadLocationsList() {
        const loadingSpinner = document.getElementById('locationsLoading');
        const locationsList = document.getElementById('locationsList');
        
        loadingSpinner.style.display = 'block';
        locationsList.innerHTML = '';
        
        try {
            const response = await fetch(`${API_BASE_URL}/admin/locations`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.locations && data.locations.length > 0) {
                    data.locations.forEach(location => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${escapeHTML(location.name)}</td>
                            <td>${escapeHTML(location.address || 'N/A')}</td>
                            <td>${location.savedCount} users</td>
                            <td>
                                <button class="action-btn view-btn" data-id="${location.placeId}">View</button>
                                <button class="action-btn delete-btn" data-id="${location.placeId}">Delete</button>
                            </td>
                        `;
                        
                        locationsList.appendChild(row);
                    });
                    
                    // Add event listeners
                    // Implementation for location actions would go here
                } else {
                    locationsList.innerHTML = '<tr><td colspan="4" class="no-data">No locations found</td></tr>';
                }
            } else {
                const errorData = await response.json();
                showNotification(errorData.error || 'Failed to load locations', 'error');
                locationsList.innerHTML = '<tr><td colspan="4" class="no-data">Error loading locations</td></tr>';
            }
        } catch (error) {
            console.error('Error loading locations:', error);
            showNotification('An error occurred while loading locations', 'error');
            locationsList.innerHTML = '<tr><td colspan="4" class="no-data">Error loading locations</td></tr>';
        } finally {
            loadingSpinner.style.display = 'none';
        }
    }
    
    // Helper function to escape HTML
    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    // User action functions (implementation would depend on your API)
    function viewUser(userId) {
        // Implementation
        console.log('View user', userId);
    }
    
    function editUser(userId) {
        // Implementation
        console.log('Edit user', userId);
    }
    
    function deleteUser(userId) {
        // Implementation with confirmation
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            console.log('Delete user', userId);
        }
    }
}
