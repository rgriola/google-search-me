#!/usr/bin/env node

/**
 * Environment Setup Script
 * 
 * This script helps set the NODE_ENV environment variable for different environments.
 * It can be used to switch between local development, test, and production settings.
 * 
 * Usage:
 *   node setup-env.js [environment]
 * 
 * Available environments:
 *   - development (default): For local development
 *   - production: For production settings
 *   - test: For running tests
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the environment from command line arguments
const args = process.argv.slice(2);
const env = args[0] || 'development';

// Validate the environment
const validEnvironments = ['development', 'production', 'test'];
if (!validEnvironments.includes(env)) {
  console.error(`Error: Invalid environment "${env}". Valid options are: ${validEnvironments.join(', ')}`);
  process.exit(1);
}

// Create .env file path
const envFilePath = path.join(__dirname, '.env');

// Create or update .env file with the selected environment
fs.writeFileSync(envFilePath, `NODE_ENV=${env}\n`);

console.log(`✅ Environment set to ${env}`);

// Display info about the active configuration
try {
  const envConfig = require(`./config/environments/${env}.js`);
  console.log('\nActive configuration:');
  console.log('---------------------');
  console.log(`Frontend URL: ${envConfig.FRONTEND_URL}`);
  console.log(`API Base URL: ${envConfig.API_BASE_URL}`);
  console.log(`Port: ${envConfig.PORT}`);
  console.log(`Database: ${envConfig.DB_PATH}`);
  console.log(`CORS Origin: ${JSON.stringify(envConfig.CORS.origin)}`);
  console.log('\nTo start the server with this environment:');
  console.log('  npm start');
} catch (err) {
  console.error(`Could not load environment configuration: ${err.message}`);
}
