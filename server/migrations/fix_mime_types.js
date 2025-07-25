/**
 * Migration: Fix MIME types in location_photos table
 * Updates incorrect MIME types to proper format based on file extensions
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../locations.db');

async function fixMimeTypes() {
    const db = new Database(dbPath);
    
    try {
        console.log('🔄 Starting MIME type fix for location_photos table...');
        
        // Begin transaction
        db.exec('BEGIN TRANSACTION');
        
        // Get all photos with their current mime_type and original_filename
        const photos = db.prepare('SELECT id, mime_type, original_filename FROM location_photos').all();
        
        console.log(`📋 Found ${photos.length} photos to check`);
        
        let updatedCount = 0;
        
        // Update each photo with correct MIME type
        const updateStmt = db.prepare('UPDATE location_photos SET mime_type = ? WHERE id = ?');
        
        for (const photo of photos) {
            let correctMimeType = null;
            
            // Determine correct MIME type based on file extension
            if (photo.original_filename) {
                const ext = path.extname(photo.original_filename).toLowerCase();
                switch (ext) {
                    case '.jpg':
                    case '.jpeg':
                        correctMimeType = 'image/jpeg';
                        break;
                    case '.png':
                        correctMimeType = 'image/png';
                        break;
                    case '.webp':
                        correctMimeType = 'image/webp';
                        break;
                    case '.gif':
                        correctMimeType = 'image/gif';
                        break;
                    default:
                        // If no extension or unknown, default to jpeg
                        correctMimeType = 'image/jpeg';
                        console.log(`⚠️  Unknown extension for ${photo.original_filename}, defaulting to image/jpeg`);
                }
            } else {
                // No filename, default to jpeg
                correctMimeType = 'image/jpeg';
                console.log(`⚠️  No filename for photo ID ${photo.id}, defaulting to image/jpeg`);
            }
            
            // Only update if the MIME type is different
            if (photo.mime_type !== correctMimeType) {
                updateStmt.run(correctMimeType, photo.id);
                updatedCount++;
                console.log(`✅ Updated photo ID ${photo.id}: "${photo.mime_type}" → "${correctMimeType}" (${photo.original_filename})`);
            } else {
                console.log(`✅ Photo ID ${photo.id} already has correct MIME type: ${correctMimeType}`);
            }
        }
        
        // Commit transaction
        db.exec('COMMIT');
        console.log(`🎉 MIME type fix completed successfully!`);
        console.log(`📊 Statistics:`);
        console.log(`   - Photos checked: ${photos.length}`);
        console.log(`   - Photos updated: ${updatedCount}`);
        console.log(`   - Photos unchanged: ${photos.length - updatedCount}`);
        
        // Show updated data
        const updatedPhotos = db.prepare('SELECT id, mime_type, original_filename FROM location_photos ORDER BY id').all();
        console.log('\n📋 Updated MIME types:');
        updatedPhotos.forEach(photo => {
            console.log(`   ID ${photo.id}: ${photo.mime_type} (${photo.original_filename})`);
        });
        
    } catch (error) {
        console.error('❌ Error fixing MIME types:', error);
        db.exec('ROLLBACK');
        throw error;
    } finally {
        db.close();
    }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    fixMimeTypes()
        .then(() => {
            console.log('✅ Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

export { fixMimeTypes };
