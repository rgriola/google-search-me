#!/usr/bin/env node

/**
 * Database Migration: Add Permanent Locations Support
 * ES Module compatible migration script
 */

import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const { verbose } = sqlite3;

// Database path
const DB_PATH = join(__dirname, '../../locations.db');

/**
 * Add permanent location support to the database
 */
function migratePermanentLocationSupport() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting permanent locations migration...');
    
    const db = new (verbose().Database)(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Database connection error:', err.message);
        return reject(err);
      }
      
      db.serialize(() => {
        // Begin transaction
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) {
            console.error('❌ Transaction begin error:', err.message);
            return reject(err);
          }
        });
        
        // 1. Add is_permanent column
        db.run('ALTER TABLE saved_locations ADD COLUMN is_permanent BOOLEAN DEFAULT FALSE', (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('❌ Error adding is_permanent column:', err.message);
            db.run('ROLLBACK');
            return reject(err);
          }
          console.log('✅ Added is_permanent column');
        });
        
        // 2. Add admin_notes column
        db.run('ALTER TABLE saved_locations ADD COLUMN admin_notes TEXT', (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('❌ Error adding admin_notes column:', err.message);
            db.run('ROLLBACK');
            return reject(err);
          }
          console.log('✅ Added admin_notes column');
        });
        
        // 3. Create new table with updated CHECK constraint
        console.log('🔄 Updating table schema with new location types...');
        
        db.run(`
          CREATE TABLE saved_locations_new (
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
            admin_notes TEXT
          )
        `, (err) => {
          if (err) {
            console.error('❌ Error creating new table:', err.message);
            db.run('ROLLBACK');
            return reject(err);
          }
          
          // 4. Copy data from old table to new table
          db.run(`
            INSERT INTO saved_locations_new (
              id, name, lat, lng, formatted_address, production_notes, type,
              entry_point, parking, access, street, number, city, state, zipcode,
              created_by, created_date, updated_date, place_id, is_permanent, admin_notes
            )
            SELECT 
              id, name, lat, lng, formatted_address, production_notes, type,
              entry_point, parking, access, street, number, city, state, zipcode,
              created_by, created_date, updated_date, place_id,
              COALESCE(is_permanent, 0) as is_permanent,
              admin_notes
            FROM saved_locations
          `, (err) => {
            if (err) {
              console.error('❌ Error copying data:', err.message);
              db.run('ROLLBACK');
              return reject(err);
            }
            
            // 5. Drop old table and rename new one
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
                
                // 6. Recreate indexes
                db.run('CREATE INDEX idx_saved_locations_created_by ON saved_locations(created_by)');
                db.run('CREATE INDEX idx_saved_locations_type ON saved_locations(type)');
                db.run('CREATE INDEX idx_saved_locations_place_id ON saved_locations(place_id)');
                db.run('CREATE INDEX idx_saved_locations_permanent ON saved_locations(is_permanent)');
                
                // 7. Recreate trigger
                db.run(`
                  CREATE TRIGGER update_saved_locations_updated_date 
                  AFTER UPDATE ON saved_locations
                  FOR EACH ROW
                  BEGIN
                      UPDATE saved_locations SET updated_date = CURRENT_TIMESTAMP WHERE id = NEW.id;
                  END
                `, (err) => {
                  if (err) {
                    console.error('❌ Error creating trigger:', err.message);
                    db.run('ROLLBACK');
                    return reject(err);
                  }
                  
                  console.log('✅ Updated table schema with new location types');
                  
                  // 8. Mark existing headquarters/bureau locations as permanent
                  db.run(`
                    UPDATE saved_locations 
                    SET is_permanent = 1 
                    WHERE LOWER(type) IN ('headquarters', 'bureau', 'office')
                  `, function(err) {
                    if (err) {
                      console.error('❌ Error updating permanent status:', err.message);
                      db.run('ROLLBACK');
                      return reject(err);
                    }
                    
                    console.log(`✅ Marked ${this.changes} existing locations as permanent`);
                    
                    // Commit transaction
                    db.run('COMMIT', (err) => {
                      if (err) {
                        console.error('❌ Error committing transaction:', err.message);
                        return reject(err);
                      }
                      
                      console.log('✅ Migration completed successfully');
                      
                      // Verify the changes
                      db.get(`
                        SELECT COUNT(*) as total, 
                               SUM(CASE WHEN is_permanent = 1 THEN 1 ELSE 0 END) as permanent
                        FROM saved_locations
                      `, (err, row) => {
                        if (err) {
                          console.error('❌ Error verifying migration:', err.message);
                        } else {
                          console.log(`📊 Verification: ${row.total} total locations, ${row.permanent} permanent`);
                        }
                        
                        db.close();
                        resolve(true);
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

/**
 * Rollback migration (creates backup without new columns)
 */
function rollbackPermanentLocationSupport() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Rolling back permanent locations migration...');
    
    const db = new (verbose().Database)(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Database connection error:', err.message);
        return reject(err);
      }
      
      db.serialize(() => {
        // Create table without permanent location columns
        db.run(`
          CREATE TABLE saved_locations_rollback (
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
            place_id TEXT UNIQUE NOT NULL
          )
        `, (err) => {
          if (err) {
            console.error('❌ Error creating rollback table:', err.message);
            return reject(err);
          }
          
          // Copy data (excluding permanent location data and new types)
          db.run(`
            INSERT INTO saved_locations_rollback (
              id, name, lat, lng, formatted_address, production_notes, type,
              entry_point, parking, access, street, number, city, state, zipcode,
              created_by, created_date, updated_date, place_id
            )
            SELECT 
              id, name, lat, lng, formatted_address, production_notes, type,
              entry_point, parking, access, street, number, city, state, zipcode,
              created_by, created_date, updated_date, place_id
            FROM saved_locations
            WHERE type NOT IN ('headquarters', 'bureau', 'office')
          `, (err) => {
            if (err) {
              console.error('❌ Error copying data for rollback:', err.message);
              return reject(err);
            }
            
            // Replace tables
            db.run('DROP TABLE saved_locations', (err) => {
              if (err) {
                console.error('❌ Error dropping table:', err.message);
                return reject(err);
              }
              
              db.run('ALTER TABLE saved_locations_rollback RENAME TO saved_locations', (err) => {
                if (err) {
                  console.error('❌ Error renaming rollback table:', err.message);
                  return reject(err);
                }
                
                // Recreate original indexes and trigger
                db.run('CREATE INDEX idx_saved_locations_created_by ON saved_locations(created_by)');
                db.run('CREATE INDEX idx_saved_locations_type ON saved_locations(type)');
                db.run('CREATE INDEX idx_saved_locations_place_id ON saved_locations(place_id)');
                db.run(`
                  CREATE TRIGGER update_saved_locations_updated_date 
                  AFTER UPDATE ON saved_locations
                  FOR EACH ROW
                  BEGIN
                      UPDATE saved_locations SET updated_date = CURRENT_TIMESTAMP WHERE id = NEW.id;
                  END
                `, (err) => {
                  if (err) {
                    console.error('❌ Error creating trigger for rollback:', err.message);
                    return reject(err);
                  }
                  
                  console.log('✅ Rollback completed successfully');
                  db.close();
                  resolve(true);
                });
              });
            });
          });
        });
      });
    });
  });
}

// Command line execution
const command = process.argv[2];

if (command === 'migrate') {
  migratePermanentLocationSupport()
    .then(success => {
      console.log(`Migration ${success ? 'completed successfully' : 'failed'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Migration error:', error);
      process.exit(1);
    });
} else if (command === 'rollback') {
  rollbackPermanentLocationSupport()
    .then(success => {
      console.log(`Rollback ${success ? 'completed successfully' : 'failed'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Rollback error:', error);
      process.exit(1);
    });
} else {
  console.log(`
Usage:
  node migrate-permanent-locations.mjs migrate   - Apply the migration
  node migrate-permanent-locations.mjs rollback  - Rollback the migration
  `);
  process.exit(1);
}

export { migratePermanentLocationSupport, rollbackPermanentLocationSupport };
