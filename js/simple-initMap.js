/**
 * Simple initMap for debugging
 */

console.log('🔧 Loading simple initMap for debugging...');

// Create a simple global initMap function that doesn't depend on modules
window.initMap = function() {
    console.log('🚀 Simple initMap called by Google Maps API');
    
    try {
        // Create a basic map first
        const map = new google.maps.Map(document.getElementById('map'), {
            zoom: 13,
            center: { lat: 37.7749, lng: -122.4194 },
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true
        });
        
        console.log('✅ Basic Google Maps initialized successfully');
        
        // Now try to load the full application modules
        setTimeout(async () => {
            try {
                console.log('📦 Loading application modules...');
                const { initializeAllModules } = await import('/js/main.js');
                await initializeAllModules();
                console.log('✅ Application modules loaded successfully');
            } catch (error) {
                console.error('❌ Error loading application modules:', error);
                alert('Error loading application modules: ' + error.message);
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Error in simple initMap:', error);
        alert('Error initializing Google Maps: ' + error.message);
    }
};

console.log('✅ Simple initMap function registered globally');
