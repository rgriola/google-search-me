#!/bin/bash

# Production Deployment Cache Buster
# Updates version numbers across all files to force cache refresh

# Generate new version
NEW_VERSION="1.2.$(date +%s)"
TIMESTAMP=$(date +%s)

echo "🚀 Updating version to: $NEW_VERSION"

# Update environment.js
sed -i '' "s/const APP_VERSION = '.*';/const APP_VERSION = '$NEW_VERSION';/" js/modules/config/environment.js
sed -i '' "s/const BUILD_TIMESTAMP = .*;/const BUILD_TIMESTAMP = '$TIMESTAMP';/" js/modules/config/environment.js

# Update app.html version numbers
sed -i '' "s/\?v=[0-9.]*/?v=$NEW_VERSION/g" app.html

# Also update any other HTML files
for file in *.html; do
    if [ "$file" != "app.html" ] && [ -f "$file" ]; then
        sed -i '' "s/\?v=[0-9.]*/?v=$NEW_VERSION/g" "$file"
    fi
done

echo "✅ Version updated to $NEW_VERSION"
echo "📝 Files updated:"
echo "   - js/modules/config/environment.js"
echo "   - app.html"
echo "   - Other HTML files"
echo ""
echo "🔥 This will force a complete cache refresh on production!"
echo "💡 Run this script before each production deployment"
