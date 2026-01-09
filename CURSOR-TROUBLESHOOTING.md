# Custom Cursor Troubleshooting Guide

## What I fixed

Your custom cursor was 40x40 and 46x46 pixels, but **Windows has a strict 32x32px limit**. This means your friend's laptop (likely Windows) couldn't display the cursor and fell back to the system default.

## Changes made

1. ✅ Created smaller 32x32px cursor versions (`cursor-default-small.svg` and `cursor-hover-small.svg`)
2. ✅ Updated CSS with fallback chain: large cursor → small cursor → system cursor
3. ✅ Added automatic detection for Windows/macOS/touch devices
4. ✅ Added comprehensive logging to help debug issues

## How to test

### On your friend's laptop:

1. Open the website
2. Press **F12** to open browser DevTools
3. Go to the **Console** tab
4. Look for messages starting with 🖱️ - they'll show:
   - Platform detected (Windows/macOS)
   - Which cursor size is being used
   - Whether files loaded successfully
   - If custom cursor is active

### Quick debug command:

Your friend can type this in the console:
```javascript
window.debugCursor()
```

This will show a detailed table with cursor status and recommendations.

## Expected behavior

- **macOS**: Should use the larger 40x40/46x46 cursors (your original design)
- **Windows**: Will automatically use 32x32 cursors (smaller but compatible)
- **Touch devices**: Uses system cursor (custom cursors don't work well on touch)
- **If any files fail to load**: Falls back gracefully to system cursor

## Common issues and solutions

### "Cursor still not showing on Windows"

1. Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
2. Clear cache and reload
3. Check if files are being served correctly (Network tab in DevTools)

### "Cursor flickers or jumps"

This was happening because the cursor was too large for Windows. The new 32x32 version should fix this.

### "Can't see cursor at all"

Check the console - if files aren't loading, you'll see ⚠️ warnings explaining why.

## File locations

```
src/assets/
  ├── cursor-default.svg       (40x40 - for macOS)
  ├── cursor-default-small.svg (32x32 - for Windows)
  ├── cursor-hover.svg         (46x46 - for macOS)
  └── cursor-hover-small.svg   (32x32 - for Windows)
```

## CSS strategy

The CSS tries multiple cursor files in order:
1. Large cursor (works on macOS)
2. Small cursor (works on Windows)  
3. System cursor (ultimate fallback)

This way everyone gets the best experience for their platform!
