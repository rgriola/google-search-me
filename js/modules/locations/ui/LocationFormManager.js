/**
 * Location Form Manager
 * Handles form creation, enhancement, and submission logic
 */

import { LocationFormValidator } from './LocationFormValidator.js';

export class LocationFormManager {
  
  /**
   * Setup form enhancements after form is displayed
   * @param {HTMLElement} formContainer - Container with the form
   */
  static setupFormEnhancements(formContainer) {
    // Initialize character counters
    const productionNotesField = formContainer.querySelector('#location-production-notes');
    if (productionNotesField) {
      this.updateCharacterCount(productionNotesField);
    }
    
    // Setup live address updating
    this.setupLiveAddressUpdate(formContainer);
    
    // Setup real-time validation
    this.setupRealTimeValidation(formContainer);
  }

  /**
   * Setup real-time form validation
   * @param {HTMLElement} formContainer - Container with the form
   */
  static setupRealTimeValidation(formContainer) {
    const form = formContainer.querySelector('form');
    if (!form) return;
    
    // Add validation to all form fields
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
      // Skip hidden fields and photo fields
      if (field.type === 'hidden' || field.type === 'file') return;
      
      field.addEventListener('blur', (e) => {
        this.validateFieldRealTime(e.target);
      });
      
      field.addEventListener('input', (e) => {
        // Clear previous validation styling on input
        this.clearFieldValidation(e.target);
        
        // Special handling for character count fields
        if (e.target.id === 'location-production-notes') {
          this.updateCharacterCount(e.target);
        }
      });
    });
  }

  /**
   * Validate field in real-time
   * @param {HTMLElement} field - Form field to validate
   */
  static validateFieldRealTime(field) {
    const validation = LocationFormValidator.validateField(field, field.value);
    
    if (!validation.isValid && validation.showError) {
      this.showFieldError(field, validation.message);
    } else {
      this.clearFieldValidation(field);
    }
  }

  /**
   * Show field validation error
   * @param {HTMLElement} field - Form field
   * @param {string} message - Error message
   */
  static showFieldError(field, message) {
    field.style.borderColor = '#dc3545';
    field.classList.add('is-invalid');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
    
    // Add error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.cssText = 'color: #dc3545; font-size: 12px; margin-top: 4px;';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
  }

  /**
   * Clear field validation styling
   * @param {HTMLElement} field - Form field
   */
  static clearFieldValidation(field) {
    field.style.borderColor = '';
    field.classList.remove('is-invalid', 'is-valid');
    
    // Remove error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  }

  /**
   * Setup live address updating for form fields
   * @param {HTMLElement} formContainer - Container with the form
   */
  static setupLiveAddressUpdate(formContainer) {
    const addressFields = [
      'location-number',
      'location-street', 
      'location-city',
      'location-state',
      'location-zipcode'
    ];
    
    const addressDisplay = formContainer.querySelector('.address-display');
    const hiddenAddressField = formContainer.querySelector('input[name="formatted_address"]');
    
    if (!addressDisplay) return;
    
    // Function to update the live address preview
    const updateAddressPreview = () => {
      const components = {
        number: formContainer.querySelector('#location-number')?.value.trim() || '',
        street: formContainer.querySelector('#location-street')?.value.trim() || '',
        city: formContainer.querySelector('#location-city')?.value.trim() || '',
        state: formContainer.querySelector('#location-state')?.value.trim() || '',
        zipcode: formContainer.querySelector('#location-zipcode')?.value.trim() || ''
      };
      
      const formattedAddress = LocationFormValidator.formatLiveAddress(components);
      
      if (formattedAddress) {
        addressDisplay.textContent = formattedAddress;
        addressDisplay.classList.add('updating');
        
        // Reset the styling after animation
        setTimeout(() => {
          addressDisplay.classList.remove('updating');
        }, 500);
      } else {
        addressDisplay.textContent = 'Address will appear here...';
        addressDisplay.classList.remove('updating');
      }
      
      // Update hidden field for form submission
      if (hiddenAddressField) {
        hiddenAddressField.value = formattedAddress;
      }
    };
    
    // Add event listeners to address fields
    addressFields.forEach(fieldId => {
      const field = formContainer.querySelector(`#${fieldId}`);
      if (field) {
        field.addEventListener('input', (e) => {
          // Validate field length
          if (fieldId === 'location-state' && e.target.value.length > 2) {
            e.target.value = e.target.value.substring(0, 2);
          }
          if (fieldId === 'location-zipcode' && e.target.value.length > 5) {
            e.target.value = e.target.value.substring(0, 5);
          }
          
          updateAddressPreview();
        });
        
        field.addEventListener('blur', (e) => {
          // Convert state to uppercase
          if (fieldId === 'location-state') {
            e.target.value = e.target.value.toUpperCase();
            updateAddressPreview();
          }
        });
      }
    });
    
    // Initial address update
    updateAddressPreview();
  }

  /**
   * Update character count for textarea fields
   * @param {HTMLTextAreaElement} textarea - Textarea element
   */
  static updateCharacterCount(textarea) {
    const maxLength = parseInt(textarea.getAttribute('maxlength'));
    const currentLength = textarea.value.length;
    const charCountElement = textarea.parentNode.querySelector('.char-count');
    
    if (charCountElement) {
      charCountElement.textContent = `${currentLength}/${maxLength} characters`;
      
      // Update styling based on character count
      charCountElement.classList.remove('warning', 'error');
      if (currentLength > maxLength * 0.8) {
        charCountElement.classList.add('warning');
      }
      if (currentLength >= maxLength) {
        charCountElement.classList.add('error');
      }
    }
  }

  /**
   * Extract and validate form data
   * @param {HTMLFormElement} form - Form element
   * @returns {Object} Processed form data with validation
   */
  static extractFormData(form) {
    console.log('🔍 === FORM DATA EXTRACTION DEBUG START ===');
    console.log('🔍 Form element:', form);
    console.log('🔍 Form ID:', form.id);
    
    // Check if required dropdown elements exist in the DOM
    const requiredDropdowns = ['type', 'entry_point', 'parking', 'access'];
    requiredDropdowns.forEach(field => {
      const element = form.querySelector(`[name="${field}"]`);
      console.log(`🔍 Field "${field}" element:`, element);
      if (element) {
        console.log(`🔍 Field "${field}" value: "${element.value}" (selected index: ${element.selectedIndex})`);
        if (element.tagName === 'SELECT') {
          console.log(`🔍 Field "${field}" options:`, Array.from(element.options).map(opt => ({
            value: opt.value,
            text: opt.text,
            selected: opt.selected
          })));
        }
      } else {
        console.error(`❌ Field "${field}" element NOT FOUND in form!`);
      }
    });
    
    const formData = new FormData(form);
    const locationData = Object.fromEntries(formData.entries());
    
    console.log('🔍 Raw FormData entries:', Array.from(formData.entries()));
    console.log('🔍 Converted location data object:', locationData);
    
    // Check for empty string values and missing required fields
    const missingRequired = [];
    requiredDropdowns.forEach(field => {
      const value = locationData[field];
      console.log(`🔍 Required field ${field}: "${value}" (type: ${typeof value}, isEmpty: ${!value || value.trim() === ''})`);
      
      if (!value || value.trim() === '') {
        missingRequired.push(field);
      }
    });
    
    if (missingRequired.length > 0) {
      console.error(`❌ Missing required fields: ${missingRequired.join(', ')}`);
    }
    
    // Convert lat/lng to numbers
    if (locationData.lat) locationData.lat = parseFloat(locationData.lat);
    if (locationData.lng) locationData.lng = parseFloat(locationData.lng);
    
    // Ensure place_id is present
    if (!locationData.place_id) {
      console.warn('⚠️ No place_id found in form data');
    }
    
    // Ensure formatted_address is updated from address components
    const addressComponents = {
      number: locationData.number || '',
      street: locationData.street || '',
      city: locationData.city || '',
      state: locationData.state || '',
      zipcode: locationData.zipcode || ''
    };
    
    const updatedFormattedAddress = LocationFormValidator.formatLiveAddress(addressComponents);
    if (updatedFormattedAddress) {
      locationData.formatted_address = updatedFormattedAddress;
    }
    
    console.log('🔍 Final location data before validation:', locationData);
    
    // Validate the data
    const validation = LocationFormValidator.validateLocationData(locationData);
    console.log('🔍 Validation result:', validation);
    
    console.log('🔍 === FORM DATA EXTRACTION DEBUG END ===');
    
    return {
      data: locationData,
      validation
    };
  }

  /**
   * Show form validation errors
   * @param {Array} errors - Array of error messages
   * @param {HTMLElement} form - Form element
   */
  static showFormErrors(errors, form) {
    // Remove existing error display
    const existingErrorDisplay = form.querySelector('.form-errors');
    if (existingErrorDisplay) {
      existingErrorDisplay.remove();
    }
    
    if (errors.length === 0) return;
    
    // Create error display
    const errorDisplay = document.createElement('div');
    errorDisplay.className = 'form-errors';
    errorDisplay.style.cssText = `
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 16px;
    `;
    
    errorDisplay.innerHTML = `
      <strong>Please fix the following errors:</strong>
      <ul style="margin: 8px 0 0 0; padding-left: 20px;">
        ${errors.map(error => `<li>${error}</li>`).join('')}
      </ul>
    `;
    
    // Insert at the top of dialog content
    const dialogContent = form.querySelector('.dialog-content');
    if (dialogContent) {
      dialogContent.insertBefore(errorDisplay, dialogContent.firstChild);
    }
  }

  /**
   * Show form warnings
   * @param {Array} warnings - Array of warning messages
   * @param {HTMLElement} form - Form element
   */
  static showFormWarnings(warnings, form) {
    if (warnings.length === 0) return;
    
    // Show warnings as console logs for now
    warnings.forEach(warning => {
      console.warn('⚠️ Form warning:', warning);
    });
  }

  /**
   * Handle form submission - delegates to LocationEventManager
   * @param {HTMLFormElement} form - Form element
   */
  static async handleFormSubmit(form) {
    // Import and delegate to LocationEventManager
    const { LocationEventManager } = await import('../LocationEventManager.js');
    return LocationEventManager.handleFormSubmit(form);
  }
}
