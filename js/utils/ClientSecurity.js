/**
 * Client-Side Security Utilities
 * Handles CSRF tokens, secure requests, and input validation
 */

/**
 * CSRF Token Manager
 */
class CSRFManager {
  constructor() {
    this.token = null;
    this.headerName = 'x-csrf-token';
    this.tokenEndpoint = '/api/csrf-token';
  }

  /**
   * Get CSRF token from server
   */
  async getToken() {
    try {
      const response = await fetch(this.tokenEndpoint, {
        method: 'GET',
        credentials: 'same-origin'
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.token;
        this.headerName = data.headerName || this.headerName;
        return this.token;
      } else {
        console.warn('Failed to get CSRF token:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      return null;
    }
  }

  /**
   * Get current token (fetch if not available)
   */
  async ensureToken() {
    if (!this.token) {
      await this.getToken();
    }
    return this.token;
  }

  /**
   * Add CSRF token to request headers
   */
  async addTokenToHeaders(headers = {}) {
    const token = await this.ensureToken();
    if (token) {
      headers[this.headerName] = token;
    }
    return headers;
  }

  /**
   * Add CSRF token to form data
   */
  async addTokenToFormData(formData) {
    const token = await this.ensureToken();
    if (token) {
      formData.append('_csrf', token);
    }
    return formData;
  }

  /**
   * Create secure fetch wrapper
   */
  async secureFetch(url, options = {}) {
    // Only add CSRF token for unsafe methods
    const unsafeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    const method = (options.method || 'GET').toUpperCase();

    if (unsafeMethods.includes(method)) {
      options.headers = await this.addTokenToHeaders(options.headers);
    }

    // Ensure credentials are included
    options.credentials = options.credentials || 'same-origin';

    return fetch(url, options);
  }
}

/**
 * Input Validation Utilities
 */
export class InputValidator {
  static patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    username: /^[a-zA-Z0-9_-]+$/,
    phone: /^\+?[\d\s()-]+$/,
    noHtml: /<[^>]*>/g,
    noScript: /<script[^>]*>.*?<\/script>/gi
  };

  static limits = {
    email: { min: 3, max: 254 },
    password: { min: 8, max: 128 },
    username: { min: 2, max: 50 },
    name: { min: 1, max: 100 },
    description: { min: 0, max: 1000 },
    caption: { min: 0, max: 500 }
  };

  /**
   * Validate email format and length
   */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required' };
    }

    const length = email.length;
    if (length < this.limits.email.min || length > this.limits.email.max) {
      return { 
        valid: false, 
        error: `Email must be between ${this.limits.email.min} and ${this.limits.email.max} characters` 
      };
    }

    if (!this.patterns.email.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true };
  }

  /**
   * Validate password strength
   */
  static validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { valid: false, error: 'Password is required' };
    }

    const length = password.length;
    if (length < this.limits.password.min || length > this.limits.password.max) {
      return { 
        valid: false, 
        error: `Password must be between ${this.limits.password.min} and ${this.limits.password.max} characters` 
      };
    }

    // Check password strength
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const requirements = [];
    if (!hasLower) requirements.push('lowercase letter');
    if (!hasUpper) requirements.push('uppercase letter');
    if (!hasNumber) requirements.push('number');
    if (!hasSpecial) requirements.push('special character');

    if (requirements.length > 0) {
      return { 
        valid: false, 
        error: `Password must contain: ${requirements.join(', ')}` 
      };
    }

    return { valid: true };
  }

  /**
   * Validate string length
   */
  static validateLength(value, field, limits) {
    if (value && typeof value === 'string') {
      const length = value.length;
      if (length < limits.min || length > limits.max) {
        return { 
          valid: false, 
          error: `${field} must be between ${limits.min} and ${limits.max} characters` 
        };
      }
    }
    return { valid: true };
  }

  /**
   * Check for dangerous content
   */
  static validateSafeContent(value, field) {
    if (typeof value !== 'string') {
      return { valid: true };
    }

    // Check for script tags
    if (this.patterns.noScript.test(value)) {
      return { 
        valid: false, 
        error: `${field} contains forbidden script content` 
      };
    }

    // Check for excessive HTML
    const htmlMatches = value.match(this.patterns.noHtml);
    if (htmlMatches && htmlMatches.length > 5) {
      return { 
        valid: false, 
        error: `${field} contains too much HTML content` 
      };
    }

    return { valid: true };
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    // Remove potential XSS vectors
    return str
      .replace(this.patterns.noScript, '') // Remove script tags
      .trim(); // Remove leading/trailing whitespace
  }
}

/**
 * Secure Request Manager
 */
export class SecureRequestManager {
  constructor() {
    this.csrfManager = new CSRFManager();
  }

  /**
   * Make a secure GET request
   */
  async get(url, options = {}) {
    return this.csrfManager.secureFetch(url, {
      method: 'GET',
      ...options
    });
  }

  /**
   * Make a secure POST request
   */
  async post(url, data, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    return this.csrfManager.secureFetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Make a secure PUT request
   */
  async put(url, data, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    return this.csrfManager.secureFetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Make a secure DELETE request
   */
  async delete(url, options = {}) {
    return this.csrfManager.secureFetch(url, {
      method: 'DELETE',
      ...options
    });
  }

  /**
   * Upload files securely
   */
  async uploadFiles(url, formData, options = {}) {
    // Add CSRF token to form data
    await this.csrfManager.addTokenToFormData(formData);

    return this.csrfManager.secureFetch(url, {
      method: 'POST',
      body: formData,
      ...options
    });
  }
}

/**
 * Form Security Helper
 */
export class FormSecurityHelper {
  constructor() {
    this.requestManager = new SecureRequestManager();
  }

  /**
   * Secure form submission
   */
  async submitForm(form, url, options = {}) {
    const formData = new FormData(form);
    const data = {};

    // Convert FormData to object and validate
    for (let [key, value] of formData.entries()) {
      // Basic sanitization
      if (typeof value === 'string') {
        data[key] = InputValidator.sanitizeString(value);
      } else {
        data[key] = value;
      }
    }

    // Submit based on method
    const method = (options.method || form.method || 'POST').toUpperCase();
    
    switch (method) {
      case 'POST':
        return this.requestManager.post(url, data, options);
      case 'PUT':
        return this.requestManager.put(url, data, options);
      default:
        throw new Error(`Unsupported form method: ${method}`);
    }
  }

  /**
   * Add real-time validation to form
   */
  addValidation(form, validationRules) {
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      const fieldName = input.name;
      const rules = validationRules[fieldName];
      
      if (rules) {
        input.addEventListener('blur', () => {
          this.validateField(input, rules);
        });

        input.addEventListener('input', () => {
          // Clear previous errors on input
          this.clearFieldError(input);
        });
      }
    });
  }

  /**
   * Validate individual field
   */
  validateField(input, rules) {
    const value = input.value;
    let result = { valid: true };

    // Email validation
    if (rules.type === 'email') {
      result = InputValidator.validateEmail(value);
    }
    // Password validation
    else if (rules.type === 'password') {
      result = InputValidator.validatePassword(value);
    }
    // Length validation
    else if (rules.limits) {
      result = InputValidator.validateLength(value, rules.label || input.name, rules.limits);
    }

    // Safety validation
    if (result.valid && rules.checkSafety !== false) {
      result = InputValidator.validateSafeContent(value, rules.label || input.name);
    }

    // Display validation result
    if (!result.valid) {
      this.showFieldError(input, result.error);
    } else {
      this.clearFieldError(input);
    }

    return result.valid;
  }

  /**
   * Show field error
   */
  showFieldError(input, message) {
    this.clearFieldError(input);
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    errorElement.style.color = 'red';
    errorElement.style.fontSize = '0.8em';
    errorElement.style.marginTop = '2px';
    
    input.parentNode.insertBefore(errorElement, input.nextSibling);
    input.classList.add('error');
  }

  /**
   * Clear field error
   */
  clearFieldError(input) {
    const existingError = input.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
    input.classList.remove('error');
  }
}

// Global instances
export const secureRequest = new SecureRequestManager();
export const formSecurity = new FormSecurityHelper();

// Initialize CSRF protection
document.addEventListener('DOMContentLoaded', () => {
  // Get initial CSRF token
  secureRequest.csrfManager.getToken().catch(console.error);
});

// Export for module usage
export { CSRFManager, InputValidator, SecureRequestManager, FormSecurityHelper };
