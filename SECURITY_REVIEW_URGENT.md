# 🔒 Security Configuration Guide

## ⚠️ IMMEDIATE SECURITY FIXES REQUIRED

### 1. Environment Variables Setup

Create these environment files (DO NOT commit to Git):

**server/.env.development**
```bash
NODE_ENV=development
JWT_SECRET=your-development-jwt-secret-min-32-chars
SESSION_SECRET=your-development-session-secret-min-32-chars
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=your-imagekit-public-key
IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-endpoint

# Email Configuration
EMAIL_SERVICE=mailtrap
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-mailtrap-user
EMAIL_PASS=your-mailtrap-password
```

**server/.env.production** (for production deployment)
```bash
NODE_ENV=production
JWT_SECRET=production-super-secure-jwt-secret-min-32-chars
SESSION_SECRET=production-super-secure-session-secret-min-32-chars
GOOGLE_MAPS_API_KEY=your-production-google-maps-api-key

# ImageKit Configuration  
IMAGEKIT_PUBLIC_KEY=your-imagekit-public-key
IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-endpoint

# Email Configuration
EMAIL_SERVICE=mailtrap
EMAIL_HOST=live.smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_USER=api
EMAIL_PASS=your-mailtrap-api-token
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

### 2. Rotate All Exposed Secrets

**IMMEDIATELY rotate these compromised credentials:**

1. **ImageKit API Keys**
   - Go to ImageKit dashboard → Settings → API Keys
   - Generate new public/private key pair
   - Update environment variables
   - Delete old keys

2. **JWT Secrets** 
   - Generate new 32+ character random secrets
   - Update in production environment
   - This will invalidate all existing user sessions (users need to re-login)

3. **Google Maps API Key**
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Create new API key or regenerate existing
   - Restrict by HTTP referrers (add your domains)
   - Update in environment variables

4. **Mailtrap Credentials**
   - Go to Mailtrap → Settings → API Tokens
   - Generate new API token
   - Update EMAIL_PASS in environment

### 3. Git Security Cleanup

The .env files are properly ignored by Git, but ensure no sensitive data remains in commit history:

```bash
# Check for any accidentally committed secrets
git log --all --full-history -- "*.env*"
git log --all --grep="password\|secret\|key" --oneline

# If you find exposed secrets in commit history, you'll need to:
# 1. Use git filter-repo or BFG to clean history
# 2. Force push (WARNING: This rewrites Git history)
# 3. Notify all team members to re-clone the repository
```

### 4. Google Maps API Key Security

**Current Issue:** API key is hardcoded in HTML file
**Solution:** Load dynamically from server

Create endpoint in server/routes/config.js:
```javascript
router.get('/google-maps-key', (req, res) => {
    res.json({ 
        apiKey: process.env.GOOGLE_MAPS_API_KEY 
    });
});
```

Update app.html to load key dynamically:
```javascript
// Replace hardcoded script tag with:
fetch('/api/config/google-maps-key')
    .then(r => r.json())
    .then(data => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    });
```

### 5. Additional Security Hardening

**Environment Variable Validation:**
- Add startup checks to ensure all required secrets are present
- Use minimum length validation for JWT secrets (32+ characters)
- Validate API key formats

**Session Security:**
- Consider Redis for session storage in production
- Implement session invalidation on password change
- Add session limits per user

**API Rate Limiting:**
- Current: 100 requests/15min (general), 5 requests/15min (auth)
- Consider stricter limits for production
- Add IP-based blocking for repeated violations

**Database Security:**
- Ensure SQLite file permissions are restricted (600)
- Consider encryption at rest for sensitive data
- Implement database backup encryption

### 6. Monitoring & Alerting

**Set up monitoring for:**
- Failed authentication attempts
- Rate limit violations
- Unusual API usage patterns
- Database access errors
- Email sending failures

**Log Security Events:**
- All admin actions
- Password changes
- Account lockouts
- Security header violations

## 🔍 Security Assessment Score

**Current Status:** 
- **Authentication:** ✅ Excellent (JWT + sessions, bcrypt, rate limiting)
- **Authorization:** ✅ Excellent (role-based access, middleware protection)
- **Input Validation:** ✅ Excellent (XSS protection, sanitization, size limits)
- **Headers & CSP:** ✅ Excellent (comprehensive security headers)
- **Secrets Management:** ❌ **CRITICAL** (exposed in development config)
- **Dependencies:** ⚠️ **MODERATE** (nodemailer vulnerabilities)

**Overall Grade: C+ → A- (after fixes)**

## 📋 Security Checklist

- [ ] Remove hardcoded secrets from development.js (✅ DONE)
- [ ] Replace Google Maps API key placeholder in HTML (✅ DONE)
- [ ] Create proper .env files with new secrets
- [ ] Rotate all exposed API keys and tokens
- [ ] Implement dynamic Google Maps key loading
- [ ] Set up proper API key restrictions in Google Cloud
- [ ] Add environment variable validation on startup
- [ ] Consider upgrading nodemailer (evaluate mailtrap compatibility)
- [ ] Set up security monitoring and alerting
- [ ] Document incident response procedures

## 🚨 Emergency Response

If you suspect the exposed secrets have been compromised:

1. **Immediate Actions (within 1 hour):**
   - Rotate all API keys and secrets
   - Check access logs for unusual activity
   - Invalidate all user sessions (change JWT secret)
   - Monitor for unauthorized API usage

2. **Short-term Actions (within 24 hours):**
   - Audit all recent database changes
   - Review email sending logs for abuse
   - Check ImageKit usage for unauthorized uploads
   - Set up enhanced monitoring

3. **Follow-up Actions (within 1 week):**
   - Implement additional rate limiting
   - Add API usage alerts
   - Review and update security policies
   - Conduct security training for team members

## 📞 Support Resources

- **Google Cloud Security:** https://cloud.google.com/security
- **ImageKit Security:** https://imagekit.io/security
- **Mailtrap Security:** https://help.mailtrap.io/article/69-security-and-privacy
- **OWASP Security Guide:** https://owasp.org/www-project-web-security-testing-guide/
