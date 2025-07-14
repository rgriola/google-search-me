/**
 * Locations Street View Helpers
 * Handles Street View integration and panorama functionality
 */

/**
 * Locations Street View Helpers Class
 */
export class LocationsStreetViewHelpers {

  /**
   * Load and display Street View for a location
   * @param {Object} locationData - Location data with lat/lng
   */
  static loadStreetView(locationData) {
    const container = document.getElementById('street-view-container');
    if (!container || !locationData.lat || !locationData.lng) {
      console.log('Street View container not found or no coordinates available');
      return;
    }

    try {
      // Clear existing content
      container.innerHTML = '<div style="padding: 80px 20px; text-align: center; color: #666;">Loading Street View...</div>';

      // Create Street View panorama
      const panorama = new google.maps.StreetViewPanorama(container, {
        position: { lat: parseFloat(locationData.lat), lng: parseFloat(locationData.lng) },
        pov: { heading: 0, pitch: 0 },
        zoom: 1,
        enableCloseButton: false,
        showRoadLabels: true,
        panControl: true,
        zoomControl: true,
        addressControl: false,
        fullscreenControl: false
      });

      // Handle Street View status
      panorama.addListener('status_changed', () => {
        const status = panorama.getStatus();
        if (status !== 'OK') {
          container.innerHTML = `
            <div style="padding: 80px 20px; text-align: center; color: #666;">
              <p>Street View not available for this location</p>
              <small>Coordinates: ${locationData.lat}, ${locationData.lng}</small>
            </div>
          `;
        }
      });

      console.log('✅ Street View loaded successfully for:', locationData);

    } catch (error) {
      console.error('Error loading Street View:', error);
      container.innerHTML = `
        <div style="padding: 80px 20px; text-align: center; color: #666;">
          <p>Error loading Street View</p>
          <small>Please check your internet connection</small>
        </div>
      `;
    }
  }

  /**
   * Load Street View in a custom container
   * @param {HTMLElement} container - Container element
   * @param {Object} locationData - Location data with lat/lng
   * @param {Object} options - Street View options
   */
  static loadStreetViewInContainer(container, locationData, options = {}) {
    if (!container || !locationData.lat || !locationData.lng) {
      console.log('Street View container or coordinates not available');
      return null;
    }

    try {
      // Clear existing content
      container.innerHTML = '<div style="padding: 40px 20px; text-align: center; color: #666;">Loading Street View...</div>';

      // Default options
      const defaultOptions = {
        position: { lat: parseFloat(locationData.lat), lng: parseFloat(locationData.lng) },
        pov: { heading: 0, pitch: 0 },
        zoom: 1,
        enableCloseButton: false,
        showRoadLabels: true,
        panControl: true,
        zoomControl: true,
        addressControl: false,
        fullscreenControl: false
      };

      // Merge with custom options
      const streetViewOptions = { ...defaultOptions, ...options };

      // Create Street View panorama
      const panorama = new google.maps.StreetViewPanorama(container, streetViewOptions);

      // Handle Street View status
      panorama.addListener('status_changed', () => {
        const status = panorama.getStatus();
        if (status !== 'OK') {
          container.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; color: #666;">
              <p>Street View not available for this location</p>
              <small>Coordinates: ${locationData.lat}, ${locationData.lng}</small>
            </div>
          `;
        }
      });

      return panorama;

    } catch (error) {
      console.error('Error loading Street View in container:', error);
      container.innerHTML = `
        <div style="padding: 40px 20px; text-align: center; color: #666;">
          <p>Error loading Street View</p>
          <small>Please check your internet connection</small>
        </div>
      `;
      return null;
    }
  }

  /**
   * Check if Street View is available for coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<boolean>} Whether Street View is available
   */
  static async isStreetViewAvailable(lat, lng) {
    return new Promise((resolve) => {
      try {
        const service = new google.maps.StreetViewService();
        
        service.getPanorama({
          location: { lat: parseFloat(lat), lng: parseFloat(lng) },
          radius: 50,
          source: google.maps.StreetViewSource.OUTDOOR
        }, (data, status) => {
          resolve(status === 'OK');
        });
        
      } catch (error) {
        console.error('Error checking Street View availability:', error);
        resolve(false);
      }
    });
  }

  /**
   * Create Street View preview thumbnail
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {string} Street View static image URL
   */
  static createStreetViewThumbnail(lat, lng, width = 300, height = 200) {
    const apiKey = window.GOOGLE_MAPS_API_KEY || '';
    
    if (!apiKey) {
      console.warn('Google Maps API key not found for Street View thumbnail');
      return null;
    }

    const baseUrl = 'https://maps.googleapis.com/maps/api/streetview';
    const params = new URLSearchParams({
      size: `${width}x${height}`,
      location: `${lat},${lng}`,
      heading: '0',
      pitch: '0',
      key: apiKey
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Initialize Street View in location details
   * @param {Object} location - Location object
   */
  static initializeLocationStreetView(location) {
    // Extract coordinates from location
    let lat, lng;
    
    if (location.lat && location.lng) {
      lat = location.lat;
      lng = location.lng;
    } else if (location.geometry && location.geometry.location) {
      lat = location.geometry.location.lat;
      lng = location.geometry.location.lng;
    } else {
      console.log('No coordinates available for Street View');
      return;
    }

    // Load Street View with slight delay to ensure container is rendered
    setTimeout(() => {
      this.loadStreetView({ lat, lng });
    }, 100);
  }

  /**
   * Create Street View container element
   * @param {string} id - Container ID
   * @param {Object} styles - CSS styles to apply
   * @returns {HTMLElement} Container element
   */
  static createStreetViewContainer(id = 'street-view-container', styles = {}) {
    const container = document.createElement('div');
    container.id = id;
    
    // Default styles
    const defaultStyles = {
      width: '100%',
      height: '300px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      overflow: 'hidden'
    };

    // Apply styles
    Object.assign(container.style, defaultStyles, styles);

    return container;
  }

  /**
   * Dispose of Street View panorama to free memory
   * @param {google.maps.StreetViewPanorama} panorama - Panorama to dispose
   */
  static disposeStreetView(panorama) {
    if (panorama) {
      try {
        // Clear all listeners
        google.maps.event.clearInstanceListeners(panorama);
        
        // Set panorama to null position to clean up
        panorama.setPosition(null);
        
        console.log('Street View panorama disposed');
      } catch (error) {
        console.error('Error disposing Street View panorama:', error);
      }
    }
  }

  /**
   * Handle Street View container resize
   * @param {google.maps.StreetViewPanorama} panorama - Panorama instance
   */
  static handleStreetViewResize(panorama) {
    if (panorama) {
      try {
        // Trigger resize event
        google.maps.event.trigger(panorama, 'resize');
      } catch (error) {
        console.error('Error handling Street View resize:', error);
      }
    }
  }

  /**
   * Create Street View error message
   * @param {string} message - Error message
   * @param {Object} locationData - Location data for debugging
   * @returns {string} HTML error message
   */
  static createStreetViewErrorMessage(message = 'Street View not available', locationData = null) {
    const coordinates = locationData ? 
      `<small>Coordinates: ${locationData.lat}, ${locationData.lng}</small>` : 
      '';

    return `
      <div style="padding: 60px 20px; text-align: center; color: #666;">
        <p>${message}</p>
        ${coordinates}
      </div>
    `;
  }

  /**
   * Create Street View loading message
   * @param {string} message - Loading message
   * @returns {string} HTML loading message
   */
  static createStreetViewLoadingMessage(message = 'Loading Street View...') {
    return `
      <div style="padding: 60px 20px; text-align: center; color: #666;">
        <div style="margin-bottom: 10px;">
          <div style="width: 20px; height: 20px; border: 2px solid #ddd; border-top: 2px solid #666; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        </div>
        <p>${message}</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
  }
}

// Export individual functions for backward compatibility
export const loadStreetView = LocationsStreetViewHelpers.loadStreetView.bind(LocationsStreetViewHelpers);
export const loadStreetViewInContainer = LocationsStreetViewHelpers.loadStreetViewInContainer.bind(LocationsStreetViewHelpers);
export const isStreetViewAvailable = LocationsStreetViewHelpers.isStreetViewAvailable.bind(LocationsStreetViewHelpers);
export const createStreetViewThumbnail = LocationsStreetViewHelpers.createStreetViewThumbnail.bind(LocationsStreetViewHelpers);
