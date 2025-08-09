/**
 * PostgreSQL Database Configuration for Render
 * This replaces SQLite for production deployments
 */

import pkg from 'pg';
const { Pool } = pkg;

let pool = null;

/**
 * Initialize PostgreSQL connection
 */
export function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // Use Render's PostgreSQL connection string
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        console.log('✅ Connected to PostgreSQL database');
        createTables()
            .then(() => resolve(pool))
            .catch(reject);
    });
}

/**
 * Create database tables if they don't exist
 */
async function createTables() {
    const client = await pool.connect();
    
    try {
        // Users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                is_admin BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                email_verified BOOLEAN DEFAULT FALSE,
                verification_token TEXT,
                verification_expires TIMESTAMP,
                password_reset_token TEXT,
                password_reset_expires TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Saved locations table
        await client.query(`
            CREATE TABLE IF NOT EXISTS saved_locations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                lat DECIMAL(10, 8) NOT NULL,
                lng DECIMAL(11, 8) NOT NULL,
                formatted_address TEXT,
                production_notes TEXT,
                type VARCHAR(50),
                entry_point VARCHAR(100),
                parking VARCHAR(100),
                access VARCHAR(100),
                street VARCHAR(255),
                number VARCHAR(50),
                city VARCHAR(255),
                state VARCHAR(100),
                zipcode VARCHAR(20),
                created_by INTEGER REFERENCES users(id),
                created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                place_id VARCHAR(255) UNIQUE,
                is_permanent BOOLEAN DEFAULT FALSE,
                admin_notes TEXT
            )
        `);
        
        // Location photos table
        await client.query(`
            CREATE TABLE IF NOT EXISTS location_photos (
                id SERIAL PRIMARY KEY,
                place_id VARCHAR(255) NOT NULL,
                imagekit_file_id VARCHAR(255) NOT NULL,
                imagekit_file_path TEXT NOT NULL,
                imagekit_url TEXT NOT NULL,
                original_filename VARCHAR(255),
                file_size INTEGER,
                mime_type VARCHAR(100),
                width INTEGER,
                height INTEGER,
                caption TEXT,
                is_primary BOOLEAN DEFAULT FALSE,
                uploaded_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // User saves table
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_saves (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                place_id VARCHAR(255) NOT NULL,
                saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, place_id)
            )
        `);
        
        // User sessions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(255) UNIQUE NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                ip_address INET,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT TRUE
            )
        `);
        
        console.log('✅ PostgreSQL tables created successfully');
        
    } catch (error) {
        console.error('❌ Error creating PostgreSQL tables:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Get database connection
 */
export function getDatabase() {
    if (!pool) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return pool;
}

/**
 * Close database connection
 */
export function closeDatabase() {
    if (pool) {
        return pool.end();
    }
    return Promise.resolve();
}
