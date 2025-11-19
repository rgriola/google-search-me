/**
 * Production Environment Configuration
 */
export default {
  // Server Configuration
  PORT: process.env.PORT || 8080,
  
  // Security (always use environment variables in production)
  JWT_SECRET: process.env.JWT_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,
  
  // Frontend URL for CORS - dynamically determine from environment
  FRONTEND_URL: process.env.RENDER_EXTERNAL_URL || process.env.FRONTEND_URL || 'https://google-search-me.onrender.com',

  // API base URL - dynamically determine from environment  
  API_BASE_URL: process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/api` : (process.env.API_BASE_URL || 'https://google-search-me.onrender.com/api'),
  
  // Database
  DB_PATH: process.env.DATABASE_PATH || '/opt/render/project/src/server/locations.db',
  
  // CORS settings - dynamically determine allowed origins
  CORS: {
    origin: [
      process.env.RENDER_EXTERNAL_URL || 'https://google-search-me.onrender.com',
      'https://merkelvision.com'
    ].filter(Boolean), // Remove any undefined values
    credentials: true
  },
  
  // Logging
  LOG_LEVEL: 'info'
};
