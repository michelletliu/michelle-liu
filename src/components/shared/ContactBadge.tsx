import { useRef, useState, useEffect } from "react";
import clsx from "clsx";
import { posthog, posthogEnabled } from "../../lib/posthog";

export type ContactBadgeSize = "sm" | "md" | "lg";

type ContactBadgeProps = {
  /** Whether to show the badge in expanded state initially (for hover behavior on Work page) */
  hoverMode?: boolean;
  /** Whether to auto-expand on scroll (for About page) */
  scrollExpandMode?: boolean;
  /**
   * Visual size. Defaults from mode: hover → sm (header), scroll/default → md (about).
   */
  size?: ContactBadgeSize;
  /** Additional className */
  className?: string;
  /** Called when expanded state changes */
  onExpandedChange?: (isExpanded: boolean) => void;
};

/**
 * Contact badge component with green dot and "Get in touch" CTA
 * - Work page: Collapses/expands on hover (lg)
 * - About page: Auto-expands on scroll into view (md)
 * Visuals live in `globals.css` under `.contact-badge`.
 */
export default function ContactBadge({
  hoverMode = false,
  scrollExpandMode = false,
  size,
  className,
  onExpandedChange,
}: ContactBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(!hoverMode && !scrollExpandMode);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resolvedSize: ContactBadgeSize = size ?? (hoverMode ? "sm" : "md");

  const handleMouseEnter = () => {
    if (!hoverMode) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (!hoverMode) return;
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 100);
  };

  useEffect(() => {
    if (!scrollExpandMode) return;

    const badge = badgeRef.current;
    if (!badge) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isExpanded) {
            setTimeout(() => {
              setIsExpanded(true);
            }, 400);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(badge);

    return () => {
      observer.disconnect();
    };
  }, [scrollExpandMode, isExpanded]);

  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  return (
    <span
      ref={badgeRef}
      className={clsx(
        "contact-badge",
        resolvedSize,
        isExpanded ? "expanded" : "collapsed",
        hoverMode && "hover-mode",
        scrollExpandMode && "scroll-mode",
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="contact-badge-dot">
        <span
          className={clsx(
            "contact-badge-pulse",
            isExpanded ? "off" : "on",
          )}
        >
          <span className="green-pulse-ring" />
        </span>
        <svg className="relative z-10 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
          <circle cx="8" cy="8" fill="#10B981" r="4" />
        </svg>
      </span>
      <span className="contact-badge-text">
        <span>Working on something cool? Get in</span>{" "}
        <a
          href="mailto:studio@liumichelle.com"
          className="contact-badge-link"
          onClick={() => {
            if (posthogEnabled) {
              posthog.capture("contact_link_clicked");
            }
          }}
        >
          touch
        </a>!
      </span>
    </span>
  );
}
