/**
 * Mobile Photo Upload Service
 * Handles mobile-optimized photo uploads with progress, compression, and ImageKit integration
 * Dependencies: ImageKit backend API, MobileCameraService
 */

export class MobilePhotoUploadService {
    
    constructor() {
        this.uploadQueue = [];
        this.isUploading = false;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.compressionQuality = 0.8;
        this.progressCallbacks = new Map();
    }

    /**
     * Upload photo with mobile optimizations
     * @param {Object} photoData - Photo data from camera or file input
     * @param {string} placeId - Location place ID
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Upload result
     */
    async uploadPhoto(photoData, placeId, options = {}) {
        try {
            console.log('📤 Starting mobile photo upload...');

            const config = {
                caption: options.caption || '',
                compress: options.compress !== false,
                onProgress: options.onProgress || null,
                retries: options.retries || 3,
                ...options
            };

            // Validate inputs
            this.validateUploadData(photoData, placeId);

            // Compress photo if needed
            let uploadBlob = photoData.blob;
            if (config.compress && this.shouldCompress(uploadBlob)) {
                uploadBlob = await this.compressPhoto(photoData, config);
            }

            // Create form data
            const formData = this.createFormData(uploadBlob, placeId, config);

            // Upload with progress tracking
            const result = await this.performUpload(formData, config);

            console.log('✅ Mobile photo upload successful:', result);
            return result;

        } catch (error) {
            console.error('❌ Mobile photo upload failed:', error);
            throw this.handleUploadError(error);
        }
    }

    /**
     * Upload multiple photos in sequence
     * @param {Array} photoDataArray - Array of photo data objects
     * @param {string} placeId - Location place ID
     * @param {Object} options - Upload options
     * @returns {Promise<Array>} Upload results
     */
    async uploadMultiplePhotos(photoDataArray, placeId, options = {}) {
        try {
            console.log(`📤 Uploading ${photoDataArray.length} photos...`);

            const results = [];
            const config = {
                onBatchProgress: options.onBatchProgress || null,
                ...options
            };

            for (let i = 0; i < photoDataArray.length; i++) {
                const photoData = photoDataArray[i];
                
                try {
                    // Update batch progress
                    if (config.onBatchProgress) {
                        config.onBatchProgress({
                            current: i + 1,
                            total: photoDataArray.length,
                            percentage: Math.round(((i + 1) / photoDataArray.length) * 100)
                        });
                    }

                    const result = await this.uploadPhoto(photoData, placeId, {
                        ...options,
                        onProgress: (progress) => {
                            if (config.onBatchProgress) {
                                config.onBatchProgress({
                                    current: i + 1,
                                    total: photoDataArray.length,
                                    currentProgress: progress,
                                    percentage: Math.round(((i + progress.percentage / 100) / photoDataArray.length) * 100)
                                });
                            }
                        }
                    });

                    results.push(result);

                } catch (error) {
                    console.error(`❌ Failed to upload photo ${i + 1}:`, error);
                    results.push({ error: error.message, index: i });
                }
            }

            console.log(`✅ Batch upload completed: ${results.filter(r => !r.error).length}/${photoDataArray.length} successful`);
            return results;

        } catch (error) {
            console.error('❌ Batch upload failed:', error);
            throw error;
        }
    }

    /**
     * Validate upload data
     */
    validateUploadData(photoData, placeId) {
        if (!photoData || !photoData.blob) {
            throw new Error('Invalid photo data - blob required');
        }

        if (!placeId) {
            throw new Error('Place ID is required for photo upload');
        }

        if (photoData.blob.size > this.maxFileSize) {
            throw new Error(`Photo too large. Maximum size: ${Math.round(this.maxFileSize / 1024 / 1024)}MB`);
        }

        if (!photoData.blob.type.startsWith('image/')) {
            throw new Error('Invalid file type. Only images are supported.');
        }
    }

    /**
     * Check if photo should be compressed
     */
    shouldCompress(blob) {
        const compressionThreshold = 2 * 1024 * 1024; // 2MB
        return blob.size > compressionThreshold;
    }

    /**
     * Compress photo for mobile upload
     * @param {Object} photoData - Original photo data
     * @param {Object} config - Compression config
     * @returns {Promise<Blob>} Compressed photo blob
     */
    async compressPhoto(photoData, config) {
        try {
            console.log('🗜️ Compressing photo for mobile upload...');

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            return new Promise((resolve, reject) => {
                img.onload = () => {
                    try {
                        // Calculate compressed dimensions
                        const maxWidth = config.maxWidth || 1600;
                        const maxHeight = config.maxHeight || 1200;
                        const quality = config.quality || this.compressionQuality;

                        const { width, height } = this.calculateCompressedDimensions(
                            img.width, img.height, maxWidth, maxHeight
                        );

                        canvas.width = width;
                        canvas.height = height;

                        // Draw and compress
                        ctx.drawImage(img, 0, 0, width, height);

                        canvas.toBlob((compressedBlob) => {
                            if (compressedBlob) {
                                const originalSize = Math.round(photoData.blob.size / 1024);
                                const compressedSize = Math.round(compressedBlob.size / 1024);
                                const savings = Math.round(((photoData.blob.size - compressedBlob.size) / photoData.blob.size) * 100);

                                console.log(`✅ Photo compressed: ${originalSize}KB → ${compressedSize}KB (${savings}% savings)`);
                                resolve(compressedBlob);
                            } else {
                                reject(new Error('Compression failed'));
                            }
                        }, 'image/jpeg', quality);

                    } catch (error) {
                        reject(error);
                    }
                };

                img.onerror = () => reject(new Error('Failed to load image for compression'));
                img.src = photoData.dataUrl || URL.createObjectURL(photoData.blob);
            });

        } catch (error) {
            console.error('❌ Photo compression failed:', error);
            // Return original blob if compression fails
            return photoData.blob;
        }
    }

    /**
     * Calculate compressed dimensions maintaining aspect ratio
     */
    calculateCompressedDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        let width = originalWidth;
        let height = originalHeight;

        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }

        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }

        return { width: Math.round(width), height: Math.round(height) };
    }

    /**
     * Create form data for upload
     */
    createFormData(blob, placeId, config) {
        const formData = new FormData();
        
        // Create filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = blob.type === 'image/png' ? 'png' : 'jpg';
        const filename = `mobile-photo-${timestamp}.${extension}`;

        formData.append('photo', blob, filename);
        formData.append('place_id', placeId);
        
        if (config.caption) {
            formData.append('caption', config.caption);
        }

        // Add mobile-specific metadata
        formData.append('source', 'mobile_app');
        formData.append('upload_timestamp', new Date().toISOString());

        return formData;
    }

    /**
     * Perform upload with progress tracking
     */
    async performUpload(formData, config) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const uploadId = Date.now().toString();

            // Track progress
            if (config.onProgress) {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const progress = {
                            loaded: event.loaded,
                            total: event.total,
                            percentage: Math.round((event.loaded / event.total) * 100)
                        };
                        config.onProgress(progress);
                    }
                });
            }

            // Handle response
            xhr.addEventListener('load', () => {
                try {
                    if (xhr.status === 200 || xhr.status === 201) {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } else {
                        const errorText = xhr.responseText || `HTTP ${xhr.status}`;
                        reject(new Error(`Upload failed: ${errorText}`));
                    }
                } catch (error) {
                    reject(new Error(`Invalid response: ${error.message}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });

            xhr.addEventListener('timeout', () => {
                reject(new Error('Upload timeout'));
            });

            // Configure request
            xhr.timeout = 60000; // 60 second timeout
            xhr.open('POST', '/api/photos/upload');

            // Add authentication if available
            const authToken = localStorage.getItem('authToken');
            if (authToken) {
                xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
            }

            // Start upload
            xhr.send(formData);
        });
    }

    /**
     * Handle upload errors with user-friendly messages
     */
    handleUploadError(error) {
        let userMessage = 'Photo upload failed. ';

        if (error.message.includes('Network error')) {
            userMessage += 'Please check your connection and try again.';
        } else if (error.message.includes('timeout')) {
            userMessage += 'Upload took too long. Please try again.';
        } else if (error.message.includes('too large')) {
            userMessage += 'Photo is too large. Please try a smaller image.';
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
            userMessage += 'Please log in and try again.';
        } else if (error.message.includes('413')) {
            userMessage += 'Photo is too large for upload.';
        } else if (error.message.includes('415')) {
            userMessage += 'Photo format not supported.';
        } else {
            userMessage += 'Please try again.';
        }

        return new Error(userMessage);
    }

    /**
     * Upload photo from file input (for non-camera uploads)
     * @param {File} file - File from input element
     * @param {string} placeId - Location place ID  
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Upload result
     */
    async uploadFromFile(file, placeId, options = {}) {
        try {
            console.log('📁 Uploading photo from file...');

            // Convert File to photo data format
            const photoData = {
                blob: file,
                dataUrl: await this.fileToDataUrl(file),
                width: 0, // Will be determined during compression
                height: 0,
                size: file.size,
                timestamp: new Date().toISOString(),
                source: 'file_input'
            };

            return await this.uploadPhoto(photoData, placeId, options);

        } catch (error) {
            console.error('❌ File upload failed:', error);
            throw error;
        }
    }

    /**
     * Convert File to data URL
     */
    fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Get upload progress for a specific upload
     * @param {string} uploadId - Upload identifier
     * @returns {Object|null} Progress data
     */
    getUploadProgress(uploadId) {
        return this.progressCallbacks.get(uploadId) || null;
    }

    /**
     * Cancel ongoing upload (if supported)
     * @param {string} uploadId - Upload identifier
     */
    cancelUpload(uploadId) {
        // Implementation would depend on tracking active XHR requests
        console.log(`Upload cancellation requested for ${uploadId}`);
    }
}
