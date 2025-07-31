/**
 * Security Configuration
 * Centralized security settings and CSP policies
 */

/**
 * Content Security Policy configuration
 * @returns {string} CSP policy string
 */
export function getCSPPolicy() {
    const policies = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://unpkg.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://maps.googleapis.com",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests"
    ];
    
    return policies.join('; ');
}

/**
 * Security headers configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function setSecurityHeaders(req, res, next) {
    // Basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', getCSPPolicy());
    
    // Only add HSTS in production with HTTPS
    if (process.env.NODE_ENV === 'production' && req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    // Remove server information for security
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    
    next();
}

/**
 * Session configuration for production
 * @returns {Object} Session configuration object
 */
export function getSessionConfig(jwtSecret) {
    return {
        secret: jwtSecret,
        resave: false,
        saveUninitialized: false,
        name: 'sessionId', // Don't use default session name
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    };
}

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
    // General API rate limiting
    api: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: {
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        }
    },
    
    // Authentication endpoints
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit each IP to 5 login attempts per windowMs
        message: {
            error: 'Too many login attempts, please try again later.',
            retryAfter: '15 minutes'
        }
    },
    
    // Registration endpoint
    registration: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // Limit each IP to 3 registration attempts per hour
        message: {
            error: 'Too many registration attempts, please try again later.',
            retryAfter: '1 hour'
        }
    },
    
    // Password reset endpoint
    passwordReset: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3, // Limit each IP to 3 password reset attempts per hour
        message: {
            error: 'Too many password reset attempts, please try again later.',
            retryAfter: '1 hour'
        }
    }
};
