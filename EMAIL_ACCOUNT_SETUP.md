# Email Account Setup for Testing

## Quick Setup Guide

### Step 1: Choose Your Email Account
Use any email account you have access to (Gmail, Yahoo, Outlook, etc.). It doesn't need to be registered in your app.

### Step 2: Gmail Setup (Easiest Option)

#### For Gmail:
1. **Enable 2-Factor Authentication**
   - Go to: https://myaccount.google.com/security
   - Turn on 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (custom name)"
   - Enter "Map Search App Testing"
   - Copy the 16-character password (like: `abcd efgh ijkl mnop`)

3. **Update .env file**
   ```bash
   EMAIL_USER='your-test-email@gmail.com'
   EMAIL_PASS='abcdefghijklmnop'  # No spaces in app password
   EMAIL_MODE='production'
   ```

### Step 3: Alternative Email Services

#### Yahoo Mail:
```bash
EMAIL_SERVICE='yahoo'
EMAIL_USER='your-email@yahoo.com'
EMAIL_PASS='your-yahoo-app-password'
```

#### Outlook/Hotmail:
```bash
EMAIL_SERVICE='hotmail'
EMAIL_USER='your-email@outlook.com'
EMAIL_PASS='your-outlook-password'
```

#### Custom SMTP:
```bash
EMAIL_SERVICE='custom'
EMAIL_HOST='smtp.your-provider.com'
EMAIL_PORT='587'
EMAIL_USER='your-email@provider.com'
EMAIL_PASS='your-password'
```

### Step 4: Test the Configuration

1. **Update your .env file** with real credentials
2. **Restart the server**: `npm start`
3. **Register a test user** with a real email address you can access
4. **Check the email inbox** for the verification email

### Step 5: What Email Address to Use for Testing?

You can use:
- ✅ **Your personal email** (you'll receive the verification email)
- ✅ **A separate Gmail account** you create just for testing
- ✅ **Any email you have access to** (work email, etc.)
- ✅ **The same email from multiple test accounts** (emails will still be sent)

### Example Test Flow:
1. Register user: `testuser123` with email: `your-test-email@gmail.com`
2. Check `your-test-email@gmail.com` inbox
3. Click verification link in email
4. User `testuser123` is now verified and can login

## Ready to Set Up?

**Tell me:**
1. What email service do you want to use? (Gmail/Yahoo/Outlook/Other)
2. What email address should I help you configure?

**Then I'll:**
1. Help you get the right credentials
2. Update the .env file
3. Test sending a real email
4. Walk you through the verification process
