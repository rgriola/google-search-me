/**
 * Production Environment Configuration
 */
export default {
  // Server Configuration
  PORT: process.env.PORT || 8080,
  
  // Security (always use environment variables in production)
  JWT_SECRET: process.env.JWT_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,
  
  // Frontend URL for CORS
  //FRONTEND_URL: 'https://google-search-me.onrender.com',
  FRONTEND_URL: 'https://merkelvision.com',

  // API base URL
  //API_BASE_URL: 'https://google-search-me.onrender.com/api',
  API_BASE_URL: 'https://merkelvision.com/api',
  
  // Database
  DB_PATH: process.env.DATABASE_PATH || '/opt/render/project/src/server/locations.db',
  
  // CORS settings
  CORS: {
    origin: [
     // 'https://google-search-me.onrender.com'
     'https://merkelvision.com'
    ],
    credentials: true
  },
  
  // Logging
  LOG_LEVEL: 'info'
};
