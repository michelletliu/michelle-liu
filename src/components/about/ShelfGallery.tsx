import { useState } from "react";
import clsx from "clsx";
import MediaCard, { type MediaCardData } from "./MediaCard";
import { ArrowUpRight } from "../ArrowUpRight";

export type ShelfCategory = {
  id: string;
  /** Display label (e.g., "BOOKS ★") */
  label: string;
  /** Whether this is a filterable category like years or a label category */
  type: "label" | "filter";
  /** Count to show in parentheses */
  count?: number;
};

type ShelfGalleryProps = {
  className?: string;
  /** Display state - Default shows limited items, Expanded shows all */
  state?: "Default" | "Expanded";
  /** Categories/tabs for the header */
  categories: ShelfCategory[];
  /** Currently active category ID */
  activeCategory?: string;
  /** Callback when a category is selected */
  onCategoryChange?: (categoryId: string) => void;
  /** External link configuration */
  externalLink?: {
    label: string;
    href: string;
  };
  /** Media items to display */
  items: MediaCardData[];
  /** Number of items to show in Default state */
  defaultItemCount?: number;
  /** Callback when an item is clicked */
  onItemClick?: (item: MediaCardData) => void;
};

export default function ShelfGallery({
  className,
  state = "Default",
  categories,
  activeCategory,
  onCategoryChange,
  externalLink,
  items,
  defaultItemCount = 5,
  onItemClick,
}: ShelfGalleryProps) {
  const [internalActiveCategory, setInternalActiveCategory] = useState(
    activeCategory || categories[0]?.id
  );

  const currentActiveCategory = activeCategory ?? internalActiveCategory;

  const handleCategoryClick = (categoryId: string) => {
    if (onCategoryChange) {
      onCategoryChange(categoryId);
    } else {
      setInternalActiveCategory(categoryId);
    }
  };

  // Determine which items to display based on state
  const displayItems =
    state === "Default" ? items.slice(0, defaultItemCount) : items;

  return (
    <div className={clsx("flex w-full flex-col gap-1", className)}>
      {/* Header */}
      <div className="flex w-full flex-col py-4">
        {/* Top row: Categories and external link */}
        <div className="flex w-full items-center justify-between">
          {/* Category tags */}
          <div className="flex shrink-0 items-start">
            {categories.map((category) => {
              const isActive = currentActiveCategory === category.id;
              const isLabel = category.type === "label";

              if (isLabel) {
                // Label category (like "BOOKS ★") - clickable to switch media types
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={clsx(
                      "flex shrink-0 cursor-pointer items-center justify-center rounded-full px-3 py-1 transition-colors",
                      isActive ? "bg-gray-500/10" : "hover:bg-gray-500/5"
                    )}
                  >
                    <span
                      className={clsx(
                        "font-['Figtree',sans-serif] text-base font-semibold tracking-wide",
                        isActive ? "text-gray-500" : "text-gray-400"
                      )}
                    >
                      {category.label}
                      {category.count !== undefined && (
                        <span className="text-gray-400"> ({category.count})</span>
                      )}
                    </span>
                  </button>
                );
              }

              // Filter category (like years)
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={clsx(
                    "flex shrink-0 cursor-pointer items-center justify-center rounded-full px-3 py-1 transition-colors",
                    isActive
                      ? "bg-gray-500/10"
                      : "hover:bg-gray-500/5"
                  )}
                >
                  <span
                    className={clsx(
                      "font-['Figtree',sans-serif] text-base font-semibold tracking-wide",
                      isActive ? "text-gray-500" : "text-gray-400"
                    )}
                  >
                    {category.label}
                    {category.count !== undefined && (
                      <span className={isActive ? "text-gray-400" : "text-gray-300"}>
                        {" "}({category.count})
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* External link */}
          {externalLink && (
            <a
              href={externalLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 cursor-pointer items-center justify-center rounded-full px-0.5 transition-colors hover:text-gray-600"
            >
              <span className="text-base font-normal leading-5 tracking-wide text-gray-400">
                {externalLink.label} <ArrowUpRight />
              </span>
            </a>
          )}
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gray-200" />
      </div>

      {/* Media Grid */}
      <div
        className={clsx(
          "flex w-full items-start",
          state === "Default"
            ? "gap-4 md:gap-6"
            : "flex-wrap content-start gap-3 md:gap-4"
        )}
      >
        {displayItems.map((item, index) => (
          <MediaCard
            key={item.id || index}
            data={item}
            variant={state === "Default" ? "default" : "expanded"}
            onClick={() => onItemClick?.(item)}
            className={clsx(
              state === "Default"
                ? "min-h-px min-w-0 flex-1 shrink-0"
                : [
                    // Expanded state: responsive grid sizing
                    // Mobile: 5 items per row with gaps accounted for
                    // Desktop: fixed 94x122px book cover size
                    "aspect-[210/310] w-[calc((100%-48px)/5)] shrink-0",
                    "md:aspect-auto md:h-[122px] md:w-[94px]",
                  ]
            )}
          />
        ))}
      </div>
    </div>
  );
}

