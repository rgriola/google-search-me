/**
 * Database Migration: Add Permanent Locations Support
 * Adds columns and functionality for headquarters/bureau locations
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path - adjust as needed
const DB_PATH = path.join(__dirname, '../../locations.db');

/**
 * Migration script to add permanent location support
 */
async function addPermanentLocationSupport() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    console.log('🚀 Starting permanent locations migration...');
    
    // Begin transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // 1. Add is_permanent column
      db.run(`
        ALTER TABLE saved_locations 
        ADD COLUMN is_permanent BOOLEAN DEFAULT FALSE
      `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('❌ Error adding is_permanent column:', err.message);
          db.run('ROLLBACK');
          return reject(err);
        }
        console.log('✅ Added is_permanent column');
      });
      
      // 2. Add admin_notes column
      db.run(`
        ALTER TABLE saved_locations 
        ADD COLUMN admin_notes TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('❌ Error adding admin_notes column:', err.message);
          db.run('ROLLBACK');
          return reject(err);
        }
        console.log('✅ Added admin_notes column');
      });
      
      // 3. Create index for performance
      db.run(`
        CREATE INDEX IF NOT EXISTS idx_saved_locations_permanent 
        ON saved_locations(is_permanent)
      `, (err) => {
        if (err) {
          console.error('❌ Error creating permanent index:', err.message);
          db.run('ROLLBACK');
          return reject(err);
        }
        console.log('✅ Created permanent locations index');
      });
      
      // 4. Update the CHECK constraint to include new permanent types and mark existing locations
      db.run(`
        CREATE TABLE saved_locations_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            formatted_address TEXT,
            production_notes TEXT CHECK(length(production_notes) <= 200),
            type TEXT NOT NULL CHECK(type IN ('broll', 'interview', 'live anchor', 'live reporter', 'stakeout', 'headquarters', 'bureau', 'office')),
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
            admin_notes TEXT
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating new table:', err.message);
          db.run('ROLLBACK');
          return reject(err);
        }
        console.log('✅ Created new table with updated constraints');
        
        // Copy data from old table to new table
        db.run(`
          INSERT INTO saved_locations_new (
            id, name, lat, lng, formatted_address, production_notes, type,
            entry_point, parking, access, street, number, city, state, zipcode,
            created_by, created_date, updated_date, place_id, is_permanent
          )
          SELECT 
            id, name, lat, lng, formatted_address, production_notes, type,
            entry_point, parking, access, street, number, city, state, zipcode,
            created_by, created_date, updated_date, place_id,
            CASE WHEN LOWER(type) IN ('headquarters', 'bureau', 'office') THEN TRUE ELSE FALSE END
          FROM saved_locations
        `, function(err) {
          if (err) {
            console.error('❌ Error copying data:', err.message);
            db.run('ROLLBACK');
            return reject(err);
          }
          console.log(`✅ Copied ${this.changes} records to new table`);
          
          // Drop old table and rename new one
          db.run('DROP TABLE saved_locations', (err) => {
            if (err) {
              console.error('❌ Error dropping old table:', err.message);
              db.run('ROLLBACK');
              return reject(err);
            }
            
            db.run('ALTER TABLE saved_locations_new RENAME TO saved_locations', (err) => {
              if (err) {
                console.error('❌ Error renaming table:', err.message);
                db.run('ROLLBACK');
                return reject(err);
              }
              console.log('✅ Table structure updated successfully');
              
              // Recreate indexes
              db.run('CREATE INDEX idx_saved_locations_created_by ON saved_locations(created_by)', (err) => {
                if (err) console.warn('⚠️ Warning: Could not recreate created_by index');
              });
              
              db.run('CREATE INDEX idx_saved_locations_type ON saved_locations(type)', (err) => {
                if (err) console.warn('⚠️ Warning: Could not recreate type index');
              });
              
              db.run('CREATE INDEX idx_saved_locations_place_id ON saved_locations(place_id)', (err) => {
                if (err) console.warn('⚠️ Warning: Could not recreate place_id index');
              });
              
              // Recreate trigger
              db.run(`
                CREATE TRIGGER update_saved_locations_updated_date 
                AFTER UPDATE ON saved_locations
                FOR EACH ROW
                BEGIN
                    UPDATE saved_locations SET updated_date = CURRENT_TIMESTAMP WHERE id = NEW.id;
                END
              `, (err) => {
                if (err) console.warn('⚠️ Warning: Could not recreate trigger');
              });
              
              // Continue with commit...
              commitTransaction();
            });
          });
        });
      });
      
      // 5. Commit transaction function
      function commitTransaction() {
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('❌ Error committing transaction:', err.message);
            return reject(err);
          }
          console.log('✅ Migration completed successfully');
          
          // Verify the changes
          db.get(`
            SELECT COUNT(*) as total, 
                   SUM(CASE WHEN is_permanent = TRUE THEN 1 ELSE 0 END) as permanent
            FROM saved_locations
          `, (err, row) => {
            if (err) {
              console.error('❌ Error verifying migration:', err.message);
            } else {
              console.log(`📊 Verification: ${row.total} total locations, ${row.permanent} permanent`);
            }
            
            db.close();
            resolve();
          });
        });
      }
    });
  });
}

/**
 * Rollback migration (if needed)
 */
async function rollbackPermanentLocationSupport() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    
    console.log('🔄 Rolling back permanent locations migration...');
    
    db.serialize(() => {
      // Note: SQLite doesn't support DROP COLUMN, so we'll create a new table
      db.run(`
        CREATE TABLE saved_locations_backup AS 
        SELECT id, user_id, place_id, name, formatted_address, address, lat, lng, 
               location_type, production_notes, entry_point, parking, 
               street, number, city, state, zipcode, 
               created_at, updated_at, photo_url
        FROM saved_locations
      `, (err) => {
        if (err) {
          console.error('❌ Error creating backup:', err.message);
          return reject(err);
        }
        
        db.run('DROP TABLE saved_locations', (err) => {
          if (err) {
            console.error('❌ Error dropping table:', err.message);
            return reject(err);
          }
          
          db.run('ALTER TABLE saved_locations_backup RENAME TO saved_locations', (err) => {
            if (err) {
              console.error('❌ Error restoring table:', err.message);
              return reject(err);
            }
            
            console.log('✅ Rollback completed');
            db.close();
            resolve();
          });
        });
      });
    });
  });
}

// Command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  if (command === 'migrate') {
    addPermanentLocationSupport()
      .then(() => {
        console.log('🎉 Permanent locations migration completed successfully!');
        process.exit(0);
      })
      .catch(err => {
        console.error('💥 Migration failed:', err);
        process.exit(1);
      });
  } else if (command === 'rollback') {
    rollbackPermanentLocationSupport()
      .then(() => {
        console.log('🔄 Rollback completed successfully!');
        process.exit(0);
      })
      .catch(err => {
        console.error('💥 Rollback failed:', err);
        process.exit(1);
      });
  } else {
    console.log(`
Usage:
  node add_permanent_locations.js migrate   - Apply the migration
  node add_permanent_locations.js rollback  - Rollback the migration
    `);
    process.exit(1);
  }
}

export {
  addPermanentLocationSupport,
  rollbackPermanentLocationSupport
};
