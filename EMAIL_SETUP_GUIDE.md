# Email Setup Solutions

## Current Status
🔧 **Development Mode Active**: Email verification links are now shown in the server console instead of being sent via email.

## Solution Options

### Option 1: Fix Gmail Authentication (Recommended for Production)

The issue with your Gmail account is likely due to security settings. Here's how to fix it:

#### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already enabled

#### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Other (custom name)"
3. Enter "Map Search App" as the name
4. Google will generate a 16-character password like: `abcd efgh ijkl mnop`

#### Step 3: Update .env File
```bash
# Replace the current EMAIL_PASS with the app password (no spaces)
EMAIL_USER='rodczaro@gmail.com'
EMAIL_PASS='abcdefghijklmnop'
EMAIL_MODE='production'
```

#### Step 4: Restart Server
```bash
npm start
```

### Option 2: Alternative Email Services

#### SendGrid (Free tier: 100 emails/day)
```bash
# .env
EMAIL_SERVICE='SendGrid'
EMAIL_USER='apikey'
EMAIL_PASS='your-sendgrid-api-key'
```

#### Mailgun (Free tier: 5,000 emails/month)
```bash
# .env
EMAIL_SERVICE='Mailgun'
EMAIL_USER='your-mailgun-smtp-user'
EMAIL_PASS='your-mailgun-smtp-password'
```

#### Office 365 / Outlook
```bash
# .env
EMAIL_SERVICE='hotmail'  # or 'outlook365'
EMAIL_USER='your-email@outlook.com'
EMAIL_PASS='your-password-or-app-password'
```

### Option 3: Keep Development Mode (Current Setup)

This is perfect for testing and development:
- ✅ No email configuration needed
- ✅ Verification links appear in console
- ✅ Testers can register immediately
- ✅ No external dependencies

## Testing the Current Setup

1. **Register a new user** at: http://localhost:3000/login.html
2. **Check the server console** for the verification link
3. **Copy and visit the verification URL**
4. **Login with the verified account**

## Next Steps

For immediate testing with your beta users, the current development mode setup is perfect. You can:

1. Share the dev-email-guide.html page with testers
2. Help them register by copying verification links from your console
3. Later switch to production email mode when ready

Would you like me to help you set up Gmail App Passwords, or would you prefer to continue with development mode for now?
