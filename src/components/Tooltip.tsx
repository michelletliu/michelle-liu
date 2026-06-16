import { useState, useRef, useEffect } from 'react';

type TooltipProps = {
  label: string;
  children: React.ReactNode;
  /** Position of tooltip relative to children */
  position?: 'top' | 'bottom';
  /** Offset from the element in pixels */
  offset?: number;
};

// Tooltip warmup state - tracks if any tooltip is currently open
// This allows subsequent tooltips to open instantly without delay or animation
let tooltipWarmupActive = false;
let tooltipWarmupTimeout: NodeJS.Timeout | null = null;

function setTooltipWarmup(active: boolean) {
  if (tooltipWarmupTimeout) {
    clearTimeout(tooltipWarmupTimeout);
    tooltipWarmupTimeout = null;
  }

  if (active) {
    tooltipWarmupActive = true;
  } else {
    // Keep warmup active briefly to allow moving between tooltips
    tooltipWarmupTimeout = setTimeout(() => {
      tooltipWarmupActive = false;
    }, 150);
  }
}

// Module-level touch detection: a single touchstart anywhere on the page
// permanently marks the session as touch-driven. This is more robust than
// `(hover: none)` alone, which can misreport on iPads/Apple Pencil/simulators.
let isTouchSession = false;
if (typeof window !== 'undefined') {
  const initialMatch =
    window.matchMedia('(hover: none)').matches ||
    window.matchMedia('(pointer: coarse)').matches;
  if (initialMatch) isTouchSession = true;
  const markTouch = () => {
    isTouchSession = true;
    window.removeEventListener('touchstart', markTouch);
  };
  window.addEventListener('touchstart', markTouch, { passive: true });
}

export default function Tooltip({ 
  label, 
  children, 
  position = 'bottom',
  offset = 6 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isInstant, setIsInstant] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Force-hide on any touch anywhere — defensive cleanup in case a tooltip
  // got stuck open from a synthetic mouseenter on tap.
  useEffect(() => {
    if (!isVisible) return;
    const hide = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setIsVisible(false);
      setIsEnding(false);
      setIsInstant(false);
      setTooltipWarmup(false);
    };
    window.addEventListener('touchstart', hide, { passive: true });
    return () => window.removeEventListener('touchstart', hide);
  }, [isVisible]);

  const handleMouseEnter = () => {
    // Skip tooltips on touch devices: tapping fires mouseenter without a
    // matching mouseleave, so tooltips would stick after each tap.
    if (isTouchSession) return;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    setIsEnding(false);

    // If warmup is active (another tooltip was recently open), show instantly
    if (tooltipWarmupActive) {
      setIsInstant(true);
      setIsVisible(true);
      setTooltipWarmup(true);
    } else {
      // Show tooltip after 400ms delay
      setIsInstant(false);
      hoverTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        setTooltipWarmup(true);
      }, 400);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (isVisible) {
      // Signal that we're closing (but keep warmup briefly active)
      setTooltipWarmup(false);

      // If instant mode, hide immediately without animation
      if (isInstant) {
        setIsVisible(false);
        setIsInstant(false);
      } else {
        // Trigger exit animation
        setIsEnding(true);
        setTimeout(() => {
          setIsVisible(false);
          setIsEnding(false);
        }, 125);
      }
    }
  };

  const positionStyles = position === 'bottom' 
    ? { top: `calc(100% + ${offset}px)`, '--transform-origin': 'center top' as string }
    : { bottom: `calc(100% + ${offset}px)`, '--transform-origin': 'center bottom' as string };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className="tooltip absolute left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[13px] font-medium rounded-lg whitespace-nowrap pointer-events-none z-[9999]"
          data-ending-style={isEnding ? "" : undefined}
          data-instant={isInstant ? "" : undefined}
          style={positionStyles}
        >
          {label}
        </div>
      )}
    </div>
  );
}
