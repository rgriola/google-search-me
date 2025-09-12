/**
 * Migration: Remove Access Field Restrictions
 * Removes CHECK constraints from parking, entry_point, and access columns
 * to allow any text values instead of predefined options
 */

import { initializeDatabase, getDatabase } from '../config/database.js';
import { config } from '../config/environment.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Fix path resolution for when running from server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure we're using the correct database path
console.log('📍 Database path:', config.DB_PATH);
console.log('📁 Current directory:', process.cwd());

async function removeAccessFieldRestrictions() {
    // Initialize database first
    await initializeDatabase();
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        console.log('🔄 Removing restrictions from access fields (parking, entry_point, access)...');
        
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            // Step 1: Create new table without CHECK constraints on access fields
            console.log('📝 Creating new table structure...');
            db.run(`
                CREATE TABLE saved_locations_unrestricted (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    lat REAL NOT NULL,
                    lng REAL NOT NULL,
                    formatted_address TEXT,
                    production_notes TEXT CHECK(length(production_notes) <= 500),
                    type TEXT NOT NULL CHECK(type IN ('broll', 'interview', 'live anchor', 'live reporter', 'stakeout', 'headquarters', 'bureau', 'office')),
                    entry_point TEXT,
                    parking TEXT,
                    access TEXT,
                    street TEXT,
                    number TEXT,
                    city TEXT,
                    state TEXT CHECK(length(state) <= 2),
                    zipcode TEXT CHECK(length(zipcode) <= 5),
                    created_by INTEGER NOT NULL,
                    created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    place_id TEXT UNIQUE NOT NULL
                )
            `, (err) => {
                if (err) {
                    console.error('❌ Error creating new table:', err);
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                }
                console.log('✅ Created new table structure');
                
                // Step 2: Copy all existing data to new table
                console.log('📋 Copying existing data...');
                db.run(`
                    INSERT INTO saved_locations_unrestricted (
                        id, name, lat, lng, formatted_address, production_notes, type,
                        entry_point, parking, access, street, number, city, state, zipcode,
                        created_by, created_date, updated_date, place_id
                    )
                    SELECT 
                        id, name, lat, lng, formatted_address, production_notes, type,
                        entry_point, parking, access, street, number, city, state, zipcode,
                        created_by, created_date, updated_date, place_id
                    FROM saved_locations
                `, (err) => {
                    if (err) {
                        console.error('❌ Error copying data:', err);
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                    }
                    console.log('✅ Data copied successfully');
                    
                    // Step 3: Drop old table and rename new table
                    console.log('🔄 Replacing old table...');
                    db.run('DROP TABLE saved_locations', (err) => {
                        if (err) {
                            console.error('❌ Error dropping old table:', err);
                            db.run('ROLLBACK');
                            reject(err);
                            return;
                        }
                        
                        db.run('ALTER TABLE saved_locations_unrestricted RENAME TO saved_locations', (err) => {
                            if (err) {
                                console.error('❌ Error renaming table:', err);
                                db.run('ROLLBACK');
                                reject(err);
                                return;
                            }
                            console.log('✅ Table replaced successfully');
                            
                            // Step 4: Recreate indexes
                            console.log('🔍 Creating indexes...');
                            db.run('CREATE INDEX idx_saved_locations_created_by ON saved_locations(created_by)', (err) => {
                                if (err) {
                                    console.error('❌ Error creating created_by index:', err);
                                    db.run('ROLLBACK');
                                    reject(err);
                                    return;
                                }
                                
                                db.run('CREATE INDEX idx_saved_locations_type ON saved_locations(type)', (err) => {
                                    if (err) {
                                        console.error('❌ Error creating type index:', err);
                                        db.run('ROLLBACK');
                                        reject(err);
                                        return;
                                    }
                                    
                                    db.run('CREATE INDEX idx_saved_locations_place_id ON saved_locations(place_id)', (err) => {
                                        if (err) {
                                            console.error('❌ Error creating place_id index:', err);
                                            db.run('ROLLBACK');
                                            reject(err);
                                            return;
                                        }
                                        console.log('✅ Indexes created successfully');
                                        
                                        // Step 5: Recreate the updated_date trigger
                                        console.log('⚡ Creating updated_date trigger...');
                                        db.run(`
                                            CREATE TRIGGER update_saved_locations_updated_date 
                                            AFTER UPDATE ON saved_locations
                                            FOR EACH ROW
                                            BEGIN
                                                UPDATE saved_locations SET updated_date = CURRENT_TIMESTAMP WHERE id = NEW.id;
                                            END
                                        `, (err) => {
                                            if (err) {
                                                console.error('❌ Error creating trigger:', err);
                                                db.run('ROLLBACK');
                                                reject(err);
                                                return;
                                            }
                                            console.log('✅ Trigger created successfully');
                                            
                                            // Commit transaction
                                            db.run('COMMIT', (err) => {
                                                if (err) {
                                                    console.error('❌ Error committing transaction:', err);
                                                    reject(err);
                                                } else {
                                                    console.log('🎉 Migration completed successfully!');
                                                    console.log('📌 Access fields (parking, entry_point, access) now accept any text values');
                                                    resolve();
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
        });
    });
}

// Export the migration function
export { removeAccessFieldRestrictions };

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    removeAccessFieldRestrictions()
        .then(() => {
            console.log('✅ Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}
