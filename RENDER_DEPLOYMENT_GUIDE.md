# 🚀 Render Deployment Guide - Environment Variables Setup

## 📧 **Email Configuration for Render**

Your app is configured to use **Mailtrap** for email testing, which means emails will be captured in your Mailtrap inbox instead of being sent to real users. This is perfect for demo purposes!

## 🔧 **Environment Variables to Set in Render**

### **Step 1: Access Render Dashboard**
1. Go to [render.com](https://render.com)
2. Navigate to your `google-search-me` service
3. Click on **"Environment"** tab

### **Step 2: Add These Environment Variables**

Copy and paste these **exact values** into Render's environment variables:

```bash
# === REQUIRED CORE SETTINGS ===
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://google-search-me.onrender.com

# === SECURITY SECRETS ===
JWT_SECRET=map-search-app-jwt-super-secure-key-2025-render-deployment-v1
SESSION_SECRET=map-search-app-session-super-secure-key-2025-render-deployment-v1

# === EMAIL CONFIGURATION (Mailtrap Testing) ===
EMAIL_SERVICE=mailtrap
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=e61052be8f5ea6
EMAIL_PASS=34dc22b24e84eb
EMAIL_MODE=production
EMAIL_FROM_NAME=Map Search App Demo

# === DATABASE ===
DB_PATH=./server/locations.db
```

### **Step 3: Render Environment Variables Setup**

**In Render Dashboard:**

| Variable Name | Value |
|---------------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `FRONTEND_URL` | `https://google-search-me.onrender.com` |
| `JWT_SECRET` | `map-search-app-jwt-super-secure-key-2025-render-deployment-v1` |
| `SESSION_SECRET` | `map-search-app-session-super-secure-key-2025-render-deployment-v1` |
| `EMAIL_SERVICE` | `mailtrap` |
| `EMAIL_HOST` | `sandbox.smtp.mailtrap.io` |
| `EMAIL_PORT` | `2525` |
| `EMAIL_USER` | `e61052be8f5ea6` |
| `EMAIL_PASS` | `34dc22b24e84eb` |
| `EMAIL_MODE` | `production` |
| `EMAIL_FROM_NAME` | `Map Search App Demo` |
| `DB_PATH` | `./server/locations.db` |

## 📧 **How Email Will Work**

### **With Mailtrap Configuration:**
1. **User registers** → Account created
2. **Verification email sent** → Captured in Mailtrap inbox
3. **You can see the email** → Check your Mailtrap dashboard
4. **Click verification link** → User account gets verified
5. **For demo purposes** → You can verify accounts manually

### **Mailtrap Dashboard Access:**
- **Login**: [mailtrap.io](https://mailtrap.io)
- **Username**: `e61052be8f5ea6`
- **Password**: `34dc22b24e84eb`
- **Inbox**: Check "Demo Inbox" for captured emails

## 🎯 **Demo Workflow for Visitors**

### **Option 1: Manual Verification (Recommended)**
1. User registers on your live site
2. You check Mailtrap inbox for verification email
3. You copy the verification link
4. User clicks the link → Account verified
5. User can now login and use the app

### **Option 2: Development Mode Override**
If you want to skip email verification entirely for demo:

Add this environment variable in Render:
```bash
EMAIL_MODE=development
```

This will:
- ✅ Allow immediate login after registration
- ✅ Print verification links to server logs
- ✅ Perfect for live demos

## 🔄 **Deployment Steps**

### **1. Update Environment Variables**
- Add all variables listed above to Render

### **2. Redeploy**
- Render will automatically redeploy when you push to GitHub
- Or manually trigger redeploy in Render dashboard

### **3. Test Email Flow**
- Register a test account
- Check Mailtrap inbox
- Verify the verification link works

## 🚨 **Important Notes**

### **Security:**
- These are **test credentials** for Mailtrap
- Safe to use for demos and development
- **Don't use for production with real users**

### **Email Limitations:**
- Emails go to Mailtrap, not real inboxes
- Perfect for demos and testing
- Users won't receive actual emails

### **For Production with Real Emails:**
If you later want real email delivery, replace with:
```bash
EMAIL_SERVICE=gmail
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
```

## ✅ **Verification Checklist**

After deployment:
- [ ] App loads at your Render URL
- [ ] User registration works
- [ ] Emails appear in Mailtrap inbox
- [ ] Verification links work
- [ ] Login works after verification
- [ ] Password reset emails work
- [ ] Change password functionality works

## 🆘 **Troubleshooting**

### **If emails don't work:**
1. Check Render logs for email errors
2. Verify all environment variables are set
3. Check Mailtrap dashboard for captured emails

### **If users can't login:**
1. Verify their account manually in database
2. Or switch to `EMAIL_MODE=development`

### **Common Issues:**
- **Port mismatch**: Use `2525` for Mailtrap, not `8080`
- **Missing EMAIL_MODE**: Add `EMAIL_MODE=production`
- **Wrong frontend URL**: Use your actual Render URL

---

**🎉 Ready to deploy!** Your app will have full email functionality for demos and testing.
