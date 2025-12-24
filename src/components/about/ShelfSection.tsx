import clsx from "clsx";
import MediaCard, { type MediaCardData } from "./MediaCard";

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
  const displayItems = items.slice(0, itemCount);
  const isSquare = mediaType === "music";

  return (
    <div className={clsx("flex w-full flex-col gap-1", className)}>
      {/* Header */}
      <div className="relative flex w-full flex-col py-4">
        {/* Title tag and year filters */}
        <div className="flex items-center gap-2 md:gap-6 overflow-x-auto scrollbar-hide pb-3">
          {/* Title tag - always highlighted */}
          <div className="flex shrink-0 items-center justify-center rounded-full bg-gray-500/10 px-3 py-1">
            <span className="font-['Figtree',sans-serif] text-sm md:text-base font-bold tracking-wide text-gray-500 whitespace-nowrap">
              {title}
              {count !== undefined && (
                <span className="text-gray-400"> ({count})</span>
              )}
            </span>
          </div>

          {/* Year filters - hidden on mobile if there are many */}
          {yearFilters.map((filter) => {
            const isActive = activeYear === filter.year;
            return (
              <button
                key={filter.year}
                onClick={() => onYearChange?.(filter.year)}
                className={clsx(
                  "hidden md:flex shrink-0 cursor-pointer items-center justify-center rounded-full px-3 py-1 transition-colors",
                  isActive ? "bg-gray-500/10" : "hover:bg-gray-500/5"
                )}
              >
                <span
                  className={clsx(
                    "font-['Figtree',sans-serif] text-base font-bold tracking-wide whitespace-nowrap",
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

        {/* External link - positioned at bottom right */}
        {externalLink && (
          <a
            href={externalLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-0 bottom-[calc(1rem+0.5rem)] flex shrink-0 cursor-pointer justify-start rounded-full px-0.5 transition-colors"
          >
            <span className="font-['Figtree',sans-serif] text-sm md:text-base font-normal tracking-wide text-gray-400 hover:text-blue-500 transition-colors whitespace-nowrap">
              {externalLink.label} ↗
            </span>
          </a>
        )}

        {/* Divider */}
        <div className="h-px w-full bg-gray-200" />
      </div>

      {/* Media Grid - horizontal scroll on mobile, flex row on desktop */}
      <div className="flex w-full items-start gap-3 md:gap-6 overflow-x-auto overflow-y-visible py-2 scrollbar-hide lg:px-[118px]">
        {displayItems.length > 0 ? (
          displayItems.map((item, index) => (
            <MediaCard
              key={item.id || index}
              data={item}
              variant="default"
              aspectRatio={isSquare ? "square" : "portrait"}
              onClick={() => onItemClick?.(item)}
              className={clsx(
                "shrink-0",
                // Mobile: fixed width for scrollable row
                // Desktop: flex to fill space evenly
                isSquare 
                  ? "w-28 md:w-auto md:flex-1 md:min-w-0" 
                  : "w-24 md:w-auto md:flex-1 md:min-w-0"
              )}
            />
          ))
        ) : (
          <p className="text-gray-400 text-sm py-4">
            No {mediaType}s added yet. Add them in Sanity Studio.
          </p>
        )}
      </div>
    </div>
  );
}

