/**
 * Migration: Add GPS Permission to Users Table
 * Adds GPS permission tracking to user profiles
 */

import { initializeDatabase, getDatabase } from '../config/database.js';

async function addGpsPermissionToUsers() {
    // Initialize database first
    await initializeDatabase();
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        console.log('🔄 Adding GPS permission columns to users table...');
        
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            // Step 1: Add GPS permission column
            db.run(`
                ALTER TABLE users ADD COLUMN gps_permission TEXT DEFAULT 'not_asked'
            `, (err) => {
                if (err) {
                    if (err.message.includes('duplicate column')) {
                        console.log('ℹ️ gps_permission column already exists');
                    } else {
                        console.error('❌ Error adding gps_permission column:', err);
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                    }
                } else {
                    console.log('✅ Added gps_permission column');
                }
                
                // Step 2: Add GPS permission updated timestamp
                db.run(`
                    ALTER TABLE users ADD COLUMN gps_permission_updated DATETIME
                `, (err) => {
                    if (err) {
                        if (err.message.includes('duplicate column')) {
                            console.log('ℹ️ gps_permission_updated column already exists');
                        } else {
                            console.error('❌ Error adding gps_permission_updated column:', err);
                            db.run('ROLLBACK');
                            reject(err);
                            return;
                        }
                    } else {
                        console.log('✅ Added gps_permission_updated column');
                    }
                    
                    // Step 3: Set GPS permission to 'granted' for rodczaro@gmail.com
                    db.run(`
                        UPDATE users 
                        SET gps_permission = 'granted', 
                            gps_permission_updated = CURRENT_TIMESTAMP 
                        WHERE email = 'rodczaro@gmail.com'
                    `, function(err) {
                        if (err) {
                            console.error('❌ Error updating user GPS permission:', err);
                            db.run('ROLLBACK');
                            reject(err);
                            return;
                        }
                        
                        console.log(`✅ Set GPS permission to "granted" for rodczaro@gmail.com (${this.changes} rows updated)`);
                        
                        // Commit transaction
                        db.run('COMMIT', (err) => {
                            if (err) {
                                console.error('❌ Error committing transaction:', err);
                                reject(err);
                                return;
                            }
                            
                            console.log('🎉 GPS permission migration completed successfully!');
                            
                            // Verify the changes
                            db.get("SELECT email, gps_permission, gps_permission_updated FROM users WHERE email = 'rodczaro@gmail.com'", (err, userCheck) => {
                                if (err) {
                                    console.error('❌ Error verifying changes:', err);
                                } else if (userCheck) {
                                    console.log('📋 User GPS permission status:');
                                    console.log(`   Email: ${userCheck.email}`);
                                    console.log(`   GPS Permission: ${userCheck.gps_permission}`);
                                    console.log(`   Updated: ${userCheck.gps_permission_updated}`);
                                } else {
                                    console.log('⚠️ User rodczaro@gmail.com not found in database');
                                }
                                
                                resolve();
                            });
                        });
                    });
                });
            });
        });
    });
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    addGpsPermissionToUsers()
        .then(() => {
            console.log('✅ Migration completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

export { addGpsPermissionToUsers };
