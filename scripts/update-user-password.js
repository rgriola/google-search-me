#!/usr/bin/env node

/**
 * Production Database Update Script
 * Run this on Render to update user passwords manually
 * 
 * yoyu can also run it locally in dev to generate the search
 * 
 * Usage: node scripts/update-user-password.js "lvelocci" "Test1234$$"
 */

import bcrypt from 'bcrypt';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get command line arguments
const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
    console.log('Usage: node scripts/update-user-password.js <username> <password>');
    console.log('Example: node scripts/update-user-password.js "lvelocci" "Test1234$$"');
    process.exit(1);
}

async function updateUserPassword() {
    try {
        // Determine database path (production or development)
        const dbPath = process.env.NODE_ENV === 'production' 
            ? '/opt/render/project/database/locations.db'
            : './server/locations.db';

          //  /opt/render/project/database/locations.db
        
        console.log(`🔧 Connecting to database: ${dbPath}`);
        
        // Connect to database
        const db = new Database(dbPath);
        
        // Hash the password
        console.log('🔐 Hashing password...');
        const passwordHash = await bcrypt.hash(password, 12);
        
        // Check if user exists
        const existingUser = db.prepare('SELECT username, email FROM users WHERE username = ?').get(username);
        
        if (!existingUser) {
            console.error(`❌ User '${username}' not found in database`);
            process.exit(1);
        }
        
        console.log(`📧 Found user: ${existingUser.username} (${existingUser.email})`);
        
        // Update user password and verify email
        const updateResult = db.prepare(`
            UPDATE users 
            SET password_hash = ?, 
                email_verified = 1,
                updated_date = datetime('now')
            WHERE username = ?
        `).run(passwordHash, username);
        
        if (updateResult.changes > 0) {
            console.log(`✅ Password updated successfully for user: ${username}`);
            console.log(`📧 Email verification set to: verified`);
            console.log(`📊 Rows affected: ${updateResult.changes}`);
        } else {
            console.error(`❌ Failed to update password for user: ${username}`);
        }
        
        // Close database connection
        db.close();
        
    } catch (error) {
        console.error('❌ Error updating password:', error);
        process.exit(1);
    }
}

// Run the update
updateUserPassword();
