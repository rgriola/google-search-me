/**
 * Database Configuration and Setup
 * Handles SQLite database connection and table creation
 */

import sqlite3 from 'sqlite3';
import { config } from './environment.js';

const { verbose } = sqlite3;

let db = null;

/**
 * Initialize database connection
 */
export function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db = new (verbose().Database)(config.DB_PATH, (err) => {
            if (err) {
                console.error('❌ Error opening database:', err.message);
                reject(err);
            } else {
                console.log('✅ Connected to SQLite database:', config.DB_PATH);
                createTables()
                    .then(() => resolve(db))
                    .catch(reject);
            }
        });
    });
}

/**
 * Create database tables if they don't exist
 */
function createTables() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Users table
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    first_name TEXT,
                    last_name TEXT,
                    is_admin BOOLEAN DEFAULT FALSE,
                    is_active BOOLEAN DEFAULT TRUE,
                    email_verified BOOLEAN DEFAULT FALSE,
                    verification_token TEXT,
                    reset_token TEXT,
                    reset_token_expires DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('❌ Error creating users table:', err.message);
                    reject(err);
                    return;
                }
                console.log('✅ Users table ready');
            });

            // Saved locations table
            db.run(`
                CREATE TABLE IF NOT EXISTS saved_locations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    place_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    address TEXT,
                    lat REAL,
                    lng REAL,
                    rating REAL,
                    website TEXT,
                    photo_url TEXT,
                    types TEXT,
                    saved_count INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('❌ Error creating saved_locations table:', err.message);
                    reject(err);
                    return;
                }
                console.log('✅ Saved locations table ready');
            });

            // User saves (many-to-many relationship)
            db.run(`
                CREATE TABLE IF NOT EXISTS user_saves (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    place_id TEXT NOT NULL,
                    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (place_id) REFERENCES saved_locations (place_id),
                    UNIQUE(user_id, place_id)
                )
            `, (err) => {
                if (err) {
                    console.error('❌ Error creating user_saves table:', err.message);
                    reject(err);
                    return;
                }
                console.log('✅ User saves table ready');
                
                // User sessions table for session tracking and security
                db.run(`
                    CREATE TABLE IF NOT EXISTS user_sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        session_token TEXT UNIQUE NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
                        expires_at DATETIME NOT NULL,
                        user_agent TEXT,
                        ip_address TEXT,
                        is_active BOOLEAN DEFAULT 1,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                `, (err) => {
                    if (err) {
                        console.error('❌ Error creating user_sessions table:', err.message);
                        reject(err);
                        return;
                    }
                    console.log('✅ User sessions table ready');
                    resolve();
                });
            });
        });
    });
}

/**
 * Get database instance
 */
export function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}

/**
 * Close database connection
 */
export function closeDatabase() {
    return new Promise((resolve) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                } else {
                    console.log('✅ Database connection closed');
                }
                resolve();
            });
        } else {
            resolve();
        }
    });
}

/**
 * Database utility functions
 */
export const dbUtils = {
    /**
     * Run a query with promise wrapper
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes, lastID: this.lastID });
                }
            });
        });
    },

    /**
     * Get a single row
     */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    /**
     * Get multiple rows
     */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                    }
            });
        });
    }
};

/*
 * Database Schema Improvement Note:
 * 
 * Current: is_active stored as INTEGER (1/0) or BOOLEAN
 * Future consideration: Store as TEXT ('Y'/'N') for direct display
 * 
 * Benefits of Y/N storage:
 * - No translation needed between database and UI
 * - Copy/paste friendly for manual database operations
 * - More readable in database queries and exports
 * - Consistent with user expectation of Yes/No answers
 * 
 * Migration would involve:
 * 1. ALTER TABLE users ADD COLUMN active_status TEXT DEFAULT 'Y'
 * 2. UPDATE users SET active_status = CASE WHEN is_active = 1 THEN 'Y' ELSE 'N' END
 * 3. Update all queries to use active_status instead of is_active
 * 4. DROP COLUMN is_active after testing
 */

export default { initializeDatabase, getDatabase, closeDatabase, dbUtils };
