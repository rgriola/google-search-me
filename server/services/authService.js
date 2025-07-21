/**
 * Authentication Service Module
 * Handles user authentication, registration, and password management
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/environment.js';
import { getDatabase } from '../config/database.js';
import * as sessionService from './sessionService.js';

// Get database instance once at module level
const db = getDatabase();

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function generateToken(user) {
    const payload = {
        id: user.id,
        userId: user.id, // Keep for backward compatibility
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin || false,
        emailVerified: user.email_verified || false
    };
    
    return jwt.sign(payload, config.JWT_SECRET, { 
        expiresIn: config.JWT_EXPIRY || '24h' 
    });
}

/**
 * Hash password with bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Password verification result
 */
async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

/**
 * Generate simple user ID for backward compatibility
 * @returns {string} Simple user ID
 */
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Create a new user in the database
 * @param {Object} userData - User data object
 * @returns {Promise<Object>} Created user object
 */
async function createUser(userData) {
    const { username, email, password, firstName, lastName } = userData;
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO users (username, email, password_hash, first_name, last_name, verification_token, verification_token_expires) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, email, passwordHash, firstName || null, lastName || null, verificationToken, verificationTokenExpires.toISOString()],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        username,
                        email,
                        firstName,
                        lastName,
                        verificationToken,
                        isActive: false,
                        emailVerified: false,
                        isAdmin: false
                    });
                }
            }
        );
    });
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
async function findUserByEmail(email) {
    
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM users WHERE email = ?',
            [email],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            }
        );
    });
}

/**
 * Find user by username
 * @param {string} username - Username
 * @returns {Promise<Object|null>} User object or null
 */
async function findUserByUsername(username) {
    
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM users WHERE username = ?',
            [username],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            }
        );
    });
}

/**
 * Find user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object|null>} User object or null
 */
async function findUserById(id) {
    
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM users WHERE id = ?',
            [id],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            }
        );
    });
}

/**
 * Check if username or email already exists
 * @param {string} username - Username to check
 * @param {string} email - Email to check
 * @returns {Promise<Object>} Existence check result
 */
async function checkUserExists(username, email) {
    
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
            [username, email],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        exists: !!row,
                        user: row
                    });
                }
            }
        );
    });
}

/**
 * Authenticate user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} userAgent - User agent string
 * @param {string} ipAddress - IP address
 * @param {boolean} rememberMe - Whether to create extended session
 * @returns {Promise<Object>} Authentication result
 */
async function authenticateUser(email, password, userAgent = null, ipAddress = null, rememberMe = false) {
    const user = await findUserByEmail(email);
    
    if (!user) {
        return { success: false, error: 'Invalid email or password' };
    }
    
    if (!user.is_active) {
        return { success: false, error: 'Account is deactivated' };
    }
    
    const passwordMatch = await verifyPassword(password, user.password_hash);
    
    if (!passwordMatch) {
        return { success: false, error: 'Invalid email or password' };
    }
    
    try {
        // SECURITY: Invalidate all existing sessions for this user before creating a new one
        // This ensures only one active session per user at a time
        await sessionService.invalidateUserSessions(user.id);
        console.log(`🔒 Invalidated all existing sessions for user ${user.email}`);
        
        // Create a new session for the user
        const sessionData = await sessionService.createSession(user.id, userAgent, ipAddress, rememberMe);
        
        // Generate JWT token (keeping for compatibility, but session is primary)
        const token = generateToken(user);
        
        console.log(`✅ User ${user.email} authenticated successfully with session ${sessionData.sessionId}`);
        
        return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                emailVerified: user.email_verified,
                isAdmin: user.is_admin
            },
            token,
            session: {
                sessionId: sessionData.sessionId,
                sessionToken: sessionData.sessionToken,
                expiresAt: sessionData.expiresAt
            }
        };
    } catch (sessionError) {
        console.error('❌ Error creating session:', sessionError);
        // Fall back to just JWT if session creation fails
        const token = generateToken(user);
        
        return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                emailVerified: user.email_verified,
                isAdmin: user.is_admin
            },
            token,
            session: null
        };
    }
}

/**
 * Update user password
 * @param {number} userId - User ID
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} Update success status
 */
async function updateUserPassword(userId, newPassword) {
    const passwordHash = await hashPassword(newPassword);
    
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [passwordHash, userId],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            }
        );
    });
}

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated user object
 */
async function updateUserProfile(userId, profileData) {
    const { firstName, lastName, email } = profileData;
    
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE users SET first_name = ?, last_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [firstName, lastName, email, userId],
            function(err) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    reject(new Error('User not found'));
                } else {
                    // Return updated user
                    findUserById(userId).then(resolve).catch(reject);
                }
            }
        );
    });
}

/**
 * Set password reset token for user
 * @param {string} email - User email
 * @returns {Promise<Object>} Reset token data
 */
async function setPasswordResetToken(email) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour
    
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
            [resetToken, resetTokenExpires.toISOString(), email],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        resetToken,
                        resetTokenExpires,
                        userUpdated: this.changes > 0
                    });
                }
            }
        );
    });
}

/**
 * Verify password reset token
 * @param {string} token - Reset token
 * @returns {Promise<Object|null>} User object or null
 */
async function verifyPasswordResetToken(token) {
    
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?',
            [token, new Date().toISOString()],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            }
        );
    });
}

/**
 * Clear password reset token
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function clearPasswordResetToken(userId) {
    
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [userId],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            }
        );
    });
}

/**
 * Verify email with verification token
 * @param {string} token - Verification token
 * @returns {Promise<Object>} Verification result
 */
async function verifyEmailToken(token) {
    
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM users WHERE verification_token = ? AND verification_token_expires > ?',
            [token, new Date().toISOString()],
            (err, row) => {
                if (err) {
                    reject(err);
                } else if (!row) {
                    resolve({ success: false, error: 'Invalid or expired verification token' });
                } else {
                    // Mark email as verified and clear verification token
                    db.run(
                        'UPDATE users SET email_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
                        [row.id],
                        function(updateErr) {
                            if (updateErr) {
                                reject(updateErr);
                            } else {
                                resolve({
                                    success: true,
                                    user: row
                                });
                            }
                        }
                    );
                }
            }
        );
    });
}

/**
 * Generate new email verification token
 * @param {number} userId - User ID
 * @returns {Promise<string>} New verification token
 */
async function generateNewVerificationToken(userId) {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
            [verificationToken, verificationTokenExpires.toISOString(), userId],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(verificationToken);
                }
            }
        );
    });
}

/**
 * Update user GPS permission status
 * @param {number} userId - User ID
 * @param {string} permission - GPS permission status ('granted', 'denied', 'not_asked')
 * @returns {Promise<boolean>} Success status
 */
async function updateUserGPSPermission(userId, permission) {
    const validPermissions = ['granted', 'denied', 'not_asked'];
    
    if (!validPermissions.includes(permission)) {
        throw new Error('Invalid GPS permission status');
    }
    
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE users SET gps_permission = ?, gps_permission_updated = CURRENT_TIMESTAMP WHERE id = ?',
            [permission, userId],
            function(err) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    reject(new Error('User not found'));
                } else {
                    resolve(true);
                }
            }
        );
    });
}

/**
 * Get user GPS permission status
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} GPS permission info or null
 */
async function getUserGPSPermission(userId) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT gps_permission, gps_permission_updated FROM users WHERE id = ?',
            [userId],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            }
        );
    });
}

export {
    generateToken,
    hashPassword,
    verifyPassword,
    generateUserId,
    createUser,
    findUserByEmail,
    findUserByUsername,
    findUserById,
    checkUserExists,
    authenticateUser,
    updateUserPassword,
    updateUserProfile,
    setPasswordResetToken,
    verifyPasswordResetToken,
    clearPasswordResetToken,
    verifyEmailToken,
    generateNewVerificationToken,
    updateUserGPSPermission,
    getUserGPSPermission
};
