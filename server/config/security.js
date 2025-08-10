/**
 * Security Configuration
 * Centralized security settings and CSP policies
 */

/**
 * Content Security Policy configuration
 * Enhanced security to prevent CSS injection and XSS attacks
 * @returns {string} CSP policy string
 */
export function getCSPPolicy() {
    // Allow unsafe-inline for styles to support Google Maps API
    // Google Maps requires inline styles for map controls and overlays
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    const policies = [
        "default-src 'self'",
        
        // Script sources - allow external scripts from same origin and Google Maps
        "script-src 'self' https://maps.googleapis.com https://unpkg.com",
        
        // Style sources - MUST allow unsafe-inline for Google Maps API functionality
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com https://maps.gstatic.com",
        
        // Font sources
        "font-src 'self' https://fonts.gstatic.com",
        
        // Image sources - allow ImageKit for photo management
        "img-src 'self' data: https://maps.googleapis.com https://maps.gstatic.com https://streetviewpixels-pa.googleapis.com https://ik.imagekit.io",
        
        // Connection sources for API calls - allow all Google Maps subdomains
        "connect-src 'self' https://maps.googleapis.com https://*.googleapis.com https://maps.gstatic.com https://fonts.gstatic.com",
        
        // Frame restrictions
        "frame-src 'none'",
        "frame-ancestors 'none'",
        
        // Object restrictions
        "object-src 'none'",
        
        // Base URI restrictions
        "base-uri 'self'",
        
        // Form restrictions
        "form-action 'self'",
        
        // Upgrade insecure requests
        "upgrade-insecure-requests",
        
        // Block mixed content
        "block-all-mixed-content"
    ];
    
    return policies.join('; ');
}

/**
 * CSS Security Validation
 * Prevents CSS injection attacks and validates CSS content
 */

/**
 * Validate CSS content for security risks
 * @param {string} cssContent - CSS content to validate
 * @returns {Object} Validation result
 */
export function validateCSS(cssContent) {
    const securityRisks = [];
    
    // Check for JavaScript URLs
    if (/javascript:/i.test(cssContent)) {
        securityRisks.push('JavaScript URLs detected in CSS');
    }
    
    // Check for data URLs with script content
    if (/data:.*script/i.test(cssContent)) {
        securityRisks.push('Script data URLs detected in CSS');
    }
    
    // Check for external URL patterns that could be used for data exfiltration
    const suspiciousUrls = cssContent.match(/url\(['"]?https?:\/\/(?!fonts\.googleapis\.com|fonts\.gstatic\.com|maps\.googleapis\.com)/gi);
    if (suspiciousUrls && suspiciousUrls.length > 0) {
        securityRisks.push(`Suspicious external URLs detected: ${suspiciousUrls.join(', ')}`);
    }
    
    // Check for CSS that could be used for attribute stealing
    if (/\[.*\^=.*\].*url\(/i.test(cssContent)) {
        securityRisks.push('Potential attribute stealing patterns detected');
    }
    
    // Check for CSS that could be used for form value stealing
    if (/input\[value.*\].*url\(/i.test(cssContent)) {
        securityRisks.push('Potential form value stealing patterns detected');
    }
    
    return {
        isValid: securityRisks.length === 0,
        risks: securityRisks
    };
}

/**
 * Generate CSP hash for inline styles
 * @param {string} styleContent - Style content to hash
 * @returns {string} SHA256 hash for CSP
 */
export function generateStyleHash(styleContent) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(styleContent).digest('base64');
    return `'sha256-${hash}'`;
}

/**
 * Sanitize inline styles to prevent CSS injection
 * @param {string} styleValue - Style attribute value
 * @returns {string} Sanitized style value
 */
export function sanitizeInlineStyle(styleValue) {
    if (!styleValue || typeof styleValue !== 'string') {
        return '';
    }
    
    // Remove potentially dangerous CSS functions
    const sanitized = styleValue
        .replace(/javascript:/gi, '') // Remove javascript: URLs
        .replace(/expression\s*\(/gi, '') // Remove CSS expressions (IE)
        .replace(/url\s*\(\s*["']?javascript:/gi, '') // Remove javascript URLs
        .replace(/@import/gi, '') // Remove @import statements
        .replace(/behaviour:/gi, '') // Remove IE behaviors
        .replace(/binding:/gi, ''); // Remove XML binding
    
    return sanitized;
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
    
    // Additional CSS security headers
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    
    // COEP policy - use unsafe-none to allow Google Maps API cross-origin requests
    // Note: require-corp blocks Google Maps API which doesn't provide CORP headers
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    
    // Prevent CSS MIME type confusion
    if (req.path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
    
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
