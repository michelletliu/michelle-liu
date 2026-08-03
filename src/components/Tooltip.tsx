import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

type TooltipProps = {
  label: string;
  children: React.ReactNode;
  /** Position of tooltip relative to children */
  position?: 'top' | 'bottom';
  /** Offset from the element in pixels */
  offset?: number;
  /** Force-hide and skip hover show (e.g. while a click popover is open) */
  disabled?: boolean;
  /** Keep tooltip permanently visible (e.g. design-system specimens) */
  forceOpen?: boolean;
  /** Extra classes on the outer wrapper (merged with base) */
  className?: string;
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
  offset = 6,
  disabled = false,
  forceOpen = false,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isInstant, setIsInstant] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hideImmediately = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsVisible(false);
    setIsEnding(false);
    setIsInstant(false);
    setTooltipWarmup(false);
  };

  // Force-hide when disabled (e.g. click opened a popover instead)
  useEffect(() => {
    if (disabled) hideImmediately();
  }, [disabled]);

  // Force-hide on any touch anywhere — defensive cleanup in case a tooltip
  // got stuck open from a synthetic mouseenter on tap.
  useEffect(() => {
    if (!isVisible) return;
    window.addEventListener('touchstart', hideImmediately, { passive: true });
    return () => window.removeEventListener('touchstart', hideImmediately);
  }, [isVisible]);

  const handleMouseEnter = () => {
    // Skip tooltips on touch devices: tapping fires mouseenter without a
    // matching mouseleave, so tooltips would stick after each tap.
    if (forceOpen || isTouchSession || disabled) return;

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
    if (forceOpen) return;

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

  // Clicking the trigger should never leave a tooltip open/queued
  const handleMouseDown = () => {
    if (forceOpen) return;
    hideImmediately();
  };

  const showTooltip = forceOpen || (isVisible && !disabled);

  const positionStyles = position === 'bottom' 
    ? { top: `calc(100% + ${offset}px)`, '--transform-origin': 'center top' as string }
    : { bottom: `calc(100% + ${offset}px)`, '--transform-origin': 'center bottom' as string };

  return (
    <div
      className={clsx('relative inline-flex', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
    >
      {children}
      {showTooltip && (
        <div
          className="tooltip absolute left-1/2 -translate-x-1/2 px-2.5 py-0.5 leading-none bg-zinc-800 text-white text-sm font-medium rounded-lg whitespace-nowrap pointer-events-none z-[9999]"
          data-ending-style={!forceOpen && isEnding ? "" : undefined}
          data-instant={forceOpen || isInstant ? "" : undefined}
          style={positionStyles}
        >
          {label}
        </div>
      )}
    </div>
  );
}
