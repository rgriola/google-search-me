#!/usr/bin/env node

/**
 * Environment Verification Script
 * 
 * This script checks if your environment configuration is set up correctly.
 * It verifies both server and client configuration for consistency.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get directory name (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Environment Configuration Verification\n');

// Check current environment
const currentEnv = process.env.NODE_ENV || 'development';
console.log(`Current NODE_ENV: ${currentEnv}`);

// Verify .env files
const envFiles = [
  { file: '.env', required: true },
  { file: '.env.production', required: false }
];

console.log('\n📁 Checking environment files:');
envFiles.forEach(({ file, required }) => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : required ? '❌' : '⚠️'} ${file} ${exists ? 'found' : 'not found'}`);
  
  if (exists) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      console.log(`   Contains ${lines.length} configuration values`);
    } catch (err) {
      console.log(`   Could not read file: ${err.message}`);
    }
  } else if (required) {
    console.log(`   Creating default ${file}...`);
    fs.writeFileSync(filePath, `NODE_ENV=${currentEnv}\n`);
    console.log(`   ✅ Created with default values`);
  }
});

// Check server environment configuration files
console.log('\n📁 Server environment configurations:');

const serverEnvs = ['development', 'production', 'test'];
serverEnvs.forEach(env => {
  const configPath = path.join(__dirname, 'server', 'config', 'environments', `${env}.js`);
  const exists = fs.existsSync(configPath);
  console.log(`${exists ? '✅' : '❌'} ${env}.js ${exists ? 'found' : 'not found'}`);
});

// Check client environment configuration
console.log('\n📁 Client environment configuration:');
const clientEnvPath = path.join(__dirname, 'js', 'modules', 'config', 'environment.js');
const clientEnvExists = fs.existsSync(clientEnvPath);
console.log(`${clientEnvExists ? '✅' : '❌'} environment.js ${clientEnvExists ? 'found' : 'not found'}`);

if (clientEnvExists) {
  try {
    // Check if file content includes development and production configurations
    const content = fs.readFileSync(clientEnvPath, 'utf8');
    const hasDev = content.includes('development:');
    const hasProd = content.includes('production:');
    
    console.log(`   Development config: ${hasDev ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Production config: ${hasProd ? '✅ Found' : '❌ Missing'}`);
  } catch (err) {
    console.log(`   Could not analyze file: ${err.message}`);
  }
}

// Summary
console.log('\n📊 Configuration Summary:');
console.log('-------------------------');
console.log(`✅ Environment system is using ${currentEnv} mode`);
if (currentEnv === 'production') {
  console.log('⚠️ Running in production mode requires proper environment variables');
  console.log('   Make sure JWT_SECRET and SESSION_SECRET are properly set');
}

console.log('\n🔄 To switch environments, run:');
console.log('   npm run dev:setup    # For development');
console.log('   npm run prod:setup   # For production');
console.log('   npm run test:setup   # For testing');

console.log('\n📝 For more details, see CONFIG_GUIDE.md');
