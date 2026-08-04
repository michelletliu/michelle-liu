import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

type TooltipProps = {
  label: string;
  children: React.ReactNode;
  /** Position of tooltip relative to children */
  position?: 'top' | 'bottom';
  /** Offset from the element in pixels */
  offset?: number;
  /**
   * ms before showing. Hover default is 400. With `forceOpen`, omit (or 0) for
   * instant open; pass an explicit value to delay forced opens too.
   */
  delay?: number;
  /** Force-hide and skip hover show (e.g. while a click popover is open) */
  disabled?: boolean;
  /** Keep tooltip permanently visible (e.g. design-system specimens) */
  forceOpen?: boolean;
  /** Extra classes on the outer wrapper (merged with base) */
  className?: string;
  /**
   * Render in document.body with fixed coords so overflow:hidden ancestors
   * (composer morph shell, stack clips, etc.) cannot crop the tip.
   */
  portal?: boolean;
};

const DEFAULT_HOVER_DELAY = 400;

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
  delay,
  disabled = false,
  forceOpen = false,
  className,
  portal = false,
}: TooltipProps) {
  // Hover tips default to 400ms; forceOpen stays instant unless delay is set.
  const showDelay = delay ?? (forceOpen ? 0 : DEFAULT_HOVER_DELAY);
  const [isVisible, setIsVisible] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isInstant, setIsInstant] = useState(false);
  const [forceRevealed, setForceRevealed] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  // Delayed forceOpen (e.g. Met tip): wait showDelay, then reveal.
  useEffect(() => {
    if (!forceOpen || disabled) {
      setForceRevealed(false);
      return;
    }
    if (showDelay <= 0) {
      setForceRevealed(true);
      return;
    }
    setForceRevealed(false);
    const id = window.setTimeout(() => setForceRevealed(true), showDelay);
    return () => window.clearTimeout(id);
  }, [forceOpen, disabled, showDelay]);

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
      setIsInstant(false);
      hoverTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        setTooltipWarmup(true);
      }, showDelay);
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

  const showTooltip = forceRevealed || (isVisible && !disabled);

  useLayoutEffect(() => {
    if (!portal || !showTooltip) {
      setCoords(null);
      return;
    }
    const update = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setCoords({
        left: r.left + r.width / 2,
        top: position === 'top' ? r.top - offset : r.bottom + offset,
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [portal, showTooltip, position, offset, label, forceOpen]);

  const tipClassName = clsx(
    'tooltip px-2 py-1 bg-zinc-800 text-white text-sm font-medium rounded-lg whitespace-nowrap pointer-events-none z-[9999]',
    !portal && 'absolute left-1/2 -translate-x-1/2',
  );

  const tipProps = {
    className: tipClassName,
    'data-ending-style': !forceOpen && isEnding ? '' : undefined,
    'data-instant': forceOpen || isInstant ? '' : undefined,
  } as const;

  const inlinePositionStyles =
    position === 'bottom'
      ? {
          top: `calc(100% + ${offset}px)`,
          '--transform-origin': 'center top' as string,
        }
      : {
          bottom: `calc(100% + ${offset}px)`,
          '--transform-origin': 'center bottom' as string,
        };

  const tip = showTooltip ? (
    portal && coords ? (
      createPortal(
        // Outer node owns fixed placement + centering; inner keeps scale
        // animation so transform doesn't fight translate(-50%, …).
        <div
          className="pointer-events-none fixed z-[9999]"
          style={{
            left: coords.left,
            top: coords.top,
            transform:
              position === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          }}
        >
          <div
            {...tipProps}
            style={
              {
                '--transform-origin':
                  position === 'top' ? 'center bottom' : 'center top',
              } as React.CSSProperties
            }
          >
            {label}
          </div>
        </div>,
        document.body,
      )
    ) : !portal ? (
      <div {...tipProps} style={inlinePositionStyles}>
        {label}
      </div>
    ) : null
  ) : null;

  return (
    <div
      ref={wrapRef}
      className={clsx(
        // Allow callers (e.g. RestingStack) to own absolute placement; default
        // stays relative so inline tooltips still anchor to the trigger.
        className?.includes('absolute') ? null : 'relative',
        'inline-flex',
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
    >
      {children}
      {tip}
    </div>
  );
}
