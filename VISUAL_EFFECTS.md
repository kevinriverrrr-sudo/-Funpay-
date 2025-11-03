# Visual Effects Documentation

## Overview

FunPay Customizer v1.1.0 introduces three new visual effects to enhance the user experience on FunPay.com. All effects are optional, performance-optimized, and can be toggled on/off easily.

## Features

### 1. Snow Trail Cursor Effect ❄️

A magical snow trail that follows your mouse cursor across the page.

**Implementation:**
- HTML5 Canvas-based animation
- Throttled mouse events (16ms delay)
- Maximum 50 particles to maintain performance
- GPU-accelerated using `requestAnimationFrame`
- Automatic cleanup of old particles

**Performance:**
- Optimized for 60fps on modern hardware
- May impact performance on older devices
- Can be instantly disabled via popup

**Technical Details:**
- File: `content/snow-trail.js`
- Class: `SnowTrailEffect`
- Canvas z-index: 9999 (top layer)
- Particle lifecycle: ~1 second

### 2. Animated FunPay Logo 🎨

Replaces the standard FunPay logo with an animated SVG version.

**Implementation:**
- SVG-based animations
- Rotating outer ring
- Pulsating center circle
- Built-in pause/play control button

**Performance:**
- SVG animations with hardware acceleration
- Minimal CPU/GPU usage
- No impact on page load time

**Technical Details:**
- File: `content/animated-logo.js`
- Class: `AnimatedLogoEffect`
- Automatically finds and replaces logo
- Restores original logo when disabled
- 500ms delay before initialization

### 3. Custom Cursor Styles 🖱️

Change the mouse cursor appearance across the entire site.

**Implementation:**
- Pure CSS solution (no JavaScript overhead)
- 6 preset cursor styles:
  - Default
  - Pointer
  - Neon Pointer (custom SVG)
  - Arrow (custom SVG)
  - Target/Crosshair (custom SVG)
  - Gaming cursor (custom SVG)
- Support for custom image upload (PNG, GIF)

**Performance:**
- Zero performance impact
- CSS-only implementation
- Instant application

**Technical Details:**
- File: `content/custom-cursor.js`
- Class: `CustomCursorEffect`
- Max image size: 1 MB
- Recommended size: 32x32px
- Hotspot at 16,16 (center)

## User Interface

### Popup Quick Controls

Location: Extension popup (click extension icon)

- **Visual Effects** section with 3 checkboxes:
  - ❄️ Snow trail cursor
  - 🎨 Animated logo
  - 🖱️ Custom cursor
- Instant toggle on/off
- Apply button to save changes

### Options Page Advanced Settings

Location: Options page → "Visual Effects" tab

**Features:**
- Detailed descriptions of each effect
- Performance warnings where applicable
- Custom cursor type selector
- Image upload for custom cursors
- Live cursor preview
- Compatibility information
- Performance optimization tips

## Storage

New settings keys added to `chrome.storage.sync`:

```javascript
{
  snowTrailEnabled: boolean,      // default: false
  animatedLogoEnabled: boolean,   // default: false
  customCursorEnabled: boolean,   // default: false
  customCursorType: string,       // default: 'default'
  customCursorImage: string       // base64 or null
}
```

## Browser Compatibility

### Chrome/Edge/Brave
✅ All effects fully supported
✅ Hardware acceleration available
✅ Perfect performance

### Firefox
✅ All effects supported
⚠️ Minor animation differences possible
✅ Good performance

### Safari
❌ Extension not compatible (Manifest V3)

## Performance Recommendations

### For Powerful Computers
- ✅ Use all effects simultaneously
- ✅ No performance concerns

### For Average Computers
- ✅ Animated logo + cursor (no impact)
- ⚠️ Snow trail (minor impact)
- 💡 Monitor FPS if issues occur

### For Older/Slower Devices
- ✅ Cursor only (zero impact)
- ⚠️ Avoid snow trail
- ✅ Animated logo usually fine

## Troubleshooting

### Snow Trail Not Appearing
1. Check if enabled in settings
2. Refresh the page (F5)
3. Check browser console for errors
4. Ensure JavaScript is not blocked

### Animated Logo Not Showing
1. Wait 500ms after page load
2. Check if FunPay logo exists on page
3. Try disabling and re-enabling
4. Refresh the page

### Custom Cursor Not Working
1. Verify effect is enabled
2. Check cursor type is selected
3. For custom images:
   - Verify PNG or GIF format
   - Check file size (max 1 MB)
   - Ensure proper image format

### Performance Issues
1. Disable snow trail effect (most resource-intensive)
2. Close other browser tabs
3. Enable hardware acceleration in browser settings
4. Update graphics drivers

## Code Architecture

### Module Loading Order

1. `snow-trail.js` - First (no dependencies)
2. `animated-logo.js` - Second (no dependencies)
3. `custom-cursor.js` - Third (no dependencies)
4. `content.js` - Last (initializes all modules)

### Class Structure

All effect classes follow the same pattern:

```javascript
class EffectName {
  constructor() { }
  init() { }
  enable() { }
  disable() { }
  destroy() { }
}
```

### Integration with Main Content Script

The main `FunPayCustomizer` class:
1. Creates instances of effect classes
2. Loads settings from storage
3. Applies effects based on settings
4. Listens for setting changes
5. Updates effects in real-time

## Best Practices

### For Users
- Start with one effect at a time
- Test performance before enabling all
- Use quick disable if issues occur
- Animated logo + cursor = best combo

### For Developers
- Keep effects modular and independent
- Always provide disable mechanisms
- Document performance characteristics
- Test on various hardware
- Provide clear user feedback

## Future Enhancements

Planned for future versions:
- Adjustable snow trail intensity
- More cursor presets
- Additional particle effects (stars, confetti)
- Logo animation customization
- Performance monitoring dashboard
- Auto-disable on low FPS detection

## Credits

Visual Effects Implementation: @MarkusGarantor
Version: 1.1.0
Release Date: 2024-11-04

---

For more information, see:
- [README.md](README.md) - Main documentation
- [FAQ.md](FAQ.md) - Common questions
- [CHANGELOG.md](CHANGELOG.md) - Version history
