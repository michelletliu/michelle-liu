import clsx from "clsx";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import MediaCard, { type MediaCardData } from "./MediaCard";
import { ArrowUpRight } from "../ArrowUpRight";
import { FilterDropdown } from "../FilterDropdown";

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

const SHELF_FEATURED_FILTER_ID = "__featured";

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
  
  const desktopTagsRef = useRef<HTMLDivElement | null>(null);
  const desktopTagRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const indicatorReadyRef = useRef(false);
  const activeTagId = activeYear || SHELF_FEATURED_FILTER_ID;
  const [indicatorReady, setIndicatorReady] = useState(false);
  const [desktopTagsOverflowing, setDesktopTagsOverflowing] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    height: 0,
    top: 0,
    opacity: 0,
  });

  const updateIndicator = useCallback(() => {
    const container = desktopTagsRef.current;
    const activeButton = desktopTagRefs.current[activeTagId];

    if (!container || !activeButton) return;

    setDesktopTagsOverflowing(container.scrollWidth > container.clientWidth + 1);

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeButton.getBoundingClientRect();
    const nextStyle = {
      left: activeRect.left - containerRect.left,
      width: activeRect.width,
      height: activeRect.height,
      top: activeRect.top - containerRect.top,
      opacity: 1,
    };

    setIndicatorStyle((currentStyle) => {
      if (
        currentStyle.left === nextStyle.left &&
        currentStyle.width === nextStyle.width &&
        currentStyle.height === nextStyle.height &&
        currentStyle.top === nextStyle.top &&
        currentStyle.opacity === nextStyle.opacity
      ) {
        return currentStyle;
      }

      return nextStyle;
    });

    if (!indicatorReadyRef.current) {
      requestAnimationFrame(() => {
        indicatorReadyRef.current = true;
        setIndicatorReady(true);
      });
    }
  }, [activeTagId]);
  
  // Increment animation key when view changes to trigger staggered fade-up
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [currentView]);

  useLayoutEffect(() => {
    updateIndicator();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateIndicator);

    if (desktopTagsRef.current) observer.observe(desktopTagsRef.current);
    [SHELF_FEATURED_FILTER_ID, ...yearFilters.map((filter) => filter.year)].forEach((id) => {
      const element = desktopTagRefs.current[id];
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [updateIndicator, yearFilters]);

  // Build options for mobile FilterDropdown
  const mobileFilterOptions = [
    { value: "", label: title },
    ...yearFilters.map((f) => ({ value: f.year, label: f.year, count: f.count })),
  ];

  return (
    <div className={clsx("flex w-full flex-col gap-1", className)}>
      {/* Header */}
      <div className="relative flex w-full flex-col py-4">
        {/* Title tag and year filters */}
        <div className="flex items-center pb-2">
          {/* Mobile/Tablet: Shared FilterDropdown */}
          <div className="lg:hidden shrink-0">
            {yearFilters.length > 0 ? (
              <FilterDropdown
                options={mobileFilterOptions}
                activeValue={activeYear ?? ""}
                onChange={(value) => onYearChange?.(value)}
                usePortal
              />
            ) : (
              <button
                onClick={() => onYearChange?.("")}
                className={clsx(
                  "flex shrink-0 items-center justify-center rounded-full px-3 py-1 transition-colors cursor-pointer",
                  !activeYear ? "bg-gray-500/10" : "hover:bg-gray-500/5"
                )}
              >
                <span className={clsx(
                  "font-['Michelle',sans-serif] font-medium text-base tracking-wide whitespace-nowrap",
                  !activeYear ? "text-gray-500" : "text-gray-400"
                )}>
                  {title}
                </span>
              </button>
            )}
          </div>

            {/* Spacer to push link to right on mobile/tablet */}
            <div className="flex-1 lg:hidden" />

            {/* Desktop: Title and year filters in overflow container */}
            <div ref={desktopTagsRef} className="hidden lg:flex items-center gap-1 min-w-0 overflow-hidden flex-1 relative">
              <div
                aria-hidden="true"
                className={clsx(
                  "absolute left-0 top-0 z-0 rounded-full bg-gray-500/10 motion-reduce:transition-none",
                  indicatorReady && "transition-[transform,width,opacity] duration-300 ease-out"
                )}
                style={{
                  opacity: indicatorStyle.opacity,
                  transform: `translate3d(${indicatorStyle.left}px, ${indicatorStyle.top}px, 0)`,
                  width: indicatorStyle.width,
                  height: indicatorStyle.height,
                }}
              />
              {/* Desktop: Title tag - clickable to show favorites */}
              <button
                ref={(element) => {
                  desktopTagRefs.current[SHELF_FEATURED_FILTER_ID] = element;
                }}
                onClick={() => onYearChange?.("")}
                className="group relative z-10 flex shrink-0 cursor-pointer items-center justify-center rounded-full px-3 py-1"
              >
                <span className={clsx(
                  "font-['Michelle',sans-serif] font-medium text-base tracking-wide whitespace-nowrap transition-colors duration-200 ease-out",
                  !activeYear ? "text-gray-500" : "text-gray-400 group-hover:text-gray-500"
                )}>
                  {title}
                </span>
              </button>

              {/* Year filters */}
              {yearFilters.map((filter) => {
                const isActive = activeYear === filter.year;
                return (
                  <button
                    ref={(element) => {
                      desktopTagRefs.current[filter.year] = element;
                    }}
                    key={filter.year}
                    onClick={() => onYearChange?.(filter.year)}
                    className={clsx(
                      "group relative z-10 flex shrink-0 cursor-pointer items-center justify-center rounded-full px-3 py-1"
                    )}
                  >
                    <span
                      className={clsx(
                        "font-['Michelle',sans-serif] text-base font-medium tracking-wide whitespace-nowrap transition-colors duration-200 ease-out",
                        isActive ? "text-gray-600" : "text-gray-400 group-hover:text-gray-500"
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
              {desktopTagsOverflowing && (
                <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-12 bg-gradient-to-r from-transparent to-white" />
              )}
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
                <span className="font-['Michelle',sans-serif] text-base font-normal tracking-wide text-gray-400 hover:text-blue-500 transition-colors whitespace-nowrap">
                  {externalLink.label}<ArrowUpRight className="ml-1.5" />
                </span>
              </a>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-zinc-100" />
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

