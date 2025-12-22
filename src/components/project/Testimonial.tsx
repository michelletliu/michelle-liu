import React, { useState } from "react";
import clsx from "clsx";

// Quote mark SVG
const QuoteMark = ({ className }: { className?: string }) => (
  <div className={clsx("absolute", className)}>
    <svg
      className="block size-full opacity-10"
      viewBox="0 0 121 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 60C0 26.8629 26.8629 0 60 0C93.1371 0 120 26.8629 120 60C120 93.1371 93.1371 120 60 120C26.8629 120 0 93.1371 0 60Z"
        fill="#E5E7EB"
      />
      <path
        d="M55.5 47.5H35.5L25.5 72.5H45.5V92.5H25.5V72.5L35.5 47.5H45.5L55.5 27.5V47.5Z M95.5 47.5H75.5L65.5 72.5H85.5V92.5H65.5V72.5L75.5 47.5H85.5L95.5 27.5V47.5Z"
        fill="#9CA3AF"
      />
    </svg>
  </div>
);

// Collapse/Expand arrow icon
const CollapseIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    className={clsx(
      "block size-full transition-transform",
      expanded ? "rotate-0" : "rotate-180"
    )}
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.46967 6.53033C1.17678 6.23744 1.17678 5.76256 1.46967 5.46967L4.46967 2.46967C4.76256 2.17678 5.23744 2.17678 5.53033 2.46967L8.53033 5.46967C8.82322 5.76256 8.82322 6.23744 8.53033 6.53033C8.23744 6.82322 7.76256 6.82322 7.46967 6.53033L5 4.06066L2.53033 6.53033C2.23744 6.82322 1.76256 6.82322 1.46967 6.53033Z"
      fill="#9CA3AF"
    />
  </svg>
);

type TestimonialProps = {
  state?: "Default" | "Expanded";
  device?: "Default" | "Mobile";
  /** Section label */
  label?: string;
  /** Section title */
  title?: string;
  /** Author name */
  authorName: string;
  /** Author title/role */
  authorTitle: string;
  /** Author avatar image URL */
  authorAvatar: string;
  /** Short quote (shown in Default state) */
  shortQuote: string;
  /** Full quote paragraphs (shown in Expanded state) */
  fullQuote: string[];
  /** Controlled expanded state */
  expanded?: boolean;
  /** Callback when expanded state changes */
  onExpandedChange?: (expanded: boolean) => void;
};

export default function Testimonial({
  state = "Default",
  device = "Default",
  label = "Feedback",
  title = "Kind words from my manager",
  authorName,
  authorTitle,
  authorAvatar,
  shortQuote,
  fullQuote,
  expanded: controlledExpanded,
  onExpandedChange,
}: TestimonialProps) {
  const [internalExpanded, setInternalExpanded] = useState(state === "Expanded");
  
  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  
  const toggleExpanded = () => {
    const newValue = !isExpanded;
    if (onExpandedChange) {
      onExpandedChange(newValue);
    } else {
      setInternalExpanded(newValue);
    }
  };

  const isDesktop = device === "Default";
  const isMobile = device === "Mobile";

  return (
    <div
      className={clsx(
        "content-stretch flex flex-col items-start justify-center py-16 relative",
        isDesktop && "px-[175px] w-[1440px]",
        isMobile && "px-8 w-[640px]"
      )}
    >
      <div
        className={clsx(
          "content-stretch flex flex-col relative shrink-0 w-full",
          isDesktop && "gap-[100px] items-start",
          isMobile && "gap-16 items-center justify-center"
        )}
      >
        {/* Header Section */}
        <div className="content-stretch flex flex-col gap-5 items-start relative shrink-0 w-full">
          <p className="leading-5 relative shrink-0 text-[#9ca3af] text-base">
            {label}
          </p>
          <p className="leading-7 min-w-full relative shrink-0 text-2xl text-black whitespace-pre-wrap">
            {title}
          </p>
        </div>

        {/* Quote Section */}
        <div
          className={clsx(
            "content-stretch flex items-start relative shrink-0",
            isDesktop && "justify-between px-[111px] py-0 w-full",
            isMobile && "flex-col gap-16 w-[378px]"
          )}
        >
          {/* Author Info */}
          <div
            className={clsx(
              "content-stretch flex relative shrink-0",
              isDesktop && "flex-col gap-6 items-start w-[202px]",
              isMobile && "gap-8 items-center w-[264px]"
            )}
          >
            {/* Avatar */}
            <div className="relative rounded-full shrink-0 size-[120px] overflow-hidden">
              <img
                className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
                alt={authorName}
                src={authorAvatar}
              />
            </div>

            {/* Name and Title */}
            <div
              className={clsx(
                "content-stretch flex flex-col gap-1 items-start leading-5 relative shrink-0 text-base",
                isMobile && "flex-[1_0_0] min-h-px min-w-px"
              )}
            >
              <p className="relative shrink-0 text-black">{authorName}</p>
              <p className="relative shrink-0 text-[#9ca3af]">{authorTitle}</p>
            </div>
          </div>

          {/* Quote Content */}
          <div
            className={clsx(
              "content-stretch flex flex-col gap-6 relative shrink-0",
              isDesktop && isExpanded && "items-end justify-end",
              isDesktop && !isExpanded && "items-start justify-center whitespace-pre-wrap",
              isMobile && "items-start justify-center w-full"
            )}
          >
            {!isExpanded ? (
              <>
                {/* Short Quote */}
                <p
                  className={clsx(
                    "leading-[26px] relative shrink-0 text-[#1f2937] text-xl",
                    isDesktop && "w-[424px]",
                    isMobile && "min-w-full whitespace-pre-wrap"
                  )}
                >
                  {shortQuote}
                </p>
                {/* Read More Button */}
                <button
                  onClick={toggleExpanded}
                  className={clsx(
                    "leading-5 relative shrink-0 text-[#9ca3af] text-base hover:text-[#6b7280] transition-colors cursor-pointer",
                    isDesktop && "w-[424px]"
                  )}
                >
                  Read more
                </button>
              </>
            ) : (
              <>
                {/* Full Quote */}
                <div
                  className={clsx(
                    "font-normal leading-[26px] relative shrink-0 text-[#1f2937] text-xl whitespace-pre-wrap",
                    isDesktop && "w-[424px]",
                    isMobile && "min-w-full"
                  )}
                >
                  {fullQuote.map((paragraph, index) => (
                    <p key={index} className={index < fullQuote.length - 1 ? "mb-4" : ""}>
                      {paragraph}
                    </p>
                  ))}
                </div>
                {/* Collapse Button */}
                <button
                  onClick={toggleExpanded}
                  className="content-stretch flex items-center justify-center relative shrink-0 size-6 cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <div className="relative shrink-0 size-5">
                    <CollapseIcon expanded={isExpanded} />
                  </div>
                </button>
              </>
            )}
          </div>

          {/* Quote Mark */}
          <QuoteMark
            className={clsx(
              isDesktop && "h-[120px] left-[-77px] top-[-77px] w-[121px]",
              isMobile && "h-[100px] left-[-79px] top-[124px] w-[101px]"
            )}
          />
        </div>
      </div>
    </div>
  );
}
