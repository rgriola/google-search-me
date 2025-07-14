/**
 * Location Service Module
 * Handles location-related business logic and database operations
 */

const { getDatabase } = require('../config/database');

/**
 * Get all saved locations ordered by popularity
 * @returns {Promise<Array>} Array of location objects
 */
async function getAllLocations() {
    const db = getDatabase();
    
    const query = `
        SELECT 
            place_id,
            name,
            address,
            lat,
            lng,
            rating,
            website,
            photo_url,
            user_id,
            saved_count,
            created_at,
            type,
            entry_point,
            parking,
            access
        FROM saved_locations 
        ORDER BY saved_count DESC, created_at DESC
    `;
    
    return new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Get popular locations with save count > 1
 * @param {number} limit - Maximum number of locations to return
 * @returns {Promise<Array>} Array of popular location objects
 */
async function getPopularLocations(limit = 20) {
    const db = getDatabase();
    
    const query = `
        SELECT 
            place_id,
            name,
            address,
            lat,
            lng,
            rating,
            website,
            photo_url,
            user_id,
            saved_count,
            created_at,
            type,
            entry_point,
            parking,
            access
        FROM saved_locations 
        WHERE saved_count > 1
        ORDER BY saved_count DESC, created_at DESC
        LIMIT ?
    `;
    
    return new Promise((resolve, reject) => {
        db.all(query, [limit], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Get user's saved locations
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of user's saved locations
 */
async function getUserLocations(userId) {
    const db = getDatabase();
    
    const query = `
        SELECT 
            sl.place_id,
            sl.name,
            sl.address,
            sl.lat,
            sl.lng,
            sl.rating,
            sl.website,
            sl.photo_url,
            sl.type,
            sl.entry_point,
            sl.parking,
            sl.access,
            us.saved_at
        FROM saved_locations sl
        JOIN user_saves us ON sl.place_id = us.place_id
        WHERE us.user_id = ?
        ORDER BY us.saved_at DESC
    `;
    
    return new Promise((resolve, reject) => {
        db.all(query, [userId], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Check if user has already saved a location
 * @param {number} userId - User ID
 * @param {string} placeId - Google Places place ID
 * @returns {Promise<boolean>} True if location is already saved
 */
async function isLocationSavedByUser(userId, placeId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT id FROM user_saves WHERE user_id = ? AND place_id = ?',
            [userId, placeId],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(!!row);
                }
            }
        );
    });
}

/**
 * Save a location for a user with enhanced address data
 * @param {number} userId - User ID
 * @param {Object} locationData - Location data object
 * @returns {Promise<Object>} Save operation result
 */
async function saveLocationForUser(userId, locationData) {
    const db = getDatabase();
    
    // Handle both camelCase and snake_case formats
    const placeId = locationData.placeId || locationData.place_id;
    const photoUrl = locationData.photoUrl || locationData.photo_url;
    const { 
        name, 
        address, 
        lat, 
        lng, 
        rating, 
        website,
        description,
        street,
        number,
        city,
        state,
        zipcode,
        type,
        entry_point,
        parking,
        access
    } = locationData;
    
    // Check if user has already saved this location
    const alreadySaved = await isLocationSavedByUser(userId, placeId);
    if (alreadySaved) {
        throw new Error('Location already saved');
    }
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Insert or update location in saved_locations table with new fields
            db.run(
                `INSERT OR REPLACE INTO saved_locations 
                (place_id, name, address, lat, lng, rating, website, photo_url, 
                 description, street, number, city, state, zipcode, created_by, user_id, 
                 type, entry_point, parking, access, saved_count, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                    ?, ?, ?, ?, 
                    COALESCE((SELECT saved_count FROM saved_locations WHERE place_id = ?), 0) + 1, 
                    CURRENT_TIMESTAMP)`,
                [placeId, name, address, lat, lng, rating, website, photoUrl, 
                 description, street, number, city, state, zipcode, userId, userId, 
                 type, entry_point, parking, access, placeId],
                function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Add user save record
                    db.run(
                        'INSERT INTO user_saves (user_id, place_id) VALUES (?, ?)',
                        [userId, placeId],
                        function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                // Return the complete location data
                                resolve({
                                    success: true,
                                    placeId: placeId,
                                    message: 'Location saved successfully',
                                    location: {
                                        place_id: placeId,
                                        name: name,
                                        address: address,
                                        lat: lat,
                                        lng: lng,
                                        rating: rating,
                                        website: website,
                                        photo_url: photoUrl,
                                        description: description,
                                        street: street,
                                        number: number,
                                        city: city,
                                        state: state,
                                        zipcode: zipcode,
                                        type: type,
                                        entry_point: entry_point,
                                        parking: parking,
                                        access: access,
                                        created_by: userId,
                                        user_id: userId,
                                        saved_at: new Date().toISOString()
                                    }
                                });
                            }
                        }
                    );
                }
            );
        });
    });
}

/**
 * Remove a location for a user
 * @param {number} userId - User ID
 * @param {string} placeId - Google Places place ID
 * @returns {Promise<Object>} Remove operation result
 */
async function removeLocationForUser(userId, placeId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Remove user save record
            db.run(
                'DELETE FROM user_saves WHERE user_id = ? AND place_id = ?',
                [userId, placeId],
                function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (this.changes === 0) {
                        reject(new Error('Location not found for user'));
                        return;
                    }

                    // Decrease saved count
                    db.run(
                        'UPDATE saved_locations SET saved_count = saved_count - 1 WHERE place_id = ?',
                        [placeId],
                        function(err) {
                            if (err) {
                                reject(err);
                                return;
                            }

                            // Remove location if no one has saved it
                            db.run(
                                'DELETE FROM saved_locations WHERE place_id = ? AND saved_count <= 0',
                                [placeId],
                                function(err) {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve({
                                            success: true,
                                            message: 'Location removed successfully'
                                        });
                                    }
                                }
                            );
                        }
                    );
                }
            );
        });
    });
}

/**
 * Get location statistics
 * @returns {Promise<Object>} Location statistics
 */
async function getLocationStats() {
    const db = getDatabase();
    
    const queries = {
        totalLocations: 'SELECT COUNT(*) as count FROM saved_locations',
        totalUserSaves: 'SELECT COUNT(*) as count FROM user_saves',
        popularLocations: 'SELECT COUNT(*) as count FROM saved_locations WHERE saved_count > 1',
        averageSaveCount: 'SELECT AVG(saved_count) as average FROM saved_locations'
    };
    
    const stats = {};
    
    for (const [key, query] of Object.entries(queries)) {
        stats[key] = await new Promise((resolve, reject) => {
            db.get(query, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(key === 'averageSaveCount' ? row.average : row.count);
                }
            });
        });
    }
    
    return stats;
}

/**
 * Search locations by name or address
 * @param {string} searchTerm - Search term
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Array of matching locations
 */
async function searchLocations(searchTerm, limit = 10) {
    const db = getDatabase();
    
    const query = `
        SELECT 
            place_id,
            name,
            address,
            lat,
            lng,
            rating,
            website,
            photo_url,
            user_id,
            saved_count,
            created_at
        FROM saved_locations 
        WHERE name LIKE ? OR address LIKE ?
        ORDER BY saved_count DESC, created_at DESC
        LIMIT ?
    `;
    
    const searchPattern = `%${searchTerm}%`;
    
    return new Promise((resolve, reject) => {
        db.all(query, [searchPattern, searchPattern, limit], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Get location by place ID
 * @param {string} placeId - Google Places place ID
 * @returns {Promise<Object|null>} Location object or null
 */
async function getLocationByPlaceId(placeId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM saved_locations WHERE place_id = ?',
            [placeId],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            }
        );
    });
}

/**
 * Update location statistics (like save count)
 * @param {string} placeId - Google Places place ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<boolean>} Success status
 */
async function updateLocationStats(placeId, updates) {
    const db = getDatabase();
    
    const setClause = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');
    
    const values = Object.values(updates);
    values.push(placeId);
    
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE saved_locations SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE place_id = ?`,
            values,
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            }
        );
    });
}

/**
 * Check if user can edit a location (admin or creator)
 * @param {number} userId - User ID
 * @param {string} placeId - Place ID
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<boolean>} Whether user can edit the location
 */
async function canUserEditLocation(userId, placeId, isAdmin = false) {
    if (isAdmin) return true;
    
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT created_by FROM saved_locations WHERE place_id = ?',
            [placeId],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row && row.created_by === userId);
                }
            }
        );
    });
}

/**
 * Update a location with permission check
 * @param {number} userId - User ID
 * @param {string} placeId - Place ID
 * @param {Object} updates - Updates to apply
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Object>} Update result
 */
async function updateLocation(userId, placeId, updates, isAdmin = false) {
    const canEdit = await canUserEditLocation(userId, placeId, isAdmin);
    if (!canEdit) {
        throw new Error('Insufficient permissions to edit this location');
    }
    
    const db = getDatabase();
    
    // Filter out fields that shouldn't be updated
    const allowedFields = ['name', 'address', 'description', 'street', 'number', 'city', 'state', 'zipcode'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
            filteredUpdates[key] = updates[key];
        }
    });
    
    if (Object.keys(filteredUpdates).length === 0) {
        throw new Error('No valid fields to update');
    }
    
    const setClause = Object.keys(filteredUpdates)
        .map(key => `${key} = ?`)
        .join(', ');
    
    const values = Object.values(filteredUpdates);
    values.push(placeId);
    
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE saved_locations SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE place_id = ?`,
            values,
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        success: true,
                        changes: this.changes,
                        message: 'Location updated successfully'
                    });
                }
            }
        );
    });
}

/**
 * Delete a location with permission check
 * @param {number} userId - User ID
 * @param {string} placeId - Place ID
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Object>} Delete result
 */
async function deleteLocation(userId, placeId, isAdmin = false) {
    const canEdit = await canUserEditLocation(userId, placeId, isAdmin);
    if (!canEdit) {
        throw new Error('Insufficient permissions to delete this location');
    }
    
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // First delete from user_saves
            db.run(
                'DELETE FROM user_saves WHERE place_id = ?',
                [placeId],
                function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    // Then delete from saved_locations
                    db.run(
                        'DELETE FROM saved_locations WHERE place_id = ?',
                        [placeId],
                        function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({
                                    success: true,
                                    changes: this.changes,
                                    message: 'Location deleted successfully'
                                });
                            }
                        }
                    );
                }
            );
        });
    });
}

/**
 * Get locations with creator information
 * @returns {Promise<Array>} Array of locations with creator data
 */
async function getLocationsWithCreators() {
    const db = getDatabase();
    
    const query = `
        SELECT 
            sl.*,
            u.username as creator_username,
            u.email as creator_email
        FROM saved_locations sl
        LEFT JOIN users u ON sl.created_by = u.id
        ORDER BY sl.saved_count DESC, sl.created_at DESC
    `;
    
    return new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    getAllLocations,
    getPopularLocations,
    getUserLocations,
    isLocationSavedByUser,
    saveLocationForUser,
    removeLocationForUser,
    getLocationStats,
    searchLocations,
    getLocationByPlaceId,
    updateLocationStats,
    canUserEditLocation,
    updateLocation,
    deleteLocation,
    getLocationsWithCreators
};
