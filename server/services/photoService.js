/**
 * ImageKit Service
 * Handles all photo-related operations for saved locations
 */

import { getImageKit, uploadImage, deleteImage, getOptimizedImageUrl, IMAGE_PRESETS } from '../config/imagekit.js';
import { getDatabase } from '../config/database.js';

/**
 * Upload photo for a location
 * @param {Object} params - Upload parameters
 * @param {Buffer} params.fileBuffer - File buffer
 * @param {String} params.originalFilename - Original filename
 * @param {String} params.placeId - Place ID
 * @param {Number} params.userId - User ID (optional)
 * @param {String} params.caption - Photo caption (optional)
 * @returns {Promise<Object>} Upload result
 */
export async function uploadLocationPhoto({ fileBuffer, originalFilename, placeId, userId = null, caption = null }) {
    const db = getDatabase();
    
    try {
        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${placeId}_${timestamp}_${sanitizedFilename}`;
        
        // Upload to ImageKit
        const uploadResult = await uploadImage(
            fileBuffer,
            fileName,
            'locations',
            [placeId, 'user-upload']
        );
        
        // Save to database
        const photoData = {
            place_id: placeId,
            user_id: userId,
            imagekit_file_id: uploadResult.fileId,
            imagekit_file_path: uploadResult.filePath,
            original_filename: originalFilename,
            file_size: uploadResult.size,
            mime_type: uploadResult.fileType,
            width: uploadResult.width,
            height: uploadResult.height,
            caption: caption
        };
        
        const photoId = await savePhotoToDatabase(photoData);
        
        // Update primary photo if this is the first photo for this location
        await updatePrimaryPhotoIfNeeded(placeId, photoId);
        
        return {
            success: true,
            photoId,
            imagekit: uploadResult,
            urls: generatePhotoUrls(uploadResult.filePath)
        };
        
    } catch (error) {
        console.error('❌ Photo upload failed:', error);
        throw new Error(`Photo upload failed: ${error.message}`);
    }
}

/**
 * Save photo data to database
 */
async function savePhotoToDatabase(photoData) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO location_photos (
                place_id, user_id, imagekit_file_id, imagekit_file_path,
                original_filename, file_size, mime_type, width, height, caption
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            photoData.place_id,
            photoData.user_id,
            photoData.imagekit_file_id,
            photoData.imagekit_file_path,
            photoData.original_filename,
            photoData.file_size,
            photoData.mime_type,
            photoData.width,
            photoData.height,
            photoData.caption
        ];
        
        db.run(sql, params, function(err) {
            if (err) {
                console.error('❌ Database save failed:', err);
                reject(err);
                return;
            }
            
            console.log('✅ Photo saved to database:', this.lastID);
            resolve(this.lastID);
        });
    });
}

/**
 * Update primary photo if this is the first photo
 */
async function updatePrimaryPhotoIfNeeded(placeId, photoId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        // Check if this location has any primary photos
        db.get(
            'SELECT COUNT(*) as count FROM location_photos WHERE place_id = ? AND is_primary = 1',
            [placeId],
            (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // If no primary photo exists, make this one primary
                if (row.count === 0) {
                    db.run(
                        'UPDATE location_photos SET is_primary = 1 WHERE id = ?',
                        [photoId],
                        (err) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            console.log('✅ Set as primary photo:', photoId);
                            resolve();
                        }
                    );
                } else {
                    resolve();
                }
            }
        );
    });
}

/**
 * Generate optimized photo URLs for different use cases
 */
function generatePhotoUrls(filePath) {
    return {
        thumbnail: getOptimizedImageUrl(filePath, IMAGE_PRESETS.thumbnail),
        card: getOptimizedImageUrl(filePath, IMAGE_PRESETS.card),
        large: getOptimizedImageUrl(filePath, IMAGE_PRESETS.large),
        mobile: getOptimizedImageUrl(filePath, IMAGE_PRESETS.mobile),
        original: getOptimizedImageUrl(filePath, {})
    };
}

/**
 * Get all photos for a location
 * @param {String} placeId - Place ID
 * @returns {Promise<Array>} Array of photo objects with URLs
 */
export async function getLocationPhotos(placeId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                lp.*,
                u.username as uploaded_by_username
            FROM location_photos lp
            LEFT JOIN users u ON lp.user_id = u.id
            WHERE lp.place_id = ?
            ORDER BY lp.is_primary DESC, lp.uploaded_at DESC
        `;
        
        db.all(sql, [placeId], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            const photos = rows.map(photo => ({
                ...photo,
                urls: generatePhotoUrls(photo.imagekit_file_path)
            }));
            
            resolve(photos);
        });
    });
}

/**
 * Delete a photo
 * @param {Number} photoId - Photo ID
 * @param {Number} userId - User ID (for permission check)
 * @returns {Promise<Object>} Delete result
 */
export async function deleteLocationPhoto(photoId, userId = null) {
    const db = getDatabase();
    
    try {
        // Get photo details
        const photo = await getPhotoById(photoId);
        if (!photo) {
            throw new Error('Photo not found');
        }
        
        // Check permissions (user can only delete their own photos, or admin can delete any)
        if (userId && photo.user_id !== userId) {
            throw new Error('Permission denied');
        }
        
        // Delete from ImageKit
        await deleteImage(photo.imagekit_file_id);
        
        // Delete from database
        await deletePhotoFromDatabase(photoId);
        
        // If this was the primary photo, set another photo as primary
        if (photo.is_primary) {
            await setNewPrimaryPhoto(photo.place_id);
        }
        
        return { success: true, message: 'Photo deleted successfully' };
        
    } catch (error) {
        console.error('❌ Photo deletion failed:', error);
        throw error;
    }
}

/**
 * Get photo by ID
 */
async function getPhotoById(photoId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM location_photos WHERE id = ?',
            [photoId],
            (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row);
            }
        );
    });
}

/**
 * Delete photo from database
 */
async function deletePhotoFromDatabase(photoId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        db.run(
            'DELETE FROM location_photos WHERE id = ?',
            [photoId],
            (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            }
        );
    });
}

/**
 * Set a new primary photo when the current primary is deleted
 */
async function setNewPrimaryPhoto(placeId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT id FROM location_photos WHERE place_id = ? ORDER BY uploaded_at DESC LIMIT 1',
            [placeId],
            (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (row) {
                    db.run(
                        'UPDATE location_photos SET is_primary = 1 WHERE id = ?',
                        [row.id],
                        (err) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve();
                        }
                    );
                } else {
                    resolve(); // No more photos for this location
                }
            }
        );
    });
}

/**
 * Set a photo as primary
 * @param {Number} photoId - Photo ID
 * @param {String} placeId - Place ID
 * @returns {Promise<Object>} Result
 */
export async function setPrimaryPhoto(photoId, placeId) {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Remove primary flag from all photos of this location
            db.run(
                'UPDATE location_photos SET is_primary = 0 WHERE place_id = ?',
                [placeId],
                (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    // Set the specified photo as primary
                    db.run(
                        'UPDATE location_photos SET is_primary = 1 WHERE id = ? AND place_id = ?',
                        [photoId, placeId],
                        (err) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve({ success: true, message: 'Primary photo updated' });
                        }
                    );
                }
            );
        });
    });
}
