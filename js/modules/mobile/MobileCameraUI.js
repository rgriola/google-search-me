/**
 * Mobile Camera UI
 * Mobile-optimized camera interface with touch controls and photo capture
 * Dependencies: MobileCameraService, MobilePhotoUploadService, mobile-app.js
 */

import { MobileCameraService } from './MobileCameraService.js';
import { MobilePhotoUploadService } from './MobilePhotoUploadService.js';

export class MobileCameraUI {
    
    constructor() {
        this.cameraService = new MobileCameraService();
        this.uploadService = new MobilePhotoUploadService();
        this.isOpen = false;
        this.currentPlaceId = null;
        this.capturedPhotos = [];
        this.setupEventListeners();
    }

    /**
     * Open camera interface for location
     * @param {string} placeId - Location place ID
     * @param {Object} options - Camera options
     */
    async openCamera(placeId, options = {}) {
        try {
            console.log('📸 Opening mobile camera for location:', placeId);

            this.currentPlaceId = placeId;
            this.capturedPhotos = [];

            // Create camera UI
            this.createCameraUI();

            // Initialize camera
            const initialized = await this.cameraService.initializeCamera();
            if (!initialized) {
                throw new Error('Failed to initialize camera');
            }

            // Start camera stream
            const videoElement = document.getElementById('mobileCameraVideo');
            const started = await this.cameraService.startCamera(videoElement);
            if (!started) {
                throw new Error('Failed to start camera');
            }

            this.isOpen = true;
            this.updateCameraControls();

            console.log('✅ Mobile camera opened successfully');

        } catch (error) {
            console.error('❌ Failed to open camera:', error);
            this.showError(error.message);
            this.closeCamera();
        }
    }

    /**
     * Create camera UI elements
     */
    createCameraUI() {
        // Remove existing camera UI
        this.removeCameraUI();

        const cameraHTML = `
            <div id="mobileCameraOverlay" class="mobile-camera-overlay">
                <div class="mobile-camera-container">
                    <!-- Camera Header -->
                    <div class="mobile-camera-header">
                        <button id="closeCameraBtn" class="camera-btn close-btn">
                            <span class="camera-icon">✕</span>
                        </button>
                        <div class="camera-title">Add Photo</div>
                        <button id="switchCameraBtn" class="camera-btn switch-btn">
                            <span class="camera-icon">🔄</span>
                        </button>
                    </div>

                    <!-- Camera Viewport -->
                    <div class="mobile-camera-viewport">
                        <video id="mobileCameraVideo" class="camera-video" playsinline autoplay muted></video>
                        
                        <!-- Camera Overlay Elements -->
                        <div class="camera-overlay-elements">
                            <!-- Focus indicator -->
                            <div id="focusIndicator" class="focus-indicator"></div>
                            
                            <!-- Grid lines (optional) -->
                            <div class="camera-grid" id="cameraGrid">
                                <div class="grid-line vertical"></div>
                                <div class="grid-line vertical"></div>
                                <div class="grid-line horizontal"></div>
                                <div class="grid-line horizontal"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Camera Controls -->
                    <div class="mobile-camera-controls">
                        <!-- Gallery Preview -->
                        <div class="camera-gallery-preview" id="galleryPreview">
                            <div class="gallery-count" id="galleryCount">0</div>
                        </div>

                        <!-- Capture Button -->
                        <button id="captureBtn" class="capture-btn">
                            <div class="capture-btn-inner"></div>
                        </button>

                        <!-- Flash Toggle -->
                        <button id="flashBtn" class="camera-btn flash-btn">
                            <span class="camera-icon">⚡</span>
                        </button>
                    </div>

                    <!-- Photo Review Modal -->
                    <div id="photoReviewModal" class="photo-review-modal hidden">
                        <div class="photo-review-header">
                            <button id="discardPhotoBtn" class="camera-btn">
                                <span class="camera-icon">🗑️</span>
                            </button>
                            <div class="photo-review-title">Photo Preview</div>
                            <button id="savePhotoBtn" class="camera-btn save-btn">
                                <span class="camera-icon">✓</span>
                            </button>
                        </div>
                        
                        <div class="photo-review-content">
                            <img id="photoPreview" class="photo-preview-img" alt="Captured photo">
                        </div>
                        
                        <div class="photo-review-controls">
                            <textarea id="photoCaptionInput" class="photo-caption-input" 
                                placeholder="Add a caption (optional)..." maxlength="500"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', cameraHTML);
        this.bindCameraEvents();
    }

    /**
     * Bind camera UI events
     */
    bindCameraEvents() {
        // Close camera
        document.getElementById('closeCameraBtn').addEventListener('click', () => {
            this.closeCamera();
        });

        // Switch camera
        document.getElementById('switchCameraBtn').addEventListener('click', async () => {
            await this.switchCamera();
        });

        // Capture photo
        document.getElementById('captureBtn').addEventListener('click', async () => {
            await this.capturePhoto();
        });

        // Gallery preview
        document.getElementById('galleryPreview').addEventListener('click', () => {
            this.showGallery();
        });

        // Photo review controls
        document.getElementById('discardPhotoBtn').addEventListener('click', () => {
            this.discardPhoto();
        });

        document.getElementById('savePhotoBtn').addEventListener('click', async () => {
            await this.savePhoto();
        });

        // Touch controls for focus
        const video = document.getElementById('mobileCameraVideo');
        video.addEventListener('touchstart', (e) => {
            this.handleTouchFocus(e);
        });

        // Prevent body scroll when camera is open
        document.addEventListener('touchmove', (e) => {
            if (this.isOpen) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /**
     * Switch between front and back camera
     */
    async switchCamera() {
        try {
            const btn = document.getElementById('switchCameraBtn');
            btn.style.opacity = '0.5';
            btn.disabled = true;

            await this.cameraService.switchCamera();

            btn.style.opacity = '1';
            btn.disabled = false;

        } catch (error) {
            console.error('❌ Failed to switch camera:', error);
            this.showError('Failed to switch camera');
        }
    }

    /**
     * Capture photo from camera
     */
    async capturePhoto() {
        try {
            const captureBtn = document.getElementById('captureBtn');
            captureBtn.classList.add('capturing');

            // Add haptic feedback if available
            this.triggerHapticFeedback();

            const photoData = await this.cameraService.capturePhoto({
                quality: 0.9,
                maxWidth: 1920,
                maxHeight: 1080
            });

            // Show photo review
            this.showPhotoReview(photoData);

            captureBtn.classList.remove('capturing');

        } catch (error) {
            console.error('❌ Photo capture failed:', error);
            this.showError('Failed to capture photo');
        }
    }

    /**
     * Show photo review modal
     */
    showPhotoReview(photoData) {
        const modal = document.getElementById('photoReviewModal');
        const preview = document.getElementById('photoPreview');
        
        preview.src = photoData.dataUrl;
        modal.classList.remove('hidden');

        // Store current photo data
        this.currentPhotoData = photoData;
    }

    /**
     * Discard current photo
     */
    discardPhoto() {
        const modal = document.getElementById('photoReviewModal');
        modal.classList.add('hidden');
        
        // Clear photo data
        this.currentPhotoData = null;
        
        // Clear caption
        document.getElementById('photoCaptionInput').value = '';
    }

    /**
     * Save current photo
     */
    async savePhoto() {
        try {
            if (!this.currentPhotoData || !this.currentPlaceId) {
                throw new Error('No photo data or location available');
            }

            const caption = document.getElementById('photoCaptionInput').value.trim();
            const saveBtn = document.getElementById('savePhotoBtn');
            
            // Show upload progress
            saveBtn.innerHTML = '<span class="camera-icon">⏳</span>';
            saveBtn.disabled = true;

            // Upload photo
            const result = await this.uploadService.uploadPhoto(
                this.currentPhotoData,
                this.currentPlaceId,
                {
                    caption: caption,
                    onProgress: (progress) => {
                        console.log(`Upload progress: ${progress.percentage}%`);
                    }
                }
            );

            // Add to captured photos
            this.capturedPhotos.push({
                ...this.currentPhotoData,
                caption: caption,
                uploadResult: result
            });

            this.updateGalleryCount();
            this.discardPhoto();
            this.showSuccess('Photo saved successfully!');

            console.log('✅ Photo saved and uploaded:', result);

        } catch (error) {
            console.error('❌ Failed to save photo:', error);
            this.showError('Failed to save photo');
            
            // Reset save button
            const saveBtn = document.getElementById('savePhotoBtn');
            saveBtn.innerHTML = '<span class="camera-icon">✓</span>';
            saveBtn.disabled = false;
        }
    }

    /**
     * Handle touch focus
     */
    handleTouchFocus(event) {
        event.preventDefault();
        
        const touch = event.touches[0];
        const video = event.target;
        const rect = video.getBoundingClientRect();
        
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Show focus indicator
        this.showFocusIndicator(x, y);
    }

    /**
     * Show focus indicator at touch point
     */
    showFocusIndicator(x, y) {
        const indicator = document.getElementById('focusIndicator');
        
        indicator.style.left = `${x - 25}px`;
        indicator.style.top = `${y - 25}px`;
        indicator.style.display = 'block';
        indicator.classList.add('active');
        
        setTimeout(() => {
            indicator.classList.remove('active');
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 200);
        }, 1000);
    }

    /**
     * Update camera controls
     */
    async updateCameraControls() {
        // Check if device has multiple cameras
        const hasMultipleCameras = await this.cameraService.hasMultipleCameras();
        const switchBtn = document.getElementById('switchCameraBtn');
        
        if (hasMultipleCameras) {
            switchBtn.style.display = 'block';
        } else {
            switchBtn.style.display = 'none';
        }

        this.updateGalleryCount();
    }

    /**
     * Update gallery count
     */
    updateGalleryCount() {
        const countElement = document.getElementById('galleryCount');
        if (countElement) {
            countElement.textContent = this.capturedPhotos.length;
            
            const preview = document.getElementById('galleryPreview');
            if (this.capturedPhotos.length > 0) {
                preview.classList.add('has-photos');
            } else {
                preview.classList.remove('has-photos');
            }
        }
    }

    /**
     * Show captured photos gallery
     */
    showGallery() {
        if (this.capturedPhotos.length === 0) {
            this.showInfo('No photos captured yet');
            return;
        }

        // For now, just show count - could expand to full gallery
        this.showInfo(`${this.capturedPhotos.length} photo(s) captured`);
    }

    /**
     * Close camera interface
     */
    closeCamera() {
        console.log('📸 Closing mobile camera...');

        this.cameraService.stopCamera();
        this.removeCameraUI();
        this.isOpen = false;
        this.currentPlaceId = null;
        this.currentPhotoData = null;

        // Notify mobile app
        if (window.mobileApp && typeof window.mobileApp.onCameraClosed === 'function') {
            window.mobileApp.onCameraClosed(this.capturedPhotos);
        }
    }

    /**
     * Remove camera UI
     */
    removeCameraUI() {
        const overlay = document.getElementById('mobileCameraOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Trigger haptic feedback
     */
    triggerHapticFeedback() {
        if (navigator.vibrate) {
            navigator.vibrate(50); // 50ms vibration
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // Use NotificationService if available, otherwise alert
        if (window.NotificationService) {
            window.NotificationService.show(message, 'error');
        } else {
            alert(`Error: ${message}`);
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        if (window.NotificationService) {
            window.NotificationService.show(message, 'success');
        } else {
            console.log(`Success: ${message}`);
        }
    }

    /**
     * Show info message
     */
    showInfo(message) {
        if (window.NotificationService) {
            window.NotificationService.show(message, 'info');
        } else {
            console.log(`Info: ${message}`);
        }
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Handle hardware back button on mobile
        document.addEventListener('backbutton', () => {
            if (this.isOpen) {
                this.closeCamera();
            }
        });

        // Handle device orientation changes
        window.addEventListener('orientationchange', () => {
            if (this.isOpen) {
                setTimeout(() => {
                    this.updateCameraLayout();
                }, 100);
            }
        });
    }

    /**
     * Update camera layout after orientation change
     */
    updateCameraLayout() {
        // Adjust camera viewport for new orientation
        const video = document.getElementById('mobileCameraVideo');
        if (video) {
            // Force video to recalculate dimensions
            video.style.width = '100%';
            video.style.height = '100%';
        }
    }

    /**
     * Get captured photos
     * @returns {Array} Array of captured photo data
     */
    getCapturedPhotos() {
        return this.capturedPhotos;
    }

    /**
     * Clear captured photos
     */
    clearCapturedPhotos() {
        this.capturedPhotos = [];
        this.updateGalleryCount();
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.closeCamera();
        this.cameraService.cleanup();
    }
}
