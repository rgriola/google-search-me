/**
 * CSRF Protection Middleware
 * Implements Cross-Site Request Forgery protection
 */

import crypto from 'crypto';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('CSRF');

/**
 * CSRF Protection Configuration
 */
const CSRF_CONFIG = {
  tokenLength: 32,
  tokenHeader: 'x-csrf-token',
  cookieName: 'csrf-token',
  sessionKey: 'csrfToken',
  excludePaths: [
    '/api/health',
    '/api/health-check',
    '/api/health/extended',
    '/api/test',
    '/api/info'
  ],
  safeMethods: ['GET', 'HEAD', 'OPTIONS', 'TRACE']
};

/**
 * Generate a cryptographically secure CSRF token
 */
function generateCSRFToken() {
  return crypto.randomBytes(CSRF_CONFIG.tokenLength).toString('hex');
}

/**
 * Verify CSRF token from request
 */
function verifyCSRFToken(req, token) {
  const sessionToken = req.session?.[CSRF_CONFIG.sessionKey];
  const headerToken = req.headers[CSRF_CONFIG.tokenHeader];
  const bodyToken = req.body?._csrf;
  
  const providedToken = token || headerToken || bodyToken;
  
  if (!sessionToken || !providedToken) {
    return false;
  }
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(sessionToken, 'hex'),
    Buffer.from(providedToken, 'hex')
  );
}

/**
 * Check if path should be excluded from CSRF protection
 */
function shouldExcludePath(path) {
  return CSRF_CONFIG.excludePaths.some(excludePath => 
    path.startsWith(excludePath)
  );
}

/**
 * Check if HTTP method is considered safe
 */
function isSafeMethod(method) {
  return CSRF_CONFIG.safeMethods.includes(method.toUpperCase());
}

/**
 * CSRF Protection Middleware
 */
export function csrfProtection(req, res, next) {
  // Skip CSRF protection for excluded paths
  if (shouldExcludePath(req.path)) {
    return next();
  }
  
  // Skip CSRF protection for safe HTTP methods
  if (isSafeMethod(req.method)) {
    // For safe methods, generate and provide token
    if (req.session) {
      if (!req.session[CSRF_CONFIG.sessionKey]) {
        req.session[CSRF_CONFIG.sessionKey] = generateCSRFToken();
      }
      
      // Add token to response headers for client-side access
      res.setHeader('X-CSRF-Token', req.session[CSRF_CONFIG.sessionKey]);
    }
    return next();
  }
  
  // For unsafe methods (POST, PUT, DELETE, etc.), verify token
  if (!req.session) {
    logger.warn('CSRF protection: No session found', {
      method: req.method,
      path: req.path,
      ip: req.ip
    });
    return res.status(403).json({
      error: 'CSRF protection: Session required',
      code: 'CSRF_NO_SESSION'
    });
  }
  
  const sessionToken = req.session[CSRF_CONFIG.sessionKey];
  if (!sessionToken) {
    logger.warn('CSRF protection: No token in session', {
      method: req.method,
      path: req.path,
      ip: req.ip
    });
    return res.status(403).json({
      error: 'CSRF protection: Token not found in session',
      code: 'CSRF_NO_TOKEN'
    });
  }
  
  const providedToken = req.headers[CSRF_CONFIG.tokenHeader] || req.body?._csrf;
  if (!providedToken) {
    logger.warn('CSRF protection: No token provided', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      headers: Object.keys(req.headers)
    });
    return res.status(403).json({
      error: 'CSRF protection: Token required',
      code: 'CSRF_TOKEN_REQUIRED',
      hint: `Provide token in ${CSRF_CONFIG.tokenHeader} header or _csrf body field`
    });
  }
  
  if (!verifyCSRFToken(req, providedToken)) {
    logger.security('CSRF protection: Invalid token', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      providedTokenLength: providedToken?.length,
      sessionTokenLength: sessionToken?.length
    });
    
    return res.status(403).json({
      error: 'CSRF protection: Invalid token',
      code: 'CSRF_INVALID_TOKEN'
    });
  }
  
  // Token is valid, proceed
  logger.debug('CSRF protection: Token verified', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  
  next();
}

/**
 * Middleware to provide CSRF token to clients
 */
export function provideCSRFToken(req, res, next) {
  if (req.session) {
    if (!req.session[CSRF_CONFIG.sessionKey]) {
      req.session[CSRF_CONFIG.sessionKey] = generateCSRFToken();
    }
    
    // Add token to locals for template rendering
    res.locals.csrfToken = req.session[CSRF_CONFIG.sessionKey];
    
    // Add token to response headers
    res.setHeader('X-CSRF-Token', req.session[CSRF_CONFIG.sessionKey]);
  }
  
  next();
}

/**
 * API endpoint to get CSRF token
 */
export function getCSRFToken(req, res) {
  if (!req.session) {
    return res.status(403).json({
      error: 'Session required for CSRF token',
      code: 'CSRF_NO_SESSION'
    });
  }
  
  if (!req.session[CSRF_CONFIG.sessionKey]) {
    req.session[CSRF_CONFIG.sessionKey] = generateCSRFToken();
  }
  
  res.json({
    success: true,
    token: req.session[CSRF_CONFIG.sessionKey],
    headerName: CSRF_CONFIG.tokenHeader
  });
}

/**
 * Configuration getter for client-side usage
 */
export function getCSRFConfig() {
  return {
    tokenHeader: CSRF_CONFIG.tokenHeader,
    cookieName: CSRF_CONFIG.cookieName,
    excludePaths: CSRF_CONFIG.excludePaths,
    safeMethods: CSRF_CONFIG.safeMethods
  };
}
