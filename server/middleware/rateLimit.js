/**
 * Rate Limiting Middleware
 * Handles different rate limiting strategies for various endpoints
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints (login, register)
 * More restrictive to prevent brute force attacks
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs for auth endpoints
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`🚫 Auth rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many authentication attempts, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

/**
 * Rate limiter for general API endpoints
 * More lenient for general API usage
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs for general API
    message: {
        error: 'Too many API requests, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`🚫 API rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many API requests, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

/**
 * Rate limiter for admin endpoints
 * Very restrictive for admin operations
 */
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 admin requests per windowMs
    message: {
        error: 'Too many admin requests, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`🚫 Admin rate limit exceeded for IP: ${req.ip} - User: ${req.user?.username || 'Unknown'}`);
        res.status(429).json({
            error: 'Too many admin requests, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

/**
 * Rate limiter for password reset endpoints
 * Very restrictive to prevent abuse
 */
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset attempts per hour
    message: {
        error: 'Too many password reset attempts, please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`🚫 Password reset rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many password reset attempts, please try again later.',
            retryAfter: '1 hour'
        });
    }
});

/**
 * Rate limiter for registration endpoints
 * Moderate restriction to prevent spam accounts
 */
const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 registration attempts per hour
    message: {
        error: 'Too many registration attempts, please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`🚫 Registration rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'Too many registration attempts, please try again later.',
            retryAfter: '1 hour'
        });
    }
});

export {
    authLimiter,
    apiLimiter,
    adminLimiter,
    passwordResetLimiter,
    registrationLimiter
};
