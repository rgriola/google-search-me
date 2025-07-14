/**
 * Migration: Add news/media specific fields to saved_locations table
 * Date: 2025-07-13
 */

import sqlite3 from 'sqlite3';
import { config } from '../config/environment.js';

const { verbose } = sqlite3;

/**
 * Run the migration to add new columns
 */
export async function runMigration() {
    return new Promise((resolve, reject) => {
        const db = new (verbose().Database)(config.DB_PATH, (err) => {
            if (err) {
                console.error('❌ Error opening database for migration:', err.message);
                reject(err);
                return;
            }

            console.log('📋 Starting migration: Add location types and metadata...');

            db.serialize(() => {
                // Add new columns to saved_locations table
                const migrations = [
                    {
                        sql: `ALTER TABLE saved_locations ADD COLUMN type TEXT DEFAULT NULL`,
                        description: 'Add type column'
                    },
                    {
                        sql: `ALTER TABLE saved_locations ADD COLUMN entry_point TEXT DEFAULT NULL`,
                        description: 'Add entry_point column'
                    },
                    {
                        sql: `ALTER TABLE saved_locations ADD COLUMN parking TEXT DEFAULT NULL`,
                        description: 'Add parking column'
                    },
                    {
                        sql: `ALTER TABLE saved_locations ADD COLUMN access TEXT DEFAULT NULL`,
                        description: 'Add access column'
                    }
                ];

                let completed = 0;
                const total = migrations.length;

                migrations.forEach((migration, index) => {
                    db.run(migration.sql, (err) => {
                        if (err && !err.message.includes('duplicate column name')) {
                            console.error(`❌ Error in migration ${index + 1} (${migration.description}):`, err.message);
                            if (completed === 0) {
                                db.close();
                                reject(err);
                            }
                            return;
                        }
                        
                        if (err && err.message.includes('duplicate column name')) {
                            console.log(`✅ Column already exists: ${migration.description}`);
                        } else {
                            console.log(`✅ ${migration.description} completed`);
                        }
                        
                        completed++;
                        
                        if (completed === total) {
                            console.log('✅ Migration completed successfully');
                            db.close((closeErr) => {
                                if (closeErr) {
                                    console.error('❌ Error closing database:', closeErr.message);
                                    reject(closeErr);
                                } else {
                                    console.log('📋 Migration database connection closed');
                                    resolve();
                                }
                            });
                        }
                    });
                });
            });
        });
    });
}

/**
 * Rollback the migration (remove added columns)
 */
export async function rollbackMigration() {
    console.log('⚠️  SQLite does not support dropping columns directly.');
    console.log('⚠️  To rollback, you would need to recreate the table without these columns.');
    console.log('⚠️  This is not implemented to prevent data loss.');
    
    return Promise.reject(new Error('Rollback not implemented for SQLite'));
}

// Run migration if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    runMigration()
        .then(() => {
            console.log('🎉 Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}
