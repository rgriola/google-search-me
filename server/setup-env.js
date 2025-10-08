#!/usr/bin/env node

/**
 * Environment Setup Script
 * 
 * Usage:
 *   node setup-env.js [environment]
 * 
 * Copies the correct .env file for the environment to .env,
 * and sets NODE_ENV accordingly.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const env = args[0] || 'development';

const validEnvironments = ['development', 'production', 'test'];
if (!validEnvironments.includes(env)) {
  console.error(`Error: Invalid environment "${env}". Valid options are: ${validEnvironments.join(', ')}`);
  process.exit(1);
}

const envFileMap = {
  development: '.env.development',
  production: '.env.production',
  test: '.env.test'
};

const srcEnvFile = path.join(__dirname, envFileMap[env] || `.env.${env}`);
const destEnvFile = path.join(__dirname, '.env');

// Check if the source env file exists
if (!fs.existsSync(srcEnvFile)) {
  console.error(`Error: ${srcEnvFile} does not exist. Please create it with the correct variables for ${env}.`);
  process.exit(1);
}

// Copy the environment file to .env
fs.copyFileSync(srcEnvFile, destEnvFile);

// Append/overwrite NODE_ENV at the end of .env
fs.appendFileSync(destEnvFile, `\nNODE_ENV=${env}\n`);

console.log(`✅ Environment set to ${env}. Copied ${srcEnvFile} to .env.`);

// Optionally, show a summary of the config
try {
  const envConfigModule = await import(`./config/environments/${env}.js`);
  const envConfig = envConfigModule.default;
  console.log('\nACTIVE CONFIGURATION:');
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
