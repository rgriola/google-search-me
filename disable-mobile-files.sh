#!/bin/bash

# Mobile App Cleanup Script
# Disables abandoned mobile-first version files to prevent cache conflicts

echo "🧹 Disabling abandoned mobile app files..."

MOBILE_FILES=(
    "mobile-service-worker.js"
    "mobile-app.html" 
    "js/mobile-service-worker.js"
    "js/mobile-app.js"
    "js/mobile-app-callback.js"
    "js/mobile-app_backup.js"
    "css/components/mobile-camera.css"
)

# Create disabled directory if it doesn't exist
mkdir -p disabled-mobile-files

for file in "${MOBILE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "🚫 Disabling $file"
        mv "$file" "disabled-mobile-files/$(basename $file).disabled"
    else
        echo "⚠️  $file not found (already disabled?)"
    fi
done

echo "✅ Mobile app files disabled and moved to disabled-mobile-files/"
echo "🔥 This will prevent service worker cache conflicts!"
echo ""
echo "📝 Files moved:"
ls -la disabled-mobile-files/

echo ""
echo "💡 To re-enable later, move files back from disabled-mobile-files/"
