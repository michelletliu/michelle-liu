import clsx from "clsx";
import { useEffect, useState } from "react";
import MediaCard, { type MediaCardData } from "./MediaCard";
import { getShelfDisplayItems } from "./shelfCoverDate";
import { ArrowUpRight } from "../icons/ArrowUpRight";
import { FilterDropdown } from "../shared/FilterDropdown";
import { FilterPills } from "../shared/FilterPills";

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
  // Featured: keep Sanity order. Year filter: newest → oldest by coverDateRaw.
  const displayItems = getShelfDisplayItems(items, activeYear, itemCount);
  const isSquare = mediaType === "music";

  // Animation state - triggers fade up on tab change using a key to force re-render
  const [animationKey, setAnimationKey] = useState(0);
  const currentView = activeYear || "featured";
  const activeTagId = activeYear || SHELF_FEATURED_FILTER_ID;

  // Increment animation key when view changes to trigger staggered fade-up
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [currentView]);

  // Build options for mobile FilterDropdown — star goes after the label in the menu
  const dropdownTitle = title.startsWith("★ ") ? `${title.slice(2)} ★` : title;
  const mobileFilterOptions = [
    { value: "", label: dropdownTitle, count },
    ...yearFilters.map((f) => ({ value: f.year, label: f.year, count: f.count })),
  ];

  const desktopFilterOptions = [
    { value: SHELF_FEATURED_FILTER_ID, label: title, count },
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
                  !activeYear ? "bg-zinc-500/10" : "hover:bg-zinc-500/5"
                )}
              >
                <span className={clsx(
                  "font-['Michelle',sans-serif] font-medium text-base tracking-wide whitespace-nowrap",
                  !activeYear ? "text-zinc-500" : "text-zinc-400"
                )}>
                  {title}
                  {count !== undefined && (
                    <span className={!activeYear ? "text-zinc-400" : "text-zinc-300"}> {count}</span>
                  )}
                </span>
              </button>
            )}
          </div>

            {/* Spacer to push link to right on mobile/tablet */}
            <div className="flex-1 lg:hidden" />

            {/* Desktop: Title and year filters in overflow container */}
            <div className="relative hidden min-w-0 flex-1 overflow-hidden lg:block">
              <FilterPills
                options={desktopFilterOptions}
                value={activeTagId}
                onChange={(next) =>
                  onYearChange?.(next === SHELF_FEATURED_FILTER_ID ? "" : next)
                }
                showOverflowFade
              />
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
                <span className="inline-flex items-center font-['Michelle',sans-serif] text-sm md:text-base font-medium tracking-wide text-zinc-400 hover:text-blue-500 transition-colors whitespace-nowrap">
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
            // Favorites: 5 items, no date hover tooltips (year tabs keep them)
            <div className="grid grid-cols-5 md:flex md:justify-center gap-2 md:gap-6 w-full py-2 lg:px-[118px]">
              {displayItems.map((item, index) => (
                <div
                  key={item.id || index}
                  className="animate-shelf-item-fade-up w-full md:flex-1 md:min-w-0"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <MediaCard
                    data={{ ...item, coverDateLabel: undefined }}
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
            <p className="text-zinc-400 text-sm py-4">
              No {mediaType}s added yet. Add them in Sanity Studio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

