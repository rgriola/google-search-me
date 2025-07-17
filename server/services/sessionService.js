/**
 * Session Service
 * Handles user session management, tracking, and cleanup
 */

import { getDatabase } from '../config/database.js';
import crypto from 'crypto';

// Get database instance once at module level
const db = getDatabase();

// Session configuration
const SESSION_CONFIG = {
    // Default session timeout: 24 hours
    DEFAULT_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    
    // Extended session timeout for "remember me": 30 days
    EXTENDED_TIMEOUT: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    
    // Cleanup interval: run every hour
    CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour in milliseconds
};

/**
 * Create a new session for a user
 */
const createSession = async (userId, userAgent = null, ipAddress = null, rememberMe = false) => {
    return new Promise((resolve, reject) => {
        // Generate a secure session token
        const sessionToken = crypto.randomBytes(32).toString('hex');
        
        // Calculate expiration time
        const timeout = rememberMe ? SESSION_CONFIG.EXTENDED_TIMEOUT : SESSION_CONFIG.DEFAULT_TIMEOUT;
        const expiresAt = new Date(Date.now() + timeout).toISOString();
        
        console.log(`🔐 Creating session for user ${userId}, expires: ${expiresAt}`);
        
        db.run(`
            INSERT INTO user_sessions (user_id, session_token, expires_at, user_agent, ip_address)
            VALUES (?, ?, ?, ?, ?)
        `, [userId, sessionToken, expiresAt, userAgent, ipAddress], function(err) {
            if (err) {
                console.error('❌ Error creating session:', err);
                reject(err);
                return;
            }
            
            console.log(`✅ Session created with ID: ${this.lastID}`);
            resolve({
                sessionId: this.lastID,
                sessionToken,
                expiresAt,
                userId
            });
        });
    });
};

/**
 * Validate and refresh a session
 */
const validateSession = async (sessionToken) => {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT s.*, u.username, u.email, u.first_name, u.last_name, u.is_admin
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = ? 
            AND s.is_active = 1 
            AND s.expires_at > datetime('now')
        `, [sessionToken], (err, session) => {
            if (err) {
                console.error('❌ Error validating session:', err);
                reject(err);
                return;
            }
            
            if (!session) {
                console.log('🚫 Invalid or expired session');
                resolve(null);
                return;
            }
            
            // Update last accessed time
            db.run(`
                UPDATE user_sessions 
                SET last_accessed = datetime('now')
                WHERE session_token = ?
            `, [sessionToken], (updateErr) => {
                if (updateErr) {
                    console.error('⚠️ Error updating session access time:', updateErr);
                }
            });
            
            console.log(`✅ Valid session for user: ${session.username}`);
            resolve({
                userId: session.user_id,
                username: session.username,
                email: session.email,
                firstName: session.first_name,
                lastName: session.last_name,
                isAdmin: !!session.is_admin,
                sessionId: session.id,
                lastAccessed: session.last_accessed,
                expiresAt: session.expires_at
            });
        });
    });
};

/**
 * Invalidate a specific session
 */
const invalidateSession = async (sessionToken) => {
    return new Promise((resolve, reject) => {
        
        db.run(`
            UPDATE user_sessions 
            SET is_active = 0 
            WHERE session_token = ?
        `, [sessionToken], function(err) {
            if (err) {
                console.error('❌ Error invalidating session:', err);
                reject(err);
                return;
            }
            
            console.log(`🚫 Session invalidated: ${this.changes} session(s) affected`);
            resolve(this.changes > 0);
        });
    });
};

/**
 * Invalidate all sessions for a user
 */
const invalidateUserSessions = async (userId) => {
    return new Promise((resolve, reject) => {
        db.run(`
            UPDATE user_sessions 
            SET is_active = 0 
            WHERE user_id = ?
        `, [userId], function(err) {
            if (err) {
                console.error('❌ Error invalidating user sessions:', err);
                reject(err);
                return;
            }
            
            console.log(`🚫 All sessions invalidated for user ${userId}: ${this.changes} session(s) affected`);
            resolve(this.changes);
        });
    });
};

/**
 * Get active sessions count
 */
const getActiveSessionsCount = async () => {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT COUNT(*) as count
            FROM user_sessions
            WHERE is_active = 1 
            AND expires_at > datetime('now')
        `, [], (err, result) => {
            if (err) {
                console.error('❌ Error getting active sessions count:', err);
                reject(err);
                return;
            }
            
            resolve(result.count);
        });
    });
};

/**
 * Get all active sessions for admin panel
 */
const getActiveSessions = async () => {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                s.id,
                s.user_id,
                u.username,
                u.email,
                s.created_at,
                s.last_accessed,
                s.expires_at,
                s.user_agent,
                s.ip_address
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.is_active = 1 
            AND s.expires_at > datetime('now')
            ORDER BY s.last_accessed DESC
        `, [], (err, sessions) => {
            if (err) {
                console.error('❌ Error getting active sessions:', err);
                reject(err);
                return;
            }
            
            resolve(sessions);
        });
    });
};

/**
 * Get active sessions for a specific user
 */
const getUserActiveSessions = (userId) => {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT id, session_token, expires_at, created_at, last_accessed 
             FROM user_sessions 
             WHERE user_id = ? AND is_active = 1 AND expires_at > datetime('now')
             ORDER BY last_accessed DESC`,
            [userId],
            (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            }
        );
    });
};

/**
 * Clean up expired sessions
 */
const cleanupExpiredSessions = async () => {
    return new Promise((resolve, reject) => {
        db.run(`
            DELETE FROM user_sessions
            WHERE expires_at < datetime('now')
            OR is_active = 0
        `, [], function(err) {
            if (err) {
                console.error('❌ Error cleaning up expired sessions:', err);
                reject(err);
                return;
            }
            
            if (this.changes > 0) {
                console.log(`🧹 Cleaned up ${this.changes} expired/inactive session(s)`);
            }
            resolve(this.changes);
        });
    });
};

/**
 * Start automatic session cleanup
 */
const startSessionCleanup = () => {
    console.log('🕐 Starting automatic session cleanup...');
    
    // Run cleanup immediately
    cleanupExpiredSessions().catch(err => {
        console.error('❌ Initial session cleanup failed:', err);
    });
    
    // Set up periodic cleanup
    setInterval(async () => {
        try {
            await cleanupExpiredSessions();
        } catch (err) {
            console.error('❌ Periodic session cleanup failed:', err);
        }
    }, SESSION_CONFIG.CLEANUP_INTERVAL);
    
    console.log(`✅ Session cleanup scheduled every ${SESSION_CONFIG.CLEANUP_INTERVAL / 1000 / 60} minutes`);
};

export {
    createSession,
    validateSession,
    invalidateSession,
    invalidateUserSessions,
    getActiveSessionsCount,
    getActiveSessions,
    getUserActiveSessions,
    cleanupExpiredSessions,
    startSessionCleanup,
    SESSION_CONFIG
};
