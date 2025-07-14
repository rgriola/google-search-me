/**
 * Test Environment Configuration
 */
module.exports = {
  // Server Configuration
  PORT: 3001, // Different from dev port to avoid conflicts
  
  // Security (use test-specific secrets)
  JWT_SECRET: 'test-jwt-secret-not-for-production',
  SESSION_SECRET: 'test-session-secret-not-for-production',
  
  // Frontend URL for CORS
  FRONTEND_URL: 'http://localhost:3001',
  
  // API base URL
  API_BASE_URL: 'http://localhost:3001/api',
  
  // Database (use in-memory or test-specific database)
  DB_PATH: ':memory:', // Use SQLite in-memory database for tests
  
  // CORS settings
  CORS: {
    origin: true, // Allow all origins in test
    credentials: true
  },
  
  // Logging
  LOG_LEVEL: 'error' // Minimal logging during tests
};
