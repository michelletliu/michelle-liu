import clsx from "clsx";
import ArtCard, { ArtCardData } from "./ArtCard";

type ArtGalleryProps = {
  className?: string;
  /** Array of art pieces to display */
  items: ArtCardData[];
  /** Callback when an art card is clicked */
  onItemClick?: (item: ArtCardData) => void;
};

/**
 * Art Gallery component - displays a responsive layout of art cards
 * - Mobile: Single column, images fill width with natural aspect ratio
 * - Medium (md): 2 columns
 * - Desktop (lg): 3 columns masonry
 */
export default function ArtGallery({ 
  className, 
  items,
  onItemClick 
}: ArtGalleryProps) {
  return (
    <div 
      className={clsx(
        "w-full max-w-full",
        // Single column on mobile, masonry on larger screens
        "flex flex-col gap-4",
        "md:block md:columns-2 lg:columns-3 md:gap-4",
        className
      )}
    >
      {items.map((item) => (
        <ArtCard
          key={item.id}
          data={item}
          onClick={() => onItemClick?.(item)}
        />
      ))}
    </div>
  );
}
