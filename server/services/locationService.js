/**
 * Location Service Module
 * Handles location-related business logic and database operations
 */

import { getDatabase } from '../config/database.js';

// Get database instance once at module level
const db = getDatabase();

/**
 * Get all saved locations ordered by popularity
 * @returns {Promise<Array>} Array of location objects
 */
async function getAllLocations() {
    const query = `
        SELECT 
            id,
            name,
            lat,
            lng,
            formatted_address,
            production_notes,
            type,
            entry_point,
            parking,
            access,
            street,
            number,
            city,
            state,
            zipcode,
            created_by,
            created_date,
            updated_date,
            place_id
        FROM saved_locations 
        ORDER BY created_date DESC
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
    
    // Handle both camelCase and snake_case formats
    const placeId = locationData.placeId || locationData.place_id;
    const { 
        name, 
        lat, 
        lng, 
        formatted_address,
        production_notes,
        type,
        entry_point,
        parking,
        access,
        street,
        number,
        city,
        state,
        zipcode
    } = locationData;
    
    // Check if user has already saved this location
    const alreadySaved = await isLocationSavedByUser(userId, placeId);
    if (alreadySaved) {
        throw new Error('Location already saved');
    }
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Insert location in saved_locations table with new structure
            db.run(
                `INSERT INTO saved_locations 
                (name, lat, lng, formatted_address, production_notes, type, entry_point, 
                 parking, access, street, number, city, state, zipcode, created_by, place_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, lat, lng, formatted_address, production_notes, type, entry_point, 
                 parking, access, street, number, city, state, zipcode, userId, placeId],
                function(err) {
                    if (err) {
                        // Handle specific SQLite constraint errors more gracefully
                        if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE constraint failed')) {
                            // This is a race condition - location was already saved
                            console.log('🔍 UNIQUE constraint error caught - location already exists:', placeId);
                            
                            // Instead of rejecting, let's resolve with the existing location
                            db.get(
                                'SELECT * FROM saved_locations WHERE place_id = ?',
                                [placeId],
                                (getErr, row) => {
                                    if (getErr) {
                                        reject(err); // Use original error if we can't get the existing location
                                    } else if (row) {
                                        resolve({
                                            success: true,
                                            placeId: placeId,
                                            message: 'Location already exists',
                                            location: row
                                        });
                                    } else {
                                        reject(err); // Use original error if location doesn't exist somehow
                                    }
                                }
                            );
                            return;
                        }
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
                                        lat: lat,
                                        lng: lng,
                                        formatted_address: formatted_address,
                                        production_notes: production_notes,
                                        type: type,
                                        entry_point: entry_point,
                                        parking: parking,
                                        access: access,
                                        street: street,
                                        number: number,
                                        city: city,
                                        state: state,
                                        zipcode: zipcode,
                                        created_by: userId
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
    
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT created_by, is_permanent FROM saved_locations WHERE place_id = ?',
            [placeId],
            (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve(false); // Location not found
                } else {
                    // Permanent locations can only be edited by admins
                    if (row.is_permanent === 1) {
                        resolve(false);
                    } else {
                        // Regular locations can be edited by owner
                        resolve(row.created_by === userId);
                    }
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
    
    
    // Filter out fields that shouldn't be updated
    const allowedFields = ['name',
                           'formatted_address',
                           'production_notes',
                           'type',
                           'entry_point',
                           'parking',
                           'access',
                           'number', 
                           'street', 
                           'city',
                           'state', 
                           'zipcode'
                        ];

    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
            console.log(`updateLocation() ============`);
            console.log(`Updating field: ${key} with value: ${updates[key]}`);
            filteredUpdates[key] = updates[key];
        } else {
            console.log(`FILTERED OUT field: ${key} with value: ${updates[key]}`);
        }
    });
    
    console.log('=== FINAL FILTERED UPDATES ===');
    console.log('filteredUpdates object:', JSON.stringify(filteredUpdates, null, 2));
    console.log('formatted_address value:', filteredUpdates.formatted_address);
    console.log('=== END FILTERED UPDATES ===');
    
    if (Object.keys(filteredUpdates).length === 0) {
        throw new Error('No valid fields to update');
    }
    
    const setClause = Object.keys(filteredUpdates)
        .map(key => `${key} = ?`)
        .join(', ');
    
    const values = Object.values(filteredUpdates);
    values.push(placeId);
    
    console.log('=== SQL EXECUTION DEBUG ===');
    console.log('SET clause:', setClause);
    console.log('Values array:', values);
    console.log('Full SQL:', `UPDATE saved_locations SET ${setClause} WHERE place_id = ?`);
    console.log('formatted_address position in values:', values.indexOf(filteredUpdates.formatted_address));
    console.log('=== END SQL DEBUG ===');
    
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE saved_locations SET ${setClause} WHERE place_id = ?`,
            values,
            function(err) {
                if (err) {
                    console.log('SQL ERROR:', err);
                    reject(err);
                } else {
                    console.log('SQL SUCCESS - Changes made:', this.changes);
                    console.log('LastID:', this.lastID);
                    
                    // Verify the update by checking what's actually in the database
                    db.get(
                        'SELECT formatted_address, number, street FROM saved_locations WHERE place_id = ?',
                        [placeId],
                        (selectErr, row) => {
                            if (selectErr) {
                                console.log('VERIFICATION SELECT ERROR:', selectErr);
                            } else {
                                console.log('POST-UPDATE DATABASE STATE:');
                                console.log('Database formatted_address:', row ? row.formatted_address : 'NOT FOUND');
                                console.log('Database number:', row ? row.number : 'NOT FOUND');
                                console.log('Database street:', row ? row.street : 'NOT FOUND');
                            }
                        }
                    );
                    
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
    
    console.log(`🗑️ Starting location deletion for: ${placeId}`);
    
    // Step 1: Delete all photos for this location first
    let photoResult = null;
    try {
        const { deleteAllLocationPhotos } = await import('./photoService.js');
        photoResult = await deleteAllLocationPhotos(placeId);
        console.log(`📸 Photo deletion result:`, photoResult);
    } catch (photoError) {
        console.error(`⚠️ Photo deletion failed for location ${placeId}, proceeding with location deletion:`, photoError);
        // Continue with location deletion even if photos fail
        photoResult = { 
            success: false, 
            error: photoError.message,
            deletedCount: 0,
            errorCount: 0
        };
    }
    
    // Step 2: Proceed with location deletion
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
                                console.log(`✅ Location ${placeId} deleted successfully`);
                                resolve({
                                    success: true,
                                    changes: this.changes,
                                    message: 'Location deleted successfully',
                                    photoResult: photoResult // Include photo deletion results
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
    
    const query = `
        SELECT 
            sl.*,
            u.username as creator_username,
            u.email as creator_email
        FROM saved_locations sl
        LEFT JOIN users u ON sl.created_by = u.id
        ORDER BY sl.created_date DESC
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
 * Update location permanent status
 * @param {number} locationId - The location ID
 * @param {boolean} isPermanent - Whether the location should be permanent
 * @returns {Promise<Object>} Result object with changes count
 */
async function updateLocationPermanentStatus(locationId, isPermanent) {

    console.log(`updateLocationPermanentStatus ${locationId} to ${isPermanent}`);

    const query = `
        UPDATE saved_locations 
        SET is_permanent = ?, updated_date = datetime('now') 
        WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
        db.run(query, [isPermanent ? 1 : 0, locationId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes, lastID: this.lastID });
            }
        });
    });
}

/**
 * Update location admin notes
 * @param {number} locationId - The location ID
 * @param {string|null} adminNotes - The admin notes to set
 * @returns {Promise<Object>} Result object with changes count
 */
async function updateLocationAdminNotes(locationId, adminNotes) {
    const query = `
        UPDATE saved_locations 
        SET admin_notes = ?, updated_date = datetime('now') 
        WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
        db.run(query, [adminNotes, locationId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes, lastID: this.lastID });
            }
        });
    });
}

export {
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
    getLocationsWithCreators,
    updateLocationPermanentStatus,
    updateLocationAdminNotes
};
