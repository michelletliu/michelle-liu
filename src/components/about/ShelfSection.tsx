import clsx from "clsx";
import { useEffect, useState, useRef } from "react";
import MediaCard, { type MediaCardData } from "./MediaCard";
import { ArrowUpRight } from "../ArrowUpRight";

type YearFilter = {
  year: string;
  count?: number;
};

type ShelfSectionProps = {
  className?: string;
  /** Title label like "BOOKS ★" */
  title: string;
  /** Count to show in parentheses after title */
  count?: number;
  /** Media type for aspect ratio (book/movie = portrait, music = square) */
  mediaType: "book" | "music" | "movie";
  /** Year filters to show (empty array = no filters) */
  yearFilters?: YearFilter[];
  /** Currently active year filter */
  activeYear?: string;
  /** Callback when year filter is clicked */
  onYearChange?: (year: string) => void;
  /** External link configuration */
  externalLink?: {
    label: string;
    href: string;
  };
  /** Media items to display */
  items: MediaCardData[];
  /** Number of items to show (default 5) */
  itemCount?: number;
  /** Callback when an item is clicked */
  onItemClick?: (item: MediaCardData) => void;
};

export default function ShelfSection({
  className,
  title,
  count,
  mediaType,
  yearFilters = [],
  activeYear,
  onYearChange,
  externalLink,
  items,
  itemCount = 5,
  onItemClick,
}: ShelfSectionProps) {
  // Filter items based on active year
  // If no year is selected, show featured items; otherwise show items from that year
  const filteredItems = activeYear
    ? items.filter(item => item.year === activeYear)
    : items.filter(item => item.isFeatured);
  
  // When a year is selected, show all items from that year; otherwise limit to itemCount
  const displayItems = activeYear ? filteredItems : filteredItems.slice(0, itemCount);
  const isSquare = mediaType === "music";

  // Animation state - triggers fade up on tab change using a key to force re-render
  const [animationKey, setAnimationKey] = useState(0);
  const currentView = activeYear || "featured";
  
  // Mobile dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);
  
  // Increment animation key when view changes to trigger staggered fade-up
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [currentView]);

  // Get display text for mobile dropdown
  const getActiveFilterDisplay = () => {
    if (!activeYear) {
      return `${title}${count !== undefined ? ` (${count})` : ""}`;
    }
    const filter = yearFilters.find(f => f.year === activeYear);
    if (filter) {
      return `${filter.year}${filter.count !== undefined ? ` (${filter.count})` : ""}`;
    }
    return activeYear;
  };

  return (
    <div className={clsx("flex w-full flex-col gap-1", className)}>
      {/* Header */}
      <div className="relative flex w-full flex-col py-4">
        {/* Title tag and year filters */}
        <div className="flex items-center pb-2">
          {/* Mobile/Tablet: Dropdown for year filters - outside overflow container */}
          {yearFilters.length > 0 && (
            <div className="relative lg:hidden shrink-0" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={clsx(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 transition-colors cursor-pointer",
                    "bg-gray-500/10"
                  )}
                >
                  <span className="font-['Figtree',sans-serif] font-semibold text-sm tracking-wide whitespace-nowrap text-gray-500">
                    {!activeYear ? (
                      <>
                        {title}
                        {count !== undefined && (
                          <span className="text-gray-400"> ({count})</span>
                        )}
                      </>
                    ) : (
                      (() => {
                        const filter = yearFilters.find(f => f.year === activeYear);
                        return filter ? (
                          <>
                            {filter.year}
                            {filter.count !== undefined && (
                              <span className="text-gray-400"> ({filter.count})</span>
                            )}
                          </>
                        ) : activeYear;
                      })()
                    )}
                  </span>
                  <svg
                    className={clsx(
                      "w-3 h-3 text-gray-400 transition-transform duration-200",
                      isDropdownOpen && "rotate-180"
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                {isDropdownOpen && (
                  <div className="absolute left-0 top-[calc(100%+4px)] bg-white rounded-lg shadow-lg border border-gray-100 z-[100] min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex flex-col py-1.5 px-1.5">
                      {/* Favorites option */}
                      <button
                        onClick={() => {
                          onYearChange?.("");
                          setIsDropdownOpen(false);
                        }}
                        className={clsx(
                          "flex items-center px-3 py-1.5 rounded-md transition-colors text-left",
                          !activeYear ? "bg-gray-100" : "hover:bg-gray-50"
                        )}
                      >
                        <span className={clsx(
                          "font-['Figtree',sans-serif] font-semibold text-sm tracking-wide",
                          !activeYear ? "text-gray-600" : "text-gray-400"
                        )}>
                          {title}
                          {count !== undefined && (
                            <span className={!activeYear ? "text-gray-400" : "text-gray-300"}> ({count})</span>
                          )}
                        </span>
                      </button>
                      
                      {/* Year options */}
                      {yearFilters.map((filter) => {
                        const isActive = activeYear === filter.year;
                        return (
                          <button
                            key={filter.year}
                            onClick={() => {
                              onYearChange?.(filter.year);
                              setIsDropdownOpen(false);
                            }}
                            className={clsx(
                              "flex items-center px-3 py-1.5 rounded-md transition-colors text-left",
                              isActive ? "bg-gray-100" : "hover:bg-gray-50"
                            )}
                          >
                            <span className={clsx(
                              "font-['Figtree',sans-serif] font-semibold text-sm tracking-wide",
                              isActive ? "text-gray-600" : "text-gray-400"
                            )}>
                              {filter.year}
                              {filter.count !== undefined && (
                                <span className={isActive ? "text-gray-400" : "text-gray-300"}>
                                  {" "}({filter.count})
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Mobile/Tablet: Show title only if no year filters */}
            {yearFilters.length === 0 && (
              <button
                onClick={() => onYearChange?.("")}
                className={clsx(
                  "flex lg:hidden shrink-0 items-center justify-center rounded-full px-3 py-1 transition-colors cursor-pointer",
                  !activeYear ? "bg-gray-500/10" : "hover:bg-gray-500/5"
                )}
              >
                <span className={clsx(
                  "font-['Figtree',sans-serif] font-semibold text-sm tracking-wide whitespace-nowrap",
                  !activeYear ? "text-gray-500" : "text-gray-400"
                )}>
                  {title}
                  {count !== undefined && (
                    <span className={!activeYear ? "text-gray-400" : "text-gray-300"}> ({count})</span>
                  )}
                </span>
              </button>
            )}

            {/* Desktop: Title and year filters in overflow container */}
            <div className="hidden lg:flex items-center gap-1 min-w-0 overflow-hidden flex-1">
              {/* Desktop: Title tag - clickable to show favorites */}
              <button
                onClick={() => onYearChange?.("")}
                className={clsx(
                  "flex shrink-0 items-center justify-center rounded-full px-3 py-1 transition-colors cursor-pointer",
                  !activeYear ? "bg-gray-500/10" : "hover:bg-gray-500/5"
                )}
              >
                <span className={clsx(
                  "font-['Figtree',sans-serif] font-semibold text-base tracking-wide whitespace-nowrap",
                  !activeYear ? "text-gray-500" : "text-gray-400"
                )}>
                  {title}
                  {count !== undefined && (
                    <span className={!activeYear ? "text-gray-400" : "text-gray-300"}> ({count})</span>
                  )}
                </span>
              </button>

              {/* Year filters */}
              {yearFilters.map((filter) => {
                const isActive = activeYear === filter.year;
                return (
                  <button
                    key={filter.year}
                    onClick={() => onYearChange?.(filter.year)}
                    className={clsx(
                      "flex shrink-0 cursor-pointer items-center justify-center rounded-full px-3 py-1 transition-colors",
                      isActive ? "bg-gray-500/10" : "hover:bg-gray-500/5"
                    )}
                  >
                    <span
                      className={clsx(
                        "font-['Figtree',sans-serif] text-base font-semibold tracking-wide whitespace-nowrap",
                        isActive ? "text-gray-600" : "text-gray-400"
                      )}
                    >
                      {filter.year}
                      {filter.count !== undefined && (
                        <span className={isActive ? "text-gray-400" : "text-gray-300"}>
                          {" "}({filter.count})
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

          {/* External link - right aligned with gradient fade for readability */}
          {externalLink && (
            <div className="shrink-0 flex items-center pl-6 bg-gradient-to-r from-transparent to-white">
              <a
                href={externalLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer transition-colors bg-white"
              >
                <span className="font-['Figtree',sans-serif] text-sm md:text-base font-normal tracking-wide text-gray-400 hover:text-blue-500 transition-colors whitespace-nowrap">
                  {externalLink.label} <ArrowUpRight />
                </span>
              </a>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gray-200" />
      </div>

      {/* Media Grid */}
      <div key={animationKey}>
        {displayItems.length > 0 ? (
          activeYear ? (
            // Year view: Grid with 10 items per row, full width
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-3 w-full py-2">
              {displayItems.map((item, index) => (
                <div
                  key={item.id || index}
                  className="animate-shelf-item-fade-up"
                  style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
                >
                  <MediaCard
                    data={item}
                    variant="default"
                    aspectRatio={isSquare ? "square" : "portrait"}
                    onClick={() => onItemClick?.(item)}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          ) : (
            // Default view: 5 items - grid on mobile to fit width, flex centered on desktop
            <div className="grid grid-cols-5 md:flex md:justify-center gap-2 md:gap-6 w-full py-2 lg:px-[118px]">
              {displayItems.map((item, index) => (
                <div
                  key={item.id || index}
                  className="animate-shelf-item-fade-up w-full md:flex-1 md:min-w-0"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <MediaCard
                    data={item}
                    variant="default"
                    aspectRatio={isSquare ? "square" : "portrait"}
                    onClick={() => onItemClick?.(item)}
                    className="w-full h-full"
                  />
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="flex w-full items-start py-2 animate-shelf-item-fade-up">
            <p className="text-gray-400 text-sm py-4">
              No {mediaType}s added yet. Add them in Sanity Studio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

