/**
 * Authentication Middleware Module
 * Handles JWT token verification and session validation
 */

const jwt = require('jsonwebtoken');
const { config } = require('../config/environment');
const sessionService = require('../services/sessionService');

/**
 * Middleware to authenticate JWT tokens with session validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        // First verify the JWT token
        const decoded = jwt.verify(token, config.JWT_SECRET);
        
        // Then check if user has an active session
        // This ensures that even valid JWT tokens are rejected if sessions are invalidated
        const activeSessions = await sessionService.getUserActiveSessions(decoded.id);
        
        if (!activeSessions || activeSessions.length === 0) {
            return res.status(401).json({ 
                error: 'Session expired. Please log in again.',
                code: 'SESSION_INVALIDATED'
            });
        }
        
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(403).json({ error: 'Invalid token' });
        } else if (err.name === 'TokenExpiredError') {
            return res.status(403).json({ error: 'Token expired' });
        } else {
            console.error('Authentication error:', err);
            return res.status(500).json({ error: 'Authentication failed' });
        }
    }
};

/**
 * Optional authentication middleware
 * For endpoints that work with or without authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, config.JWT_SECRET, (err, user) => {
            if (!err) {
                req.user = user;
            }
        });
    }
    next();
};

/**
 * Middleware to require admin privileges
 * Must be used after authenticateToken middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin privileges required' });
    }
    
    next();
};

/**
 * Middleware to validate authentication input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateAuthInput = (req, res, next) => {
    const { username, email, password } = req.body;
    
    // Check for required fields based on endpoint
    if (req.path.includes('/register')) {
        if (!username || !email || !password) {
            return res.status(400).json({ 
                error: 'Username, email, and password are required for registration' 
            });
        }
    } else if (req.path.includes('/login')) {
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required for login' 
            });
        }
    }
    
    next();
};

/**
 * Middleware to validate user ownership of resources
 * Ensures users can only access their own resources
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateUserOwnership = (req, res, next) => {
    const { userId } = req.params;
    
    // Admin can access any user's resources
    if (req.user.isAdmin) {
        return next();
    }
    
    // Regular users can only access their own resources
    const currentUserId = req.user.userId || req.user.id;
    if (userId && parseInt(userId) !== currentUserId) {
        return res.status(403).json({ 
            error: 'Access denied: You can only access your own resources' 
        });
    }
    
    next();
};

/**
 * Middleware to rate limit authentication attempts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authRateLimit = (req, res, next) => {
    // This will be implemented with express-rate-limit in the rate limiting module
    // For now, just pass through
    next();
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requireAdmin,
    validateAuthInput,
    validateUserOwnership,
    authRateLimit
};
