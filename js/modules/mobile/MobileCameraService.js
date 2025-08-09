/**
 * Mobile Camera Service
 * Handles camera access, photo capture, and mobile-optimized photo upload
 * Dependencies: ImageKit integration, PhotoService API
 */

export class MobileCameraService {
    
    constructor() {
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.isActive = false;
        this.facingMode = 'environment'; // Start with back camera
        this.constraints = {
            video: {
                facingMode: this.facingMode,
                width: { ideal: 1920, max: 1920 },
                height: { ideal: 1080, max: 1080 }
            },
            audio: false
        };
    }

    /**
     * Initialize camera with mobile optimizations
     * @returns {Promise<boolean>} Success status
     */
    async initializeCamera() {
        try {
            console.log('📸 Initializing mobile camera...');
            
            // Check camera support
            if (!this.isCameraSupported()) {
                throw new Error('Camera not supported on this device');
            }

            // Request camera permissions
            const hasPermission = await this.requestCameraPermission();
            if (!hasPermission) {
                throw new Error('Camera permission denied');
            }

            return true;
        } catch (error) {
            console.error('❌ Camera initialization failed:', error);
            return false;
        }
    }

    /**
     * Check if camera is supported
     * @returns {boolean} Camera support status
     */
    isCameraSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    /**
     * Request camera permission
     * @returns {Promise<boolean>} Permission granted status
     */
    async requestCameraPermission() {
        try {
            const result = await navigator.permissions.query({ name: 'camera' });
            
            if (result.state === 'granted') {
                return true;
            } else if (result.state === 'prompt') {
                // Will be prompted when getUserMedia is called
                return true;
            } else {
                return false;
            }
        } catch (error) {
            // Fallback for browsers that don't support permissions API
            console.log('Permissions API not supported, will check on getUserMedia call');
            return true;
        }
    }

    /**
     * Start camera stream
     * @param {HTMLVideoElement} videoElement - Video element to attach stream
     * @returns {Promise<boolean>} Success status
     */
    async startCamera(videoElement) {
        try {
            console.log('🎥 Starting camera stream...');
            
            if (this.stream) {
                this.stopCamera();
            }

            this.video = videoElement;
            this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);
            
            this.video.srcObject = this.stream;
            this.video.play();
            
            this.isActive = true;
            console.log('✅ Camera stream started');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to start camera:', error);
            this.handleCameraError(error);
            return false;
        }
    }

    /**
     * Stop camera stream
     */
    stopCamera() {
        try {
            console.log('🛑 Stopping camera stream...');
            
            if (this.stream) {
                this.stream.getTracks().forEach(track => {
                    track.stop();
                });
                this.stream = null;
            }
            
            if (this.video) {
                this.video.srcObject = null;
            }
            
            this.isActive = false;
            console.log('✅ Camera stream stopped');
        } catch (error) {
            console.error('❌ Error stopping camera:', error);
        }
    }

    /**
     * Switch between front and back camera
     * @returns {Promise<boolean>} Success status
     */
    async switchCamera() {
        try {
            console.log('🔄 Switching camera...');
            
            // Toggle facing mode
            this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
            this.constraints.video.facingMode = this.facingMode;
            
            // Restart camera with new constraints
            if (this.isActive && this.video) {
                await this.startCamera(this.video);
            }
            
            console.log(`✅ Switched to ${this.facingMode} camera`);
            return true;
        } catch (error) {
            console.error('❌ Failed to switch camera:', error);
            // Revert facing mode on error
            this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
            this.constraints.video.facingMode = this.facingMode;
            return false;
        }
    }

    /**
     * Capture photo from video stream
     * @param {Object} options - Capture options
     * @returns {Promise<Object>} Captured photo data
     */
    async capturePhoto(options = {}) {
        try {
            console.log('📸 Capturing photo...');
            
            if (!this.isActive || !this.video) {
                throw new Error('Camera not active');
            }

            const config = {
                quality: options.quality || 0.8,
                maxWidth: options.maxWidth || 1920,
                maxHeight: options.maxHeight || 1080,
                format: options.format || 'image/jpeg'
            };

            // Create canvas for capture
            if (!this.canvas) {
                this.canvas = document.createElement('canvas');
            }

            const context = this.canvas.getContext('2d');
            
            // Set canvas dimensions based on video
            const videoWidth = this.video.videoWidth;
            const videoHeight = this.video.videoHeight;
            
            // Calculate optimal dimensions maintaining aspect ratio
            const { width, height } = this.calculateOptimalDimensions(
                videoWidth, videoHeight, config.maxWidth, config.maxHeight
            );
            
            this.canvas.width = width;
            this.canvas.height = height;

            // Draw video frame to canvas
            context.drawImage(this.video, 0, 0, width, height);

            // Convert to blob
            const blob = await this.canvasToBlob(this.canvas, config.format, config.quality);
            
            const photoData = {
                blob: blob,
                dataUrl: this.canvas.toDataURL(config.format, config.quality),
                width: width,
                height: height,
                size: blob.size,
                timestamp: new Date().toISOString(),
                facingMode: this.facingMode
            };

            console.log('✅ Photo captured:', {
                size: `${Math.round(blob.size / 1024)}KB`,
                dimensions: `${width}x${height}`,
                camera: this.facingMode
            });

            return photoData;
        } catch (error) {
            console.error('❌ Photo capture failed:', error);
            throw error;
        }
    }

    /**
     * Calculate optimal dimensions maintaining aspect ratio
     */
    calculateOptimalDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        let width = originalWidth;
        let height = originalHeight;

        // Scale down if necessary
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
     * Convert canvas to blob
     */
    async canvasToBlob(canvas, format, quality) {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create blob from canvas'));
                }
            }, format, quality);
        });
    }

    /**
     * Handle camera errors with user-friendly messages
     */
    handleCameraError(error) {
        let userMessage = 'Camera access failed. ';
        
        if (error.name === 'NotAllowedError') {
            userMessage += 'Please allow camera access and try again.';
        } else if (error.name === 'NotFoundError') {
            userMessage += 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
            userMessage += 'Camera not supported on this device.';
        } else if (error.name === 'OverconstrainedError') {
            userMessage += 'Camera settings not supported.';
        } else {
            userMessage += 'Please check your camera and try again.';
        }

        console.error('Camera error details:', error);
        return userMessage;
    }

    /**
     * Get available cameras (if supported)
     * @returns {Promise<Array>} Available camera devices
     */
    async getAvailableCameras() {
        try {
            if (!navigator.mediaDevices.enumerateDevices) {
                return [];
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(device => device.kind === 'videoinput');
            
            console.log(`📹 Found ${cameras.length} camera(s)`);
            return cameras;
        } catch (error) {
            console.error('❌ Failed to enumerate cameras:', error);
            return [];
        }
    }

    /**
     * Check if device has multiple cameras
     * @returns {Promise<boolean>} Multiple cameras available
     */
    async hasMultipleCameras() {
        const cameras = await this.getAvailableCameras();
        return cameras.length > 1;
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopCamera();
        
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
        }
        
        this.video = null;
    }
}
