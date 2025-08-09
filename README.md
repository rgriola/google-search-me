# Google Maps Search App with Authentication & Shared Database

A modern, secure, and responsive Google Maps application with search functionality, user authentication, and shared saved locations using a database backend. **Fully hardened with enterprise-grade security features.**

## ✨ Key Features

### 🗺️ Map & Search
- **Smart Search**: Search for places with autocomplete suggestions and keyboard navigation
- **Interactive Map**: Click on places to see detailed information with photo galleries
- **Click-to-Save**: Click anywhere on the map to save custom locations instantly
- **GPS Integration**: Center map on your location with one-click GPS button
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern UI**: Clean, Google-inspired interface with accessibility features

### 🔐 User Authentication & Security
- **Secure Registration**: Create accounts with enforced strong password requirements
- **Protected Login/Logout**: JWT-based session management with secure cookies
- **Account Recovery**: Secure password reset with token-based email verification
- **User Profile Management**: Update personal information and change passwords safely
- **Session Security**: Persistent login with automatic token validation and refresh
- **Multi-layer Security**: XSS protection, CSRF prevention, secure headers, and rate limiting

### 📍 Location Management
- **Personal Collections**: Each user maintains their own private saved locations
- **Shared Database**: Contribute to a community database of interesting places
- **Popular Locations**: Discover places saved by multiple users in the community
- **Rich Location Data**: Save with photos, ratings, addresses, and custom captions
- **Bulk Operations**: Manage multiple locations with easy delete and export features
- **GPS Permission Control**: Fine-grained location sharing preferences

## 🔒 Enterprise-Grade Security

### 🛡️ Security Implementation (2024 Update)
This application has been fully hardened with comprehensive security measures:

**XSS Protection:**
- All user inputs sanitized with advanced HTML escaping
- Content Security Policy (CSP) ready - no inline scripts or styles
- Secure templating system prevents injection attacks
- SafeHTML utilities for all dynamic content rendering

**Authentication Security:**
- bcrypt password hashing with 12+ salt rounds
- JWT tokens with secure expiration and refresh mechanisms
- Rate limiting: 5 login attempts per 15 minutes per IP
- Secure session cookies with HttpOnly, Secure, and SameSite flags
- Password strength validation with entropy analysis

**Infrastructure Security:**
- CSRF protection with cryptographically secure tokens
- Secure HTTP headers (HSTS, X-Frame-Options, etc.)
- Environment-aware debug logging (production logs filtered)
- Input validation and sanitization at all endpoints
- SQL injection prevention with parameterized queries

**Privacy & Data Protection:**
- Optional anonymous usage (no tracking)
- User-controlled GPS permission settings
- Secure password reset with time-limited tokens
- Data minimization - only necessary information stored

### 🎯 Zero Security Vulnerabilities
- ✅ All inline onclick handlers eliminated (CSP compliant)
- ✅ XSS vulnerabilities patched across all modules
- ✅ CSRF protection active on all state-changing operations
- ✅ Secure cookie configuration for production deployment
- ✅ Debug information properly filtered from production logs

## 🏗️ Modern Architecture

### Frontend Architecture
- **Modular Design**: ES6+ modules with clean separation of concerns
- **Security-First**: CSP-compliant code with no inline scripts or event handlers
- **Responsive**: Mobile-first design with progressive enhancement
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
- **Performance**: Lazy loading, optimized assets, and efficient state management

### Backend Architecture
- **Node.js & Express**: RESTful API with comprehensive middleware stack
- **SQLite Database**: Lightweight, file-based database with migration support
- **Security Middleware**: CSRF protection, rate limiting, secure headers
- **Environment Configuration**: Development, test, and production environments
- **Logging System**: Structured logging with automatic PII filtering

### Code Quality & Maintenance
- **Clean Code**: Consistent formatting, comprehensive comments, and clear naming
- **Error Handling**: Comprehensive error catching with user-friendly messages
- **Test Coverage**: Dedicated test files for critical functionality validation
- **Documentation**: Complete API documentation and setup guides
- **Deployment Ready**: Production-optimized configuration and deployment scripts

## Database Schema

### users table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `password_hash`: Hashed password (bcrypt)
- `first_name`: User's first name
- `last_name`: User's last name
- `created_at`, `updated_at`: Timestamps
- `is_active`: Account status
- `reset_token`: Password reset token
- `reset_token_expires`: Reset token expiration

### saved_locations table
- `id`: Primary key
- `place_id`: Google Places ID (unique)
- `name`: Location name
- `address`: Full address
- `lat`, `lng`: Coordinates
- `rating`: Google rating
- `website`: Website URL
- `photo_url`: Photo URL
- `saved_count`: Number of users who saved this location
- `created_at`, `updated_at`: Timestamps

### user_saves table
- `id`: Primary key
- `user_id`: Reference to users table (or anonymous user identifier)
- `place_id`: Reference to saved_locations
- `saved_at`: When user saved the location

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Get a Google Maps API Key
- Go to the [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select an existing one
- Enable the following APIs:
  - Maps JavaScript API
  - Places API
- Create credentials (API Key)
- Restrict the API key to your domain for security

## 🚀 Setup & Deployment

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Set up environment (development)
npm run dev:setup

# 3. Start the application
npm run dev        # Development with auto-reload
# OR
npm start         # Production mode
```

### Environment Configuration
The application supports multiple environments with automatic configuration:

```bash
# Development setup (with debug logging)
npm run dev:setup && npm run dev

# Production setup (optimized and secure)
npm run prod:setup && npm start

# Test environment setup
npm run test:setup && npm start
```

### Google Maps API Setup
1. **Get API Key**: Visit [Google Cloud Console](https://console.cloud.google.com/)
2. **Enable APIs**: Maps JavaScript API, Places API, and Geocoding API
3. **Configure**: Add your API key to the environment configuration
4. **Secure**: Restrict API key to your domain for production

### Production Deployment

#### Required Environment Variables
```bash
JWT_SECRET=your-super-secret-jwt-key-here
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NODE_ENV=production
PORT=3000
DATABASE_URL=./server/locations.db
```

#### Security Checklist for Production
- ✅ Set `NODE_ENV=production` for optimized security settings
- ✅ Use HTTPS with valid SSL certificates
- ✅ Configure secure JWT_SECRET (minimum 32 characters)
- ✅ Enable firewall and limit server access
- ✅ Set up monitoring and log rotation
- ✅ Configure backup strategy for SQLite database
- ✅ Update CORS settings for your domain

#### Deployment Platforms
- **Render**: Use provided `render-deployment-guide.md`
- **Heroku**: Compatible with buildpack auto-detection
- **DigitalOcean**: VPS deployment with PM2 process manager
- **Vercel**: Frontend deployment (API functions require setup)

## 🔌 API Documentation

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user account | ❌ |
| POST | `/api/auth/login` | User login with credentials | ❌ |
| POST | `/api/auth/logout` | Secure logout and token invalidation | ✅ |
| GET | `/api/auth/profile` | Get current user profile | ✅ |
| PUT | `/api/auth/profile` | Update user information | ✅ |
| PUT | `/api/auth/change-password` | Change user password | ✅ |
| POST | `/api/auth/forgot-password` | Request password reset | ❌ |
| POST | `/api/auth/reset-password` | Reset password with token | ❌ |
| GET | `/api/auth/verify` | Verify authentication token | ✅ |

### Location Management Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/user/locations` | Get user's saved locations | ✅ |
| POST | `/api/user/locations` | Save new location | ✅ |
| PUT | `/api/user/locations/:placeId` | Update saved location | ✅ |
| DELETE | `/api/user/locations/:placeId` | Delete saved location | ✅ |
| GET | `/api/locations/popular` | Get community popular locations | ❌ |
| GET | `/api/locations` | Get all public locations | ❌ |

### Admin Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/users` | Get all users (admin only) | ✅ (Admin) |
| PUT | `/api/admin/users/:id/status` | Toggle user active status | ✅ (Admin) |
| GET | `/api/admin/stats` | Get application statistics | ✅ (Admin) |

### Security & Utility Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check and server status | ❌ |
| GET | `/api/csrf-token` | Get CSRF protection token | ❌ |
| POST | `/api/feedback` | Submit user feedback | ✅ |

## 🎯 How to Use

### 🔍 Discovering Places
1. **Search**: Type location names in the search bar with autocomplete suggestions
2. **Navigate**: Use keyboard arrows and Enter to select suggestions quickly
3. **Explore**: Click on map markers to see detailed information and photos
4. **GPS**: Use the GPS button to center the map on your current location

### 💾 Saving Locations
1. **Click-to-Save**: Enable click-to-save mode and click anywhere on the map
2. **Search Results**: Click "Save Location" in any search result info window
3. **Custom Data**: Add personal captions and notes to saved locations
4. **Privacy**: Choose to save privately or contribute to the community database

### 📋 Managing Your Locations
1. **View Collection**: Access your saved locations in the sidebar panel
2. **Edit Details**: Update names, captions, and categories for saved places
3. **Delete Items**: Remove individual locations or clear your entire collection
4. **Export Data**: Download your saved locations for backup or migration

### 👥 Community Features
1. **Popular Places**: Discover locations saved by multiple users
2. **Shared Knowledge**: Benefit from community-contributed location data
3. **Privacy Control**: Choose what information to share with the community

### 🔐 Account Management
1. **Profile**: Update your personal information and preferences
2. **Security**: Change passwords and manage login sessions
3. **Privacy**: Control GPS permissions and data sharing settings
4. **Recovery**: Use email-based password reset if needed

## Features

### Shared Database Benefits
- **Collaborative**: All users contribute to a shared knowledge base
- **Popular locations**: See what places other users find interesting
- **Persistent**: Data survives browser refreshes and device changes
- **Scalable**: Can handle many users and locations

### Privacy
- **Anonymous users**: No personal information stored
- **User IDs**: Generated automatically and stored locally
- **No tracking**: Simple anonymous usage

## 📁 Project Structure

```
google-search-me/
├── 📄 Main Application Files
│   ├── app.html              # Main application interface
│   ├── login.html            # Authentication pages
│   ├── package.json          # Dependencies and scripts
│   └── README.md             # This documentation
│
├── 🎨 Frontend Assets
│   ├── css/                  # Stylesheets and components
│   │   ├── styles.css        # Main application styles
│   │   ├── auth.css          # Authentication styling
│   │   ├── components/       # Reusable component styles
│   │   └── pages/            # Page-specific styles
│   │
│   └── js/                   # JavaScript modules
│       ├── main.js           # Application entry point
│       ├── modules/          # Feature modules
│       │   ├── auth/         # Authentication system
│       │   ├── maps/         # Google Maps integration
│       │   ├── locations/    # Location management
│       │   └── photos/       # Photo handling
│       └── utils/            # Utility functions and security
│
├── 🖥️ Backend Server
│   └── server/
│       ├── app.js            # Express server setup
│       ├── config/           # Environment configuration
│       ├── middleware/       # Security and API middleware
│       ├── models/           # Database models
│       ├── routes/           # API endpoints
│       ├── services/         # Business logic
│       ├── utils/            # Server utilities and logging
│       └── locations.db      # SQLite database
│
├── 📋 Testing & Quality
│   ├── test/                 # Test files and utilities
│   └── md/                   # Documentation and guides
│
└── 🔧 Configuration
    ├── .env files            # Environment variables
    └── setup scripts        # Deployment automation
```

## 🔧 Development & Testing

### Development Workflow
```bash
# Start development server with auto-reload
npm run dev

# Run with specific environment
npm run dev:setup && npm run dev    # Development
npm run test:setup && npm start     # Test environment
npm run prod:setup && npm start     # Production testing

# Utilities
npm run check-env                   # Validate environment setup
npm run migrate:db                  # Run database migrations
```

### Testing Features
- **Manual Testing**: Comprehensive test files in `/test` directory
- **API Testing**: Server connection and endpoint validation tools
- **Security Testing**: XSS, CSRF, and authentication test utilities
- **Performance Testing**: Load testing and optimization validation

### Development Tools
```javascript
// Available in browser console for debugging:
window.testServerConnection()       // Test API connectivity
window.debugUserStatus()           // Check authentication state
window.diagnoseClickToSave()       // Debug map interaction
window.testFullWorkflow()          // End-to-end functionality test
```

### Code Quality Standards
- **ES6+ JavaScript**: Modern syntax with async/await patterns
- **Modular Architecture**: Clean separation of concerns
- **Security-First**: All code follows security best practices
- **Documentation**: Comprehensive inline comments and guides
- **Error Handling**: Graceful failure with user-friendly messages

### Database Inspection
```bash
# SQLite database inspection
sqlite3 server/locations.db

# Useful queries
.tables                            # List all tables
SELECT * FROM users LIMIT 5;      # View users
SELECT * FROM saved_locations;    # View locations
SELECT * FROM user_saves;         # View user-location relationships
.exit                             # Exit SQLite
```

## 🛡️ Security & Production Deployment

### 🔒 Production Security Configuration

#### Environment Variables (Required for Production)
```bash
# Authentication & Security
JWT_SECRET=your-cryptographically-secure-secret-key-minimum-32-chars
NODE_ENV=production

# Google Maps Integration
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Server Configuration
PORT=3000
API_BASE_URL=https://yourdomain.com/api

# Database
DATABASE_URL=./server/locations.db

# Email Configuration (Optional)
SMTP_HOST=smtp.yourmailprovider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
```

#### 🛡️ Security Features Active in Production
- **Content Security Policy**: Strict CSP headers prevent XSS attacks
- **CSRF Protection**: Cryptographically secure tokens on all state-changing operations
- **Secure Cookies**: HttpOnly, Secure, SameSite=Strict configuration
- **Rate Limiting**: Brute force protection (5 attempts per 15 minutes)
- **Input Sanitization**: All user inputs escaped and validated
- **Secure Headers**: HSTS, X-Frame-Options, X-Content-Type-Options
- **Password Security**: bcrypt with 12+ salt rounds and strength validation
- **Session Management**: JWT tokens with secure expiration and refresh

#### 🔍 Security Monitoring
- **Audit Logging**: All authentication and critical operations logged
- **Error Filtering**: Sensitive information automatically filtered from logs
- **Health Monitoring**: `/api/health` endpoint for uptime monitoring
- **Security Headers**: Automated security header injection

### 📊 Performance & Scalability
- **Database**: SQLite for development, easily upgradeable to PostgreSQL for production
- **Caching**: Client-side caching for Maps API responses and user data
- **Lazy Loading**: Optimized asset loading for faster page loads
- **Mobile Optimization**: Progressive Web App features and mobile-first design

### 🔄 Backup & Recovery
```bash
# Database backup (recommended daily)
cp server/locations.db backups/locations-$(date +%Y%m%d).db

# User data export (for migration)
sqlite3 server/locations.db ".dump" > backup.sql

# Environment recovery
npm run prod:setup  # Restores production environment configuration
```

## 💻 Browser Support & Compatibility

### ✅ Supported Browsers
- **Chrome 90+** (Recommended)
- **Firefox 88+** 
- **Safari 14+**
- **Edge 90+**
- **Mobile Safari (iOS 14+)**
- **Chrome Mobile (Android 8+)**

### 📱 Mobile & PWA Features
- **Responsive Design**: Optimized for all screen sizes
- **Touch Gestures**: Native mobile map interactions
- **GPS Integration**: Location services on mobile devices
- **Offline Capability**: Service worker for basic offline functionality
- **App-like Experience**: Home screen installation support

## 🛠️ Technologies & Dependencies

### Frontend Stack
- **Core**: HTML5, CSS3, Modern JavaScript (ES2020+)
- **Maps**: Google Maps JavaScript API v3
- **Security**: Content Security Policy, XSS protection utilities
- **UI/UX**: Responsive design, accessibility features
- **Performance**: Lazy loading, optimized asset delivery

### Backend Stack
- **Runtime**: Node.js 16+ with Express.js framework
- **Database**: SQLite3 (development) / PostgreSQL (production ready)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Security**: CSRF protection, rate limiting, secure headers
- **Email**: Nodemailer with SMTP support

### Key Dependencies
```json
{
  "production": {
    "bcrypt": "^6.0.0",           // Password hashing
    "express": "^4.18.2",        // Web framework
    "jsonwebtoken": "^9.0.2",    // Authentication tokens
    "sqlite3": "^5.1.6",         // Database
    "cors": "^2.8.5",            // Cross-origin requests
    "express-rate-limit": "^7.1.5" // Rate limiting
  },
  "development": {
    "nodemon": "Auto-reload server" // Development server
  }
}
```

## 📄 License & Contributing

### License
MIT License - Feel free to use, modify, and distribute.

### Contributing Guidelines
1. **Security First**: All contributions must maintain security standards
2. **Code Quality**: Follow existing patterns and include comprehensive comments
3. **Testing**: Add tests for new features and verify existing functionality
4. **Documentation**: Update relevant documentation for changes
5. **Performance**: Consider impact on loading times and user experience

### Reporting Issues
- **Security Issues**: Report privately to maintain security
- **Bug Reports**: Include browser, environment, and reproduction steps
- **Feature Requests**: Provide use cases and implementation suggestions

## 📚 Additional Documentation

### Comprehensive Guides Available
- `SECURITY_IMPLEMENTATION_COMPLETE.md` - Complete security audit and fixes
- `MEDIUM_PRIORITY_SECURITY_COMPLETE.md` - Additional security hardening
- `MEDIUM_PRIORITY_TEST_CLEANUP_COMPLETE.md` - Test file cleanup summary
- `md/RENDER_DEPLOYMENT_GUIDE.md` - Deployment to Render platform
- `md/EMAIL_SETUP_GUIDE.md` - Email integration setup
- `md/GPS_IMPLEMENTATION_COMPLETE.md` - GPS feature documentation

### Development Resources
- `md/TESTING_CHECKLIST.md` - Quality assurance checklist
- `js/modules/auth/README.md` - Authentication system documentation
- `server/config/CONFIG_README.md` - Server configuration guide

---

**Last Updated**: August 2025 | **Version**: 2.0.0 | **Security Status**: ✅ Fully Hardened
