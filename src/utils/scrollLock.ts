/**
 * Scroll Lock Utility
 * 
 * Provides a flicker-free way to lock/unlock body scroll for modals.
 * Uses overflow: hidden on both html and body instead of position: fixed
 * to avoid layout shifts that cause visual flickering.
 */

let lockCount = 0;
let originalStyles: {
  htmlOverflow: string;
  bodyOverflow: string;
  scrollbarGutter: string;
} | null = null;

/**
 * Lock body scroll - prevents background scrolling when modal is open.
 * Multiple locks are tracked via reference counting, so calling lockScroll
 * multiple times requires the same number of unlockScroll calls.
 */
export function lockScroll(): void {
  lockCount++;
  
  if (lockCount === 1) {
    // Store original styles only on first lock
    originalStyles = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      scrollbarGutter: document.documentElement.style.scrollbarGutter,
    };
    
    // Apply scroll lock
    // Using scrollbar-gutter: stable prevents layout shift from scrollbar disappearing
    document.documentElement.style.scrollbarGutter = 'stable';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Unlock body scroll - restores scrolling ability.
 * Only actually unlocks when all locks have been released.
 */
export function unlockScroll(): void {
  if (lockCount > 0) {
    lockCount--;
  }
  
  if (lockCount === 0 && originalStyles) {
    // Restore original styles
    document.documentElement.style.overflow = originalStyles.htmlOverflow;
    document.body.style.overflow = originalStyles.bodyOverflow;
    document.documentElement.style.scrollbarGutter = originalStyles.scrollbarGutter;
    originalStyles = null;
  }
}

// Note: useScrollLock hook is provided separately in useScrollLock.ts
// to keep this file framework-agnostic

/**
 * Force reset all scroll locks - use sparingly, mainly for debugging
 */
export function resetScrollLock(): void {
  lockCount = 0;
  if (originalStyles) {
    document.documentElement.style.overflow = originalStyles.htmlOverflow;
    document.body.style.overflow = originalStyles.bodyOverflow;
    document.documentElement.style.scrollbarGutter = originalStyles.scrollbarGutter;
    originalStyles = null;
  }
}
