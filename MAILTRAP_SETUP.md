# Mailtrap.io Setup Guide

## Why Mailtrap.io?
✅ **Perfect for testing** - Catches all emails without sending to real inboxes  
✅ **Easy setup** - No Gmail app passwords or 2FA needed  
✅ **Visual inbox** - See exactly how emails look to users  
✅ **Free tier** - 100 emails/month for testing  
✅ **Professional** - Used by developers worldwide for email testing  

## Quick Setup Steps

### 1. Get Mailtrap Credentials
1. Go to [mailtrap.io](https://mailtrap.io)
2. Sign up for free account
3. Create a new inbox (or use default)
4. Go to **SMTP Settings** tab
5. Copy your credentials:
   ```
   Host: sandbox.smtp.mailtrap.io
   Port: 2525
   Username: [your-username]
   Password: [your-password]
   ```

### 2. Update .env File
Replace the email section in your `.env` file with:
```bash
# Mailtrap.io Configuration
EMAIL_SERVICE=mailtrap
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-mailtrap-username
EMAIL_PASS=your-mailtrap-password
EMAIL_MODE=production
```

### 3. Test Configuration
```bash
node test-mailtrap.js
```

### 4. Restart Server
```bash
npm start
```

### 5. Test Registration
1. Register a new user with any email address
2. Check your Mailtrap inbox for the verification email
3. Click the verification link in the email
4. User is now verified!

## Example .env Configuration
```bash
NODE_ENV=development
EMAIL_MODE=production
PORT=3000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=dev_secret_key

# Mailtrap.io SMTP Configuration
EMAIL_SERVICE=mailtrap
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=1a2b3c4d5e6f7g
EMAIL_PASS=9h8i7j6k5l4m3n

# ImageKit Configuration (existing)
IMAGEKIT_PUBLIC_KEY=public_O/9pxeXVXghCIZD8o8ySi04JvK4=
IMAGEKIT_PRIVATE_KEY=private_z98e1q+JMejEDabjjvzijXlKH84=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/rgriola

# Optional customizations
EMAIL_FROM_NAME=Map Search App
```

## Benefits for Testing

### 🔍 **See Every Email**
- All verification emails appear in Mailtrap inbox
- No emails sent to real addresses
- Perfect for testing with fake email addresses

### 🎯 **Test User Flow**
1. Register user: `testuser` with email: `fake@example.com`
2. Check Mailtrap inbox for verification email
3. Click verification link from email
4. User is verified and can login

### 🛡️ **Safe Testing**
- No spam to real email addresses
- No need to access real email accounts
- Professional email testing environment

## Next Steps
Once you have your Mailtrap credentials:
1. Update the `.env` file with your credentials
2. Run `node test-mailtrap.js` to test
3. Restart your server
4. Test user registration with any email address
5. Check Mailtrap inbox for verification emails

Need help? The test script will show you exactly what to configure!
