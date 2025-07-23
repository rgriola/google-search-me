# 🎨 Custom SVG Icons Guide

## Overview

This system provides a comprehensive library of custom SVG icons for map markers, with easy switching between simple and detailed icon styles.

## Files Created

### 📁 `js/modules/maps/CustomSVGIcons.js`
- **Purpose**: Complete SVG icon library and utilities
- **Features**: Custom icons, animations, export functions
- **Icons Available**: 7 specialized + 1 default icon

### 📁 `custom-svg-icons-demo.html`
- **Purpose**: Interactive demo and testing tool
- **Features**: Live preview, size controls, export options
- **Usage**: Open in browser to test icons

### 🔧 Enhanced `MarkerService.js`
- **Purpose**: Integration with existing marker system
- **Features**: Toggle between icon styles, refresh markers
- **Backward Compatible**: Yes, defaults to simple icons

## Quick Start

### 1. Enable Custom Icons
```javascript
// Toggle to custom SVG icons
MarkerService.toggleCustomIcons(true);

// Check current status
const iconInfo = MarkerService.getCurrentIconInfo();
console.log(iconInfo);
```

### 2. Export Icons
```javascript
// Export single icon as SVG
MarkerService.exportCustomIconAsSVG('live reporter');

// Export all icons as JSON
MarkerService.exportAllCustomIconsAsJSON();
```

### 3. Get Available Types
```javascript
const types = MarkerService.getAvailableCustomIconTypes();
console.log(types); // ['live reporter', 'live anchor', ...]
```

## Icon Library

### 📺 Live Reporter
- **Design**: Professional camera with recording light
- **Animation**: Pulsing effect for live events
- **Color**: Red (#ff4444)

### 📺 Live Anchor
- **Design**: TV monitor with broadcast antenna
- **Animation**: Pulsing effect for live events
- **Color**: Blue (#4285f4)

### 🔍 Live Stakeout
- **Design**: Surveillance binoculars with crosshairs
- **Animation**: Pulsing effect for live events
- **Color**: Orange (#ffbb33)

### 🎤 Interview
- **Design**: Professional microphone with sound waves
- **Animation**: None (static)
- **Color**: Purple (#8e44ad)

### 📋 Live Presser
- **Design**: Press conference podium with microphone
- **Animation**: Pulsing effect for live events
- **Color**: Green (#00aa00)

### 🎬 B-roll
- **Design**: Film reel with strip
- **Animation**: None (static)
- **Color**: Pink (#ad1457)

### 📍 Default
- **Design**: Standard location pin
- **Animation**: None (static)
- **Color**: Gray (#666666)

## Advanced Usage

### Custom Icon Creation
```javascript
// Create your own custom icon
const customSVG = `
  <g transform="translate(8,8)">
    <!-- Your custom SVG content here -->
    <rect x="0" y="0" width="16" height="16" fill="currentColor"/>
  </g>
`;

// Add to the library
CustomSVGIcons.CUSTOM_ICONS['my_type'] = {
  svg: customSVG,
  description: 'My custom icon'
};
```

### Animation Control
```javascript
// For live events, animation is automatic
const animatedSVG = CustomSVGIcons.createAnimatedSVGMarker('live reporter', '#ff4444', 48);

// For custom animations, modify the SVG
const customAnimated = `
  <svg>
    <circle r="10" fill="red">
      <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite"/>
    </circle>
  </svg>
`;
```

### Styling Options
```javascript
// Different marker sizes
const smallIcon = MarkerService.createLocationMarkerIcon('interview', 24);
const largeIcon = MarkerService.createLocationMarkerIcon('interview', 64);

// Custom colors (modify LOCATION_TYPE_COLORS)
MarkerService.LOCATION_TYPE_COLORS['my_type'] = '#ff6b35';
```

## Integration Examples

### Map Marker Usage
```javascript
// Automatically uses current icon style setting
const marker = MarkerService.createLocationMarker({
  name: 'Breaking News Location',
  type: 'live reporter',
  lat: 40.7128,
  lng: -74.0060
});
```

### Bulk Icon Style Changes
```javascript
// Switch all markers to custom icons
MarkerService.toggleCustomIcons(true);

// This automatically refreshes all existing markers
// No need to recreate markers manually
```

### Export for External Use
```javascript
// Export specific icon for use in other applications
MarkerService.exportCustomIconAsSVG('live anchor', 'live_anchor_icon.svg');

// Export all icons data for backup or sharing
MarkerService.exportAllCustomIconsAsJSON();
```

## Best Practices

### 1. **Performance**
- Use simple icons for large datasets (100+ markers)
- Use custom icons for detailed views (< 50 markers)
- Animations are best for 10 or fewer live markers

### 2. **Accessibility**
- All icons have descriptive titles
- Color contrast meets WCAG guidelines
- Text alternatives available via initials

### 3. **Customization**
- Keep SVG viewBox at "0 0 32 32" for consistency
- Use `currentColor` for dynamic coloring
- Test icons at different sizes (24px - 64px)

### 4. **File Management**
- Keep custom icons in CustomSVGIcons.js
- Export regularly for backup
- Version control your custom additions

## Demo Usage

1. Open `custom-svg-icons-demo.html` in your browser
2. Use controls to test different styles and sizes
3. Export icons you want to save or share
4. Preview animations for live event markers

## Browser Support

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **SVG Features**: All browsers supporting SVG 1.1
- **Animations**: CSS/SVG animations supported
- **Export**: HTML5 File API required for downloads

## Future Enhancements

### Planned Features
- [ ] Icon color themes (dark mode, high contrast)
- [ ] More animation types (rotate, bounce, fade)
- [ ] Icon size presets (small, medium, large, extra-large)
- [ ] Custom icon upload/import functionality
- [ ] Real-time icon editor interface

### Extension Points
- Add new icons to `CUSTOM_ICONS` object
- Create new animation functions
- Extend export formats (PNG, PDF)
- Add icon categorization/tagging

---

## 📞 Support

For questions or custom icon requests, refer to the demo file for examples or extend the `CustomSVGIcons` class with your own designs.

**Happy mapping! 🗺️✨**
