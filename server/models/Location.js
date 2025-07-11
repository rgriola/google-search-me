/**
 * Location Model
 * Defines the Location class with validation and business logic
 */

/**
 * Location class representing a saved location
 */
class Location {
    constructor(data) {
        this.placeId = data.place_id || data.placeId;
        this.name = data.name;
        this.address = data.address;
        this.lat = parseFloat(data.lat);
        this.lng = parseFloat(data.lng);
        this.rating = data.rating ? parseFloat(data.rating) : null;
        this.website = data.website;
        this.photoUrl = data.photo_url || data.photoUrl;
        this.savedCount = parseInt(data.saved_count || data.savedCount || 0);
        this.createdAt = data.created_at || data.createdAt;
        this.updatedAt = data.updated_at || data.updatedAt;
        this.savedAt = data.saved_at || data.savedAt; // For user-specific saves
    }

    /**
     * Validate location data
     * @returns {Object} Validation result with isValid boolean and errors array
     */
    validate() {
        const errors = [];

        if (!this.placeId || typeof this.placeId !== 'string') {
            errors.push('Place ID is required and must be a string');
        }

        if (!this.name || typeof this.name !== 'string' || this.name.trim().length === 0) {
            errors.push('Name is required and must be a non-empty string');
        }

        if (this.name && this.name.length > 255) {
            errors.push('Name must be less than 255 characters');
        }

        if (isNaN(this.lat) || this.lat < -90 || this.lat > 90) {
            errors.push('Latitude must be a valid number between -90 and 90');
        }

        if (isNaN(this.lng) || this.lng < -180 || this.lng > 180) {
            errors.push('Longitude must be a valid number between -180 and 180');
        }

        if (this.rating !== null && (isNaN(this.rating) || this.rating < 0 || this.rating > 5)) {
            errors.push('Rating must be a number between 0 and 5, or null');
        }

        if (this.website && !this.isValidUrl(this.website)) {
            errors.push('Website must be a valid URL');
        }

        if (this.photoUrl && !this.isValidUrl(this.photoUrl)) {
            errors.push('Photo URL must be a valid URL');
        }

        if (this.address && this.address.length > 500) {
            errors.push('Address must be less than 500 characters');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Check if a URL is valid
     * @param {string} url - URL to validate
     * @returns {boolean} True if URL is valid
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Sanitize location data
     * @returns {Location} Sanitized location instance
     */
    sanitize() {
        if (this.name) {
            this.name = this.name.trim().substring(0, 255);
        }
        
        if (this.address) {
            this.address = this.address.trim().substring(0, 500);
        }

        // Ensure coordinates are properly formatted
        this.lat = Math.round(this.lat * 1000000) / 1000000; // 6 decimal places
        this.lng = Math.round(this.lng * 1000000) / 1000000; // 6 decimal places

        // Ensure rating is within bounds
        if (this.rating !== null) {
            this.rating = Math.max(0, Math.min(5, this.rating));
            this.rating = Math.round(this.rating * 10) / 10; // 1 decimal place
        }

        return this;
    }

    /**
     * Convert location to database format
     * @returns {Object} Database-friendly object
     */
    toDatabase() {
        return {
            place_id: this.placeId,
            name: this.name,
            address: this.address,
            lat: this.lat,
            lng: this.lng,
            rating: this.rating,
            website: this.website,
            photo_url: this.photoUrl,
            saved_count: this.savedCount
        };
    }

    /**
     * Convert location to API response format
     * @returns {Object} API-friendly object
     */
    toJSON() {
        return {
            placeId: this.placeId,
            name: this.name,
            address: this.address,
            lat: this.lat,
            lng: this.lng,
            rating: this.rating,
            website: this.website,
            photoUrl: this.photoUrl,
            savedCount: this.savedCount,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            savedAt: this.savedAt
        };
    }

    /**
     * Get distance to another location in kilometers
     * @param {Location} otherLocation - Other location
     * @returns {number} Distance in kilometers
     */
    getDistanceTo(otherLocation) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(otherLocation.lat - this.lat);
        const dLng = this.toRadians(otherLocation.lng - this.lng);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(this.lat)) * Math.cos(this.toRadians(otherLocation.lat)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - Degrees
     * @returns {number} Radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Check if location is within a bounding box
     * @param {Object} bounds - Bounding box with north, south, east, west
     * @returns {boolean} True if location is within bounds
     */
    isWithinBounds(bounds) {
        return this.lat >= bounds.south &&
               this.lat <= bounds.north &&
               this.lng >= bounds.west &&
               this.lng <= bounds.east;
    }

    /**
     * Get a summary string for the location
     * @returns {string} Location summary
     */
    getSummary() {
        let summary = this.name;
        if (this.address) {
            summary += ` (${this.address})`;
        }
        if (this.rating) {
            summary += ` - Rating: ${this.rating}/5`;
        }
        return summary;
    }

    /**
     * Check if this location is the same as another location
     * @param {Location} otherLocation - Other location
     * @returns {boolean} True if locations are the same
     */
    equals(otherLocation) {
        return this.placeId === otherLocation.placeId;
    }

    /**
     * Create a Location instance from raw database data
     * @param {Object} dbData - Raw database row
     * @returns {Location} Location instance
     */
    static fromDatabase(dbData) {
        return new Location(dbData);
    }

    /**
     * Create a Location instance from API request data
     * @param {Object} apiData - API request data
     * @returns {Location} Location instance
     */
    static fromApiRequest(apiData) {
        return new Location({
            placeId: apiData.placeId,
            name: apiData.name,
            address: apiData.address,
            lat: apiData.lat,
            lng: apiData.lng,
            rating: apiData.rating,
            website: apiData.website,
            photoUrl: apiData.photoUrl
        });
    }

    /**
     * Validate location data without creating an instance
     * @param {Object} data - Location data to validate
     * @returns {Object} Validation result
     */
    static validate(data) {
        const tempLocation = new Location(data);
        return tempLocation.validate();
    }
}

/**
 * Location database schema definition
 */
const LocationSchema = {
    tableName: 'saved_locations',
    columns: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        place_id: 'TEXT UNIQUE NOT NULL',
        name: 'TEXT NOT NULL',
        address: 'TEXT',
        lat: 'REAL NOT NULL',
        lng: 'REAL NOT NULL',
        rating: 'REAL',
        website: 'TEXT',
        photo_url: 'TEXT',
        saved_count: 'INTEGER DEFAULT 1',
        created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
    }
};

/**
 * User saves database schema definition
 */
const UserSavesSchema = {
    tableName: 'user_saves',
    columns: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        user_id: 'INTEGER NOT NULL',
        place_id: 'TEXT NOT NULL',
        saved_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
    },
    constraints: [
        'FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE',
        'FOREIGN KEY (place_id) REFERENCES saved_locations (place_id) ON DELETE CASCADE'
    ]
};

module.exports = {
    Location,
    LocationSchema,
    UserSavesSchema
};
