/**
 * ImageKit Configuration
 * Handles image upload, optimization, and delivery
 */

import ImageKit from 'imagekit';
import { config } from './environment.js';

let imagekit = null;

/**
 * Initialize ImageKit client
 */
export function initializeImageKit() {
    try {
        console.log('🔧 ImageKit config values:');
        console.log('  publicKey:', config.IMAGEKIT_PUBLIC_KEY ? `${config.IMAGEKIT_PUBLIC_KEY.substring(0, 10)}...` : 'MISSING');
        console.log('  privateKey:', config.IMAGEKIT_PRIVATE_KEY ? `${config.IMAGEKIT_PRIVATE_KEY.substring(0, 10)}...` : 'MISSING');
        console.log('  urlEndpoint:', config.IMAGEKIT_URL_ENDPOINT || 'MISSING');
        
        if (!config.IMAGEKIT_PUBLIC_KEY || !config.IMAGEKIT_PRIVATE_KEY || !config.IMAGEKIT_URL_ENDPOINT) {
            console.error('❌ Missing required ImageKit configuration');
            return null;
        }
        
        imagekit = new ImageKit({
            publicKey: config.IMAGEKIT_PUBLIC_KEY,
            privateKey: config.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: config.IMAGEKIT_URL_ENDPOINT
        });
        
        console.log('✅ ImageKit initialized successfully');
        return imagekit;
    } catch (error) {
        console.error('❌ Failed to initialize ImageKit:', error.message);
        throw error;
    }
}

/**
 * Get ImageKit client instance
 */
export function getImageKit() {
    if (!imagekit) {
        throw new Error('ImageKit not initialized. Call initializeImageKit() first.');
    }
    return imagekit;
}

/**
 * Upload image to ImageKit
 * @param {Buffer|String} file - File buffer or base64 string
 * @param {String} fileName - Name for the uploaded file
 * @param {String} folder - Folder path in ImageKit (optional)
 * @param {Array} tags - Tags for the image (optional)
 * @returns {Promise} Upload result
 */
export async function uploadImage(file, fileName, folder = 'locations', tags = []) {
    try {
        const result = await imagekit.upload({
            file, // Buffer or base64 string
            fileName,
            folder: `/${folder}`,
            tags: ['location', 'user-upload', ...tags],
            useUniqueFileName: true,
            overwriteFile: false,
        });

        console.log('✅ Image uploaded successfully:', result.fileId);
        return result;
    } catch (error) {
        console.error('❌ Image upload failed:', error.message);
        throw error;
    }
}

/**
 * Delete image from ImageKit
 * @param {String} fileId - ImageKit file ID
 * @returns {Promise} Delete result
 */
export async function deleteImage(fileId) {
    try {
        // Ensure ImageKit is initialized
        if (!imagekit) {
            console.log('🔧 ImageKit not initialized, initializing now...');
            initializeImageKit();
        }
        
        if (!imagekit) {
            throw new Error('ImageKit failed to initialize - check your configuration');
        }
        
        console.log(`🗑️ Attempting to delete image from ImageKit: ${fileId}`);
        const result = await imagekit.deleteFile(fileId);
        console.log('✅ Image deleted successfully from ImageKit:', fileId);
        return result;
    } catch (error) {
        console.error('❌ Image deletion failed for file ID:', fileId, 'Error:', error.message);
        throw error;
    }
}

/**
 * Generate optimized image URL
 * @param {String} imagePath - ImageKit image path
 * @param {Object} transformations - Image transformations
 * @returns {String} Optimized image URL
 */
export function getOptimizedImageUrl(imagePath, transformations = {}) {
    const defaultTransformations = {
        quality: 80,
        format: 'auto',
        progressive: true
    };

    const finalTransformations = { ...defaultTransformations, ...transformations };
    
    return imagekit.url({
        path: imagePath,
        transformation: Object.entries(finalTransformations).map(([key, value]) => ({
            [key]: value
        }))
    });
}

/**
 * Get authentication parameters for client-side upload
 * @returns {Object} Authentication parameters
 */
export function getAuthenticationParameters() {
    try {
        const authenticationParameters = imagekit.getAuthenticationParameters();
        return authenticationParameters;
    } catch (error) {
        console.error('❌ Failed to get authentication parameters:', error.message);
        throw error;
    }
}

/**
 * Common image transformation presets
 */
export const IMAGE_PRESETS = {
    thumbnail: {
        width: 150,
        height: 150,
        crop: 'pad_resize',
        background: 'auto'
    },
    card: {
        width: 300,
        height: 200,
        crop: 'pad_resize',
        quality: 80
    },
    large: {
        width: 800,
        height: 600,
        crop: 'pad_resize',
        quality: 85
    },
    mobile: {
        width: 400,
        height: 300,
        crop: 'pad_resize',
        quality: 80,
        format: 'webp'
    }
};
