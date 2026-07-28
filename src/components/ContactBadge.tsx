import { useRef, useState, useEffect } from "react";
import clsx from "clsx";
import { posthog, posthogEnabled } from "../lib/posthog";

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
        "relative inline-flex w-fit items-center justify-center rounded-[999px] transition-all ease-in-out",
        isExpanded ? "bg-[#ecfdf5]" : "bg-transparent",
        hoverMode &&
          "align-middle -translate-y-[2px] [cursor:inherit] before:pointer-events-auto before:absolute before:-inset-2 before:rounded-[999px] before:content-['']",
        // Expanded padding / gap by size
        isExpanded &&
          resolvedSize === "sm" &&
          (hoverMode ? "gap-1.5 py-0 pl-1 pr-2.5 md:ml-0.5 duration-300" : "gap-1.5 py-0.5 pl-1 pr-2.5"),
        isExpanded &&
          resolvedSize === "md" &&
          (scrollExpandMode ? "gap-1 py-0.5 pl-1.5 pr-2.5 duration-[800ms]" : "gap-1 py-0.5 pl-1.5 pr-2.5"),
        isExpanded &&
          resolvedSize === "lg" &&
          "gap-1 py-0 pl-1 pr-3 md:ml-0.5",
        // Collapsed padding
        !isExpanded && hoverMode && "gap-0 py-0 pl-1 pr-0 md:ml-0.5 duration-300 md:gap-0 md:pr-0",
        !isExpanded && scrollExpandMode && "gap-0 p-1 duration-[800ms]",
        !isExpanded && !hoverMode && !scrollExpandMode && "gap-0 p-1",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="relative size-4 shrink-0 overflow-visible">
        <span
          className={clsx(
            "pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out",
            isExpanded ? "opacity-0" : "opacity-100"
          )}
        >
          <span className="green-pulse-ring" />
        </span>
        <svg className="relative z-10 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
          <circle cx="8" cy="8" fill="#10B981" r="4" />
        </svg>
      </span>
      <span
        className={clsx(
          "overflow-hidden text-nowrap font-['Michelle:Medium',sans-serif] font-normal tracking-[0.005em] text-emerald-500 transition-all ease-out",
          resolvedSize === "lg" ? "text-lg" : resolvedSize === "md" ? "text-base" : "text-sm",
          hoverMode && "duration-300",
          scrollExpandMode && "duration-[800ms]",
          isExpanded ? "max-w-[500px] opacity-100" : "max-w-0 opacity-0"
        )}
      >
        <span>Working on something cool? Get in</span>{" "}
        <a
          href="mailto:studio@liumichelle.com"
          className="font-semibold text-emerald-500 [text-decoration-skip-ink:none] [text-underline-position:from-font] transition-colors hover:!text-blue-500"
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
