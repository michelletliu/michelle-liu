import { useRef, useState, useEffect } from "react";
import clsx from "clsx";

type ContactBadgeProps = {
  /** Whether to show the badge in expanded state initially (for hover behavior on Work page) */
  hoverMode?: boolean;
  /** Whether to auto-expand on scroll (for About page) */
  scrollExpandMode?: boolean;
  /** Additional className */
  className?: string;
};

/**
 * Contact badge component with green dot and "Get in touch" CTA
 * - Work page: Collapses/expands on hover
 * - About page: Auto-expands on scroll into view
 */
export default function ContactBadge({ 
  hoverMode = false, 
  scrollExpandMode = false,
  className 
}: ContactBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(!hoverMode && !scrollExpandMode);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hover mode handlers (Work page)
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

  // Scroll expand mode (About page)
  useEffect(() => {
    if (!scrollExpandMode) return;
    
    const badge = badgeRef.current;
    if (!badge) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isExpanded) {
            // Delay the expansion slightly for a nice effect
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

  return (
    <span 
      ref={badgeRef}
      className={clsx(
        "relative inline-flex items-center justify-center rounded-[999px] transition-all ease-in-out w-fit bg-[#ecfdf5]",
        hoverMode && "align-middle -translate-y-[2px] [cursor:inherit] before:content-[''] before:absolute before:-inset-[2px] before:rounded-[999px] before:pointer-events-none",
        hoverMode && (isExpanded 
          ? "gap-2 pl-1 pr-2.5 md:ml-2 duration-300" 
          : "md:gap-0 pl-1 md:pr-0 md:ml-2 duration-300"
        ),
        scrollExpandMode && (isExpanded 
          ? "gap-1.5 pl-1.5 pr-2.5 py-0.5 duration-[800ms]" 
          : "gap-0 p-1 duration-[800ms]"
        ),
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="relative shrink-0 size-[16px] overflow-visible">
        {/* Pulsing ring behind the badge */}
        <span className={isExpanded ? "green-pulse-ring-off" : "green-pulse-ring"} />
        <svg className="block size-full relative z-10" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
          <g id="Background">
            <rect fill="var(--fill-0, #A7F3D0)" height="16" rx="8" width="16" />
            <circle cx="8" cy="8" fill="var(--fill-0, #10B981)" id="Ellipse 1" r="4" />
          </g>
        </svg>
      </span>
      <span className={clsx(
        "font-['Figtree:Medium',sans-serif] font-normal text-emerald-500 text-base tracking-[0.005em] text-nowrap overflow-hidden transition-all ease-out",
        hoverMode && "duration-300",
        scrollExpandMode && "duration-[800ms]",
        isExpanded ? "max-w-[500px] opacity-100" : "max-w-0 opacity-0"
      )}>
        <span>Working on something cool? Get in</span>{" "}
        <a 
          href="mailto:michelletheresaliu@gmail.com" 
          className="[text-decoration-skip-ink:none] [text-underline-position:from-font] font-semibold text-emerald-500 hover:!text-emerald-600 transition-colors"
        >
          touch
        </a>!
      </span>
    </span>
  );
}
