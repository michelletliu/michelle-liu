import clsx from "clsx";

// Sidebar navigation categories
export type AboutCategory = "hi" | "experience" | "community" | "philosophy" | "shelf" | "lore";

// Shelf subcategories
export type ShelfSubcategory = "books" | "music" | "movies";

// Shelf subcategories (indented under SHELF)
const SHELF_SUBCATEGORIES: { id: ShelfSubcategory; label: string }[] = [
  { id: "books", label: "BOOKS" },
  { id: "music", label: "MUSIC" },
  { id: "movies", label: "MOVIES" },
];

// Community item from Sanity (for sidebar display)
export type CommunitySidebarItem = {
  id: string;
  sidebarName: string;
};

export type AboutSidebarProps = {
  activeCategory: AboutCategory;
  onCategoryClick: (category: AboutCategory) => void;
  /** Community items with their sidebar names */
  communityItems?: CommunitySidebarItem[];
  /** Active community ID (when community category is active) */
  activeCommunityId?: string;
  /** Callback when a specific community is clicked */
  onCommunityClick?: (communityId: string) => void;
  /** Active shelf subcategory (when shelf category is active) */
  activeShelfSubcategory?: ShelfSubcategory;
  /** Callback when a specific shelf subcategory is clicked */
  onShelfSubcategoryClick?: (subcategory: ShelfSubcategory) => void;
  /** Counts for each shelf subcategory */
  shelfCounts?: Partial<Record<ShelfSubcategory, number>>;
};

export default function AboutSidebar({ 
  activeCategory, 
  onCategoryClick,
  communityItems = [],
  activeCommunityId,
  onCommunityClick,
  activeShelfSubcategory,
  onShelfSubcategoryClick,
  shelfCounts,
}: AboutSidebarProps) {
  const categoriesBeforeCommunity: { id: AboutCategory; label: string }[] = [
    { id: "hi", label: "HI!" },
    { id: "experience", label: "EXPERIENCE" },
  ];

  // Check if community is active
  const isCommunityActive = activeCategory === "community";
  // Check if shelf is active
  const isShelfActive = activeCategory === "shelf";
  
  // Filter communities that have sidebar names
  const visibleCommunities = communityItems.filter(c => c.sidebarName);

  return (
    <nav className="flex flex-col gap-4 items-start">
      {/* Main categories before COMMUNITY */}
      {categoriesBeforeCommunity.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onCategoryClick(cat.id)}
          className="flex items-center px-0.5 py-0 cursor-pointer"
        >
          <span
            className={clsx(
              "text-base font-semibold tracking-wide leading-5 transition-colors",
              activeCategory === cat.id
                ? "text-blue-500"
                : "text-gray-400 hover:text-gray-500"
            )}
          >
            {cat.label}
          </span>
        </button>
      ))}

      {/* COMMUNITY Header - clickable, darker when community is active */}
      <button
        onClick={() => {
          onCategoryClick("community");
          // Select first community if available
          if (visibleCommunities.length > 0) {
            onCommunityClick?.(visibleCommunities[0].id);
          }
        }}
        className="flex items-center px-0.5 py-0 cursor-pointer"
      >
        <span
          className={clsx(
            "text-base font-semibold tracking-wide leading-5 transition-colors",
            isCommunityActive ? "text-gray-500" : "text-gray-400 hover:text-gray-500"
          )}
        >
          COMMUNITY
        </span>
      </button>

      {/* Community Subcategories (indented) - with smooth collapse/expand animation */}
      {visibleCommunities.length > 0 && (
        <div
          className={clsx(
            "flex flex-col gap-4 overflow-hidden transition-all duration-300 ease-in-out",
            isCommunityActive ? "max-h-96 opacity-100 mt-0" : "max-h-0 opacity-0 -mt-4"
          )}
        >
          {visibleCommunities.map((community) => {
            const isActive = activeCommunityId === community.id;

            return (
              <button
                key={community.id}
                onClick={() => {
                  onCategoryClick("community");
                  onCommunityClick?.(community.id);
                }}
                className="flex items-center px-0.5 py-0 rounded-full cursor-pointer transition-colors pl-3"
              >
                <span
                  className={clsx(
                    "text-base font-semibold tracking-wide leading-5 text-left transition-colors",
                    isActive ? "text-blue-500" : "text-gray-400 hover:text-gray-500"
                  )}
                >
                  {community.sidebarName}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* PHILOSOPHY */}
      <button
        onClick={() => onCategoryClick("philosophy")}
        className="flex items-center px-0.5 py-0 cursor-pointer"
      >
        <span
          className={clsx(
            "text-base font-semibold tracking-wide leading-5 transition-colors",
            activeCategory === "philosophy"
              ? "text-blue-500"
              : "text-gray-400 hover:text-gray-500"
          )}
        >
          PHILOSOPHY
        </span>
      </button>

      {/* SHELF Header - clickable, darker when shelf is active */}
      <button
        onClick={() => {
          onCategoryClick("shelf");
          // Also trigger first subcategory when clicking header
          onShelfSubcategoryClick?.("books");
        }}
        className="flex items-center px-0.5 py-0 cursor-pointer"
      >
        <span
          className={clsx(
            "text-base font-semibold tracking-wide leading-5 transition-colors",
            isShelfActive ? "text-gray-500" : "text-gray-400 hover:text-gray-500"
          )}
        >
          SHELF
        </span>
      </button>

      {/* Shelf Subcategories (indented) - with smooth collapse/expand animation */}
      <div
        className={clsx(
          "flex flex-col gap-4 overflow-hidden transition-all duration-300 ease-in-out",
          isShelfActive ? "max-h-40 opacity-100 mt-0" : "max-h-0 opacity-0 -mt-4"
        )}
      >
        {SHELF_SUBCATEGORIES.map((subcat) => {
          const isActive = activeShelfSubcategory === subcat.id;
          const count = shelfCounts?.[subcat.id];
          const showCount = count !== undefined && count > 0;

          return (
            <button
              key={subcat.id}
              onClick={() => {
                onCategoryClick("shelf");
                onShelfSubcategoryClick?.(subcat.id);
              }}
              className="flex items-center px-0.5 py-0 rounded-full cursor-pointer transition-colors pl-3"
            >
              <span
                className={clsx(
                  "text-base font-semibold tracking-wide leading-5 text-left transition-colors",
                  isActive ? "text-blue-500" : "text-gray-400 hover:text-gray-500"
                )}
              >
                {subcat.label}
                {showCount && (
                  <span className="text-gray-300 ml-1">({count})</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* LORE */}
      <button
        onClick={() => onCategoryClick("lore")}
        className="flex items-center px-0.5 py-0 cursor-pointer"
      >
        <span
          className={clsx(
            "text-base font-semibold tracking-wide leading-5 transition-colors",
            activeCategory === "lore"
              ? "text-blue-500"
              : "text-gray-400 hover:text-gray-500"
          )}
        >
          LORE
        </span>
      </button>
    </nav>
  );
}
