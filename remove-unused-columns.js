#!/usr/bin/env node

/**
 * Remove Unused Columns Migration
 * Removes redundant photo-related and admin columns from saved_locations table
 * 
 * Columns to Remove:
 * - admin_notes (minimal usage, admin-only)
 * - imagekit_file_id (redundant with location_photos table)
 * - photo_uploaded_at (redundant with location_photos table)
 * - original_filename (redundant with location_photos table)
 * - photo_uploaded_by (redundant with location_photos table)
 * - imagekit_file_path (redundant with location_photos table)
 * - photo_urls (redundant with location_photos table)
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'server/locations.db');

function removeUnusedColumns() {
    const db = new sqlite3.Database(dbPath);
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            console.log('🔧 Starting removal of unused columns from saved_locations table...');
            
            // Begin transaction
            db.run('BEGIN TRANSACTION', (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                console.log('📊 Creating new table with clean schema...');
                
                // Step 1: Create new table with only the columns we want to keep
                const createNewTableSQL = `
                    CREATE TABLE saved_locations_clean (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        lat REAL NOT NULL,
                        lng REAL NOT NULL,
                        formatted_address TEXT,
                        production_notes TEXT CHECK(length(production_notes) <= 200),
                        type TEXT NOT NULL CHECK(type IN (
                          'broll', 'interview', 'live anchor', 'live reporter', 'stakeout',
                          'headquarters', 'bureau', 'office'
                        )),
                        entry_point TEXT CHECK(entry_point IN ('front door', 'backdoor', 'garage', 'parking lot')),
                        parking TEXT CHECK(parking IN ('street', 'driveway', 'garage')),
                        access TEXT CHECK(access IN ('ramp', 'stairs only', 'doorway', 'garage')),
                        street TEXT,
                        number TEXT,
                        city TEXT,
                        state TEXT CHECK(length(state) <= 2),
                        zipcode TEXT CHECK(length(zipcode) <= 5),
                        created_by INTEGER NOT NULL,
                        created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        place_id TEXT UNIQUE NOT NULL,
                        is_permanent BOOLEAN DEFAULT FALSE,
                        
                        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
                    )
                `;
                
                db.run(createNewTableSQL, (err) => {
                    if (err) {
                        console.error('❌ Error creating new table:', err);
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                    }
                    
                    console.log('✅ New clean table created');
                    
                    // Step 2: Copy data from old table to new table (excluding unwanted columns)
                    const copyDataSQL = `
                        INSERT INTO saved_locations_clean (
                            id, name, lat, lng, formatted_address, production_notes, type,
                            entry_point, parking, access, street, number, city, state, zipcode,
                            created_by, created_date, updated_date, place_id, is_permanent
                        )
                        SELECT 
                            id, name, lat, lng, formatted_address, production_notes, type,
                            entry_point, parking, access, street, number, city, state, zipcode,
                            created_by, created_date, updated_date, place_id, is_permanent
                        FROM saved_locations
                    `;
                    
                    db.run(copyDataSQL, function(err) {
                        if (err) {
                            console.error('❌ Error copying data:', err);
                            db.run('ROLLBACK');
                            reject(err);
                            return;
                        }
                        
                        console.log(`✅ Copied ${this.changes} rows to clean table`);
                        
                        // Step 3: Drop old table
                        db.run('DROP TABLE saved_locations', (err) => {
                            if (err) {
                                console.error('❌ Error dropping old table:', err);
                                db.run('ROLLBACK');
                                reject(err);
                                return;
                            }
                            
                            console.log('✅ Dropped old table');
                            
                            // Step 4: Rename new table to original name
                            db.run('ALTER TABLE saved_locations_clean RENAME TO saved_locations', (err) => {
                                if (err) {
                                    console.error('❌ Error renaming table:', err);
                                    db.run('ROLLBACK');
                                    reject(err);
                                    return;
                                }
                                
                                console.log('✅ Renamed clean table to saved_locations');
                                
                                // Step 5: Recreate indexes
                                const recreateIndexes = [
                                    'CREATE INDEX idx_saved_locations_created_by ON saved_locations(created_by)',
                                    'CREATE INDEX idx_saved_locations_place_id ON saved_locations(place_id)',
                                    'CREATE INDEX idx_saved_locations_permanent ON saved_locations(is_permanent)',
                                    'CREATE INDEX idx_saved_locations_type ON saved_locations(type)'
                                ];
                                
                                let indexCount = 0;
                                recreateIndexes.forEach((indexSQL, index) => {
                                    db.run(indexSQL, (err) => {
                                        if (err) {
                                            console.error(`❌ Error creating index ${index + 1}:`, err);
                                            db.run('ROLLBACK');
                                            reject(err);
                                            return;
                                        }
                                        
                                        indexCount++;
                                        if (indexCount === recreateIndexes.length) {
                                            console.log('✅ Recreated all indexes');
                                            
                                            // Step 6: Recreate trigger
                                            const createTriggerSQL = `
                                                CREATE TRIGGER update_saved_locations_updated_date 
                                                AFTER UPDATE ON saved_locations
                                                FOR EACH ROW
                                                BEGIN
                                                    UPDATE saved_locations SET updated_date = CURRENT_TIMESTAMP WHERE id = NEW.id;
                                                END
                                            `;
                                            
                                            db.run(createTriggerSQL, (err) => {
                                                if (err) {
                                                    console.error('❌ Error creating trigger:', err);
                                                    db.run('ROLLBACK');
                                                    reject(err);
                                                    return;
                                                }
                                                
                                                console.log('✅ Recreated trigger');
                                                
                                                // Commit transaction
                                                db.run('COMMIT', (err) => {
                                                    if (err) {
                                                        console.error('❌ Error committing transaction:', err);
                                                        reject(err);
                                                        return;
                                                    }
                                                    
                                                    console.log('🎉 Migration completed successfully!');
                                                    
                                                    // Verify the new schema
                                                    db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='saved_locations'", (err, row) => {
                                                        if (err) {
                                                            console.error('❌ Error verifying schema:', err);
                                                        } else {
                                                            console.log('\n📋 New schema:');
                                                            console.log(row.sql);
                                                        }
                                                        
                                                        db.close((err) => {
                                                            if (err) {
                                                                reject(err);
                                                            } else {
                                                                resolve();
                                                            }
                                                        });
                                                    });
                                                });
                                            });
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

// Run the migration
removeUnusedColumns()
    .then(() => {
        console.log('✅ Migration completed successfully!');
        console.log('\n🗑️ Removed columns:');
        console.log('   - admin_notes');
        console.log('   - imagekit_file_id');
        console.log('   - photo_uploaded_at');
        console.log('   - original_filename');
        console.log('   - photo_uploaded_by');
        console.log('   - imagekit_file_path');
        console.log('   - photo_urls');
        console.log('\n✅ Photo functionality now handled exclusively by location_photos table');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
