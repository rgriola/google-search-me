/**
 * API Response Caching Service
 * Reduces Google Maps API calls by caching responses
 */

export class CacheService {
  static cache = new Map();
  
  // Cache expiration times (in milliseconds)
  static CACHE_DURATIONS = {
    PLACE_DETAILS: 24 * 60 * 60 * 1000, // 24 hours
    GEOCODING: 7 * 24 * 60 * 60 * 1000, // 7 days  
    AUTOCOMPLETE: 5 * 60 * 1000, // 5 minutes (optimized for frequent searches)
    NEARBY_SEARCH: 30 * 60 * 1000, // 30 minutes
    TEXT_SEARCH: 60 * 60 * 1000, // 1 hour
    GPS_LOCATION: 60 * 60 * 1000 // 1 hour for GPS coordinates
  };

  /**
   * Generate cache key from request parameters
   * @param {string} type - API type (place_details, geocoding, etc.)
   * @param {Object} params - Request parameters
   * @returns {string} Cache key
   */
  static generateKey(type, params) {
    return `${type}:${JSON.stringify(params)}`;
  }

  /**
   * Get cached response if valid
   * @param {string} type - API type
   * @param {Object} params - Request parameters
   * @returns {Object|null} Cached response or null
   */
  static get(type, params) {
    const key = this.generateKey(type, params);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if expired
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATIONS[type.toUpperCase()]) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`📦 Cache HIT for ${type}:`, params);
    return cached.data;
  }

  /**
   * Store response in cache
   * @param {string} type - API type
   * @param {Object} params - Request parameters
   * @param {Object} data - Response data
   */
  static set(type, params, data) {
    const key = this.generateKey(type, params);
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
    
    console.log(`📦 Cache SET for ${type}:`, params);
    
    // Cleanup old entries periodically
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }

  /**
   * Remove expired entries from cache
   */
  static cleanup() {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, value] of this.cache.entries()) {
      const [type] = key.split(':');
      const maxAge = this.CACHE_DURATIONS[type.toUpperCase()] || this.CACHE_DURATIONS.PLACE_DETAILS;
      
      if (now - value.timestamp > maxAge) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    console.log(`🧹 Cache cleanup: removed ${removedCount} expired entries`);
  }

  /**
   * Clear all cache
   */
  static clear() {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  static getStats() {
    return {
      size: this.cache.size,
      types: [...new Set([...this.cache.keys()].map(key => key.split(':')[0]))]
    };
  }
}
