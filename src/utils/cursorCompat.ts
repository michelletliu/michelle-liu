/**
 * Cursor compatibility utility
 * Detects and handles custom cursor issues across different browsers/OS
 */

export function initCursorCompatibility() {
  if (typeof window === 'undefined') return;

  const ua = navigator.userAgent;
  const isWindows = /Windows/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMac = /Mac/.test(ua);

  // Log cursor info for debugging (visible in friend's browser console)
  console.log('🖱️ Custom Cursor Status:', {
    platform: isWindows ? 'Windows' : isMac ? 'macOS' : 'Other',
    browser: isFirefox ? 'Firefox' : isSafari ? 'Safari' : 'Chrome/Other',
    touchDevice: isTouchDevice,
    expectedCursor: isWindows ? '32x32 (small)' : '40x40/46x46 (large)',
    note: 'If cursor looks wrong, check Network tab for failed SVG loads'
  });

  // Disable custom cursor on touch devices
  if (isTouchDevice) {
    console.log('ℹ️ Touch device detected - using system cursor');
    return;
  }

  // Test if custom cursors load successfully
  const testCursors = async () => {
    const cursors = [
      { name: 'default-large', path: '/src/assets/cursor-default.svg' },
      { name: 'default-small', path: '/src/assets/cursor-default-small.svg' },
      { name: 'hover-large', path: '/src/assets/cursor-hover.svg' },
      { name: 'hover-small', path: '/src/assets/cursor-hover-small.svg' }
    ];

    type CursorResult = { name: string; path: string; loaded: boolean };

    const results = await Promise.all(
      cursors.map(cursor => 
        new Promise<CursorResult>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ ...cursor, loaded: true });
          img.onerror = () => resolve({ ...cursor, loaded: false });
          img.src = cursor.path;
        })
      )
    );

    const loadedCount = results.filter(r => r.loaded).length;
    const failedCursors = results.filter(r => !r.loaded);

    if (failedCursors.length > 0) {
      console.warn('⚠️ Some cursors failed to load:', failedCursors.map(c => c.name));
      console.log('💡 This might cause cursor to appear as system default');
    } else {
      console.log(`✅ All ${loadedCount} cursor files loaded successfully`);
    }

    // Check if cursor is actually applied
    setTimeout(() => {
      const computed = window.getComputedStyle(document.body);
      const cursorValue = computed.getPropertyValue('cursor');
      const hasCustomCursor = cursorValue.includes('cursor-default');
      
      console.log('🎯 Cursor application check:', {
        hasCustomCursor,
        cursorValue: hasCustomCursor ? 'Custom cursor active ✓' : 'System cursor (fallback)',
        reason: !hasCustomCursor && isWindows ? 'Might be Windows 32x32 limit issue' : 'Check CSS and file paths'
      });

      // Set status attribute for debug mode
      document.body.setAttribute('data-cursor-status', hasCustomCursor ? 'custom' : 'system');
    }, 100);
  };

  testCursors();

  // Platform-specific messages
  if (isWindows) {
    console.log('💻 Windows detected: Using 32x32px cursors (Windows size limit)');
  } else if (isMac) {
    console.log('💻 macOS detected: Using 40x40/46x46px cursors');
  }

  if (isFirefox) {
    console.log('🦊 Firefox: Custom cursors active with enhanced compatibility');
  }
}

// Debug function - call in console: window.debugCursor()
export function debugCursor() {
  const body = document.body;
  const computed = window.getComputedStyle(body);
  const cursor = computed.getPropertyValue('cursor');
  
  const info = {
    cursorValue: cursor,
    hasCustomCursor: cursor.includes('cursor-default'),
    platform: /Windows/.test(navigator.userAgent) ? 'Windows' : /Mac/.test(navigator.userAgent) ? 'macOS' : 'Other',
    browser: navigator.userAgent,
    recommendation: ''
  };

  if (!info.hasCustomCursor) {
    info.recommendation = 'Custom cursor not active. Check: 1) File paths in CSS, 2) Cursor size limits, 3) Browser console for errors';
  } else {
    info.recommendation = 'Custom cursor is active ✓';
  }

  console.table(info);
  return info;
}

// Expose debug function globally
if (typeof window !== 'undefined') {
  (window as any).debugCursor = debugCursor;
}
