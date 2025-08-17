#!/bin/bash
# Auto-update version across all files

NEW_VERSION="1.2.$(date +%s)"
echo "Updating to version: $NEW_VERSION"

# Update environment.js
sed -i '' "s/version: '[^']*'/version: '$NEW_VERSION'/" js/modules/config/environment.js
sed -i '' "s/const BUILD_TIMESTAMP = '[^']*'/const BUILD_TIMESTAMP = '$(date +%s)'/" js/modules/config/environment.js

# Update HTML files
find . -name "*.html" -exec sed -i '' "s/v=[0-9.]*[0-9]/v=$NEW_VERSION/g" {} \;

echo "Version updated to: $NEW_VERSION"
echo "All HTML cache parameters updated"
