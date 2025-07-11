# Google Maps Search App with Authentication & Shared Database

A modern, responsive Google Maps application with search functionality, user authentication, and shared saved locations using a database backend.

## Features

### Map & Search
- **Smart Search**: Search for places with autocomplete suggestions
- **Interactive Map**: Click on places to see detailed information
- **Keyboard Navigation**: Use arrow keys and Enter to navigate suggestions
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, Google-inspired interface

### User Authentication
- **Registration**: Create new user accounts with secure password requirements
- **Login/Logout**: Secure session management with JWT tokens
- **Account Recovery**: Password reset functionality via email
- **User Profile**: Update personal information and change passwords
- **Session Management**: Persistent login with token validation

### Location Management
- **Personal Saves**: Each authenticated user has their own saved locations list
- **Shared Database**: Save locations that all users can see and benefit from
- **Popular Locations**: See locations saved by multiple users
- **Location Details**: View saved locations with photos, ratings, and addresses
- **Easy Management**: Delete individual locations or clear all saved locations

## Authentication System

### Security Features
- **Password Requirements**: 8+ characters with uppercase, lowercase, numbers, and special characters
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **JWT Tokens**: Secure token-based authentication with expiration
- **Rate Limiting**: Protection against brute force login attempts
- **Input Validation**: Server-side validation for all user inputs

### User Management
- **Profile Updates**: Change email, first name, and last name
- **Password Changes**: Update password with current password verification
- **Account Recovery**: Reset password with secure token-based system
- **User Sessions**: Persistent login across browser sessions

## Architecture

### Frontend
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with flexbox and responsive design
- **JavaScript**: ES6+ features with async/await and Google Maps API integration

### Backend
- **Node.js**: Server runtime
- **Express**: Web application framework
- **SQLite**: Lightweight database for storing locations
- **CORS**: Cross-origin resource sharing enabled

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

### 3. Configure the API Key
- Open `index.html`
- Replace `YOUR_API_KEY` with your actual Google Maps API key

### 4. Start the Server
```bash
npm start
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)
- `PUT /api/auth/change-password` - Change password (requires auth)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Locations
- `GET /api/user/locations` - Get user's saved locations (requires auth)
- `POST /api/user/locations` - Save location (requires auth)
- `DELETE /api/user/locations/:placeId` - Delete saved location (requires auth)
- `GET /api/locations/popular` - Get popular locations (public)
- `GET /api/locations` - Get all saved locations (public)

### Legacy Endpoints (backwards compatibility)
- `GET /api/user/:userId/locations` - Get user's saved locations
- `POST /api/locations` - Save location (now requires authentication)
- `DELETE /api/user/:userId/locations/:placeId` - Delete saved location

## How to Use

### Save Locations
1. **Search for a place** as usual
2. **Click "Save Location"** in the info window
3. **Location is saved** to the shared database
4. **Other users can see** popular locations you've saved

### View Saved Locations
1. **Personal saves** appear in your sidebar
2. **Popular locations** show places saved by multiple users
3. **Click any location** to navigate to it

### Manage Locations
1. **Delete individual** locations using the X button
2. **Clear all** your saved locations
3. **View popular** locations from other users

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

## File Structure

```
google-search-me/
├── server.js          # Backend server
├── index.html         # Frontend HTML
├── script.js          # Frontend JavaScript
├── styles.css         # Frontend CSS
├── package.json       # Dependencies
├── locations.db       # SQLite database (created automatically)
└── README.md          # This file
```

## Development

### Start Development Server
```bash
npm run dev
```

### Production Deployment
1. Set up a production database (PostgreSQL recommended)
2. Configure environment variables
3. Deploy to your hosting platform
4. Update API_BASE_URL in script.js

## Security & Production

### Environment Variables
For production deployment, set these environment variables:
- `JWT_SECRET` - Secret key for JWT token signing (required)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Set to 'production' for production builds

### Security Features
- All passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens expire after 24 hours
- Rate limiting prevents brute force attacks (5 attempts per 15 minutes)
- Input validation prevents injection attacks
- HTTPS should be used in production
- Password reset tokens expire after 1 hour

### Password Reset
The password reset functionality generates secure tokens and logs reset URLs to the console for development. In production, these would be sent via email using a service like SendGrid or AWS SES.

## Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Authentication**: JWT, bcrypt
- **Maps**: Google Maps JavaScript API
- **Security**: express-rate-limit, express-session

## Database Inspection

You can inspect the SQLite database using the command line:

```bash
# Open the database
sqlite3 locations.db

# List all tables
.tables

# View users
SELECT * FROM users;

# View saved locations
SELECT * FROM saved_locations;

# View user saves
SELECT * FROM user_saves;

# Exit
.exit
```

## License
MIT License
