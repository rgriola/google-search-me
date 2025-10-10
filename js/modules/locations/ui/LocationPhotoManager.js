/**
 * Location Photo Manager
 * Handles all photo-related operations for location forms and dialogs
 * Extracted from LocationsUI.js to improve modularity and maintainability
 */

import { StateManager } from '../../state/AppState.js';
import { PhotoDisplayService } from '../../photos/PhotoDisplayService.js';
import { SecurityUtils } from '../../../utils/SecurityUtils.js';
import { Auth } from '../../auth/Auth.js';

import { debug, DEBUG } from '../../../debug.js';

// File identifier for debug logging
const FILE = 'LOCATION_PHOTO_MANAGER';

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
        debug(FILE, `Duplicate photo detected for ${mode} mode: ${file.name} - replacing existing`);
        const existingPhoto = targetQueue[existingPhotoIndex];
        targetQueue.splice(existingPhotoIndex, 1);

        const existingPreview = document.querySelector(`[data-unique-id="${existingPhoto.uniqueId}"]`);
        if (existingPreview) {
          existingPreview.remove();
        }

        this.showNotification(`Photo ${file.name} replaced in queue`, 'info');
      }
    }

    const uniqueId = Date.now() + Math.random();

    const fileWithCaption = {
      file: file,
      caption: '',
      name: file.name,
      size: file.size,
      uniqueId: uniqueId
    };

    if (mode === 'edit') {
      if (!window.pendingEditPhotos) window.pendingEditPhotos = [];
      window.pendingEditPhotos.push(fileWithCaption);
      debug(FILE, 'Auto-queued photo for edit mode:', file.name);
    } else {
      if (!window.pendingPhotos) window.pendingPhotos = [];
      window.pendingPhotos.push(fileWithCaption);
      debug(FILE, 'Auto-queued photo for save mode:', file.name);
    }

    // --- DOM construction starts here ---
    const previewItem = document.createElement('div');
    previewItem.className = 'photo-preview-item';
    previewItem.dataset.uniqueId = uniqueId;

    // Image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'preview-image-container';

    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Preview';
    imageContainer.appendChild(img);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-preview-btn';
    removeBtn.setAttribute('data-action', 'removePhoto');
    removeBtn.setAttribute('data-mode', mode);
    removeBtn.textContent = '×';
    imageContainer.appendChild(removeBtn);

    // Info container
    const infoContainer = document.createElement('div');
    infoContainer.className = 'preview-info';

    const fileNameDiv = document.createElement('div');
    fileNameDiv.className = 'file-name';
    fileNameDiv.textContent = file.name;
    infoContainer.appendChild(fileNameDiv);

    const fileSizeDiv = document.createElement('div');
    fileSizeDiv.className = 'file-size';
    fileSizeDiv.textContent = `${(file.size / 1024 / 1024).toFixed(1)}MB`;
    infoContainer.appendChild(fileSizeDiv);

    const uploadStatusDiv = document.createElement('div');
    uploadStatusDiv.className = 'upload-status queued';
    uploadStatusDiv.textContent = '✅ Queued for upload';
    infoContainer.appendChild(uploadStatusDiv);

    const captionTextarea = document.createElement('textarea');
    captionTextarea.className = 'photo-caption-input';
    captionTextarea.placeholder = 'Add a caption for this photo (optional)...';
    captionTextarea.maxLength = 200;
    captionTextarea.rows = 2;
    captionTextarea.setAttribute('data-unique-id', uniqueId.toString());
    captionTextarea.setAttribute('data-mode', mode);
    infoContainer.appendChild(captionTextarea);

    const charCountDiv = document.createElement('div');
    charCountDiv.className = 'caption-char-count';
    charCountDiv.id = `caption-count-${uniqueId}`;
    charCountDiv.textContent = '0/200 characters';
    infoContainer.appendChild(charCountDiv);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'caption-validation-error';
    errorDiv.id = `caption-error-${uniqueId}`;
    infoContainer.appendChild(errorDiv);

    // Assemble preview item
    previewItem.appendChild(imageContainer);
    previewItem.appendChild(infoContainer);

    previewItem._fileData = file;
    previewItem._queueItem = fileWithCaption;

    debug(FILE, 'Adding photo preview to container:', previewContainer.id);
    debug(FILE, 'File data:', { name: file.name, size: file.size, type: file.type });

    previewContainer.appendChild(previewItem);

    debug(FILE, 'Preview container now has', previewContainer.children.length, 'children');

    this.setupPhotoEventDelegation(previewItem);
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
        debug(FILE, 'Removed photo from edit queue, remaining:', window.pendingEditPhotos.length);
      } else if (mode === 'save' && window.pendingPhotos) {
        window.pendingPhotos = window.pendingPhotos.filter(photo => photo.uniqueId != uniqueId);
        debug(FILE, 'Removed photo from save queue, remaining:', window.pendingPhotos.length);
      }
      
      const fileName = previewItem.querySelector('.file-name')?.textContent || 'photo';
      previewItem.remove();
      this.showNotification(`Photo "${fileName}" removed from upload queue`, 'info');
    }
  }

  /**
   * Setup event delegation for photo preview items
   * @param {HTMLElement} previewItem - Preview item element
   */
  setupPhotoEventDelegation(previewItem) {
    const removeBtn = previewItem.querySelector('.remove-preview-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        const mode = e.target.dataset.mode;
        this.removePhotoPreview(e.target, mode);
      });
    }
    
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
    if (mode === 'edit' && window.pendingEditPhotos) {
      const photo = window.pendingEditPhotos.find(p => p.uniqueId == uniqueId);
      if (photo) {
        photo.caption = caption;
        debug(FILE, 'Updated edit photo caption:', caption);
      }
    } else if (mode === 'save' && window.pendingPhotos) {
      const photo = window.pendingPhotos.find(p => p.uniqueId == uniqueId);
      if (photo) {
        photo.caption = caption;
        debug(FILE, 'Updated save photo caption:', caption);
      }
    }
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
    
    if (charCount) {
      charCount.textContent = `${currentLength}/${maxLength} characters`;
      charCount.className = 'caption-char-count';
      if (currentLength > maxLength * 0.8) {
        charCount.classList.add('warning');
      }
      if (currentLength >= maxLength) {
        charCount.classList.add('error');
      }
    }
    
    let isValid = true;
    let errorMessage = '';
    const forbiddenPatterns = [
      /\b(fuck|shit|damn|bitch|asshole|cunt|piss|cock|dick|pussy)\b/gi,
      /<script\b/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(caption)) {
        isValid = false;
        errorMessage = 'Caption contains inappropriate content or invalid characters';
        break;
      }
    }
    const specialCharCount = (caption.match(/[^a-zA-Z0-9\s\-.,!?()]/g) || []).length;
    if (specialCharCount > currentLength * 0.3) {
      isValid = false;
      errorMessage = 'Caption contains too many special characters';
    }
    if (currentLength > 0 && currentLength < 3) {
      isValid = false;
      errorMessage = 'Caption must be at least 3 characters long or left empty';
    }
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
      const photosContainer = document.getElementById('edit-photos-grid') || 
                             document.getElementById('existing-photos-grid');
      if (!photosContainer) {
        debug(FILE, `Edit photos container not found for placeId: ${placeId}`, null, 'warn');
        return;
      }
      debug(FILE, `Loading edit form photos for location: ${placeId}`);
      await PhotoDisplayService.loadAndDisplayPhotos(placeId, photosContainer, {
        showCaptions: true,
        showPrimaryBadge: true,
        showUploader: false,
        clickable: true,
        layout: 'grid',
        imageSize: 'card',
        emptyMessage: 'No photos available for this location',
        maxPhotos: 12
      });
      debug(FILE, `Edit form photos loaded successfully for location: ${placeId}`);
    } catch (error) {
      debug(FILE, 'Error loading edit form photos:', error, 'error');
      this.showNotification('Failed to load existing photos', 'error');
    }
  }

  /**
   * Upload pending photos with captions
   * @param {Array} pendingPhotos - Array of photo objects with file and caption
   * @param {string} placeId - Location place ID
   */
  async uploadPendingPhotos(pendingPhotos, placeId) {
    debug(FILE, '=== PHOTO UPLOAD DEBUG START ===');
    debug(FILE, 'uploadPendingPhotos called with:', {
      photosCount: pendingPhotos ? pendingPhotos.length : 0,
      placeId: placeId,
      photosArray: pendingPhotos
    });
    if (!pendingPhotos || pendingPhotos.length === 0) {
      debug(FILE, 'No pending photos to upload');
      return;
    }
    debug(FILE, 'Uploading pending photos:', pendingPhotos.length, 'to place_id:', placeId);
    try {
      const authToken = Auth.getToken();
      if (!authToken) {
        debug(FILE, 'No auth token found', null, 'error');
        throw new Error('Authentication required');
      }
      debug(FILE, 'Auth token available for photo upload, length:', authToken.length);
      let successCount = 0;
      let errorCount = 0;
      for (const photoData of pendingPhotos) {
        try {
          debug(FILE, '=== UPLOADING INDIVIDUAL PHOTO ===');
          debug(FILE, 'Photo data:', {
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
            debug(FILE, 'Photo caption:', photoData.caption.trim());
          }
          const uploadUrl = `${StateManager.getApiBaseUrl()}/photos/upload`;
          debug(FILE, 'Upload URL:', uploadUrl);
          debug(FILE, 'Upload placeId:', placeId);
          debug(FILE, 'Photo file size:', photoData.file.size);
          debug(FILE, 'Photo file type:', photoData.file.type);
          debug(FILE, 'Making fetch request to:', uploadUrl);
          const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            body: formData
          });
          debug(FILE, 'Upload response status:', response.status);
          debug(FILE, 'Upload response ok:', response.ok);
          debug(FILE, 'Upload response statusText:', response.statusText);
          const responseText = await response.text();
          debug(FILE, 'Raw response text:', responseText);
          if (response.ok) {
            successCount++;
            let responseData;
            try {
              responseData = JSON.parse(responseText);
              debug(FILE, `Uploaded photo: ${photoData.name}`, responseData);
            } catch (parseError) {
              debug(FILE, 'Could not parse response as JSON:', parseError, 'warn');
              debug(FILE, `Uploaded photo: ${photoData.name} (non-JSON response)`);
            }
          } else {
            errorCount++;
            let errorData;
            try {
              errorData = JSON.parse(responseText);
              debug(FILE, `Failed to upload photo ${photoData.name}:`, response.status, errorData, 'error');
            } catch (parseError) {
              debug(FILE, `Failed to upload photo ${photoData.name}:`, response.status, responseText, 'error');
            }
          }
        } catch (error) {
          errorCount++;
          debug(FILE, `Error uploading photo ${photoData.name}:`, error, 'error');
        }
      }
      debug(FILE, '=== PHOTO UPLOAD SUMMARY ===');
      debug(FILE, 'Total photos processed:', pendingPhotos.length);
      debug(FILE, 'Successful uploads:', successCount);
      debug(FILE, 'Failed uploads:', errorCount);
      if (successCount > 0) {
        this.showNotification(`Successfully uploaded ${successCount} photo${successCount > 1 ? 's' : ''}`, 'success');
      }
      if (errorCount > 0) {
        this.showNotification(`Failed to upload ${errorCount} photo${errorCount > 1 ? 's' : ''}`, 'error');
      }
      debug(FILE, '=== PHOTO UPLOAD DEBUG END ===');
    } catch (error) {
      debug(FILE, 'Error uploading pending photos:', error, 'error');
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
      let photosContainer = document.querySelector(`.location-photos-container[data-place-id="${placeId}"]`);
      if (!photosContainer) {
        const escapedPlaceId = SecurityUtils.escapeHtmlAttribute(placeId);
        photosContainer = document.querySelector(`#location-photos-${escapedPlaceId}`);
      }
      if (!photosContainer) {
        debug(FILE, `Photos container not found for placeId: ${placeId}`, null, 'warn');
        photosContainer = document.querySelector('.dialog:not(.hidden) .location-photos-container, .dialog:not(.hidden) .location-photos');
        if (photosContainer) {
          debug(FILE, 'Found fallback photos container in dialog');
        } else {
          debug(FILE, 'No photos container found at all', null, 'warn');
          return;
        }
      }
      debug(FILE, `Loading photos for location: ${placeId} (container found)`);
      await PhotoDisplayService.loadAndDisplayPhotos(placeId, photosContainer, {
        showCaptions: true,
        showPrimaryBadge: true,
        showUploader: true,
        clickable: true,
        layout: 'grid',
        imageSize: 'card',
        emptyMessage: 'No photos available for this location',
        maxPhotos: 6
      });
      debug(FILE, `Photos loaded successfully for location: ${placeId}`);
    } catch (error) {
      debug(FILE, 'Error loading dialog photos:', error, 'error');
    }
  }
}
