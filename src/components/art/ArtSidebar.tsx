import clsx from "clsx";

export type ArtCategory = "painting" | "conceptual" | "graphite" | "sketchbook" | "murals";

type ArtSidebarProps = {
  className?: string;
  activeCategory: ArtCategory;
  onCategoryClick: (category: ArtCategory) => void;
  /** Counts for each category (optional) */
  counts?: Partial<Record<ArtCategory, number>>;
  /** Sketchbook labels for subcategories (from sidebarLabel field or first word of title) */
  sketchbookLabels?: string[];
  /** Image counts for each sketchbook */
  sketchbookImageCounts?: number[];
  /** Active sketchbook index (when sketchbook category is active) */
  activeSketchbookIndex?: number;
  /** Callback when a specific sketchbook is clicked */
  onSketchbookClick?: (index: number) => void;
  /** Mural labels for subcategories (from sidebarLabel field or first word of title) */
  muralLabels?: string[];
  /** Active mural index (when murals category is active) */
  activeMuralIndex?: number;
  /** Callback when a specific mural is clicked */
  onMuralClick?: (index: number) => void;
};

// Fine Art subcategories (indented)
const FINE_ART_CATEGORIES: { id: ArtCategory; label: string }[] = [
  { id: "painting", label: "Painting" },
  { id: "conceptual", label: "Conceptual" },
  { id: "graphite", label: "Graphite" },
];

export default function ArtSidebar({
  className,
  activeCategory,
  onCategoryClick,
  counts,
  sketchbookLabels = [],
  sketchbookImageCounts = [],
  activeSketchbookIndex,
  onSketchbookClick,
  muralLabels = [],
  activeMuralIndex,
  onMuralClick,
}: ArtSidebarProps) {
  // Check if a Fine Art subcategory is active
  const isFineArtActive = FINE_ART_CATEGORIES.some(
    (cat) => cat.id === activeCategory
  );
  
  // Check if sketchbook is active
  const isSketchbookActive = activeCategory === "sketchbook";
  
  // Check if murals is active
  const isMuralsActive = activeCategory === "murals";

  const renderCategoryButton = (
    category: { id: ArtCategory; label: string },
    isIndented: boolean
  ) => {
    const isActive = activeCategory === category.id;
    const count = counts?.[category.id];
    // Hide sketchbook count when Fine Art is active
    const showCount = count !== undefined && count > 0 && 
      !(category.id === "sketchbook" && isFineArtActive);

    return (
      <button
        key={category.id}
        onClick={() => onCategoryClick(category.id)}
        className={clsx(
          "flex items-center px-0.5 py-0 rounded-full cursor-pointer transition-colors",
          isIndented && "pl-3" // 12px indent for Fine Art subcategories
        )}
      >
        <span
          className={clsx(
            "text-base font-medium tracking-wide leading-5 text-left transition-colors",
            isActive ? "text-blue-500" : "text-gray-400 hover:text-gray-500"
          )}
        >
          {category.label}
          {showCount && (
            <span className="text-gray-300 ml-1">({count})</span>
          )}
        </span>
      </button>
    );
  };

  return (
    <div className={clsx("flex flex-col gap-3 items-start", className)}>
      {/* FINE ART Header - clickable, darker when a fine art subcategory is active */}
      <button
        onClick={() => onCategoryClick("painting")}
        className="flex items-center px-0.5 py-0 cursor-pointer"
      >
        <span
          className={clsx(
            "text-base font-medium tracking-wide leading-5 transition-colors",
            isFineArtActive ? "text-gray-500" : "text-gray-400 hover:text-gray-500"
          )}
        >
          Fine Art
        </span>
      </button>

      {/* Fine Art Subcategories (indented) - with smooth collapse/expand animation */}
      <div
        className={clsx(
          "flex flex-col gap-3 overflow-hidden transition-all duration-300 ease-in-out",
          isFineArtActive ? "max-h-40 opacity-100 mt-0" : "max-h-0 opacity-0 -mt-3"
        )}
      >
        {FINE_ART_CATEGORIES.map((category) =>
          renderCategoryButton(category, true)
        )}
      </div>

      {/* SKETCHBOOK Header */}
      <button
        onClick={() => onCategoryClick("sketchbook")}
        className="flex items-center px-0.5 py-0 cursor-pointer"
      >
        <span
          className={clsx(
            "text-base font-medium tracking-wide leading-5 transition-colors",
            isSketchbookActive ? "text-gray-500" : "text-gray-400 hover:text-gray-500"
          )}
        >
          Sketchbook
        </span>
      </button>

      {/* Sketchbook Subcategories (indented) - with smooth collapse/expand animation */}
      <div
        className={clsx(
          "flex flex-col gap-3 overflow-hidden transition-all duration-300 ease-in-out",
          isSketchbookActive ? "max-h-96 opacity-100 mt-0" : "max-h-0 opacity-0 -mt-3"
        )}
      >
        {sketchbookLabels.map((label, index) => {
          const imageCount = sketchbookImageCounts[index];
          return (
            <button
              key={index}
              onClick={() => onSketchbookClick?.(index)}
              className="flex items-center px-0.5 py-0 rounded-full cursor-pointer transition-colors pl-3"
            >
              <span
                className={clsx(
                  "text-base font-medium tracking-wide leading-5 text-left transition-colors",
                  activeSketchbookIndex === index ? "text-blue-500" : "text-gray-400 hover:text-gray-500"
                )}
              >
                {label}
                {imageCount !== undefined && imageCount > 0 && (
                  <span className="text-gray-300 ml-1">({imageCount})</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* MURALS Header */}
      <button
        onClick={() => onCategoryClick("murals")}
        className="flex items-center px-0.5 py-0 cursor-pointer"
      >
        <span
          className={clsx(
            "text-base font-medium tracking-wide leading-5 transition-colors",
            isMuralsActive ? "text-gray-500" : "text-gray-400 hover:text-gray-500"
          )}
        >
          Murals
        </span>
      </button>

      {/* Murals Subcategories (indented) - with smooth collapse/expand animation */}
      <div
        className={clsx(
          "flex flex-col gap-2 overflow-hidden transition-all duration-300 ease-in-out",
          isMuralsActive ? "max-h-96 opacity-100 mt-0" : "max-h-0 opacity-0 -mt-3"
        )}
      >
        {muralLabels.map((label, index) => (
          <button
            key={index}
            onClick={() => onMuralClick?.(index)}
            className="flex items-center px-0.5 py-0 rounded-full cursor-pointer transition-colors pl-3"
          >
            <span
              className={clsx(
                "text-base font-medium tracking-wide text-left transition-colors",
                activeMuralIndex === index ? "text-blue-500" : "text-gray-400 hover:text-gray-500"
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}




