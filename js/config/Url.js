/**
 * URL Configuration
 * Centralized page URLs for consistent redirects throughout the application
 * 
 * IMPORTANT: All paths use absolute URLs (starting with /) to ensure 
 * consistent behavior regardless of current page location.
 * 
 * Usage:
 * import { Url, Nav } from './js/config/Url.js';
 * window.location.href = Url.LOGIN;
 */

export const Url = {
    // Authentication pages
    LOGIN: '/login.html',
    REGISTER: '/registration.html',
    VERIFY: '/verify-email.html',
    FORGOT: '/forgot-password.html',
    RESET: '/reset-password.html',
    
    // Main application pages
    APP: '/app.html',
    LANDING: '/landing.html',
    
    // Admin pages
    DB_VIEWER: '/database-viewer.html',
    
    // Error pages
    NOT_FOUND: '/404.html',
    
    // Logout (special case - could be a page or action)
    LOGOUT: '/logout.html',
    SUPPORT_EMAIL: 'rodczaro@gmail.com'
};

// Convenience methods for common redirect patterns
export class Nav {
    /**
     * Redirect to login with optional return URL
     * @param {string} returnUrl - URL to return to after login
     */
    static toLogin(returnUrl = null) {
        const url = returnUrl 
            ? `${Url.LOGIN}?returnUrl=${encodeURIComponent(returnUrl)}`
            : Url.LOGIN;
        window.location.href = url;
    }
    
    /**
     * Redirect to registration with optional return URL
     * @param {string} returnUrl - URL to return to after registration
     */
    static toRegister(returnUrl = null) {
        const url = returnUrl 
            ? `${Url.REGISTER}?returnUrl=${encodeURIComponent(returnUrl)}`
            : Url.REGISTER;
        window.location.href = url;
    }
    
    /**
     * Redirect to app page (main authenticated area)
     * @param {string} source - Source page for tracking
     */
    static toApp(source = null) {
        const url = source 
            ? `${Url.APP}?from=${encodeURIComponent(source)}`
            : Url.APP;
        window.location.href = url;
    }
    
    /**
     * Get the current page name (without path and extension)
     * @returns {string} Current page name
     */
    static getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename.replace('.html', '');
    }
    
    /**
     * Check if current page is an auth page
     * @returns {boolean} True if on auth-related page
     */
    static isAuthPage() {
        const authPages = [Url.LOGIN, Url.REGISTER, Url.VERIFY, Url.FORGOT, Url.RESET];
        return authPages.includes(window.location.pathname);
    }
}

// Legacy support - longer names for backward compatibility
export const Pages = Url;

// Individual exports for destructuring
export const {
    LOGIN,
    REGISTER,
    VERIFY,
    FORGOT,
    RESET,
    APP,
    LANDING,
    DB_VIEWER,
    NOT_FOUND,
    LOGOUT
} = Url;
