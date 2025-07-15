/**
 * Client-side environment configuration
 * Detects current environment and provides appropriate API URLs
 */

// Environment detection
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('dev');

const isProduction = !isDevelopment;

// Debug logging
console.log('🌍 Environment Detection:', {
  hostname: window.location.hostname,
  isDevelopment,
  isProduction
});

// Configuration by environment
const config = {
  development: {
    API_BASE_URL: 'http://localhost:3000/api',
    FEATURES: {
      DEBUG_TOOLS: true,
      ANALYTICS: false
    }
  },
  production: {
    API_BASE_URL: 'https://google-search-me.onrender.com/api',
    FEATURES: {
      DEBUG_TOOLS: false,
      ANALYTICS: true
    }
  }
};

// Export the appropriate config based on detected environment
export const environment = isDevelopment ? config.development : config.production;

// Debug logging
console.log('🔧 Environment Config loaded:', {
  selected: isDevelopment ? 'development' : 'production',
  API_BASE_URL: environment.API_BASE_URL,
  hostname: window.location.hostname
});

// Export environment detection helpers
export const environmentUtils = {
  isDevelopment,
  isProduction
};

// Export default configuration
export default environment;
