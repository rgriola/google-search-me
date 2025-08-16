# Development Guide

A comprehensive guide for developers working on the Google Maps Search App.

## 🎯 Overview

This application is a production-ready, secure Google Maps application with enterprise-grade security features. It follows modern development practices with a focus on security, maintainability, and user experience.

## 🏗️ Architecture Overview

### Frontend Architecture
```
js/
├── main.js                 # Application entry point and module coordination
├── modules/                # Feature-based modules
│   ├── auth/              # Authentication system
│   │   ├── AuthService.js     # Core authentication logic
│   │   ├── AuthModalService.js # Login/register modals
│   │   ├── AuthUICore.js      # UI state management
│   │   └── AuthNotificationService.js # User notifications
│   ├── maps/              # Google Maps integration
│   │   ├── MapService.js      # Map initialization and management
│   │   ├── SearchService.js   # Place search functionality
│   │   ├── MarkerService.js   # Map markers and info windows
│   │   └── ClickToSaveService.js # Click-to-save functionality
│   ├── locations/         # Location management
│   │   ├── LocationsModule.js  # Main locations coordinator
│   │   ├── LocationDialogManager.js # Save/edit dialogs
│   │   └── ui/LocationListRenderer.js # Location list display
│   └── photos/            # Photo handling
│       └── PhotoDisplayService.js # Photo galleries and display
└── utils/                 # Utility functions
    ├── SecurityUtils.js   # XSS protection and secure HTML handling
    ├── StateManager.js    # Application state management
    └── ClientSecurity.js  # CSRF protection and secure requests
```

### Backend Architecture
```
server/
├── app.js                 # Express server setup and middleware
├── config/                # Environment configuration
├── middleware/            # Security and API middleware
│   ├── auth.js           # JWT authentication middleware
│   ├── csrfProtection.js # CSRF token validation
│   └── securityHeaders.js # Security headers injection
├── models/                # Database models and schemas
├── routes/                # API endpoint definitions
│   ├── auth.js           # Authentication endpoints
│   ├── locations.js      # Location management endpoints
│   └── admin.js          # Admin panel endpoints
├── services/              # Business logic services
└── utils/                 # Server utilities
    └── logger.js         # Secure logging with PII filtering
```

## 🔒 Security Architecture

### XSS Protection System
All dynamic content is protected through the `SecurityUtils` module:

```javascript
// Safe HTML insertion (automatically escapes content)
SecurityUtils.setSafeHTML(element, userContent);

// Advanced HTML with attribute escaping
SecurityUtils.setSafeHTMLAdvanced(element, htmlContent, allowedAttributes);

// Manual escaping for templates
const safe = SecurityUtils.escapeHtml(userInput);
const safeAttr = SecurityUtils.escapeHtmlAttribute(attributeValue);
```

### Event Delegation Security
All event handlers use secure delegation to prevent inline script execution:

```javascript
// Instead of: onclick="functionName()"
// Use data attributes:
<button data-action="save-location" data-place-id="123">Save</button>

// With event delegation:
document.addEventListener('click', (event) => {
    const action = event.target.getAttribute('data-action');
    if (action === 'save-location') {
        const placeId = event.target.getAttribute('data-place-id');
        handleSaveLocation(placeId);
    }
});
```

### CSRF Protection
All state-changing requests include CSRF tokens:

```javascript
// Automatic CSRF token inclusion
const response = await secureRequest.post('/api/locations', locationData);

// Manual token handling (if needed)
const token = await secureRequest.getCSRFToken();
fetch('/api/endpoint', {
    headers: { 'X-CSRF-Token': token }
});
```

## 🛠️ Development Workflow

### Environment Setup
```bash
# 1. Clone and install
git clone <repository>
cd google-search-me
npm install

# 2. Environment configuration
npm run dev:setup          # Development environment
npm run test:setup         # Test environment  
npm run prod:setup         # Production testing

# 3. Start development
npm run dev                # Auto-reload development server
```

### Development Commands
```bash
# Development
npm run dev                # Start with auto-reload
npm start                  # Start production mode
npm run check-env          # Validate environment setup

# Database
npm run migrate:db         # Run database migrations
sqlite3 server/locations.db # Inspect database directly

# Testing
npm run test              # Run automated tests (when available)
# Manual testing files in /test directory
```

### Environment Variables
Create `.env` files for different environments:

```bash
# .env.development
NODE_ENV=development
JWT_SECRET=dev-secret-key-min-32-chars
GOOGLE_MAPS_API_KEY=your-dev-api-key
PORT=3000
DATABASE_URL=./server/locations.db

# .env.production
NODE_ENV=production
JWT_SECRET=production-super-secure-secret-key
GOOGLE_MAPS_API_KEY=your-production-api-key
PORT=3000
DATABASE_URL=./server/locations.db
```

## 🧪 Testing & Quality Assurance

### Manual Testing
Use the test files in `/test` directory:
- `test-server-permissions.html` - Server permission testing
- Authentication flow testing
- Location save/edit functionality testing
- Mobile responsiveness testing

### Browser Console Debug Tools
```javascript
// Available debug functions:
window.testServerConnection()      // Test API connectivity
window.debugUserStatus()          // Check authentication state
window.diagnoseClickToSave()      // Debug map interactions
window.testFullWorkflow()         // End-to-end testing
window.debugLocationData()        // Location state debugging
```

### Security Testing
```javascript
// XSS Testing (should be safely escaped)
const maliciousContent = '<script>alert("XSS")</script>';
SecurityUtils.setSafeHTML(element, maliciousContent);

// CSRF Testing (should be automatically protected)
// All POST/PUT/DELETE requests include CSRF tokens

// Authentication Testing
window.debugLoginFlow();           // Debug authentication process
```

## 📝 Code Standards & Best Practices

### JavaScript Standards
```javascript
// ✅ Use modern ES6+ features
const authenticatedUser = await AuthService.getCurrentUser();

// ✅ Proper error handling
try {
    const result = await apiCall();
    return result;
} catch (error) {
    console.error('Operation failed:', error);
    showUserFriendlyError('Something went wrong. Please try again.');
    throw error; // Re-throw if caller needs to handle
}s

// ✅ Security-first approach
const safeContent = SecurityUtils.escapeHtml(userInput);
element.textContent = safeContent; // Preferred over innerHTML

// ✅ Comprehensive documentation
/**
 * Saves a location to the user's personal collection
 * @param {Object} locationData - Location information from Google Places
 * @param {string} locationData.placeId - Unique Google Places ID
 * @param {string} locationData.name - Human-readable place name
 * @returns {Promise<boolean>} Success status of save operation
 * @throws {Error} When user is not authenticated or API call fails
 */
async function saveLocation(locationData) {
    // Implementation...
}
```

### Security Code Patterns
```javascript
// ✅ Safe event handling
document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    
    event.preventDefault();
    const action = button.getAttribute('data-action');
    handleSecureAction(action, button);
});

// ✅ Input validation
function validateLocationData(data) {
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid location data');
    }
    
    const required = ['placeId', 'name', 'lat', 'lng'];
    for (const field of required) {
        if (!data[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    
    return true;
}

// ✅ Secure API calls
async function secureApiCall(endpoint, data) {
    const token = await secureRequest.getCSRFToken();
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return response.json();
}
```

## 🎨 UI Development Guidelines

### CSS Organization
```scss
// Follow BEM methodology for class names
.location-card {}                    // Block
.location-card__title {}            // Element
.location-card--featured {}         // Modifier

// Use CSS custom properties for theming
:root {
    --primary-color: #1976d2;
    --danger-color: #d32f2f;
    --border-radius: 8px;
}

// Mobile-first responsive design
.component {
    // Mobile styles first
    padding: 1rem;
    
    @media (min-width: 768px) {
        // Tablet styles
        padding: 1.5rem;
    }
    
    @media (min-width: 1024px) {
        // Desktop styles
        padding: 2rem;
    }
}
```

### Accessibility Requirements
```html
<!-- ✅ Proper semantic markup -->
<button type="button" 
        aria-label="Save current location" 
        data-action="save-location">
    Save Location
</button>

<!-- ✅ Form labels -->
<label for="location-name">Location Name</label>
<input id="location-name" type="text" required>

<!-- ✅ ARIA landmarks -->
<nav aria-label="Main navigation">
<main aria-label="Map and search interface">
<aside aria-label="Saved locations">
```

## 🔄 Database Development

### Schema Management
```sql
-- User table with security features
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Location sharing with privacy controls
CREATE TABLE saved_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Migration Example
```javascript
// server/migrations/001_add_gps_permissions.js
export const up = async (db) => {
    await db.exec(`
        ALTER TABLE users 
        ADD COLUMN gps_permission VARCHAR(20) DEFAULT 'denied'
    `);
};

export const down = async (db) => {
    await db.exec(`
        ALTER TABLE users 
        DROP COLUMN gps_permission
    `);
};
```

## 🚀 Deployment Guidelines

### Pre-deployment Checklist
- [ ] All environment variables configured
- [ ] Security headers properly set
- [ ] HTTPS certificates configured
- [ ] Database backup strategy implemented
- [ ] Error monitoring configured
- [ ] Performance monitoring active

### Production Configuration
```javascript
// server/config/production.js
export default {
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '24h'
    },
    security: {
        rateLimiting: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // requests per window
        },
        csrf: {
            enabled: true,
            secret: process.env.CSRF_SECRET
        }
    },
    logging: {
        level: 'warn', // Only warnings and errors in production
        filterSensitiveData: true
    }
};
```

## 🐛 Debugging & Troubleshooting

### Common Issues & Solutions

**Authentication Issues:**
```javascript
// Debug authentication state
window.debugLoginFlow();
console.log('Auth state:', StateManager.getAuthState());
console.log('JWT token valid:', await AuthService.verifyAuthToken());
```

**Map Integration Issues:**
```javascript
// Debug Google Maps integration
console.log('Map instance:', MapService.getMap());
console.log('Places service:', SearchService.getPlacesService());
window.diagnoseClickToSave(); // Comprehensive map interaction debug
```

**Location Save Issues:**
```javascript
// Debug location saving process
window.debugLocationData();
console.log('Saved locations:', StateManager.getSavedLocations());
```

### Performance Monitoring
```javascript
// Performance timing
const startTime = performance.now();
await someOperation();
const endTime = performance.now();
console.log(`Operation took ${endTime - startTime}ms`);

// Memory usage monitoring
console.log('Memory usage:', {
    used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
    total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB'
});
```

## 📚 Additional Resources

### Documentation Files
- `README.md` - Main project documentation
- `SECURITY_IMPLEMENTATION_COMPLETE.md` - Security audit and fixes
- `CHANGELOG.md` - Version history and changes
- `md/RENDER_DEPLOYMENT_GUIDE.md` - Deployment instructions
- `js/modules/auth/README.md` - Authentication system details

### External Resources
- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Last Updated**: August 2025 | **Version**: 2.0.0 | **Maintainer**: Development Team
