/**
 * Secure Google Maps API Loader
 * Loads Google Maps API key from server configuration
 */

/**
 * Load Google Maps JavaScript API dynamically with key from server
 * @returns {Promise} Promise that resolves when Maps API is loaded
 */
export async function loadGoogleMapsAPI() {
    return new Promise(async (resolve, reject) => {
        try {
            // Check if Google Maps is already loaded
            if (window.google && window.google.maps) {
                resolve(window.google.maps);
                return;
            }
            
            // Fetch API key from server
            const response = await fetch('/api/config/google-maps-key');
            if (!response.ok) {
                throw new Error(`Failed to get Google Maps API key: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data.success || !data.apiKey) {
                throw new Error('Google Maps API key not available');
            }
            
            // Create and load the script
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                if (window.google && window.google.maps) {
                    resolve(window.google.maps);
                } else {
                    reject(new Error('Google Maps API failed to initialize'));
                }
            };
            
            script.onerror = () => {
                reject(new Error('Failed to load Google Maps API script'));
            };
            
            document.head.appendChild(script);
            
        } catch (error) {
            console.error('Error loading Google Maps API:', error);
            reject(error);
        }
    });
}

/**
 * Initialize Google Maps when DOM is ready
 * @param {Function} callback - Function to call when Maps API is loaded
 */
export function initializeGoogleMaps(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            loadGoogleMapsAPI().then(callback).catch(console.error);
        });
    } else {
        loadGoogleMapsAPI().then(callback).catch(console.error);
    }
}
