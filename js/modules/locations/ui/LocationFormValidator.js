/**
 * Location Form Validator
 * Handles all form validation logic for location forms
 */

export class LocationFormValidator {
  
  /**
   * Validate location form data
   * @param {Object} locationData - Form data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validateLocationData(locationData) {
    const errors = [];
    const warnings = [];
    
    // Validate required fields
    const requiredFields = ['type', 'entry_point', 'parking', 'access'];
    const missingFields = [];
    
    requiredFields.forEach(field => {
      if (!locationData[field] || locationData[field].trim() === '') {
        missingFields.push(field.replace('_', ' '));
      }
    });
    
    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => 
        field.charAt(0).toUpperCase() + field.slice(1)
      ).join(', ');
      errors.push(`Please select values for: ${fieldNames}`);
    }
    
    // Validate name field
    if (!locationData.name || locationData.name.trim() === '') {
      errors.push('Location name is required');
    } else if (locationData.name.length > 100) {
      errors.push('Location name must be 100 characters or less');
    }
    
    // Validate production notes length
    if (locationData.production_notes && locationData.production_notes.length > 200) {
      errors.push('Production notes must be 200 characters or less');
    }
    
    // Validate address components
    this.validateAddressComponents(locationData, warnings);
    
    // Validate coordinates
    this.validateCoordinates(locationData, warnings);
    
    // Validate state format
    if (locationData.state && locationData.state.length > 2) {
      warnings.push('State should be a 2-letter abbreviation');
    }
    
    // Validate zipcode format
    if (locationData.zipcode && (locationData.zipcode.length > 5 || !/^\d{5}$/.test(locationData.zipcode))) {
      warnings.push('Zipcode should be a 5-digit number');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate address components
   * @param {Object} locationData - Form data
   * @param {Array} warnings - Warnings array to populate
   */
  static validateAddressComponents(locationData, warnings) {
    const hasStreetNumber = locationData.number && locationData.number.trim();
    const hasStreetName = locationData.street && locationData.street.trim();
    const hasCity = locationData.city && locationData.city.trim();
    const hasState = locationData.state && locationData.state.trim();
    
    // Check for incomplete address
    if (!hasCity && !hasState && !hasStreetName) {
      warnings.push('Address information is incomplete');
    }
    
    // Check for street number without street name
    if (hasStreetNumber && !hasStreetName) {
      warnings.push('Street number provided but street name is missing');
    }
    
    // Check for state without city
    if (hasState && !hasCity) {
      warnings.push('State provided but city is missing');
    }
  }

  /**
   * Validate coordinates
   * @param {Object} locationData - Form data
   * @param {Array} warnings - Warnings array to populate
   */
  static validateCoordinates(locationData, warnings) {
    const lat = parseFloat(locationData.lat);
    const lng = parseFloat(locationData.lng);
    
    if (locationData.lat || locationData.lng) {
      // Check if coordinates are valid numbers
      if (isNaN(lat) || isNaN(lng)) {
        warnings.push('Invalid coordinate format');
        return;
      }
      
      // Check latitude range
      if (lat < -90 || lat > 90) {
        warnings.push('Latitude must be between -90 and 90 degrees');
      }
      
      // Check longitude range
      if (lng < -180 || lng > 180) {
        warnings.push('Longitude must be between -180 and 180 degrees');
      }
      
      // Check if coordinates are reasonable (not 0,0)
      if (lat === 0 && lng === 0) {
        warnings.push('Coordinates appear to be default values (0,0)');
      }
    }
  }

  /**
   * Validate production notes content
   * @param {string} notes - Production notes text
   * @returns {Object} Validation result
   */
  static validateProductionNotes(notes) {
    if (!notes) return { isValid: true, message: '' };
    
    const errors = [];
    const warnings = [];
    
    // Check length
    if (notes.length > 200) {
      errors.push('Production notes must be 200 characters or less');
    }
    
    // Check for potentially problematic content
    const forbiddenPatterns = [
      /<script\b/gi, // Prevent XSS
      /javascript:/gi, // Prevent XSS
      /on\w+\s*=/gi // Prevent event handlers
    ];
    
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(notes)) {
        errors.push('Production notes contain invalid characters or code');
        break;
      }
    }
    
    // Check for excessive special characters
    const specialCharCount = (notes.match(/[^a-zA-Z0-9\s\-.,!?()]/g) || []).length;
    if (specialCharCount > notes.length * 0.3) {
      warnings.push('Production notes contain many special characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      message: errors.length > 0 ? errors[0] : (warnings.length > 0 ? warnings[0] : '')
    };
  }

  /**
   * Real-time field validation
   * @param {HTMLElement} field - Form field element
   * @param {string} value - Field value
   * @returns {Object} Validation result
   */
  static validateField(field, value) {
    const fieldName = field.name;
    const fieldType = field.type;
    const isRequired = field.hasAttribute('required');
    
    const result = {
      isValid: true,
      message: '',
      showError: false
    };
    
    // Required field validation
    if (isRequired && (!value || value.trim() === '')) {
      result.isValid = false;
      result.message = `${this.getFieldDisplayName(fieldName)} is required`;
      result.showError = true;
      return result;
    }
    
    // Field-specific validation
    switch (fieldName) {
      case 'name':
        if (value && value.length > 100) {
          result.isValid = false;
          result.message = 'Name must be 100 characters or less';
          result.showError = true;
        }
        break;
        
      case 'state':
        if (value && value.length > 2) {
          result.isValid = false;
          result.message = 'State should be 2 letters';
          result.showError = true;
        }
        break;
        
      case 'zipcode':
        if (value && (value.length > 5 || !/^\d{5}$/.test(value))) {
          result.isValid = false;
          result.message = 'Zipcode should be 5 digits';
          result.showError = true;
        }
        break;
        
      case 'production_notes':
        if (value && value.length > 200) {
          result.isValid = false;
          result.message = 'Notes must be 200 characters or less';
          result.showError = true;
        }
        break;
    }
    
    return result;
  }

  /**
   * Get user-friendly field display name
   * @param {string} fieldName - Internal field name
   * @returns {string} Display name
   */
  static getFieldDisplayName(fieldName) {
    const displayNames = {
      'name': 'Location name',
      'type': 'Type',
      'entry_point': 'Entry point',
      'parking': 'Parking',
      'access': 'Access',
      'production_notes': 'Production notes',
      'number': 'Street number',
      'street': 'Street',
      'city': 'City',
      'state': 'State',
      'zipcode': 'Zip code'
    };
    
    return displayNames[fieldName] || fieldName.replace('_', ' ');
  }

  /**
   * Format live address from components
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
