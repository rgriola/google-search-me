/**
 * Admin Service
 * Handles admin-specific business logic and operations
 */

import bcrypt from 'bcryptjs';
import { getDatabase } from '../config/database.js';
import { validateEmail, validatePassword } from '../middleware/validation.js';

/**
 * Get all users with admin details
 */
const getAllUsers = () => {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        db.all(
            `SELECT 
                id, username, email, first_name, last_name, 
                email_verified, is_active, is_admin, 
                created_at, updated_at
            FROM users 
            ORDER BY created_at DESC`,
            [],
            (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const users = rows.map(user => ({
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        emailVerified: Boolean(user.email_verified),
                        isActive: Boolean(user.is_active),
                        isAdmin: Boolean(user.is_admin),
                        createdAt: user.created_at,
                        updatedAt: user.updated_at
                    }));
                    resolve(users);
                }
            }
        );
    });
};

/**
 * Get user details with saved locations
 */
const getUserDetails = (userId) => {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        
        // Get user info
        db.get(
            `SELECT 
                id, username, email, first_name, last_name, 
                email_verified, is_active, is_admin, 
                created_at, updated_at
            FROM users 
            WHERE id = ?`,
            [userId],
            (err, user) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (!user) {
                    reject(new Error('User not found'));
                    return;
                }
                
                // Get user's saved locations
                db.all(
                    `SELECT 
                        sl.place_id,
                        sl.name,
                        sl.address,
                        sl.lat,
                        sl.lng,
                        sl.rating,
                        sl.website,
                        sl.photo_url,
                        us.saved_at
                    FROM saved_locations sl
                    JOIN user_saves us ON sl.place_id = us.place_id
                    WHERE us.user_id = ?
                    ORDER BY us.saved_at DESC`,
                    [userId],
                    (err, locations) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({
                                user: {
                                    id: user.id,
                                    username: user.username,
                                    email: user.email,
                                    firstName: user.first_name,
                                    lastName: user.last_name,
                                    emailVerified: Boolean(user.email_verified),
                                    isActive: Boolean(user.is_active),
                                    isAdmin: Boolean(user.is_admin),
                                    createdAt: user.created_at,
                                    updatedAt: user.updated_at
                                },
                                savedLocations: locations
                            });
                        }
                    }
                );
            }
        );
    });
};

/**
 * Update user information (admin operation)
 */
const updateUser = async (userId, updateData) => {
    const db = getDatabase();
    const { firstName, lastName, email, isActive, isAdmin, emailVerified } = updateData;
    
    // Check if user exists
    const existingUser = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM users WHERE id = ?', [userId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    
    if (!existingUser) {
        throw new Error('User not found');
    }
    
    // Check if email already exists for another user
    if (email) {
        const emailUser = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (emailUser) {
            throw new Error('Email already in use by another user');
        }
        
        // Validate email if provided
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            throw new Error(emailValidation.error);
        }
    }
    
    // Build update query
    const updateFields = [];
    const params = [];
    
    if (firstName !== undefined) {
        updateFields.push('first_name = ?');
        params.push(firstName || null);
    }
    
    if (lastName !== undefined) {
        updateFields.push('last_name = ?');
        params.push(lastName || null);
    }
    
    if (email !== undefined) {
        updateFields.push('email = ?');
        params.push(email);
    }
    
    if (isActive !== undefined) {
        updateFields.push('is_active = ?');
        params.push(isActive ? 1 : 0);
    }
    
    if (isAdmin !== undefined) {
        updateFields.push('is_admin = ?');
        params.push(isAdmin ? 1 : 0);
    }
    
    if (emailVerified !== undefined) {
        updateFields.push('email_verified = ?');
        params.push(emailVerified ? 1 : 0);
    }
    
    // Always update the updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // If nothing to update, throw error
    if (params.length === 0) {
        throw new Error('No fields to update');
    }
    
    // Append user ID to params
    params.push(userId);
    
    // Update user
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            params,
            function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            }
        );
    });
};

/**
 * Delete user (admin operation)
 * DELETES USER AND USER SAVED LOCATIONS
 */
const deleteUser = async (userId) => {
    const db = getDatabase();
    
    // Check if user exists
    const existingUser = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM users WHERE id = ?', [userId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    
    if (!existingUser) {
        throw new Error('User not found');
    }
    
    // DELETES USER AND USER SAVED LOCATIONS
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            // Delete user's saved locations references
            db.run('DELETE FROM user_saves WHERE user_id = ?', [userId], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                }
                
                // Delete the user
                db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                    }
                    
                    db.run('COMMIT');
                    resolve(this.changes);
                });
            });
        });
    });
};

/**
 * Reset user password (admin operation)
 */
const resetUserPassword = async (userId, newPassword) => {
    const db = getDatabase();
    
    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '));
    }
    
    // Check if user exists
    const existingUser = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM users WHERE id = ?', [userId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    
    if (!existingUser) {
        throw new Error('User not found');
    }
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user's password
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [passwordHash, userId],
            function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            }
        );
    });
};

/**
 * Get all locations for admin management
 */
const getAllLocations = () => {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        db.all(
            `SELECT 
                place_id, name, address, lat, lng, 
                rating, website, photo_url, saved_count,
                created_at, updated_at
            FROM saved_locations 
            ORDER BY saved_count DESC, created_at DESC`,
            [],
            (err, locations) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(locations);
                }
            }
        );
    });
};

/**
 * Delete location (admin operation)
 */
const deleteLocation = (placeId) => {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            // Delete all user saves for this location
            db.run('DELETE FROM user_saves WHERE place_id = ?', [placeId], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                }
                
                // Delete the location
                db.run('DELETE FROM saved_locations WHERE place_id = ?', [placeId], function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                    }
                    
                    if (this.changes === 0) {
                        db.run('ROLLBACK');
                        reject(new Error('Location not found'));
                        return;
                    }
                    
                    db.run('COMMIT');
                    resolve(this.changes);
                });
            });
        });
    });
};

/**
 * Get system statistics
 */
const getSystemStats = () => {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        
        // Get total users count
        db.get('SELECT COUNT(*) as totalUsers FROM users', [], (err, userCount) => {
            if (err) {
                reject(err);
                return;
            }
            
            // Get admin users count
            db.get('SELECT COUNT(*) as adminUsers FROM users WHERE is_admin = 1', [], (err, adminCount) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Get total locations count
                db.get('SELECT COUNT(*) as totalLocations FROM saved_locations', [], (err, locationCount) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    // Get REAL active sessions count (not based on updated_at)
                    db.get(`
                        SELECT COUNT(*) as activeSessions 
                        FROM user_sessions 
                        WHERE is_active = 1 
                        AND expires_at > datetime('now')
                    `, [], (err, sessionCount) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        
                        const stats = {
                            totalUsers: userCount.totalUsers,
                            adminUsers: adminCount.adminUsers,
                            totalLocations: locationCount.totalLocations,
                            activeSessions: sessionCount.activeSessions
                        };
                        
                        console.log('📊 Real-time system stats:', stats);
                        resolve(stats);
                    });
                });
            });
        });
    });
};

/**
 * Update user role (promote/demote admin)
 */
const updateUserRole = async (userId, action) => {
    const db = getDatabase();
    
    // Check if user exists
    const existingUser = await new Promise((resolve, reject) => {
        db.get('SELECT id, is_admin FROM users WHERE id = ?', [userId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    
    if (!existingUser) {
        throw new Error('User not found');
    }
    
    // Determine new admin status
    const newAdminStatus = action === 'promote' ? 1 : 0;
    
    // Update user's admin status
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE users SET is_admin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newAdminStatus, userId],
            function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            }
        );
    });
};

/**
 * Get system health information
 */
const getSystemHealth = () => {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        
        // Basic health check - verify database connectivity
        db.get('SELECT 1 as test', [], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    database: 'connected',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    version: process.version
                });
            }
        });
    });
};

/**
 * Change user active status (admin operation)
 */
const changeUserStatus = async (userId, action) => {
    const db = getDatabase();
    
    // Validate action
    if (!['activate', 'deactivate'].includes(action)) {
        throw new Error('Invalid action. Must be "activate" or "deactivate"');
    }
    
    const isActive = action === 'activate';
    
    // Check if user exists
    const existingUser = await new Promise((resolve, reject) => {
        db.get('SELECT id, username, is_active FROM users WHERE id = ?', [userId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
    
    if (!existingUser) {
        throw new Error('User not found');
    }
    
    // Check if user is already in the requested state
    if (!!existingUser.is_active === isActive) {
        console.log(`User ${userId} is already ${isActive ? 'active' : 'inactive'}, no change needed`);
        return {
            userId: existingUser.id,
            username: existingUser.username,
            isActive: !!existingUser.is_active,
            message: `User is already ${isActive ? 'active' : 'inactive'}`,
            changed: false
        };
    }
    
    // Update user status
    return new Promise((resolve, reject) => {
        console.log(`🔄 Executing SQL: UPDATE users SET is_active = ${isActive ? 1 : 0} WHERE id = ${userId}`);
        
        db.run(`
            UPDATE users 
            SET is_active = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [isActive ? 1 : 0, userId], function(err) {
            if (err) {
                console.error(`❌ Error ${action}ing user:`, err);
                reject(err);
                return;
            }
            
            console.log(`📊 SQL Update Result: ${this.changes} rows changed`);
            
            if (this.changes === 0) {
                console.warn(`⚠️ No rows were updated for user ${userId} - user may not exist`);
                reject(new Error('No user was updated'));
                return;
            }
            
            console.log(`✅ User ${userId} ${action}d successfully - ${this.changes} row(s) affected`);
            
            // Verify the update by checking the user's current status
            db.get('SELECT id, username, is_active FROM users WHERE id = ?', [userId], (verifyErr, verifyRow) => {
                if (verifyErr) {
                    console.error('⚠️ Error verifying user update:', verifyErr);
                } else if (verifyRow) {
                    console.log(`🔍 Verification: User ${userId} is_active = ${verifyRow.is_active} (expected: ${isActive ? 1 : 0})`);
                } else {
                    console.warn(`⚠️ User ${userId} not found during verification`);
                }
            });
            
            // If deactivating, also invalidate all their sessions
            if (!isActive) {
                // Import session service and invalidate sessions
                const sessionService = require('./sessionService');
                sessionService.invalidateUserSessions(userId).catch(sessionErr => {
                    console.error('⚠️ Failed to invalidate user sessions:', sessionErr);
                });
            }
            
            resolve({
                userId: existingUser.id,
                username: existingUser.username,
                isActive: isActive,
                message: `User ${action}d successfully`,
                changed: true
            });
        });
    });
};

/**
 * Test database connectivity and user table structure (debugging function)
 */
const testUserTable = async () => {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
        // Check table structure
        db.all("PRAGMA table_info(users)", [], (err, columns) => {
            if (err) {
                console.error('❌ Error checking users table structure:', err);
                reject(err);
                return;
            }
            
            console.log('📋 Users table structure:');
            columns.forEach(col => {
                console.log(`   ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'}) ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
            });
            
            // Check if is_active column exists
            const hasIsActive = columns.some(col => col.name === 'is_active');
            if (!hasIsActive) {
                console.error('❌ is_active column not found in users table!');
                reject(new Error('is_active column missing'));
                return;
            }
            
            // Count total users
            db.get("SELECT COUNT(*) as count FROM users", [], (countErr, countResult) => {
                if (countErr) {
                    console.error('❌ Error counting users:', countErr);
                    reject(countErr);
                    return;
                }
                
                console.log(`👥 Total users in database: ${countResult.count}`);
                
                // Show first few users with their status
                db.all("SELECT id, username, is_active FROM users LIMIT 5", [], (usersErr, users) => {
                    if (usersErr) {
                        console.error('❌ Error fetching sample users:', usersErr);
                        reject(usersErr);
                        return;
                    }
                    
                    console.log('👤 Sample users:');
                    users.forEach(user => {
                        console.log(`   User ${user.id}: ${user.username} - is_active: ${user.is_active}`);
                    });
                    
                    resolve({ tableOk: true, userCount: countResult.count, sampleUsers: users });
                });
            });
        });
    });
};

export {
    getAllUsers,
    getUserDetails,
    updateUser,
    deleteUser,
    resetUserPassword,
    getAllLocations,
    deleteLocation,
    getSystemStats,
    updateUserRole,
    getSystemHealth,
    changeUserStatus,
    testUserTable
};
