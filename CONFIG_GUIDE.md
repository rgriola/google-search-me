# Environment Configuration Guide

This guide explains how to configure the application for different environments (development, production, and test).

## 📋 Overview

The application uses a centralized configuration system that automatically loads the appropriate settings based on the current environment. This eliminates the need for manual configuration changes when switching between environments.

## 🛠️ Configuration Structure

### Server-Side Configuration

The server-side configuration is organized as follows:

- **Main Configuration**: `server/config/environment.js`
- **Environment-Specific Configs**: 
  - `server/config/environments/development.js`
  - `server/config/environments/production.js`
  - `server/config/environments/test.js`
- **Other Configs**:
  - `server/config/cors.js`: CORS settings
  - `server/config/database.js`: Database connection setup

### Client-Side Configuration

The client-side configuration is handled by:

- **Environment Detection**: `js/modules/config/environment.js`

This file automatically detects whether the app is running in development or production based on the hostname.

## 🚀 Usage

### Setting the Environment

You can set the environment using the setup script:

```bash
# For development
npm run dev:setup

# For production
npm run prod:setup

# For testing
npm run test:setup
```

Or run the setup script directly:

```bash
node server/setup-env.js [environment]
```

Where `[environment]` can be `development`, `production`, or `test`.

### Starting the Server with Specific Environment

```bash
# Development with setup
npm run dev:start

# Production with setup
npm run prod:start

# Test with setup
npm run test:start
```

Or manually:

```bash
# Set environment first
node server/setup-env.js [environment]

# Then start server
npm start
```

## 🔧 Environment Variables

In production, the following environment variables should be set:

- `JWT_SECRET`: Secret for JWT token signing
- `SESSION_SECRET`: Secret for session management
- `DB_PATH`: (Optional) Path to the database file

## ⚙️ Configuration Properties

### Common Configuration (All Environments)

- `BCRYPT_ROUNDS`: Rounds for password hashing
- `RATE_LIMIT`: API rate limiting settings
- `API_PREFIX`: Prefix for API endpoints
- `SMTP`: Email service configuration

### Environment-Specific Configuration

#### Development
- `PORT`: 3000
- `FRONTEND_URL`: http://localhost:3000
- `API_BASE_URL`: http://localhost:3000/api
- `CORS`: All origins allowed
- `LOG_LEVEL`: debug

#### Production
- `PORT`: From environment or 3000
- `FRONTEND_URL`: https://google-search-me.onrender.com
- `API_BASE_URL`: https://google-search-me.onrender.com/api
- `CORS`: Restricted to specific origins
- `LOG_LEVEL`: info

## 📝 Adding New Configuration

To add a new configuration property:

1. Add it to the common config in `server/config/environment.js` if shared across environments
2. Or add it to the specific environment file if it varies

Example:

```javascript
// In server/config/environments/development.js
export default {
  // Existing config...
  
  // New configuration property
  NEW_FEATURE_FLAG: true
};
```

## 🔄 Client-Side Environment Detection

The client-side automatically detects the environment:

```javascript
// Environment detection logic in js/modules/config/environment.js
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('dev');
```

This allows for different API URLs and feature flags based on the environment.

## 🐞 Debugging Configuration

To debug the active configuration:

```bash
node server/setup-env.js development
# Shows the active configuration details
```

Or in the browser console:

```javascript
console.log(window.API_BASE_URL);  // Check current API URL
```
