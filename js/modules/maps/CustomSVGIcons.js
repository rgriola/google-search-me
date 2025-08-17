/**
 * Custom SVG Icons for Map Markers
 * Store and manage custom SVG designs for different location types
 */

export class CustomSVGIcons {

  // ==========================================
  // CUSTOM SVG ICON LIBRARY
  // Pre-designed SVG icons for each location type
  // ==========================================

  static CUSTOM_ICONS = {
    'live reporter': {
      svg: `
        <g transform="translate(6,6)">
          <!-- Camera body -->
          <rect x="2" y="8" width="16" height="10" rx="2" fill="white" stroke="currentColor" stroke-width="1.5"/>
          <!-- Camera lens -->
          <circle cx="10" cy="13" r="4" fill="currentColor"/>
          <circle cx="10" cy="13" r="2.5" fill="white"/>
          <circle cx="10" cy="13" r="1.5" fill="currentColor"/>
          <!-- Viewfinder -->
          <rect x="6" y="5" width="3" height="2" rx="0.5" fill="currentColor"/>
          <!-- Record light -->
          <circle cx="16" cy="9" r="1" fill="#ff0000"/>
        </g>
      `,
      description: 'Professional camera with recording light'
    },
    
    'live anchor': {
      svg: `
        <g transform="translate(4,4)">
          <!-- TV/Monitor frame -->
          <rect x="2" y="6" width="20" height="14" rx="2" fill="currentColor" stroke="white" stroke-width="2"/>
          <rect x="4" y="8" width="16" height="10" fill="white"/>
          <!-- Screen content lines -->
          <rect x="6" y="10" width="12" height="1" fill="currentColor"/>
          <rect x="6" y="12" width="8" height="1" fill="currentColor"/>
          <rect x="6" y="14" width="10" height="1" fill="currentColor"/>
          <!-- Antenna -->
          <line x1="12" y1="6" x2="10" y2="2" stroke="currentColor" stroke-width="1.5"/>
          <line x1="12" y1="6" x2="14" y2="2" stroke="currentColor" stroke-width="1.5"/>
        </g>
      `,
      description: 'TV monitor with broadcast antenna'
    },
    
    'live stakeout': {
      svg: `
        <g transform="translate(5,5)">
          <!-- Binoculars -->
          <ellipse cx="8" cy="11" rx="3" ry="4" fill="currentColor"/>
          <ellipse cx="14" cy="11" rx="3" ry="4" fill="currentColor"/>
          <ellipse cx="8" cy="11" rx="2" ry="3" fill="white"/>
          <ellipse cx="14" cy="11" rx="2" ry="3" fill="white"/>
          <!-- Bridge -->
          <rect x="10" y="10" width="2" height="2" fill="currentColor"/>
          <!-- Eye pieces -->
          <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
          <circle cx="14" cy="8" r="1.5" fill="currentColor"/>
          <!-- Target crosshairs -->
          <line x1="6" y1="11" x2="10" y2="11" stroke="currentColor" stroke-width="0.5"/>
          <line x1="8" y1="9" x2="8" y2="13" stroke="currentColor" stroke-width="0.5"/>
        </g>
      `,
      description: 'Surveillance binoculars with crosshairs'
    },
    
    'stakeout': {
      svg: `
        <g transform="translate(5,5)">
          <!-- Same as live stakeout but simplified -->
          <ellipse cx="8" cy="11" rx="3" ry="4" fill="currentColor"/>
          <ellipse cx="14" cy="11" rx="3" ry="4" fill="currentColor"/>
          <ellipse cx="8" cy="11" rx="2" ry="2.5" fill="white"/>
          <ellipse cx="14" cy="11" rx="2" ry="2.5" fill="white"/>
          <rect x="10" y="10" width="2" height="2" fill="currentColor"/>
        </g>
      `,
      description: 'Simple binoculars for stakeout'
    },
    
    'live presser': {
      svg: `
        <g transform="translate(4,4)">
          <!-- Podium/Lectern -->
          <rect x="6" y="12" width="12" height="8" fill="currentColor"/>
          <rect x="8" y="14" width="8" height="4" fill="white"/>
          <!-- Microphone -->
          <circle cx="12" cy="8" r="2" fill="currentColor"/>
          <rect x="11.5" y="10" width="1" height="4" fill="currentColor"/>
          <!-- Papers/Documents -->
          <rect x="9" y="15" width="6" height="1" fill="currentColor"/>
          <rect x="9" y="17" width="4" height="1" fill="currentColor"/>
          <!-- Press badges -->
          <rect x="4" y="6" width="2" height="1" fill="#ff4444"/>
          <rect x="18" y="6" width="2" height="1" fill="#4285f4"/>
        </g>
      `,
      description: 'Press conference podium with microphone'
    },
    
    'interview': {
      svg: `
        <g transform="translate(6,6)">
          <!-- Microphone handle -->
          <rect x="9" y="12" width="2" height="8" rx="1" fill="currentColor"/>
          <!-- Microphone head -->
          <ellipse cx="10" cy="8" rx="2.5" ry="4" fill="currentColor"/>
          <ellipse cx="10" cy="8" rx="1.5" ry="3" fill="white"/>
          <!-- Sound waves -->
          <path d="M 14 6 Q 16 8 14 10" stroke="currentColor" stroke-width="1" fill="none"/>
          <path d="M 16 4 Q 19 8 16 12" stroke="currentColor" stroke-width="1" fill="none"/>
          <!-- Windscreen texture -->
          <circle cx="9" cy="7" r="0.3" fill="currentColor" opacity="0.5"/>
          <circle cx="11" cy="9" r="0.3" fill="currentColor" opacity="0.5"/>
        </g>
      `,
      description: 'Professional interview microphone with sound waves'
    },
    
    'broll': {
      svg: `
        <g transform="translate(4,4)">
          <!-- Film reel -->
          <circle cx="12" cy="12" r="8" fill="currentColor"/>
          <circle cx="12" cy="12" r="6" fill="white"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
          <!-- Film holes -->
          <circle cx="12" cy="6" r="1" fill="currentColor"/>
          <circle cx="18" cy="12" r="1" fill="currentColor"/>
          <circle cx="12" cy="18" r="1" fill="currentColor"/>
          <circle cx="6" cy="12" r="1" fill="currentColor"/>
          <!-- Film strip -->
          <rect x="2" y="10" width="20" height="4" fill="currentColor" opacity="0.3"/>
          <rect x="3" y="11" width="1" height="2" fill="white"/>
          <rect x="5" y="11" width="1" height="2" fill="white"/>
          <rect x="18" y="11" width="1" height="2" fill="white"/>
          <rect x="20" y="11" width="1" height="2" fill="white"/>
        </g>
      `,
      description: 'Film reel with strip for B-roll footage'
    },
    
    'default': {
      svg: `
        <g transform="translate(8,8)">
          <!-- Simple location pin -->
          <path d="M8 0C3.6 0 0 3.6 0 8c0 5.4 8 16 8 16s8-10.6 8-16c0-4.4-3.6-8-8-8z" fill="currentColor"/>
          <circle cx="8" cy="8" r="3" fill="white"/>
          <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
        </g>
      `,
      description: 'Standard location pin'
    },

    'headquarters': {
      svg: `
        <g transform="translate(4,4)">
          <!-- Building structure -->
          <rect x="6" y="8" width="12" height="12" fill="currentColor"/>
          <rect x="8" y="10" width="8" height="8" fill="white"/>
          <!-- Windows -->
          <rect x="9" y="11" width="1.5" height="1.5" fill="currentColor"/>
          <rect x="11.5" y="11" width="1.5" height="1.5" fill="currentColor"/>
          <rect x="14" y="11" width="1.5" height="1.5" fill="currentColor"/>
          <rect x="9" y="13.5" width="1.5" height="1.5" fill="currentColor"/>
          <rect x="11.5" y="13.5" width="1.5" height="1.5" fill="currentColor"/>
          <rect x="14" y="13.5" width="1.5" height="1.5" fill="currentColor"/>
          <rect x="9" y="16" width="1.5" height="1.5" fill="currentColor"/>
          <rect x="11.5" y="16" width="1.5" height="1.5" fill="currentColor"/>
          <rect x="14" y="16" width="1.5" height="1.5" fill="currentColor"/>
          <!-- Flag pole -->
          <rect x="18" y="4" width="1" height="16" fill="currentColor"/>
          <!-- Flag -->
          <polygon points="19,4 22,6 19,8" fill="#ff4444"/>
          <!-- Foundation -->
          <rect x="4" y="20" width="16" height="2" fill="currentColor"/>
        </g>
      `,
      description: 'The Big Office'
    }, 

    'bureau': {
      svg: `
        <g transform="translate(5,5)">
          <!-- Office building -->
          <rect x="4" y="10" width="14" height="10" fill="currentColor"/>
          <rect x="6" y="12" width="10" height="6" fill="white"/>
          <!-- Office windows grid -->
          <rect x="7" y="13" width="1" height="1" fill="currentColor"/>
          <rect x="9" y="13" width="1" height="1" fill="currentColor"/>
          <rect x="11" y="13" width="1" height="1" fill="currentColor"/>
          <rect x="13" y="13" width="1" height="1" fill="currentColor"/>
          <rect x="7" y="15" width="1" height="1" fill="currentColor"/>
          <rect x="9" y="15" width="1" height="1" fill="currentColor"/>
          <rect x="11" y="15" width="1" height="1" fill="currentColor"/>
          <rect x="13" y="15" width="1" height="1" fill="currentColor"/>
          <!-- Satellite dish -->
          <ellipse cx="15" cy="8" rx="2" ry="1" fill="currentColor"/>
          <line x1="15" y1="9" x2="15" y2="12" stroke="currentColor" stroke-width="0.5"/>
          <!-- Antenna -->
          <line x1="11" y1="10" x2="11" y2="6" stroke="currentColor" stroke-width="1"/>
          <circle cx="11" cy="6" r="0.5" fill="currentColor"/>
        </g>
      `,
      description: 'New Bureau with Staff'
    },

    'office': {
      svg: `
        <g transform="translate(6,6)">
          <!-- Simple office building -->
          <rect x="6" y="12" width="8" height="8" fill="currentColor"/>
          <rect x="7" y="14" width="6" height="4" fill="white"/>
          <!-- Door -->
          <rect x="9" y="18" width="2" height="2" fill="currentColor"/>
          <!-- Window -->
          <rect x="8" y="15" width="4" height="2" fill="currentColor"/>
          <line x1="10" y1="15" x2="10" y2="17" stroke="white" stroke-width="0.5"/>
          <!-- Sign -->
          <rect x="4" y="10" width="6" height="1.5" fill="currentColor"/>
          <text x="7" y="11" text-anchor="middle" font-size="3" fill="white">OFFICE</text>
        </g>
      `,
      description: 'Ice Cream'
    }
  };

  // ==========================================
  // SVG ENHANCEMENT UTILITIES
  // ==========================================

  /**
   * Get custom SVG icon for location type
   * @param {string} type - Location type
   * @returns {Object} Icon configuration with SVG
   */
  static getCustomIcon(type) {
    const iconKey = type?.toLowerCase() || 'default';
    return this.CUSTOM_ICONS[iconKey] || this.CUSTOM_ICONS.default;
  }




  
  /**
   * Create enhanced SVG marker with custom icon
   * @param {string} type - Location type
   * @param {string} color - Primary color
   * @param {number} size - Icon size
   * @returns {string} Complete SVG string
   *
   */
  static createCustomSVGMarker(type, color, size = 32) {
    const customIcon = this.getCustomIcon(type);
    
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Gradient for depth -->
          <linearGradient id="grad_${type}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${this.darkenColor(color, 0.3)};stop-opacity:1" />
          </linearGradient>
          <!-- Drop shadow -->
          <filter id="shadow_${type}">
            <feDropShadow dx="1" dy="2" stdDeviation="1" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Background circle with gradient -->
        <circle cx="16" cy="16" r="14" fill="url(#grad_${type})" stroke="white" stroke-width="2" filter="url(#shadow_${type})"/>
        
        <!-- Custom icon with currentColor support -->
        <g style="color: white;">
          ${customIcon.svg}
        </g>
      </svg>
    `;
  }

  /**
   * Create simple SVG marker (fallback)
   * @param {string} type - Location type
   * @param {string} color - Primary color
   * @param {string} initials - Type initials
   * @param {number} size - Icon size
   * @returns {string} Simple SVG string
   * 
   * Curent Marker used 8-16-2025
   * 
   */
  static createSimpleSVGMarker(type, color, initials, size = 32) {
    // Clean up inputs to prevent SVG encoding issues
    const safeColor = (color && color.startsWith('#')) ? color : '#666666';
    const safeInitials = (initials || '?').toString().substring(0, 2).toUpperCase();
    
    // Create SVG with proper formatting (no extra whitespace)
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="12" fill="${safeColor}" stroke="#ffffff" stroke-width="3"/>
                  <circle cx="16" cy="16" r="6" fill="#ffffff"/>
                  <text x="16" y="20" text-anchor="middle" fill="${safeColor}" font-size="8" font-weight="bold" font-family="Arial,sans-serif">${safeInitials}</text>
                  </svg>`;
    
    console.log(`📍 Creating simple SVG marker for ${type}:`, {
      type,
      color: safeColor,
      initials: safeInitials,
      size,
      svgLength: svg.length
    });
    
    return svg;
  }

  /**
   * Darken a color by a percentage
   * @param {string} color - Hex color
   * @param {number} percent - Percentage to darken (0-1)
   * @returns {string} Darkened hex color
   */
  static darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  // ==========================================
  // ANIMATION PRESETS
  // ==========================================

  /**
   * Create animated SVG marker for live events
   * @param {string} type - Location type
   * @param {string} color - Primary color
   * @param {number} size - Icon size
   * @returns {string} Animated SVG string
   */
  static createAnimatedSVGMarker(type, color, size = 32) {
    const customIcon = this.getCustomIcon(type);
    
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <!-- Pulsing background for live events -->
        <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2" opacity="0.8">
          <animate attributeName="r" values="14;16;14" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0.5;0.8" dur="2s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Static inner circle -->
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        
        <!-- Custom icon -->
        <g style="color: white;">
          ${customIcon.svg}
        </g>
        
        <!-- Live indicator -->
        ${type?.toLowerCase().includes('live') ? `
          <circle cx="26" cy="6" r="3" fill="#ff0000">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/>
          </circle>
          <text x="26" y="8" text-anchor="middle" fill="white" font-size="4" font-weight="bold">L</text>
        ` : ''}
      </svg>
    `;
  }

  // ==========================================
  // EXPORT UTILITIES
  // ==========================================

  /**
   * Export all custom icons as JSON
   * @returns {string} JSON string of all icons
   */
  static exportIconsAsJSON() {
    return JSON.stringify(this.CUSTOM_ICONS, null, 2);
  }

  /**
   * Export individual icon as SVG file content
   * @param {string} type - Location type
   * @param {string} color - Color for the icon
   * @param {number} size - Size of the icon
   * @returns {string} Complete SVG file content
   */
  static exportIconAsSVG(type, color = '#4285f4', size = 64) {
    const svg = this.createCustomSVGMarker(type, color, size);
    return `<?xml version="1.0" encoding="UTF-8"?>\n${svg}`;
  }

  /**
   * Get all available icon types
   * @returns {Array} Array of available icon types
   */
  static getAvailableTypes() {
    return Object.keys(this.CUSTOM_ICONS);
  }

  /**
   * Get icon description
   * @param {string} type - Location type
   * @returns {string} Icon description
   */
  static getIconDescription(type) {
    const icon = this.getCustomIcon(type);
    return icon.description || 'Custom location icon';
  }

}

// Export for direct use
export default CustomSVGIcons;
