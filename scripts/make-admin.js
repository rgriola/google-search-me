#!/usr/bin/env node

/**
 * Make User Admin Script
 * Updates a user's admin status in the database
 * 
 * Usage: node scripts/make-admin.js <username>
 * Example: node scripts/make-admin.js rodczaro
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path - check both possible locations
const dbPaths = [
    path.join(__dirname, '..', 'server', 'locations.db'),
    path.join(__dirname, '..', 'locations.db')
];

let dbPath = null;
for (const testPath of dbPaths) {
    try {
        const fs = await import('fs');
        if (fs.existsSync(testPath)) {
            dbPath = testPath;
            break;
        }
    } catch (err) {
        // Continue to next path
    }
}

if (!dbPath) {
    console.error('❌ Database not found. Please ensure the server has been started at least once.');
    process.exit(1);
}

console.log(`📂 Using database: ${dbPath}`);

const { verbose } = sqlite3;

/**
 * Make a user admin
 */
async function makeUserAdmin(username) {
    return new Promise((resolve, reject) => {
        const db = new (verbose().Database)(dbPath, (err) => {
            if (err) {
                reject(new Error(`Failed to open database: ${err.message}`));
                return;
            }

            console.log(`🔍 Looking for user: ${username}`);

            // First check if user exists
            db.get(
                'SELECT id, username, email, is_admin FROM users WHERE username = ?',
                [username],
                (err, row) => {
                    if (err) {
                        db.close();
                        reject(new Error(`Database error: ${err.message}`));
                        return;
                    }

                    if (!row) {
                        db.close();
                        reject(new Error(`User '${username}' not found in database`));
                        return;
                    }

                    console.log(`👤 Found user: ${row.username} (${row.email})`);
                    console.log(`🔒 Current admin status: ${row.is_admin ? 'YES' : 'NO'}`);

                    if (row.is_admin) {
                        console.log(`✅ User '${username}' is already an admin`);
                        db.close();
                        resolve(row);
                        return;
                    }

                    // Update user to admin
                    db.run(
                        'UPDATE users SET is_admin = 1, updated_at = CURRENT_TIMESTAMP WHERE username = ?',
                        [username],
                        function(err) {
                            if (err) {
                                db.close();
                                reject(new Error(`Failed to update user: ${err.message}`));
                                return;
                            }

                            if (this.changes === 0) {
                                db.close();
                                reject(new Error(`No changes made. User '${username}' may not exist.`));
                                return;
                            }

                            console.log(`🎉 Successfully made '${username}' an admin!`);
                            
                            // Verify the change
                            db.get(
                                'SELECT id, username, email, is_admin FROM users WHERE username = ?',
                                [username],
                                (err, updatedRow) => {
                                    db.close();
                                    
                                    if (err) {
                                        reject(new Error(`Verification error: ${err.message}`));
                                        return;
                                    }

                                    console.log(`✅ Verified: ${updatedRow.username} is now admin: ${updatedRow.is_admin ? 'YES' : 'NO'}`);
                                    resolve(updatedRow);
                                }
                            );
                        }
                    );
                }
            );
        });
    });
}

/**
 * Main execution
 */
async function main() {
    const username = process.argv[2];

    if (!username) {
        console.error('❌ Usage: node scripts/make-admin.js <username>');
        console.error('❌ Example: node scripts/make-admin.js rodczaro');
        process.exit(1);
    }

    try {
        await makeUserAdmin(username);
        console.log(`\n🎯 Admin privileges granted to: ${username}`);
        console.log('🔧 You can now use admin features in the application');
    } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { makeUserAdmin };
