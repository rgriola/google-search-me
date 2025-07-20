/**
 * Migration: Update saved_locations table structure
 * - Reorder columns to match specification
 * - Add missing columns with proper types
 * - Ensure proper constraints and defaults
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../locations.db');

async function updateSavedLocationsTable() {
    const db = new Database(dbPath);
    
    try {
        console.log('🔄 Starting saved_locations table restructure...');
        
        // Begin transaction
        db.exec('BEGIN TRANSACTION');
        
        // Step 1: Create new table with correct column order and structure
        const createNewTableSQL = `
            CREATE TABLE saved_locations_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                formatted_address TEXT,
                production_notes TEXT CHECK(length(production_notes) <= 200),
                type TEXT NOT NULL CHECK(type IN ('broll', 'interview', 'live anchor', 'live reporter', 'stakeout')),
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
                
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        
        db.exec(createNewTableSQL);
        console.log('✅ Created new table structure');
        
        // Step 2: Migrate existing data to new table
        const migrateDataSQL = `
            INSERT INTO saved_locations_new (
                id, name, lat, lng, formatted_address, production_notes, type,
                entry_point, parking, access, street, number, city, state, zipcode,
                created_by, created_date, updated_date, place_id
            )
            SELECT 
                id,
                COALESCE(name, COALESCE(street || ' ' || city, 'Unknown Location')) as name,
                lat,
                lng,
                COALESCE(address, '') as formatted_address,
                COALESCE(description, '') as production_notes,
                CASE 
                    WHEN type IN ('broll', 'interview', 'live anchor', 'live reporter', 'stakeout') THEN type
                    ELSE 'interview'
                END as type,
                CASE 
                    WHEN entry_point IN ('front door', 'backdoor', 'garage', 'parking lot') THEN entry_point
                    ELSE 'front door'
                END as entry_point,
                CASE 
                    WHEN parking IN ('street', 'driveway', 'garage') THEN parking
                    ELSE 'street'
                END as parking,
                CASE 
                    WHEN access IN ('ramp', 'stairs only', 'doorway', 'garage') THEN access
                    ELSE 'doorway'
                END as access,
                COALESCE(street, '') as street,
                COALESCE(number, '') as number,
                COALESCE(city, '') as city,
                COALESCE(SUBSTR(state, 1, 2), '') as state,
                COALESCE(SUBSTR(zipcode, 1, 5), '') as zipcode,
                COALESCE(created_by, user_id, 1) as created_by,
                COALESCE(created_at, CURRENT_TIMESTAMP) as created_date,
                COALESCE(updated_at, CURRENT_TIMESTAMP) as updated_date,
                place_id
            FROM saved_locations
        `;
        
        db.exec(migrateDataSQL);
        console.log('✅ Migrated existing data');
        
        // Step 3: Drop old table and rename new table
        db.exec('DROP TABLE saved_locations');
        db.exec('ALTER TABLE saved_locations_new RENAME TO saved_locations');
        console.log('✅ Replaced old table with new structure');
        
        // Step 4: Create indexes for better performance
        db.exec('CREATE INDEX idx_saved_locations_created_by ON saved_locations(created_by)');
        db.exec('CREATE INDEX idx_saved_locations_type ON saved_locations(type)');
        db.exec('CREATE INDEX idx_saved_locations_place_id ON saved_locations(place_id)');
        console.log('✅ Created performance indexes');
        
        // Step 5: Create trigger to auto-update updated_date
        const createTriggerSQL = `
            CREATE TRIGGER update_saved_locations_updated_date 
            AFTER UPDATE ON saved_locations
            FOR EACH ROW
            BEGIN
                UPDATE saved_locations SET updated_date = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END
        `;
        
        db.exec(createTriggerSQL);
        console.log('✅ Created auto-update trigger for updated_date');
        
        // Commit transaction
        db.exec('COMMIT');
        console.log('🎉 saved_locations table restructure completed successfully!');
        
        // Display new structure
        const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='saved_locations'").get();
        console.log('\n📋 New table structure:');
        console.log(schema.sql);
        
    } catch (error) {
        console.error('❌ Error updating saved_locations table:', error);
        db.exec('ROLLBACK');
        throw error;
    } finally {
        db.close();
    }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    updateSavedLocationsTable()
        .then(() => {
            console.log('✅ Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

export { updateSavedLocationsTable };
