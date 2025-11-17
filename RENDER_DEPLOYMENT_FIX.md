# 🚀 Render.com Deployment Guide

## 🔧 Environment Variable Setup

Your deployment is failing because Render needs environment variables configured in the dashboard, not in `.env` files.

### ⚠️ **IMMEDIATE FIX REQUIRED**

Go to your Render dashboard and set these environment variables:

**Render Dashboard → Your Service → Environment → Add Environment Variable**

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `JWT_SECRET` | `[64+ char secret]` | Generate with: `openssl rand -base64 64` |
| `SESSION_SECRET` | `[64+ char secret]` | Generate with: `openssl rand -base64 64` |
| `GOOGLE_MAPS_API_KEY` | `AIzaSy...` | Your Google Maps API key |
| `IMAGEKIT_PUBLIC_KEY` | `public_...` | Your ImageKit public key |
| `IMAGEKIT_PRIVATE_KEY` | `private_...` | Your ImageKit private key |
| `IMAGEKIT_URL_ENDPOINT` | `https://ik.imagekit.io/...` | Your ImageKit endpoint |
| `EMAIL_HOST` | `live.smtp.mailtrap.io` | Mailtrap live SMTP |
| `EMAIL_PASS` | `[your-api-token]` | Mailtrap API token |

## 🔐 Generate Secure Secrets

```bash
# Generate JWT_SECRET (64+ characters)
openssl rand -base64 64

# Generate SESSION_SECRET (64+ characters) 
openssl rand -base64 64
```

## 📋 Complete Environment Variable List

Copy these into Render Dashboard → Environment Variables:

```
NODE_ENV=production
JWT_SECRET=<generate-64-char-secret>
SESSION_SECRET=<generate-64-char-secret>
GOOGLE_MAPS_API_KEY=<your-google-maps-key>
IMAGEKIT_PUBLIC_KEY=<your-imagekit-public-key>
IMAGEKIT_PRIVATE_KEY=<your-imagekit-private-key>
IMAGEKIT_URL_ENDPOINT=<your-imagekit-endpoint>
EMAIL_SERVICE=mailtrap
EMAIL_HOST=live.smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_USER=api
EMAIL_PASS=<your-mailtrap-api-token>
EMAIL_MODE=production
EMAIL_FROM_NAME=Your App Name
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
DATABASE_PATH=/opt/render/project/database/locations.db
FRONTEND_URL=https://yourdomain.com
API_BASE_URL=https://yourdomain.com/api
```

## 🗄️ Database Setup

1. **Add Persistent Disk:**
   - Render Dashboard → Your Service → Settings
   - Add Disk: Mount Path = `/opt/render/project/database`
   - Size: 1GB (minimum)

2. **Set Database Path:**
   - Environment Variable: `DATABASE_PATH=/opt/render/project/database/locations.db`

## 🔍 Troubleshooting

### Error: "Missing required environment variables"
- ✅ **Solution:** Add all variables listed above in Render Dashboard
- ❌ **Don't:** Try to use `.env` files - Render ignores them in production

### Error: "JWT secret should be 64+ characters"
- ✅ **Solution:** Generate longer secrets with `openssl rand -base64 64`

### Error: "Google Maps API key format invalid"
- ✅ **Solution:** Ensure key starts with `AIza` and is 39 characters total

### Error: "Database connection failed"
- ✅ **Solution:** Add persistent disk and set correct `DATABASE_PATH`

## 🚀 Deploy Process

1. **Set Environment Variables** (in Render Dashboard)
2. **Add Persistent Disk** (for database)
3. **Deploy** - should now start successfully
4. **Test** - verify application loads correctly

## ✅ Success Indicators

When deployment succeeds, you'll see:
```
✅ Environment Configuration Validation passed
✅ Connected to SQLite database
✅ ImageKit initialized successfully
✅ Email service initialization complete
✅ Modular server running on port [PORT]
```

## 🆘 Still Having Issues?

1. **Check Render Logs** for specific error messages
2. **Verify all environment variables** are set in dashboard
3. **Confirm secrets are 64+ characters** for production
4. **Ensure API keys follow correct format** (Google Maps: `AIza...`, ImageKit: `public_...`)

## 📞 Next Steps After Successful Deployment

1. **Test Google Maps functionality** (API key working)
2. **Test email sending** (Mailtrap live mode)
3. **Test image uploads** (ImageKit integration)
4. **Set up monitoring** for the application
5. **Configure domain restrictions** for Google Maps API key
