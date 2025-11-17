/**
 * Development Environment Configuration
 */
export default {
  // Server Configuration
  PORT: 3000,
  
  // Security (use less secure options for development)
  JWT_SECRET: 'dev-jwt-secret-not-for-production',
  SESSION_SECRET: 'dev-session-secret-not-for-production',
  
  // Frontend URL for CORS
  FRONTEND_URL: 'http://localhost:3000',
  
  // API base URL
  API_BASE_URL: 'http://localhost:3000/api',
  
  // Database - adjust path based on where we're running from
  DB_PATH: process.cwd().includes('/server') ? './locations.db' : './server/locations.db',
  
  // CORS settings
  CORS: {
    origin: true, // Allow all origins in development
    credentials: true
  },
  
  // Logging
  LOG_LEVEL: 'debug'

};
