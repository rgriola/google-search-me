#!/bin/bash

# Deployment Build Script
# This script helps manage cache versioning for production deployments

set -e  # Exit on any error

echo "🚀 Starting deployment build process..."

# Configuration
APP_VERSION="1.2.0"
BUILD_TIMESTAMP=$(date +"%Y%m%d-%H%M")
BUILD_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo "📋 Build Information:"
echo "   Version: $APP_VERSION"
echo "   Timestamp: $BUILD_TIMESTAMP"
echo "   Git Hash: $BUILD_HASH"

# Update deployment config
echo "📝 Updating deployment configuration..."
sed -i.bak "s/APP_VERSION: '[^']*'/APP_VERSION: '$APP_VERSION'/" js/modules/config/deploymentConfig.js
sed -i.bak "s/BUILD_TIMESTAMP: '[^']*'/BUILD_TIMESTAMP: '$BUILD_TIMESTAMP'/" js/modules/config/deploymentConfig.js

# Update main.js cache version
echo "📝 Updating cache version in main.js..."
sed -i.bak "s/APP_VERSION = '[^']*'/APP_VERSION = '$APP_VERSION'/" js/main.js

# Update HTML files with versioned assets (if needed)
echo "📝 Updating HTML asset versions..."
if [ -f "app.html" ]; then
    # Update CSS versions
    sed -i.bak "s/\(styles\.css\?v=\)[^\"']*/\1$APP_VERSION-$BUILD_TIMESTAMP/" app.html
    
    # Update JS versions  
    sed -i.bak "s/\(\.js\?v=\)[^\"']*/\1$APP_VERSION-$BUILD_TIMESTAMP/" app.html
fi

# Clean up backup files
echo "🧹 Cleaning up backup files..."
find . -name "*.bak" -type f -delete

# Optional: Run tests
if [ "$1" = "--test" ]; then
    echo "🧪 Running tests..."
    # Add your test commands here
    # npm test || exit 1
fi

# Optional: Minify files
if [ "$1" = "--minify" ]; then
    echo "📦 Minifying assets..."
    # Add minification commands here
    # npm run build:minify || exit 1
fi

echo "✅ Build process completed successfully!"
echo ""
echo "📋 Deployment Checklist:"
echo "   ✅ Version updated to $APP_VERSION"
echo "   ✅ Build timestamp: $BUILD_TIMESTAMP"
echo "   ✅ Cache busting configured"
echo "   ✅ Asset versions updated"
echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "📝 Next steps:"
echo "   1. Review changes: git diff"
echo "   2. Commit changes: git add . && git commit -m 'Deploy v$APP_VERSION'"
echo "   3. Deploy to production"
echo "   4. Verify cache headers are working"
