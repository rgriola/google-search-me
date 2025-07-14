# Environment Configuration System

This document explains how the application's configuration system works across different environments.

## Overview

The application uses an environment-based configuration system that automatically loads the correct settings based on the current environment (development, production, or test). This eliminates the need to manually edit configuration files when deploying to different environments.

## How It Works

1. **Environment Detection**: The application determines the current environment from the `NODE_ENV` environment variable.

2. **Environment-Specific Configs**: Each environment has its own configuration file in the `server/config/environments/` directory:
   - `development.js`: Local development settings
   - `production.js`: Production settings (for render.com)
   - `test.js`: Testing environment settings

3. **Configuration Loading**: The `environment.js` file automatically loads the appropriate config based on `NODE_ENV`.

4. **Environment Setup Scripts**: Use npm scripts to easily switch between environments.

## Using Environment Configurations

### Switch Environments

Use these npm scripts to switch between environments:

```bash
# Set up development environment
npm run dev:setup

# Set up production environment
npm run prod:setup

# Set up test environment
npm run test:setup
```

### Start with Specific Environment

These commands set the environment and start the server in one step:

```bash
# Start in development mode
npm run dev:start

# Start in production mode
npm run prod:start

# Start in test mode
npm run test:start
```

### Deploy to Production

When deploying to production:

1. Make sure your hosting platform (render.com) sets `NODE_ENV=production`
2. Set the required environment variables on your hosting platform:
   - `JWT_SECRET`: Secret key for JWT tokens
   - `SESSION_SECRET`: Secret key for sessions

## Customizing Configurations

To modify environment-specific settings:

1. Edit the corresponding file in `server/config/environments/`:
   - Development: `development.js`
   - Production: `production.js`
   - Test: `test.js`

2. Update the appropriate values in the configuration object

3. Restart the application for changes to take effect

## Important Configuration Values

### Frontend URL
- Development: `http://localhost:3000`
- Production: `https://google-search-me.onrender.com`

### API Base URL
- Development: `http://localhost:3000/api`
- Production: `https://google-search-me.onrender.com/api`

### CORS Settings
- Development: Allows all origins (for easier local development)
- Production: Allows only the specific production domain
