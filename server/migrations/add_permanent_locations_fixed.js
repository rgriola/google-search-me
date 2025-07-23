import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting permanent locations migration...');

function runMigration() {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, '../locations.db');
    const db = new sqlite3.Database(dbPath);
    
    console.log('📂 Connected to database:', dbPath);
    
    // Start transaction
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('❌ Error starting transaction:', err.message);
        return reject(err);
      }
      console.log('🔄 Started transaction');
      
      // 1. Create new table with proper schema (based on actual schema)
      const createNewTableSQL = `
        CREATE TABLE saved_locations_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          address TEXT NOT NULL,
          notes TEXT,
          type TEXT DEFAULT 'broll' CHECK (type IN ('broll', 'interview', 'live anchor', 'live reporter', 'stakeout', 'headquarters', 'bureau', 'office')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_permanent BOOLEAN DEFAULT FALSE,
          admin_notes TEXT
        )
      `;
      
      db.run(createNewTableSQL, (err) => {
        if (err) {
          console.error('❌ Error creating new table:', err.message);
          db.run('ROLLBACK');
          return reject(err);
        }
        console.log('✅ Created new table structure');
        
        // 2. Copy data from old table
        const copyDataSQL = `
          INSERT INTO saved_locations_new (id, latitude, longitude, address, notes, type, created_at, is_permanent, admin_notes)
          SELECT 
            id, 
            latitude, 
            longitude, 
            address, 
            notes, 
            type, 
            created_at, 
            FALSE,
            NULL
          FROM saved_locations
        `;
        
        db.run(copyDataSQL, function(err) {
          if (err) {
            console.error('❌ Error copying data:', err.message);
            db.run('ROLLBACK');
            return reject(err);
          }
          console.log(`✅ Copied ${this.changes} records to new table`);
          
          // 3. Drop old table
          db.run('DROP TABLE saved_locations', (err) => {
            if (err) {
              console.error('❌ Error dropping old table:', err.message);
              db.run('ROLLBACK');
              return reject(err);
            }
            console.log('🗑️ Dropped old table');
            
            // 4. Rename new table
            db.run('ALTER TABLE saved_locations_new RENAME TO saved_locations', (err) => {
              if (err) {
                console.error('❌ Error renaming table:', err.message);
                db.run('ROLLBACK');
                return reject(err);
              }
              console.log('📛 Renamed table');
              
              // 5. Create index for performance
              db.run(`
                CREATE INDEX IF NOT EXISTS idx_saved_locations_permanent 
                ON saved_locations(is_permanent)
              `, (err) => {
                if (err) {
                  console.error('❌ Error creating index:', err.message);
                  db.run('ROLLBACK');
                  return reject(err);
                }
                console.log('🔍 Created permanent locations index');
                
                // 6. Commit transaction
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('❌ Error committing transaction:', err.message);
                    return reject(err);
                  }
                  console.log('✅ Migration completed successfully');
                  
                  // 7. Verify the changes
                  db.get(`
                    SELECT 
                      COUNT(*) as total, 
                      SUM(CASE WHEN is_permanent = 1 THEN 1 ELSE 0 END) as permanent
                    FROM saved_locations
                  `, (err, row) => {
                    if (err) {
                      console.error('❌ Error verifying migration:', err.message);
                    } else {
                      console.log(`📊 Verification: ${row.total} total locations, ${row.permanent} permanent`);
                    }
                    
                    // Show schema
                    db.all(`PRAGMA table_info(saved_locations)`, (err, columns) => {
                      if (err) {
                        console.error('❌ Error getting schema:', err.message);
                      } else {
                        console.log('🏗️ New table schema:');
                        columns.forEach(col => {
                          console.log(`   ${col.name}: ${col.type}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}`);
                        });
                      }
                      
                      db.close();
                      resolve();
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

// Command line interface
if (process.argv[2] === 'migrate') {
  runMigration()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
} else {
  console.log('Usage: node add_permanent_locations_fixed.js migrate');
}
