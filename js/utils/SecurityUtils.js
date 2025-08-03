/**
 * Security Utilities
 * Centralized security functions for XSS prevention and data sanitization
 * Single source of truth for all client-side security operations
 * 
 *  CO-PILOT: Never alter this without consulting the team.
 * 
 */

export class SecurityUtils {
  
  /**
   * Escape HTML characters to prevent XSS attacks
   * Uses manual character mapping for performance and consistency
   * @param {any} input - Input to escape (will be converted to string)
   * @returns {string} Escaped HTML string
   */
  static escapeHtml(input) {
    // Handle null, undefined, or non-string inputs
    if (input == null) return '';
    
    const text = String(input);
    
    // Character mapping for HTML entities
    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    
    return text.replace(/[&<>"'/`=]/g, (match) => htmlEntities[match]);
  }

  /**
   * Escape HTML attributes specifically
   * More restrictive escaping for attribute values
   * @param {any} input - Input to escape for attribute usage
   * @returns {string} Escaped attribute value
   */
  static escapeHtmlAttribute(input) {
    if (input == null) return '';
    
    const text = String(input);
    
    // More restrictive for attributes
    const attrEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '\t': '&#9;',
      '\n': '&#10;',
      '\r': '&#13;'
    };
    
    return text.replace(/[&<>"'\t\n\r]/g, (match) => attrEntities[match]);
  }

  /**
   * Sanitize for JavaScript string contexts
   * Use when inserting into JavaScript strings
   * @param {any} input - Input to escape for JS context
   * @returns {string} Escaped JavaScript string
   */
  static escapeJavaScript(input) {
    if (input == null) return '';
    
    const text = String(input);
    
    const jsEntities = {
      '\\': '\\\\',
      '"': '\\"',
      "'": "\\'",
      '\n': '\\n',
      '\r': '\\r',
      '\t': '\\t',
      '\b': '\\b',
      '\f': '\\f',
      '\v': '\\v',
      '\0': '\\0'
    };
    
    return text.replace(/[\\"'\n\r\t\b\f\v\0]/g, (match) => jsEntities[match]);
  }

  /**
   * Create safe template literal function
   * Use for template literals with user data
   * @param {Array} strings - Template literal strings
   * @param {...any} values - Values to interpolate
   * @returns {string} Safely escaped template result
   */
  static safeTemplate(strings, ...values) {
    let result = strings[0];
    
    for (let i = 0; i < values.length; i++) {
      result += this.escapeHtml(values[i]) + strings[i + 1];
    }
    
    return result;
  }

  /**
   * Validate and sanitize URLs
   * Prevents javascript: and data: URL attacks
   * @param {string} url - URL to validate
   * @returns {string|null} Sanitized URL or null if invalid
   */
  static sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return null;
    
    const trimmed = url.trim().toLowerCase();
    
    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.some(proto => trimmed.startsWith(proto))) {
      return null;
    }
    
    return url.trim();
  }

  /**
   * Safe DOM text insertion
   * Use instead of innerHTML for user content
   * @param {HTMLElement} element - Target element
   * @param {string} text - Text to insert
   */
  static setTextContent(element, text) {
    if (!element) return;
    element.textContent = text || '';
  }

  /**
   * Safe DOM HTML insertion with escaping
   * Use when you need HTML structure but with escaped user content
   * @param {HTMLElement} element - Target element  
   * @param {string} htmlTemplate - HTML template
   * @param {Object} data - Data to escape and insert
   */
  static setSafeHTML(element, htmlTemplate, data = {}) {
    if (!element) return;
    
    let safeHTML = htmlTemplate;
    
    // Replace placeholders with escaped data
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      safeHTML = safeHTML.replace(placeholder, this.escapeHtml(value));
    });
    
    element.innerHTML = safeHTML;
  }

  /**
   * Enhanced safe HTML insertion with attribute support
   * Supports both {{content}} and {{attr:attributeName}} placeholders
   * @param {HTMLElement} element - Target element
   * @param {string} htmlTemplate - HTML template with placeholders
   * @param {Object} data - Data to escape and insert
   */
  static setSafeHTMLAdvanced(element, htmlTemplate, data = {}) {
    if (!element) return;
    
    let safeHTML = htmlTemplate;
    
    // Replace placeholders with appropriate escaping
    Object.entries(data).forEach(([key, value]) => {
      // Handle attribute placeholders: {{attr:key}}
      const attrPlaceholder = new RegExp(`{{attr:${key}}}`, 'g');
      safeHTML = safeHTML.replace(attrPlaceholder, this.escapeHtmlAttribute(value));
      
      // Handle regular content placeholders: {{key}}
      const contentPlaceholder = new RegExp(`{{${key}}}`, 'g');
      safeHTML = safeHTML.replace(contentPlaceholder, this.escapeHtml(value));
    });
    
    element.innerHTML = safeHTML;
  }

  /**
   * Create a safe HTML string without DOM insertion
   * Useful for generating safe HTML that will be used later
   * @param {string} htmlTemplate - HTML template with placeholders
   * @param {Object} data - Data to escape and insert
   * @returns {string} Safe HTML string
   */
  static createSafeHTML(htmlTemplate, data = {}) {
    let safeHTML = htmlTemplate;
    
    Object.entries(data).forEach(([key, value]) => {
      // Handle attribute placeholders: {{attr:key}}
      const attrPlaceholder = new RegExp(`{{attr:${key}}}`, 'g');
      safeHTML = safeHTML.replace(attrPlaceholder, this.escapeHtmlAttribute(value));
      
      // Handle regular content placeholders: {{key}}
      const contentPlaceholder = new RegExp(`{{${key}}}`, 'g');
      safeHTML = safeHTML.replace(contentPlaceholder, this.escapeHtml(value));
    });
    
    return safeHTML;
  }
}

// Legacy compatibility - global function for easier migration
window.escapeHtml = SecurityUtils.escapeHtml.bind(SecurityUtils);
