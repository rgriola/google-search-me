/**
 * Example: How to migrate MapService.js
 * BEFORE and AFTER comparison
 */

// ================================================================
// BEFORE: Using console.log everywhere
// ================================================================

class MapServiceBefore {
  static initializeMap(mapOptions) {
    console.log('🗺️ Initializing Google Maps...');
    console.log('Map options:', mapOptions);
    
    try {
      const map = new google.maps.Map(document.getElementById('map'), mapOptions);
      console.log('✅ Map initialized successfully');
      return map;
    } catch (error) {
      console.error('❌ Failed to initialize map:', error);
      throw error;
    }
  }
  
  static addMarker(map, position, title) {
    console.log('📍 Adding marker:', { position, title });
    console.warn('⚠️ Checking if position is valid...');
    
    if (!position.lat || !position.lng) {
      console.error('❌ Invalid position for marker');
      return null;
    }
    
    const marker = new google.maps.Marker({
      position,
      map,
      title
    });
    
    console.log('✅ Marker added successfully');
    return marker;
  }
}

// ================================================================
// AFTER: Using structured logging
// ================================================================

import { createLogger, LOG_CATEGORIES } from '../utils/Logger.js';

class MapServiceAfter {
  constructor() {
    // Create a logger specific to this service
    this.logger = createLogger(LOG_CATEGORIES.MAPS);
  }
  
  initializeMap(mapOptions) {
    this.logger.info('Initializing Google Maps...');
    this.logger.debug('Map options', mapOptions);
    
    try {
      const map = new google.maps.Map(document.getElementById('map'), mapOptions);
      this.logger.info('Map initialized successfully');
      return map;
    } catch (error) {
      this.logger.error('Failed to initialize map', error);
      throw error;
    }
  }
  
  addMarker(map, position, title) {
    this.logger.debug('Adding marker', { position, title });
    this.logger.debug('Validating marker position...');
    
    if (!position.lat || !position.lng) {
      this.logger.error('Invalid position for marker', { position });
      return null;
    }
    
    const marker = new google.maps.Marker({
      position,
      map,
      title
    });
    
    this.logger.info('Marker added successfully', { title, lat: position.lat, lng: position.lng });
    return marker;
  }
}

// ================================================================
// BENEFITS OF THE MIGRATION
// ================================================================

/*
1. **Filterable**: You can now show only MAPS logs when debugging map issues
   Example in console: setLogCategories(['MAPS'])

2. **Level Control**: Show only errors in production, debug in development
   Example: setLogLevel('ERROR') // Only show errors

3. **Structured Data**: Error objects and complex data are properly formatted
   No more [object Object] in logs!

4. **Visual Organization**: Emoji prefixes help identify log sources quickly
   🗺️ [MAPS] vs 📡 [GPS] vs 🔐 [AUTH]

5. **Performance**: Logs can be completely disabled in production without code changes
*/
