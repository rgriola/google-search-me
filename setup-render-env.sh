#!/bin/bash

# 🚀 Render Environment Variables Setup Script
# Copy these commands and run them in Render's environment variables section

echo "🔧 RENDER ENVIRONMENT VARIABLES CONFIGURATION"
echo "=============================================="
echo ""
echo "📋 Copy and paste these in Render Dashboard > Environment:"
echo ""

cat << 'EOF'
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://google-search-me.onrender.com
JWT_SECRET=map-search-app-jwt-super-secure-key-2025-render-deployment-v1
SESSION_SECRET=map-search-app-session-super-secure-key-2025-render-deployment-v1
EMAIL_SERVICE=mailtrap
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=e61052be8f5ea6
EMAIL_PASS=34dc22b24e84eb
EMAIL_MODE=production
EMAIL_FROM_NAME=Map Search App Demo
DB_PATH=./server/locations.db
EOF

echo ""
echo "✅ MAILTRAP ACCESS:"
echo "  📧 Dashboard: https://mailtrap.io"
echo "  👤 Username: e61052be8f5ea6"
echo "  🔑 Password: 34dc22b24e84eb"
echo ""
echo "🎯 DEPLOYMENT CHECKLIST:"
echo "  ☐ Add all environment variables to Render"
echo "  ☐ Deploy/redeploy your service"
echo "  ☐ Test user registration"
echo "  ☐ Check Mailtrap inbox for emails"
echo "  ☐ Test verification link"
echo "  ☐ Test login after verification"
echo ""
echo "🚀 Your app will have full email functionality for demos!"
