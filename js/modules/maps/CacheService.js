/**
 * API Response Caching Service
 * Reduces Google Maps API calls by caching responses
 * ENHANCED: Environment-aware caching with aggressive cache busting
 */

import { environment, environmentUtils } from '../config/environment.js';

export class CacheService {
  static cache = new Map();
  
  // Cache expiration times (in milliseconds) - Reduced for production
  static CACHE_DURATIONS = {
    PLACE_DETAILS: environment.CACHE_CONFIG.AGGRESSIVE_CACHE_BUST ? 2 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 2 hours in prod vs 24 hours
    GEOCODING: environment.CACHE_CONFIG.AGGRESSIVE_CACHE_BUST ? 1 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 1 hour in prod vs 7 days
    AUTOCOMPLETE: 2 * 60 * 1000, // Reduced to 2 minutes
    NEARBY_SEARCH: environment.CACHE_CONFIG.AGGRESSIVE_CACHE_BUST ? 5 * 60 * 1000 : 30 * 60 * 1000, // 5 min in prod vs 30 min
    TEXT_SEARCH: environment.CACHE_CONFIG.AGGRESSIVE_CACHE_BUST ? 10 * 60 * 1000 : 60 * 60 * 1000, // 10 min in prod vs 1 hour
    GPS_LOCATION: environment.CACHE_CONFIG.AGGRESSIVE_CACHE_BUST ? 5 * 60 * 1000 : 60 * 60 * 1000 // 5 min in prod vs 1 hour
  };

  // Initialize cache service
  static init() {
    // Clear cache if needed
    if (environmentUtils.shouldClearCache()) {
      this.clear();
      environmentUtils.clearBrowserCache();
    }
    
    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
    
    environmentUtils.log('DEBUG', 'CacheService initialized', {
      aggressive: environment.CACHE_CONFIG.AGGRESSIVE_CACHE_BUST,
      durations: this.CACHE_DURATIONS
    });
  }

  /**
   * Generate cache key from request parameters
   * @param {string} type - API type (place_details, geocoding, etc.)
   * @param {Object} params - Request parameters
   * @returns {string} Cache key
   */
  static generateKey(type, params) {
    // Include app version in cache key to bust cache on deployment
    const versionedParams = {
      ...params,
      _v: environment.APP_VERSION,
      _env: environment.CURRENT_ENV
    };
    return `${type}:${JSON.stringify(versionedParams)}`;
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
