/**
 * Admin Routes
 * Handles all admin-specific endpoints with proper authorization and logging
 */

const express = require('express');
const router = express.Router();

// Import middleware
const { authenticateToken } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimit');
const { 
    requireAdmin, 
    logAdminAction, 
    validateAdminInput, 
    preventSelfModification 
} = require('../middleware/admin');

// Import admin service
const adminService = require('../services/adminService');

// Import session service
const sessionService = require('../services/sessionService');

// Middleware to prevent caching of admin data
const preventCaching = (req, res, next) => {
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    next();
};

// Apply admin rate limiting to all admin routes
router.use(adminLimiter);
router.use(preventCaching);

/**
 * @route GET /api/admin/users
 * @desc Get all users (admin only)
 * @access Admin
 */
router.get('/users', 
    authenticateToken, 
    requireAdmin,
    preventCaching,  // Add cache prevention
    logAdminAction('GET_ALL_USERS'),
    async (req, res) => {
        try {
            console.log('📋 Admin fetching all users');
            const users = await adminService.getAllUsers();
            
            console.log(`📋 Found ${users.length} users`);
            res.json({
                success: true,
                data: users,
                count: users.length
            });
        } catch (error) {
            console.error('❌ Error fetching users:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * @route GET /api/admin/users/:userId
 * @desc Get user details with saved locations (admin only)
 * @access Admin
 */
router.get('/users/:userId', 
    authenticateToken, 
    requireAdmin,
    validateAdminInput(['userId']),
    logAdminAction('GET_USER_DETAILS'),
    async (req, res) => {
        try {
            const { userId } = req.params;
            console.log(`👤 Admin fetching details for user ${userId}`);
            
            const userDetails = await adminService.getUserDetails(userId);
            
            res.json({
                success: true,
                ...userDetails
            });
        } catch (error) {
            console.error('❌ Error fetching user details:', error);
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }
);

/**
 * @route PUT /api/admin/users/:userId
 * @desc Update user information (admin only)
 * @access Admin
 */
router.put('/users/:userId', 
    authenticateToken, 
    requireAdmin,
    validateAdminInput(['userId', 'userFields']),
    logAdminAction('UPDATE_USER'),
    async (req, res) => {
        try {
            const { userId } = req.params;
            const updateData = req.body;
            
            console.log(`✏️ Admin updating user ${userId}:`, updateData);
            
            await adminService.updateUser(userId, updateData);
            
            console.log(`✅ User ${userId} updated successfully`);
            res.json({
                success: true,
                message: 'User updated successfully'
            });
        } catch (error) {
            console.error('❌ Error updating user:', error);
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else if (error.message.includes('Email already in use') || error.message.includes('No fields to update')) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
);

/**
 * @route DELETE /api/admin/users/:userId
 * @desc Delete user (admin only)
 * @access Admin
 */
router.delete('/users/:userId', 
    authenticateToken, 
    requireAdmin,
    validateAdminInput(['userId']),
    preventSelfModification,
    logAdminAction('DELETE_USER'),
    async (req, res) => {
        try {
            const { userId } = req.params;
            
            console.log(`🗑️ Admin deleting user ${userId}`);
            
            await adminService.deleteUser(userId);
            
            console.log(`✅ User ${userId} deleted successfully`);
            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            console.error('❌ Error deleting user:', error);
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
);

/**
 * @route POST /api/admin/users/:userId/reset-password
 * @desc Reset user password (admin only)
 * @access Admin
 */
router.post('/users/:userId/reset-password', 
    authenticateToken, 
    requireAdmin,
    validateAdminInput(['userId']),
    logAdminAction('RESET_USER_PASSWORD'),
    async (req, res) => {
        try {
            const { userId } = req.params;
            const { newPassword } = req.body;
            
            if (!newPassword) {
                return res.status(400).json({ error: 'New password is required' });
            }
            
            console.log(`🔑 Admin resetting password for user ${userId}`);
            
            await adminService.resetUserPassword(userId, newPassword);
            
            console.log(`✅ Password reset for user ${userId}`);
            res.json({
                success: true,
                message: 'User password reset successfully'
            });
        } catch (error) {
            console.error('❌ Error resetting password:', error);
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else if (error.message.includes('Password')) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
);

/**
 * @route PUT /api/admin/users/:userId/role
 * @desc Promote/demote user role (admin only)
 * @access Admin
 */
router.put('/users/:userId/role', 
    authenticateToken, 
    requireAdmin,
    validateAdminInput(['userId', 'role']),
    preventSelfModification,
    logAdminAction('UPDATE_USER_ROLE'),
    async (req, res) => {
        try {
            const { userId } = req.params;
            const { action } = req.body;
            
            console.log(`👑 Admin ${action}ing user ${userId}`);
            
            await adminService.updateUserRole(userId, action);
            
            console.log(`✅ User ${userId} ${action}d successfully`);
            res.json({
                success: true,
                message: `User ${action}d successfully`
            });
        } catch (error) {
            console.error(`❌ Error ${req.body.action}ing user:`, error);
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
);

/**
 * @route PUT /api/admin/users/:userId/status
 * @desc Change user active status (admin only)
 * @access Admin
 */
router.put('/users/:userId/status', 
    authenticateToken, 
    requireAdmin,
    validateAdminInput(['userId']),
    preventSelfModification,
    logAdminAction('CHANGE_USER_STATUS'),
    async (req, res) => {
        try {
            const { userId } = req.params;
            const { action } = req.body;
            
            if (!action || !['activate', 'deactivate'].includes(action)) {
                return res.status(400).json({ error: 'Invalid action. Must be "activate" or "deactivate"' });
            }
            
            console.log(`🔄 Admin ${action}ing user ${userId}`);
            
            const result = await adminService.changeUserStatus(userId, action);
            
            console.log(`✅ User ${userId} ${action}d successfully`);
            res.json({
                success: true,
                message: `User ${action}d successfully`,
                data: result
            });
        } catch (error) {
            console.error(`❌ Error ${req.body.action}ing user:`, error);
            if (error.message === 'User not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }
);

/**
 * @route GET /api/admin/locations
 * @desc Get all locations for management (admin only)
 * @access Admin
 */
router.get('/locations', 
    authenticateToken, 
    requireAdmin,
    logAdminAction('GET_ALL_LOCATIONS'),
    async (req, res) => {
        try {
            console.log('🌍 Admin fetching all locations');
            const locations = await adminService.getAllLocations();
            
            console.log(`🌍 Found ${locations.length} locations`);
            res.json({
                success: true,
                locations: locations
            });
        } catch (error) {
            console.error('❌ Error fetching locations:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * @route DELETE /api/admin/locations/:placeId
 * @desc Delete location (admin only)
 * @access Admin
 */
router.delete('/locations/:placeId', 
    authenticateToken, 
    requireAdmin,
    validateAdminInput(['placeId']),
    logAdminAction('DELETE_LOCATION'),
    async (req, res) => {
        try {
            const { placeId } = req.params;
            
            console.log(`🗑️ Admin deleting location ${placeId}`);
            
            await adminService.deleteLocation(placeId);
            
            console.log(`✅ Location ${placeId} deleted successfully`);
            res.json({
                success: true,
                message: 'Location deleted successfully'
            });
        } catch (error) {
            console.error('❌ Error deleting location:', error);
            if (error.message === 'Location not found') {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
);

/**
 * @route GET /api/admin/stats
 * @desc Get system statistics (admin only)
 * @access Admin
 */
router.get('/stats', 
    authenticateToken, 
    requireAdmin,
    preventCaching,  // Add cache prevention
    logAdminAction('GET_SYSTEM_STATS'),
    async (req, res) => {
        try {
            console.log('📊 Admin fetching system stats');
            const stats = await adminService.getSystemStats();
            
            console.log('📊 Returning stats:', stats);
            res.json(stats);
        } catch (error) {
            console.error('❌ Error fetching stats:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * @route GET /api/admin/health
 * @desc Get system health information (admin only)
 * @access Admin
 */
router.get('/health', 
    authenticateToken, 
    requireAdmin,
    logAdminAction('GET_SYSTEM_HEALTH'),
    async (req, res) => {
        try {
            console.log('🏥 Admin checking system health');
            const health = await adminService.getSystemHealth();
            
            res.json({
                success: true,
                health: health
            });
        } catch (error) {
            console.error('❌ Error checking system health:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * @route GET /api/admin/sessions
 * @desc Get active sessions information (admin only)
 * @access Admin
 */
router.get('/sessions', 
    authenticateToken, 
    requireAdmin,
    logAdminAction('GET_ACTIVE_SESSIONS'),
    async (req, res) => {
        try {
            console.log('🔐 Admin fetching active sessions');
            const sessions = await sessionService.getActiveSessions();
            
            console.log(`🔐 Found ${sessions.length} active sessions`);
            res.json({
                success: true,
                data: sessions,
                count: sessions.length
            });
        } catch (error) {
            console.error('❌ Error fetching sessions:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * @route DELETE /api/admin/sessions/:sessionId
 * @desc Invalidate a specific session (admin only)
 * @access Admin
 */
router.delete('/sessions/:sessionId', 
    authenticateToken, 
    requireAdmin,
    logAdminAction('INVALIDATE_SESSION'),
    async (req, res) => {
        try {
            const { sessionId } = req.params;
            console.log(`🚫 Admin invalidating session ${sessionId}`);
            
            const success = await sessionService.invalidateSession(sessionId);
            
            if (success) {
                console.log(`✅ Session ${sessionId} invalidated successfully`);
                res.json({
                    success: true,
                    message: 'Session invalidated successfully'
                });
            } else {
                res.status(404).json({ error: 'Session not found' });
            }
        } catch (error) {
            console.error('❌ Error invalidating session:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

/**
 * @route GET /api/admin/debug/database
 * @desc Test database connectivity and structure (admin only)
 * @access Admin
 */
router.get('/debug/database', 
    authenticateToken, 
    requireAdmin,
    async (req, res) => {
        try {
            console.log('🔍 Testing database structure and connectivity...');
            const testResult = await adminService.testUserTable();
            
            res.json({
                success: true,
                message: 'Database test completed',
                data: testResult
            });
        } catch (error) {
            console.error('❌ Database test failed:', error);
            res.status(500).json({ error: error.message });
        }
    }
);

module.exports = router;
