/**
 * Database Migration: Add Photo Support
 * Adds photo-related columns to support ImageKit integration
 */

import { getDatabase } from '../config/database.js';

/**
 * Add photo support to saved_locations table
 */
export async function addPhotoSupport() {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            console.log('🔄 Starting photo support migration...');
            
            // Check if columns already exist
            db.get("PRAGMA table_info(saved_locations)", (err, rows) => {
                if (err) {
                    console.error('❌ Error checking table structure:', err);
                    reject(err);
                    return;
                }
                
                // Add new photo-related columns
                const migrations = [
                    // ImageKit file ID for uploaded photos
                    `ALTER TABLE saved_locations ADD COLUMN imagekit_file_id TEXT`,
                    
                    // ImageKit file path for URL generation
                    `ALTER TABLE saved_locations ADD COLUMN imagekit_file_path TEXT`,
                    
                    // Multiple photo URLs (JSON array for future expansion)
                    `ALTER TABLE saved_locations ADD COLUMN photo_urls TEXT DEFAULT '[]'`,
                    
                    // User who uploaded the photo
                    `ALTER TABLE saved_locations ADD COLUMN photo_uploaded_by INTEGER`,
                    
                    // Photo upload timestamp
                    `ALTER TABLE saved_locations ADD COLUMN photo_uploaded_at DATETIME`,
                    
                    // Original filename
                    `ALTER TABLE saved_locations ADD COLUMN original_filename TEXT`
                ];
                
                let completed = 0;
                const total = migrations.length;
                
                migrations.forEach((migration, index) => {
                    db.run(migration, (err) => {
                        if (err && !err.message.includes('duplicate column name')) {
                            console.error(`❌ Migration ${index + 1} failed:`, err.message);
                            reject(err);
                            return;
                        }
                        
                        completed++;
                        console.log(`✅ Migration ${index + 1}/${total} completed`);
                        
                        if (completed === total) {
                            console.log('✅ Photo support migration completed successfully');
                            resolve();
                        }
                    });
                });
            });
        });
    });
}

/**
 * Create location_photos table for multiple photos per location
 */
export async function createLocationPhotosTable() {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS location_photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                place_id TEXT NOT NULL,
                user_id INTEGER,
                imagekit_file_id TEXT UNIQUE NOT NULL,
                imagekit_file_path TEXT NOT NULL,
                original_filename TEXT,
                file_size INTEGER,
                mime_type TEXT,
                width INTEGER,
                height INTEGER,
                is_primary BOOLEAN DEFAULT FALSE,
                caption TEXT,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (place_id) REFERENCES saved_locations (place_id),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `, (err) => {
            if (err) {
                console.error('❌ Error creating location_photos table:', err.message);
                reject(err);
                return;
            }
            console.log('✅ Location photos table created successfully');
            resolve();
        });
    });
}

/**
 * Run all photo-related migrations
 */
export async function runPhotoMigrations() {
    try {
        await addPhotoSupport();
        await createLocationPhotosTable();
        console.log('🎉 All photo migrations completed successfully');
    } catch (error) {
        console.error('❌ Photo migration failed:', error);
        throw error;
    }
}
