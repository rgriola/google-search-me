/**
 * MySQL Database Configuration for Render
 * Provides persistent database storage for production deployments
 */

import mysql from 'mysql2/promise';

let pool = null;

/**
 * Initialize MySQL connection pool
 */
export function initializeDatabase() {
    return new Promise((resolve, reject) => {
        try {
            // Create connection pool for better performance
            pool = mysql.createPool({
                host: process.env.MYSQL_HOST,
                port: process.env.MYSQL_PORT || 3306,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DATABASE,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
                timezone: '+00:00'
            });
            
            console.log('✅ Connected to MySQL database');
            console.log(`🔗 Database: ${process.env.MYSQL_DATABASE}`);
            
            createTables()
                .then(() => resolve(pool))
                .catch(reject);
                
        } catch (error) {
            console.error('❌ MySQL connection error:', error);
            reject(error);
        }
    });
}

/**
 * Create database tables if they don't exist
 */
async function createTables() {
    try {
        // Users table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                is_admin BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                email_verified BOOLEAN DEFAULT FALSE,
                verification_token TEXT,
                verification_expires DATETIME,
                password_reset_token TEXT,
                password_reset_expires DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_username (username)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Saved locations table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS saved_locations (
                id INT AUTO_INCREMENT PRIMARY KEY,
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
                created_by INT,
                created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_date DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                place_id VARCHAR(255) UNIQUE,
                is_permanent BOOLEAN DEFAULT FALSE,
                admin_notes TEXT,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_place_id (place_id),
                INDEX idx_created_by (created_by),
                INDEX idx_is_permanent (is_permanent),
                INDEX idx_type (type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Location photos table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS location_photos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                place_id VARCHAR(255) NOT NULL,
                imagekit_file_id VARCHAR(255) NOT NULL,
                imagekit_file_path TEXT NOT NULL,
                imagekit_url TEXT NOT NULL,
                original_filename VARCHAR(255),
                file_size INT,
                mime_type VARCHAR(100),
                width INT,
                height INT,
                caption TEXT,
                is_primary BOOLEAN DEFAULT FALSE,
                uploaded_by INT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_place_id (place_id),
                INDEX idx_uploaded_by (uploaded_by),
                INDEX idx_is_primary (is_primary)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // User saves table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS user_saves (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                place_id VARCHAR(255) NOT NULL,
                saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_place (user_id, place_id),
                INDEX idx_user_id (user_id),
                INDEX idx_place_id (place_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // User sessions table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(255) UNIQUE NOT NULL,
                user_id INT NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_session_id (session_id),
                INDEX idx_user_id (user_id),
                INDEX idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ MySQL tables created successfully');
        console.log('📊 Tables: users, saved_locations, location_photos, user_saves, user_sessions');
        
    } catch (error) {
        console.error('❌ Error creating MySQL tables:', error);
        throw error;
    }
}

/**
 * Get database connection pool
 */
export function getDatabase() {
    if (!pool) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return pool;
}

/**
 * Execute a query with automatic connection handling
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
export async function query(sql, params = []) {
    if (!pool) {
        throw new Error('Database not initialized');
    }
    
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('❌ MySQL query error:', error);
        console.error('🔍 SQL:', sql);
        console.error('🔍 Params:', params);
        throw error;
    }
}

/**
 * Close database connection pool
 */
export async function closeDatabase() {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('✅ MySQL connection pool closed');
    }
}

/**
 * Health check for database connection
 */
export async function healthCheck() {
    try {
        const [rows] = await pool.execute('SELECT 1 as health_check');
        return { status: 'healthy', result: rows[0] };
    } catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
}
