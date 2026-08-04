import { useState, useRef, useEffect, useLayoutEffect, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  autoUpdate,
  computePosition,
  flip,
  offset as floatingOffset,
  shift,
} from '@floating-ui/dom';
import clsx from 'clsx';

type TooltipProps = {
  label: string;
  children: ReactNode;
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
   * (composer morph shell, stack clips, modal chrome, etc.) cannot crop the tip.
   */
  portal?: boolean;
};

const DEFAULT_HOVER_DELAY = 400;
/** Keep tips clear of the viewport edge on narrow screens. */
const VIEWPORT_PADDING = 8;

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
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

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
    return () => clearTimeout(id);
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

  // Portal tips: Floating UI owns fixed left/top + flip/shift against the
  // viewport. Do NOT also apply .tooltip’s left:50%/translateX(-50%) — that
  // double-centers and shifts tips left by half their width (TW v4’s
  // `-translate-x-1/2` uses the separate `translate` property, which stacks
  // on top of CSS `transform: translateX(-50%)` for inline tips too).
  useLayoutEffect(() => {
    if (!portal || !showTooltip) return;
    const reference = wrapRef.current;
    const floating = tipRef.current;
    if (!reference || !floating) return;

    floating.style.visibility = 'hidden';

    // Portaled to body — collide with the viewport only. A custom
    // documentElement boundary + clippingAncestors both caused bad shifts;
    // overflow:hidden ancestors of the *trigger* must not clip the tip.
    const collision = { padding: VIEWPORT_PADDING };

    const update = () => {
      void computePosition(reference, floating, {
        placement: position === 'top' ? 'top' : 'bottom',
        strategy: 'fixed',
        middleware: [
          floatingOffset(offset),
          flip(collision),
          shift(collision),
        ],
      }).then(({ x, y }) => {
        if (tipRef.current !== floating) return;
        floating.style.left = `${x}px`;
        floating.style.top = `${y}px`;
        floating.style.visibility = 'visible';
      });
    };

    return autoUpdate(reference, floating, update);
  }, [portal, showTooltip, position, offset, label, forceOpen]);

  // Visuals come from `.tooltip` in globals.css. Do NOT add Tailwind
  // `left-1/2 -translate-x-1/2` here — in Tailwind v4 those set the
  // independent `translate` property, which stacks with CSS
  // `transform: translateX(-50%)` and shifts every tip left by ~50% width.
  const tipClassName =
    'tooltip px-2 py-1 bg-zinc-800 text-white text-sm font-medium rounded-lg whitespace-nowrap pointer-events-none z-[9999]';

  const tipProps = {
    className: tipClassName,
    'data-ending-style': !forceOpen && isEnding ? '' : undefined,
    'data-instant': forceOpen || isInstant ? '' : undefined,
    'data-portal': portal ? '' : undefined,
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
    portal ? (
      createPortal(
        // Single node: Floating UI writes fixed left/top. data-portal clears
        // the globals left:50% / translateX(-50%) so we don't double-center.
        <div
          ref={tipRef}
          {...tipProps}
          style={
            {
              position: 'fixed',
              left: 0,
              top: 0,
              visibility: 'hidden',
              '--transform-origin':
                position === 'top' ? 'center bottom' : 'center top',
            } as CSSProperties
          }
        >
          {label}
        </div>,
        document.body,
      )
    ) : (
      <div {...tipProps} style={inlinePositionStyles}>
        {label}
      </div>
    )
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
