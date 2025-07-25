#!/usr/bin/env node

/**
 * Fix MIME Types Script
 * Corrects incomplete MIME types in the location_photos table
 * Official Database: ./server/locations.db
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'server/locations.db');

function fixMimeTypes() {
    const db = new Database(dbPath);
    
    try {
        console.log('🔧 Starting MIME type fix...');
        
        // Get all photos with incomplete MIME types
        const photosToFix = db.prepare(`
            SELECT id, mime_type, original_filename 
            FROM location_photos 
            WHERE mime_type = 'image' OR mime_type NOT LIKE 'image/%'
        `).all();
        
        console.log(`📊 Found ${photosToFix.length} photos with incorrect MIME types`);
        
        if (photosToFix.length === 0) {
            console.log('✅ No MIME types need fixing!');
            return;
        }
        
        // Begin transaction
        const updateStmt = db.prepare(`
            UPDATE location_photos 
            SET mime_type = ? 
            WHERE id = ?
        `);
        
        const transaction = db.transaction((photos) => {
            for (const photo of photos) {
                let correctedMimeType = 'image/jpeg'; // Default fallback
                
                if (photo.original_filename) {
                    const ext = photo.original_filename.toLowerCase().split('.').pop();
                    switch (ext) {
                        case 'jpg':
                        case 'jpeg':
                            correctedMimeType = 'image/jpeg';
                            break;
                        case 'png':
                            correctedMimeType = 'image/png';
                            break;
                        case 'gif':
                            correctedMimeType = 'image/gif';
                            break;
                        case 'webp':
                            correctedMimeType = 'image/webp';
                            break;
                        case 'bmp':
                            correctedMimeType = 'image/bmp';
                            break;
                        case 'svg':
                            correctedMimeType = 'image/svg+xml';
                            break;
                        default:
                            correctedMimeType = 'image/jpeg'; // Fallback
                    }
                }
                
                console.log(`📝 Fixing photo ID ${photo.id}: "${photo.mime_type}" → "${correctedMimeType}" (${photo.original_filename})`);
                updateStmt.run(correctedMimeType, photo.id);
            }
        });
        
        transaction(photosToFix);
        
        // Verify the fixes
        const verifyResults = db.prepare(`
            SELECT id, mime_type, original_filename 
            FROM location_photos 
            WHERE mime_type LIKE 'image/%'
            ORDER BY id
        `).all();
        
        console.log('\n✅ MIME type fix completed!');
        console.log(`📊 Fixed ${photosToFix.length} photos`);
        console.log('\n📋 Current MIME types:');
        verifyResults.forEach(photo => {
            console.log(`   ID ${photo.id}: ${photo.mime_type} (${photo.original_filename})`);
        });
        
    } catch (error) {
        console.error('❌ Error fixing MIME types:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Run the fix
fixMimeTypes();
