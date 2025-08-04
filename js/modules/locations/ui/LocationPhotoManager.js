/**
 * Location Photo Manager
 * Handles all photo-related operations for location forms and dialogs
 * Extracted from LocationsUI.js to improve modularity and maintainability
 */

import { StateManager } from '../../state/AppState.js';
import { PhotoDisplayService } from '../../photos/PhotoDisplayService.js';
import { SecurityUtils } from '../../../utils/SecurityUtils.js';

/**
 * LocationPhotoManager - Manages photo upload, preview, and validation
 */
export class LocationPhotoManager {
  
  constructor(notificationService = null) {
    this.notifications = notificationService;
  }

  /**
   * Show notification using injected service or fallback
   * @param {string} message - Message text
   * @param {string} type - Notification type
   */
  showNotification(message, type = 'info') {
    if (this.notifications) {
      this.notifications.showNotification(message, type);
    } else if (window.Auth) {
      const { AuthNotificationService } = window.Auth.getServices();
      AuthNotificationService.showNotification(message, type);
    } else {
      // Simple fallback
      alert(message);
    }
  }

  /**
   * Toggle photo upload section
   * @param {string} mode - 'edit' or 'save'
   */
  togglePhotoUpload(mode) {
    const uploadSection = document.getElementById(`${mode}-photo-upload`);
    const toggleBtn = document.querySelector(`#${mode}-location-form .photo-toggle-btn, #${mode}-location-dialog .photo-toggle-btn`);
    
    if (uploadSection) {
      const isVisible = uploadSection.style.display !== 'none';
      uploadSection.style.display = isVisible ? 'none' : 'block';
      
      if (toggleBtn) {
        const toggleText = toggleBtn.querySelector('.toggle-text');
        if (toggleText) {
          toggleText.textContent = isVisible ? 'Add Photos' : 'Hide Photos';
        }
      }
    }
  }

  /**
   * Handle drag and drop for photos
   * @param {Event} event - Drop event
   * @param {string} mode - 'edit' or 'save'
   */
  handlePhotoDrop(event, mode) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    this.processPhotoFiles(files, mode);
  }

  /**
   * Allow drop for drag and drop
   * @param {Event} event - Dragover event
   */
  allowDrop(event) {
    event.preventDefault();
  }

  /**
   * Handle file input change for photos
   * @param {Event} event - Change event
   * @param {string} mode - 'edit' or 'save'
   */
  handlePhotoFile(event, mode) {
    const files = event.target.files;
    this.processPhotoFiles(files, mode);
  }

  /**
   * Process selected photo files
   * @param {FileList} files - Selected files
   * @param {string} mode - 'edit' or 'save'
   */
  processPhotoFiles(files, mode) {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        if (file.size <= 10 * 1024 * 1024) { // 10MB limit
          const reader = new FileReader();
          reader.onload = (e) => {
            this.addPhotoPreview(e.target.result, file, mode);
          };
          reader.readAsDataURL(file);
        } else {
          this.showNotification(`File ${file.name} is too large. Maximum size is 10MB.`, 'error');
        }
      }
    });
  }

  /**
   * Add photo preview with caption input - Auto-queues photo for upload
   * @param {string} src - Image data URL
   * @param {File} file - File object
   * @param {string} mode - 'edit' or 'save'
   */
  addPhotoPreview(src, file, mode) {
    const previewContainer = document.getElementById(`${mode}-photo-preview`);
    if (!previewContainer) return;
    
    // Check for duplicate files in the appropriate queue
    const targetQueue = mode === 'edit' ? window.pendingEditPhotos : window.pendingPhotos;
    if (targetQueue) {
      const existingPhotoIndex = targetQueue.findIndex(existingPhoto => 
        existingPhoto.file.name === file.name && 
        existingPhoto.file.size === file.size &&
        existingPhoto.file.lastModified === file.lastModified
      );
      
      if (existingPhotoIndex !== -1) {
        console.log(`🔍 Duplicate photo detected for ${mode} mode: ${file.name} - replacing existing`);
        // Remove the existing photo from queue and preview
        const existingPhoto = targetQueue[existingPhotoIndex];
        targetQueue.splice(existingPhotoIndex, 1);
        
        // Remove existing preview if it exists
        const existingPreview = document.querySelector(`[data-unique-id="${existingPhoto.uniqueId}"]`);
        if (existingPreview) {
          existingPreview.remove();
        }
        
        this.showNotification(`Photo ${file.name} replaced in queue`, 'info');
      }
    }
    
    const uniqueId = Date.now() + Math.random(); // Unique ID for this preview item
    
    // Auto-queue the photo immediately
    const fileWithCaption = {
      file: file,
      caption: '', // Start with empty caption, can be updated later
      name: file.name,
      size: file.size,
      uniqueId: uniqueId
    };
    
    // Add to appropriate pending queue
    if (mode === 'edit') {
      if (!window.pendingEditPhotos) window.pendingEditPhotos = [];
      window.pendingEditPhotos.push(fileWithCaption);
      console.log('🔍 Auto-queued photo for edit mode:', file.name);
    } else {
      if (!window.pendingPhotos) window.pendingPhotos = [];
      window.pendingPhotos.push(fileWithCaption);
      console.log('🔍 Auto-queued photo for save mode:', file.name);
    }
    
    const previewItem = document.createElement('div');
    previewItem.className = 'photo-preview-item';
    previewItem.dataset.uniqueId = uniqueId;
    previewItem.innerHTML = `
      <div class="preview-image-container">
        <img src="${SecurityUtils.escapeHtmlAttribute(src)}" alt="Preview">
        <button type="button" class="remove-preview-btn" 
                data-action="removePhoto" 
                data-mode="${SecurityUtils.escapeHtmlAttribute(mode)}">×</button>
      </div>
      <div class="preview-info">
        <div class="file-name">${SecurityUtils.escapeHtml(file.name)}</div>
        <div class="file-size">${(file.size / 1024 / 1024).toFixed(1)}MB</div>
        <div class="upload-status queued">✅ Queued for upload</div>
        <textarea class="photo-caption-input" 
                  placeholder="Add a caption for this photo (optional)..." 
                  maxlength="200" 
                  rows="2"
                  data-unique-id="${SecurityUtils.escapeHtmlAttribute(uniqueId.toString())}"
                  data-mode="${SecurityUtils.escapeHtmlAttribute(mode)}"></textarea>
        <div class="caption-char-count" id="caption-count-${SecurityUtils.escapeHtmlAttribute(uniqueId.toString())}">0/200 characters</div>
        <div class="caption-validation-error" id="caption-error-${SecurityUtils.escapeHtmlAttribute(uniqueId.toString())}"></div>
      </div>
    `;
    
    // Store file data and reference to queue item
    previewItem._fileData = file;
    previewItem._queueItem = fileWithCaption;
    
    console.log('🖼️ Adding photo preview to container:', previewContainer.id);
    console.log('🖼️ Preview item HTML length:', previewItem.innerHTML.length);
    console.log('🖼️ File data:', { name: file.name, size: file.size, type: file.type });
    
    previewContainer.appendChild(previewItem);
    
    console.log('🖼️ Preview container now has', previewContainer.children.length, 'children');
    
    // Setup event delegation for this preview item
    this.setupPhotoEventDelegation(previewItem);
    
    // Show success notification
    this.showNotification(`Photo "${file.name}" queued for upload`, 'success');
  }

  /**
   * Remove photo preview and from pending queue
   * @param {HTMLElement} button - Remove button element
   * @param {string} mode - 'edit' or 'save'
   */
  removePhotoPreview(button, mode) {
    const previewItem = button.closest('.photo-preview-item');
    if (previewItem) {
      const uniqueId = previewItem.dataset.uniqueId;
      
      // Remove from pending queue
      if (mode === 'edit' && window.pendingEditPhotos) {
        window.pendingEditPhotos = window.pendingEditPhotos.filter(photo => photo.uniqueId != uniqueId);
        console.log('🔍 Removed photo from edit queue, remaining:', window.pendingEditPhotos.length);
      } else if (mode === 'save' && window.pendingPhotos) {
        window.pendingPhotos = window.pendingPhotos.filter(photo => photo.uniqueId != uniqueId);
        console.log('🔍 Removed photo from save queue, remaining:', window.pendingPhotos.length);
      }
      
      // Get filename for notification
      const fileName = previewItem.querySelector('.file-name')?.textContent || 'photo';
      
      // Remove preview element
      previewItem.remove();
      
      // Show notification
      this.showNotification(`Photo "${fileName}" removed from upload queue`, 'info');
    }
  }

  /**
   * Setup event delegation for photo preview items
   * @param {HTMLElement} previewItem - Preview item element
   */
  setupPhotoEventDelegation(previewItem) {
    // Handle remove button clicks
    const removeBtn = previewItem.querySelector('.remove-preview-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        this.removePhotoPreview(e.target, mode);
      });
    }
    
    // Handle caption input events
    const captionInput = previewItem.querySelector('.photo-caption-input');
    if (captionInput) {
      captionInput.addEventListener('input', (e) => {
        const uniqueId = parseInt(e.target.dataset.uniqueId);
        const mode = e.target.dataset.mode;
        this.updatePhotoCaption(e.target, uniqueId, mode);
      });
      
      captionInput.addEventListener('blur', (e) => {
        const uniqueId = parseInt(e.target.dataset.uniqueId);
        this.validatePhotoCaption(e.target, uniqueId);
      });
    }
  }

  /**
   * Update photo caption in pending queue
   * @param {HTMLElement} textarea - Caption textarea element
   * @param {number} uniqueId - Unique ID for this preview item
   * @param {string} mode - 'edit' or 'save'
   */
  updatePhotoCaption(textarea, uniqueId, mode) {
    const caption = textarea.value.trim();
    
    // Update caption in pending queue
    if (mode === 'edit' && window.pendingEditPhotos) {
      const photo = window.pendingEditPhotos.find(p => p.uniqueId == uniqueId);
      if (photo) {
        photo.caption = caption;
        console.log('🔍 Updated edit photo caption:', caption);
      }
    } else if (mode === 'save' && window.pendingPhotos) {
      const photo = window.pendingPhotos.find(p => p.uniqueId == uniqueId);
      if (photo) {
        photo.caption = caption;
        console.log('🔍 Updated save photo caption:', caption);
      }
    }
    
    // Also run validation
    this.validatePhotoCaption(textarea, uniqueId);
  }

  /**
   * Validate photo caption input
   * @param {HTMLElement} textarea - Caption textarea element
   * @param {number} uniqueId - Unique ID for this preview item
   * @returns {boolean} Whether caption is valid
   */
  validatePhotoCaption(textarea, uniqueId) {
    const caption = textarea.value.trim();
    const charCount = document.getElementById(`caption-count-${uniqueId}`);
    const errorDiv = document.getElementById(`caption-error-${uniqueId}`);
    const currentLength = caption.length;
    const maxLength = 200;
    
    // Update character count
    if (charCount) {
      charCount.textContent = `${currentLength}/${maxLength} characters`;
      
      // Update character count styling
      charCount.className = 'caption-char-count';
      if (currentLength > maxLength * 0.8) {
        charCount.classList.add('warning');
      }
      if (currentLength >= maxLength) {
        charCount.classList.add('error');
      }
    }
    
    // Validate caption content
    let isValid = true;
    let errorMessage = '';
    
    // Check for inappropriate content (basic validation)
    const forbiddenPatterns = [
      /\b(fuck|shit|damn|bitch|asshole|cunt|piss|cock|dick|pussy)\b/gi,
      /<script\b/gi, // Prevent XSS
      /javascript:/gi, // Prevent XSS
      /on\w+\s*=/gi // Prevent event handlers
    ];
    
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(caption)) {
        isValid = false;
        errorMessage = 'Caption contains inappropriate content or invalid characters';
        break;
      }
    }
    
    // Check for excessive special characters
    const specialCharCount = (caption.match(/[^a-zA-Z0-9\s\-.,!?()]/g) || []).length;
    if (specialCharCount > currentLength * 0.3) {
      isValid = false;
      errorMessage = 'Caption contains too many special characters';
    }
    
    // Check minimum meaningful length if not empty
    if (currentLength > 0 && currentLength < 3) {
      isValid = false;
      errorMessage = 'Caption must be at least 3 characters long or left empty';
    }
    
    // Update UI based on validation
    if (!isValid && currentLength > 0) {
      textarea.style.borderColor = '#dc3545';
      if (errorDiv) {
        errorDiv.textContent = errorMessage;
        errorDiv.style.display = 'block';
      }
    } else {
      textarea.style.borderColor = '#ced4da';
      if (errorDiv) {
        errorDiv.style.display = 'none';
      }
    }
    
    // Store validation state on the textarea element
    textarea.dataset.isValid = isValid;
    
    return isValid;
  }

  /**
   * Load existing photos for edit form
   * @param {string} placeId - Location place ID
   */
  async loadEditFormPhotos(placeId) {
    if (!placeId) return;
    
    try {
      // Try to find the edit photos grid container
      const photosContainer = document.getElementById('edit-photos-grid') || 
                             document.getElementById('existing-photos-grid');
      
      if (!photosContainer) {
        console.warn(`📷 Edit photos container not found for placeId: ${placeId}`);
        return;
      }
      
      console.log(`📷 Loading edit form photos for location: ${placeId}`);
      
      // Load photos using PhotoDisplayService
      await PhotoDisplayService.loadAndDisplayPhotos(placeId, photosContainer, {
        showCaptions: true,
        showPrimaryBadge: true,
        showUploader: false,
        clickable: true,
        layout: 'grid',
        imageSize: 'card',
        emptyMessage: 'No photos available for this location',
        maxPhotos: 12 // Show more photos in edit mode
      });
      
      console.log(`✅ Edit form photos loaded successfully for location: ${placeId}`);
      
    } catch (error) {
      console.error('Error loading edit form photos:', error);
      this.showNotification('Failed to load existing photos', 'error');
    }
  }

  /**
   * Upload pending photos with captions
   * @param {Array} pendingPhotos - Array of photo objects with file and caption
   * @param {string} placeId - Location place ID
   */
  async uploadPendingPhotos(pendingPhotos, placeId) {
    console.log('📸 === PHOTO UPLOAD DEBUG START ===');
    console.log('📸 uploadPendingPhotos called with:', {
      photosCount: pendingPhotos ? pendingPhotos.length : 0,
      placeId: placeId,
      photosArray: pendingPhotos
    });
    
    if (!pendingPhotos || pendingPhotos.length === 0) {
      console.log('🔍 No pending photos to upload');
      return;
    }
    
    console.log('🔍 Uploading pending photos:', pendingPhotos.length, 'to place_id:', placeId);
    
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        console.error('❌ No auth token found');
        throw new Error('Authentication required');
      }
      
      console.log('🔍 Auth token available for photo upload, length:', authToken.length);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const photoData of pendingPhotos) {
        try {
          console.log('🔍 === UPLOADING INDIVIDUAL PHOTO ===');
          console.log('🔍 Photo data:', {
            name: photoData.name,
            file: photoData.file,
            caption: photoData.caption,
            fileSize: photoData.file?.size,
            fileType: photoData.file?.type
          });
          
          const formData = new FormData();
          formData.append('photo', photoData.file);
          formData.append('placeId', placeId);
          
          if (photoData.caption && photoData.caption.trim()) {
            formData.append('caption', photoData.caption.trim());
            console.log('🔍 Photo caption:', photoData.caption.trim());
          }
          
          const uploadUrl = `${StateManager.getApiBaseUrl()}/photos/upload`;
          console.log('🔍 Upload URL:', uploadUrl);
          console.log('🔍 Upload placeId:', placeId);
          console.log('🔍 Photo file size:', photoData.file.size);
          console.log('🔍 Photo file type:', photoData.file.type);
          
          console.log('🔍 Making fetch request to:', uploadUrl);
          
          // ✅ FIXED: Use dynamic API URL instead of hardcoded localhost
          const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            body: formData
          });
          
          console.log('🔍 Upload response status:', response.status);
          console.log('🔍 Upload response ok:', response.ok);
          console.log('🔍 Upload response statusText:', response.statusText);
          
          const responseText = await response.text();
          console.log('🔍 Raw response text:', responseText);
          
          if (response.ok) {
            successCount++;
            let responseData;
            try {
              responseData = JSON.parse(responseText);
              console.log(`✅ Uploaded photo: ${photoData.name}`, responseData);
            } catch (parseError) {
              console.warn('⚠️ Could not parse response as JSON:', parseError);
              console.log(`✅ Uploaded photo: ${photoData.name} (non-JSON response)`);
            }
          } else {
            errorCount++;
            let errorData;
            try {
              errorData = JSON.parse(responseText);
              console.error(`❌ Failed to upload photo ${photoData.name}:`, response.status, errorData);
            } catch (parseError) {
              console.error(`❌ Failed to upload photo ${photoData.name}:`, response.status, responseText);
            }
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Error uploading photo ${photoData.name}:`, error);
        }
      }
      
      console.log('📸 === PHOTO UPLOAD SUMMARY ===');
      console.log('📸 Total photos processed:', pendingPhotos.length);
      console.log('📸 Successful uploads:', successCount);
      console.log('📸 Failed uploads:', errorCount);
      
      // Show summary notification
      if (successCount > 0) {
        this.showNotification(`Successfully uploaded ${successCount} photo${successCount > 1 ? 's' : ''}`, 'success');
      }
      
      if (errorCount > 0) {
        this.showNotification(`Failed to upload ${errorCount} photo${errorCount > 1 ? 's' : ''}`, 'error');
      }
      
      console.log('📸 === PHOTO UPLOAD DEBUG END ===');
      
    } catch (error) {
      console.error('❌ Error uploading pending photos:', error);
      this.showNotification('Failed to upload photos', 'error');
    }
  }

  /**
   * Load photos for dialog display
   * @param {string} placeId - Place ID to load photos for
   */
  async loadDialogPhotos(placeId) {
    if (!placeId) return;
    
    try {
      // First try the LocationDialogService container format
      let photosContainer = document.querySelector(`.location-photos-container[data-place-id="${placeId}"]`);
      
      if (!photosContainer) {
        // Fallback to LocationTemplates format (with escaped ID)
        const escapedPlaceId = SecurityUtils.escapeHtmlAttribute(placeId);
        photosContainer = document.querySelector(`#location-photos-${escapedPlaceId}`);
      }
      
      if (!photosContainer) {
        console.warn(`📷 Photos container not found for placeId: ${placeId}`);
        
        // Final fallback: try to find any photos container in the dialog
        photosContainer = document.querySelector('.dialog:not(.hidden) .location-photos-container, .dialog:not(.hidden) .location-photos');
        if (photosContainer) {
          console.log('📷 Found fallback photos container in dialog');
        } else {
          console.warn('📷 No photos container found at all');
          return;
        }
      }
      
      console.log(`📷 Loading photos for location: ${placeId} (container found)`);
      
      // Load photos using PhotoDisplayService
      await PhotoDisplayService.loadAndDisplayPhotos(placeId, photosContainer, {
        showCaptions: true,
        showPrimaryBadge: true,
        showUploader: true,
        clickable: true,
        layout: 'grid',
        imageSize: 'card',
        emptyMessage: 'No photos available for this location',
        maxPhotos: 6 // Limit to 6 photos in dialog
      });
      
      console.log(`✅ Photos loaded successfully for location: ${placeId}`);
      
    } catch (error) {
      console.error('Error loading dialog photos:', error);
    }
  }
}
