#!/bin/bash

# Generate PWA icons script
# Creates placeholder icons for the Merkel Vision mobile app

ICON_DIR="/Users/rgriola/Desktop/01_Vibecode/google-search-me/images/icons"
BASE_SVG="$ICON_DIR/icon-32x32.svg"

# Icon sizes needed for PWA
SIZES=(16 32 72 96 128 144 152 192 384 512)

echo "🎨 Generating PWA icons..."

# Create base SVG template function
create_svg_icon() {
    local size=$1
    local filename="$ICON_DIR/icon-${size}x${size}.svg"
    
    cat > "$filename" << EOF
<svg width="$size" height="$size" viewBox="0 0 $size $size" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="$size" height="$size" rx="$(($size/5))" fill="url(#gradient)"/>
  <circle cx="$(($size/2))" cy="$(($size*3/8))" r="$(($size/8))" fill="white" opacity="0.9"/>
  <path d="M $(($size/4)) $(($size*5/8))c0-$(($size/7.3)) $(($size/7.3))-$(($size/4)) $(($size/4))-$(($size/4))s$(($size/4)) $(($size/7.3)) $(($size/4)) $(($size/4))" stroke="white" stroke-width="$(($size/16))" fill="none" opacity="0.9"/>
  <text x="$(($size/2))" y="$(($size*7/8))" text-anchor="middle" fill="white" font-family="Arial" font-size="$(($size/4))" opacity="0.7">📱</text>
</svg>
EOF
    
    echo "Created $filename"
}

# Generate all icon sizes
for size in "${SIZES[@]}"; do
    create_svg_icon $size
done

# Create maskable versions
create_svg_icon 192 "maskable"
create_svg_icon 512 "maskable"

echo "✅ PWA icons generated successfully!"
echo "📁 Icons location: $ICON_DIR"
echo "📱 Total icons created: $((${#SIZES[@]} + 2))"
