/**
 * Location Form Validator
 * Handles form validation logic and field validation
 */

export class LocationFormValidator {
  
  /**
   * Validate location form data
   * @param {Object} locationData - Form data to validate
   * @returns {Object} Validation result with isValid and errors
   */
  static validateLocationData(locationData) {
    const errors = [];
    const requiredFields = ['type', 'entry_point', 'parking', 'access'];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!locationData[field] || locationData[field].trim() === '') {
        errors.push(`${field.replace('_', ' ')} is required`);
      }
    });
    
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
    
    // Validate state field
    if (locationData.state && locationData.state.length > 2) {
      errors.push('State must be 2 characters or less');
    }
    
    // Validate zipcode field
    if (locationData.zipcode && locationData.zipcode.length > 5) {
      errors.push('Zip code must be 5 characters or less');
    }
    
    // Validate coordinates if provided
    if (locationData.lat && (isNaN(locationData.lat) || locationData.lat < -90 || locationData.lat > 90)) {
      errors.push('Invalid latitude value');
    }
    
    if (locationData.lng && (isNaN(locationData.lng) || locationData.lng < -180 || locationData.lng > 180)) {
      errors.push('Invalid longitude value');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate individual field
   * @param {string} fieldName - Field name
   * @param {any} value - Field value
   * @returns {Object} Validation result
   */
  static validateField(fieldName, value) {
    const errors = [];
    
    switch (fieldName) {
      case 'name':
        if (!value || value.trim() === '') {
          errors.push('Location name is required');
        } else if (value.length > 100) {
          errors.push('Name must be 100 characters or less');
        }
        break;
        
      case 'production_notes':
        if (value && value.length > 200) {
          errors.push('Production notes must be 200 characters or less');
        }
        break;
        
      case 'state':
        if (value && value.length > 2) {
          errors.push('State must be 2 characters or less');
        }
        break;
        
      case 'zipcode':
        if (value && value.length > 5) {
          errors.push('Zip code must be 5 characters or less');
        }
        break;
        
      case 'type':
      case 'entry_point':
      case 'parking':
      case 'access':
        if (!value || value.trim() === '') {
          errors.push(`${fieldName.replace('_', ' ')} is required`);
        }
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Get formatted validation error message
   * @param {Array} errors - Array of error messages
   * @returns {string} Formatted error message
   */
  static getFormattedErrorMessage(errors) {
    if (errors.length === 0) return '';
    
    if (errors.length === 1) {
      return errors[0];
    }
    
    return `Please fix the following issues:\n• ${errors.join('\n• ')}`;
  }

  /**
   * Sanitize form input
   * @param {string} input - Input value
   * @returns {string} Sanitized input
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove excessive whitespace
    return input.trim().replace(/\s+/g, ' ');
  }

  /**
   * Format form data for submission
   * @param {Object} rawData - Raw form data
   * @returns {Object} Formatted data
   */
  static formatForSubmission(rawData) {
    const formatted = { ...rawData };
    
    // Sanitize text fields
    ['name', 'street', 'city', 'state', 'zipcode', 'production_notes'].forEach(field => {
      if (formatted[field]) {
        formatted[field] = this.sanitizeInput(formatted[field]);
      }
    });
    
    // Ensure state is uppercase
    if (formatted.state) {
      formatted.state = formatted.state.toUpperCase();
    }
    
    // Ensure numeric fields are properly formatted
    if (formatted.lat) formatted.lat = parseFloat(formatted.lat);
    if (formatted.lng) formatted.lng = parseFloat(formatted.lng);
    
    return formatted;
  }
}
