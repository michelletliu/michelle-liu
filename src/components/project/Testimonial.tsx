import React, { useState, useRef } from "react";
import clsx from "clsx";
import quoteGraphic from "../../assets/quote gray 200.png";

// Quote mark using the quote.png asset
const QuoteMark = ({ className }: { className?: string }) => (
  <div className={clsx("absolute pointer-events-none", className)}>
    <img
      src={quoteGraphic}
      alt=""
      className="w-full h-full object-contain"
    />
  </div>
);

// Collapse arrow icon (diagonal arrow pointing up-left) - for desktop expanded
const CollapseArrowIcon = () => (
  <svg
    className="block size-full"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.7803 14.7803C14.4874 15.0732 14.0126 15.0732 13.7197 14.7803L6.5 7.56066V13.25C6.5 13.6642 6.16421 14 5.75 14C5.33579 14 5 13.6642 5 13.25V5.75C5 5.33579 5.33579 5 5.75 5H13.25C13.6642 5 14 5.33579 14 5.75C14 6.16421 13.6642 6.5 13.25 6.5H7.56066L14.7803 13.7197C15.0732 14.0126 15.0732 14.4874 14.7803 14.7803Z"
      fill="#9CA3AF"
    />
  </svg>
);

// Expand arrow icon (diagonal arrow pointing down-right) - for mobile expanded
const ExpandArrowIcon = () => (
  <svg
    className="block size-full rotate-180"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.7803 14.7803C14.4874 15.0732 14.0126 15.0732 13.7197 14.7803L6.5 7.56066V13.25C6.5 13.6642 6.16421 14 5.75 14C5.33579 14 5 13.6642 5 13.25V5.75C5 5.33579 5.33579 5 5.75 5H13.25C13.6642 5 14 5.33579 14 5.75C14 6.16421 13.6642 6.5 13.25 6.5H7.56066L14.7803 13.7197C15.0732 14.0126 15.0732 14.4874 14.7803 14.7803Z"
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
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Use controlled state if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  
  const toggleExpanded = () => {
    const wasExpanded = isExpanded;
    const newValue = !isExpanded;
    
    if (onExpandedChange) {
      onExpandedChange(newValue);
    } else {
      setInternalExpanded(newValue);
    }
    
    // If collapsing, scroll to the section after a short delay
    if (wasExpanded && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 50);
    }
  };

  const isDesktop = device === "Default";
  const isMobile = device === "Mobile";

  return (
    <div
      ref={sectionRef}
      className={clsx(
        "content-stretch flex flex-col items-start justify-center py-16 relative scroll-mt-8 w-full",
        isDesktop && "px-8 md:px-16 lg:px-[175px] max-w-[1440px]",
        isMobile && "px-6 sm:px-8 max-w-[640px]"
      )}
    >
      <div
        className={clsx(
          "content-stretch flex flex-col relative shrink-0 w-full transition-all duration-400 ease-out",
          isDesktop && "gap-12 md:gap-16 lg:gap-[100px] items-start",
          isMobile && "gap-16 items-center justify-center"
        )}
      >
        {/* Header Section */}
        <div className="content-stretch flex flex-col gap-5 items-start relative shrink-0 w-full">
          <p className="leading-5 relative shrink-0 text-[#9ca3af] uppercase text-base">
            {label}
          </p>
          <p className="leading-7 min-w-full relative shrink-0 text-2xl text-black whitespace-pre-wrap">
            {title}
          </p>
        </div>

        {/* Quote Section */}
        <div
          className={clsx(
            "content-stretch flex items-start relative shrink-0 transition-all duration-400 ease-out w-full",
            isDesktop && "flex-col md:flex-row gap-8 md:gap-12 lg:gap-16 px-0 md:px-8 lg:px-[111px] py-0",
            isMobile && "flex-col gap-16 max-w-[378px]"
          )}
        >
          {/* Author Info */}
          <div
            className={clsx(
              "content-stretch flex relative shrink-0 transition-all duration-400 ease-out",
              isDesktop && "flex-col gap-6 items-start w-full md:w-auto md:min-w-[180px] lg:w-[202px]",
              isMobile && "gap-8 items-center w-full max-w-[264px]"
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
              "content-stretch flex flex-col gap-6 relative transition-all duration-400 ease-out flex-1 min-w-0 w-full md:w-auto",
              isDesktop && isExpanded && "items-end justify-end",
              isDesktop && !isExpanded && "items-start justify-center",
              isMobile && "items-start justify-center w-full"
            )}
          >
            {/* Quote Text Container with smooth height transition */}
            <div
              className={clsx(
                "relative overflow-hidden w-full",
                isDesktop && "md:max-w-[424px]",
                isMobile && "min-w-full"
              )}
            >
              {/* Short Quote */}
              <div
                className={clsx(
                  "transition-all duration-400 ease-out origin-top",
                  isExpanded
                    ? "opacity-0 max-h-0 pointer-events-none scale-95"
                    : "opacity-100 max-h-[500px] scale-100"
                )}
              >
                <p className="leading-[26px] text-[#1f2937] text-xl whitespace-pre-wrap">
                  {shortQuote}
                </p>
              </div>

              {/* Full Quote */}
              <div
                className={clsx(
                  "transition-all duration-400 ease-out origin-top",
                  isExpanded
                    ? "opacity-100 max-h-[2000px] scale-100"
                    : "opacity-0 max-h-0 pointer-events-none absolute top-0 left-0 scale-95"
                )}
              >
                <div className="leading-[26px] text-[#1f2937] text-xl whitespace-pre-wrap">
                  {fullQuote.map((paragraph, index) => (
                    <p key={index} className={index < fullQuote.length - 1 ? "mb-6" : ""}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Button - Read More or Collapse */}
            <button
              onClick={toggleExpanded}
              className={clsx(
                "relative shrink-0 cursor-pointer transition-all duration-300 ease-out",
                isExpanded
                  ? "size-6 hover:opacity-70"
                  : "leading-5 text-[#9ca3af] text-base hover:text-[#6b7280] text-left",
                isDesktop && !isExpanded && "w-full md:max-w-[424px]"
              )}
            >
              {!isExpanded ? (
                "Read more"
              ) : (
                <div className="relative shrink-0 size-5">
                  {/* Desktop: up-left arrow, Mobile: down-right arrow */}
                  {isDesktop ? <CollapseArrowIcon /> : <ExpandArrowIcon />}
                </div>
              )}
            </button>
          </div>

          {/* Quote Mark */}
          <QuoteMark
            className={clsx(
              "transition-all duration-400 ease-out",
              isDesktop && "h-[120px] left-[-77px] top-[-77px] w-[121px]",
              isMobile && "h-[100px] left-[-40px] top-[124px] w-[101px]"
            )}
          />
        </div>
      </div>
    </div>
  );
}



