# Email Verification Setup Guide

## Current Status
- **Email service is disabled** because environment variables are not set
- Verification links are printed to the Node.js terminal console
- This is normal for development/testing

## How to Verify Your Email (Development Mode)

### Step 1: Register or Login
1. Register a new account or login with existing credentials
2. You'll see a yellow banner saying "Please verify your email address"

### Step 2: Find the Verification Link
1. Look at your Node.js terminal (where you ran `npm start`)
2. You'll see a line like: `Verification URL: http://localhost:3000/verify-email.html?token=...`
3. Copy this entire URL

### Step 3: Verify Your Email
1. Paste the URL into your browser
2. The verification page will process your token
3. You should see a success message

### Step 4: Refresh and Access Full Features
1. Go back to the main application
2. The logout button and other features should now be accessible
3. Click on the user area (blue section with your name) to see the dropdown menu

## Quick Fix for Current Session
Based on your terminal log, here's your verification link:
```
http://localhost:3000/verify-email.html?token=c2bac6010fe5b93efdc67725a30f8d0acb62004c07920a66d713cbb14363dcd0
```

## Setting Up Real Email Service (Optional)

To enable actual email sending, set these environment variables:

```bash
# For Gmail
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASS="your-app-password"

# Then restart the server
npm start
```

**Note**: For Gmail, you need to use an "App Password" not your regular password.

## Troubleshooting

### Logout Button Not Visible
- Make sure you're logged in
- Verify your email using the link from the terminal
- Click on the blue user area to open the dropdown menu
- The logout button is inside the dropdown, not always visible

### Verification Link Not Working
- Check that the token hasn't expired
- Make sure you're using the exact URL from the terminal
- Try registering again to get a new token

### Still Having Issues
1. Clear your browser's localStorage: `localStorage.clear()`
2. Restart the server
3. Register with a new account
4. Check the terminal for the new verification link
