/**
 * Secure 404 Page Module - 404.js
 * Following security implementation guide
 * CSP compliant - no inline scripts or styles
 * Enhanced navigation with security validation
 */

// Import security utilities
import { SecurityUtils } from './js/utils/SecurityUtils.js';
import { debug, DEBUG } from './js/debug.js';
import { Url } from './js/config/Url.js';

const FILE = '404';

// Configuration
const CONFIG = {
    // Allowed navigation targets (whitelist for security)
    ALLOWED_PAGES: [
        Url.LANDING,
        Url.LOGIN,
        Url.REGISTER,
        Url.APP
    ],
    
    // Default fallback URL
    DEFAULT_HOME: Url.LANDING,

    // Message display time
    MESSAGE_DISPLAY_TIME: 4000,
    
    // Security settings
    VALIDATE_URLS: true,
    LOG_NAVIGATION: true
};

/**
 * Test404Service - Secure 404 page functionality
 */
class Test404Service {
    
    static isInitialized = false;
    static navigationAttempts = 0;
    
    /**
     * Initialize the 404 service
     */
    static init() {
        if (this.isInitialized) {
            debug(FILE, '⚠️ Service already initialized');
            return;
        }
        
        debug(FILE, '🚀 Initializing secure 404 service');
        
        // Set up event listeners
        this._setupEventListeners();
        
        // Log 404 occurrence for analytics
        this._log404Event();
        
        // Set up navigation enhancement
        this._enhanceNavigation();
        
        this.isInitialized = true;
        debug(FILE, '✅ 404 service initialized');
    }
    
    /**
     * Set up all event listeners
     */
    static _setupEventListeners() {
        debug(FILE, '📡 Setting up event listeners');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._attachEventHandlers());
        } else {
            this._attachEventHandlers();
        }
    }
    
    /**
     * Attach event handlers to DOM elements
     */
    static _attachEventHandlers() {
        // Home button (primary navigation)
        const homeBtn = document.getElementById('homeBtn');
        if (homeBtn) {
            homeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this._navigateToHome();
            });
            debug(FILE, '✅ Home button handler attached');
        }
        
        // All navigation links
        const navLinks = document.querySelectorAll('a[href]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#')) {
                    this._validateAndNavigate(e, href);
                }
            });
        });
        debug(FILE, `✅ Enhanced ${navLinks.length} navigation links`);
        
        // Message close buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('message-close')) {
                this._hideMessage();
            }
        });
        
        // Keyboard navigation support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this._hideMessage();
            }
            if (e.key === 'h' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this._navigateToHome();
            }
        });
        
        debug(FILE, '✅ Event handlers attached');
    }
    
    /**
     * Validate and navigate to target URL
     */
    static _validateAndNavigate(event, targetUrl) {
        this.navigationAttempts++;
        
        // Basic security validation
        if (!this._isValidNavigationTarget(targetUrl)) {
            event.preventDefault();
            debug(FILE, `🚫 Blocked potentially unsafe navigation to: ${targetUrl}`);
            this._showMessage('Navigation blocked for security reasons. Using safe fallback.', 'warning');
            this._navigateToHome();
            return;
        }
        
        if (CONFIG.LOG_NAVIGATION) {
            debug(FILE, `🔗 Navigating to: ${targetUrl}`);
        }
    }
    
    /**
     * Validate if a URL is safe for navigation
     */
    static _isValidNavigationTarget(url) {
        if (!CONFIG.VALIDATE_URLS) return true;
        
        // Block obviously dangerous schemes
        const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
        if (dangerousSchemes.some(scheme => url.toLowerCase().startsWith(scheme))) {
            return false;
        }
        
        // For relative URLs, check against whitelist
        if (!url.includes('://')) {
            const filename = url.split('?')[0].split('#')[0];
            return CONFIG.ALLOWED_PAGES.includes(filename) || filename === '';
        }
        
        // For absolute URLs, ensure same origin
        try {
            const targetOrigin = new URL(url, window.location.origin).origin;
            return targetOrigin === window.location.origin;
        } catch (error) {
            debug(FILE, '⚠️ URL validation error:', error);
            return false;
        }
    }
    
    /**
     * Navigate to home page with security validation
     */
    static _navigateToHome() {
        debug(FILE, '🏠 Navigating to home page');
        
        const homeUrl = CONFIG.DEFAULT_HOME;
        
        // Add cache-busting parameter to ensure fresh load
        const params = new URLSearchParams({
            from: '404',
            t: Date.now().toString()
        });
        
        const targetUrl = `${homeUrl}?${params.toString()}`;
        
        // Final security check
        if (this._isValidNavigationTarget(homeUrl)) {
            window.location.href = targetUrl;
        } else {
            debug(FILE, '🚫 Home navigation blocked by security check');
            this._showMessage('Unable to navigate. Please refresh the page and try again.', 'error');
        }
    }
    
    /**
     * Log 404 event for analytics (privacy-conscious)
     */
    static _log404Event() {
        try {
            const logData = {
                timestamp: Date.now(),
                page: '404',
                referrer: document.referrer ? 'has-referrer' : 'no-referrer', // Privacy-conscious
                userAgent: navigator.userAgent.substring(0, 50) + '...', // Truncated for privacy
                requestedUrl: window.location.pathname
            };
            
            // Store locally for potential later transmission
            const existingLogs = JSON.parse(localStorage.getItem('404Logs') || '[]');
            existingLogs.push(logData);
            
            // Keep only last 10 logs to avoid storage bloat
            const recentLogs = existingLogs.slice(-10);
            localStorage.setItem('404Logs', JSON.stringify(recentLogs));
            
            debug(FILE, '📊 404 event logged (privacy-conscious)');
            
        } catch (error) {
            debug(FILE, '⚠️ Failed to log 404 event:', error);
        }
    }
    
    /**
     * Enhance navigation with helpful features
     */
    static _enhanceNavigation() {
        // Check if user came from a valid page
        const referrer = document.referrer;
        if (referrer && referrer.includes(window.location.hostname)) {
            this._addBackButton();
        }
        
        // Add helpful navigation hints
        this._addNavigationHints();
        
        debug(FILE, '✨ Navigation enhanced');
    }
    
    /**
     * Add a back button if user came from our site
     */
    static _addBackButton() {
        const errorActions = document.querySelector('.error-actions');
        if (!errorActions) return;
        
        const backButton = document.createElement('a');
        backButton.href = '#';
        backButton.className = 'secondary-cta back-btn';
        backButton.innerHTML = '<span class="btn-icon">↩️</span>Go Back';
        
        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.history.length > 1) {
                window.history.back();
            } else {
                this._navigateToHome();
            }
        });
        
        errorActions.appendChild(backButton);
        debug(FILE, '⬅️ Back button added');
    }
    
    /**
     * Add navigation hints to the page
     */
    static _addNavigationHints() {
        // Check for common mistyped URLs and suggest corrections
        const currentPath = window.location.pathname;
        const suggestions = this._getSuggestions(currentPath);
        
        if (suggestions.length > 0) {
            this._displaySuggestions(suggestions);
        }
    }
    
    /**
     * Get URL suggestions based on common patterns
     */
    static _getSuggestions(path) {
        const suggestions = [];
        const pathLower = path.toLowerCase();
        
        // Common patterns
        if (pathLower.includes('login') || pathLower.includes('signin')) {
            suggestions.push({ text: 'Sign In', url: Url.LOGIN });
        }
        if (pathLower.includes('register') || pathLower.includes('signup')) {
            suggestions.push({ text: 'Sign Up', url: Url.REGISTER });
        }
        if (pathLower.includes('home') || pathLower.includes('index')) {
            suggestions.push({ text: 'Home Page', url: Url.LANDING });
        }
        if (pathLower.includes('logout')) {
            suggestions.push({ text: 'Logout', url: Url.LOGOUT });
        }
        
        return suggestions.slice(0, 3); // Limit to 3 suggestions
    }
    
    /**
     * Display URL suggestions to user
     */
    static _displaySuggestions(suggestions) {
        if (suggestions.length === 0) return;
        
        const suggestionsHtml = suggestions.map(suggestion => 
            `<a href="${suggestion.url}" class="suggestion-link">${suggestion.text}</a>`
        ).join(' • ');
        
        const message = `Were you looking for: ${suggestionsHtml}`;
        this._showMessage(message, 'info', false); // Don't auto-hide suggestions
        
        debug(FILE, `💡 Displayed ${suggestions.length} suggestions`);
    }
    
    /**
     * Show secure message to user
     */
    static _showMessage(messageText, type = 'info', autoHide = true) {
        const messageElement = document.getElementById('message');
        const messageTextElement = messageElement?.querySelector('.message-text');
        
        if (!messageElement || !messageTextElement) {
            debug(FILE, '⚠️ Message elements not found');
            return;
        }
        
        // Handle HTML content in messages (like suggestions)
        if (messageText.includes('<a href=')) {
            // For suggestion messages, we need to allow some HTML (but escape user content)
            // Since suggestions are generated by us, not user input, this is safer
            messageTextElement.innerHTML = messageText;
        } else {
            // For regular messages, use text content only
            SecurityUtils.setTextContent(messageTextElement, messageText);
        }
        
        // Update message type
        messageElement.className = `message ${type}`;
        messageElement.classList.remove('hidden');
        
        // Auto-hide after delay (unless disabled)
        if (autoHide) {
            setTimeout(() => {
                if (!messageElement.classList.contains('hidden')) {
                    messageElement.classList.add('fade-out');
                    setTimeout(() => {
                        messageElement.classList.add('hidden');
                        messageElement.classList.remove('fade-out');
                    }, 300);
                }
            }, CONFIG.MESSAGE_DISPLAY_TIME);
        }
        
        debug(FILE, `💬 Showed ${type} message: ${messageText.substring(0, 50)}...`);
    }
    
    /**
     * Hide message display
     */
    static _hideMessage() {
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.classList.add('hidden');
            messageElement.classList.remove('fade-out');
        }
    }
}

// Security check - ensure we're on expected domain
if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    debug(FILE, '[SECURITY] 404 page should be served over HTTPS in production');
}

// Initialize the 404 service
Test404Service.init();

// Handle any unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    debug(FILE, '⚠️ Unhandled promise rejection:', event.reason);
});

// Export for potential testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Test404Service;
}

debug(FILE, '🚀 Secure 404 module loaded successfully');
