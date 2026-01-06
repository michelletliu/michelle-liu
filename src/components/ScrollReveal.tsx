import React, { useEffect, useRef, ReactNode } from "react";
import clsx from "clsx";

type AnimationVariant = "slide" | "fast" | "fade";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** Animation variant: "slide" (default), "fast" (smaller/quicker), or "fade" (opacity only) */
  variant?: AnimationVariant;
  /** Use faster, shorter animation (shorthand for variant="fast") */
  fast?: boolean;
  /** Delay in milliseconds before animation starts */
  delay?: number;
  /** Threshold for intersection observer (0-1) */
  threshold?: number;
  /** Root margin for earlier/later trigger */
  rootMargin?: string;
  /** HTML element to render as */
  as?: keyof JSX.IntrinsicElements;
  /** Disable animation (element renders normally) */
  disabled?: boolean;
};

/**
 * ScrollReveal - Wraps content to animate it sliding up into view on scroll
 * Uses Squarespace-style smooth animations with hardware acceleration
 * 
 * Usage:
 * <ScrollReveal>
 *   <YourContent />
 * </ScrollReveal>
 * 
 * With delay:
 * <ScrollReveal delay={100}>
 *   <YourContent />
 * </ScrollReveal>
 * 
 * Fade only (for text):
 * <ScrollReveal variant="fade">
 *   <Text />
 * </ScrollReveal>
 */
export function ScrollReveal({
  children,
  className,
  variant = "slide",
  fast = false,
  delay = 0,
  threshold = 0.15,
  rootMargin = "0px 0px -40px 0px",
  as: Component = "div",
  disabled = false,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);

  // Determine the actual variant
  const actualVariant = fast ? "fast" : variant;

  // Track if element was above the fold on mount
  const wasAboveFoldRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (disabled) return;
    
    const element = ref.current;
    if (!element) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      element.classList.add("revealed");
      return;
    }

    // Check if element is in viewport
    const isInViewport = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      // Element is visible if its top is within the viewport (with some margin)
      return rect.top < windowHeight + 40 && rect.bottom > -40;
    };

    // On first mount, check if element is "above the fold" (visible without scrolling)
    // These elements should animate together without staggered delays
    if (wasAboveFoldRef.current === null) {
      wasAboveFoldRef.current = isInViewport();
      
      // Clear delay for above-fold elements so they all animate together
      if (wasAboveFoldRef.current && delay > 0) {
        element.style.transitionDelay = "0ms";
      }
    }

    // Check if element is already in viewport and reveal it
    const checkVisibility = () => {
      if (isInViewport()) {
        requestAnimationFrame(() => {
          element.classList.add("revealed");
        });
        return true;
      }
      return false;
    };

    // Use Intersection Observer which handles initial visibility automatically
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            requestAnimationFrame(() => {
              element.classList.add("revealed");
            });
            observer.unobserve(element);
          }
        });
      },
      {
        threshold: 0, // Trigger as soon as any part is visible
        rootMargin: "40px", // Extra margin to trigger slightly earlier
      }
    );

    observer.observe(element);

    // Also check immediately after a frame (for elements already in view)
    requestAnimationFrame(() => {
      checkVisibility();
    });

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, disabled, delay]);

  if (disabled) {
    return <>{children}</>;
  }

  // Get the appropriate class based on variant
  const variantClass = {
    slide: "scroll-reveal",
    fast: "scroll-reveal-fast",
    fade: "scroll-reveal-fade",
  }[actualVariant];

  return React.createElement(
    Component,
    {
      ref,
      className: clsx(variantClass, className),
      style: delay > 0 ? { transitionDelay: `${delay}ms` } : undefined,
    },
    children
  );
}

type ScrollRevealGroupProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay between each child (in ms) */
  stagger?: number;
  /** Starting delay for first child */
  baseDelay?: number;
  /** Animation variant */
  variant?: AnimationVariant;
  /** Use faster animation variant (shorthand) */
  fast?: boolean;
  /** Threshold for intersection observer */
  threshold?: number;
  /** Root margin for trigger */
  rootMargin?: string;
};

/**
 * ScrollRevealGroup - Wraps multiple children and staggers their reveal animation
 * Each child will be wrapped in ScrollReveal with increasing delays
 * 
 * Usage:
 * <ScrollRevealGroup stagger={100}>
 *   <Card1 />
 *   <Card2 />
 *   <Card3 />
 * </ScrollRevealGroup>
 */
export function ScrollRevealGroup({
  children,
  className,
  stagger = 80,
  baseDelay = 0,
  variant = "slide",
  fast = false,
  threshold = 0.15,
  rootMargin = "0px 0px -40px 0px",
}: ScrollRevealGroupProps) {
  const childArray = React.Children.toArray(children);

  return (
    <div className={clsx("scroll-reveal-stagger", className)}>
      {childArray.map((child, index) => (
        <ScrollReveal
          key={index}
          delay={baseDelay + index * stagger}
          variant={variant}
          fast={fast}
          threshold={threshold}
          rootMargin={rootMargin}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}

/**
 * useScrollReveal - Hook for adding scroll reveal to existing elements
 * Returns a ref to attach to your element
 * 
 * Usage:
 * const ref = useScrollReveal();
 * return <div ref={ref} className="scroll-reveal">...</div>
 */
export function useScrollReveal(options: {
  threshold?: number;
  rootMargin?: string;
} = {}) {
  const { threshold = 0.15, rootMargin = "0px 0px -40px 0px" } = options;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      element.classList.add("revealed");
      return;
    }

    // Check if element is already in viewport
    const checkVisibility = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const isVisible = rect.top < windowHeight + 40 && rect.bottom > -40;
      
      if (isVisible) {
        requestAnimationFrame(() => {
          element.classList.add("revealed");
        });
        return true;
      }
      return false;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            requestAnimationFrame(() => {
              element.classList.add("revealed");
            });
            observer.unobserve(element);
          }
        });
      },
      { threshold: 0, rootMargin: "40px" }
    );

    observer.observe(element);

    // Check immediately after a frame
    requestAnimationFrame(() => {
      checkVisibility();
    });

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}

export default ScrollReveal;

