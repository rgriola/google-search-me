/**
 * Location Form Manager
 * Handles form operations, enhancements, and character counting
 */

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
      
      // Add real-time character counting
      productionNotesField.addEventListener('input', () => {
        this.updateCharacterCount(productionNotesField);
      });
    }
    
    // Setup live address updating
    this.setupLiveAddressUpdate(formContainer);
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
      
      const formattedAddress = this.formatLiveAddress(components);
      
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
   * Extract form data into location object
   * @param {HTMLFormElement} form - Form element
   * @returns {Object} Location data object
   */
  static extractFormData(form) {
    const formData = new FormData(form);
    const locationData = Object.fromEntries(formData.entries());
    
    // Convert lat/lng to numbers
    if (locationData.lat) locationData.lat = parseFloat(locationData.lat);
    if (locationData.lng) locationData.lng = parseFloat(locationData.lng);
    
    // Ensure formatted_address is updated from address components
    const addressComponents = {
      number: locationData.number || '',
      street: locationData.street || '',
      city: locationData.city || '',
      state: locationData.state || '',
      zipcode: locationData.zipcode || ''
    };
    
    const updatedFormattedAddress = this.formatLiveAddress(addressComponents);
    if (updatedFormattedAddress) {
      locationData.formatted_address = updatedFormattedAddress;
    }
    
    return locationData;
  }

  /**
   * Live address formatting function
   * @param {Object} components - Address components
   * @returns {string} Formatted address
   */
  static formatLiveAddress(components) {
    const { number, street, city, state, zipcode } = components;
    
    // Build address parts
    const parts = [];
    
    // Street address (number + street)
    if (number || street) {
      const streetPart = [number, street].filter(Boolean).join(' ');
      if (streetPart.trim()) {
        parts.push(streetPart.trim());
      }
    }
    
    // City
    if (city && city.trim()) {
      parts.push(city.trim());
    }
    
    // State and zipcode (together)
    if (state || zipcode) {
      const stateZip = [state, zipcode].filter(Boolean).join(' ');
      if (stateZip.trim()) {
        parts.push(stateZip.trim());
      }
    }
    
    // Join with commas
    let formattedAddress = '';
    if (parts.length > 0) {
      if (parts.length === 1) {
        formattedAddress = parts[0];
      } else if (parts.length === 2) {
        formattedAddress = parts.join(', ');
      } else {
        formattedAddress = parts.slice(0, -1).join(', ') + ', ' + parts[parts.length - 1];
      }
    }
    
    // Add USA if we have a complete address
    if (formattedAddress && (state || zipcode)) {
      formattedAddress += ', USA';
    }
    
    return formattedAddress;
  }
}
