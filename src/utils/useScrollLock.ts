import { useEffect } from 'react';
import { lockScroll, unlockScroll } from './scrollLock';

/**
 * React hook for scroll locking - automatically locks on mount and unlocks on unmount.
 * 
 * Usage:
 * ```
 * import { useScrollLock } from '../utils/useScrollLock';
 * 
 * function Modal() {
 *   useScrollLock();
 *   return <div>...</div>;
 * }
 * ```
 * 
 * With conditional:
 * ```
 * function Modal({ isOpen }) {
 *   useScrollLock(isOpen);
 *   return isOpen ? <div>...</div> : null;
 * }
 * ```
 */
export function useScrollLock(enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;
    
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [enabled]);
}

export default useScrollLock;
