import clsx from "clsx";
import ArtCard, { ArtCardData } from "./ArtCard";
import { ScrollReveal } from "../shared/ScrollReveal";

type ArtGalleryProps = {
  className?: string;
  /** Array of art pieces to display */
  items: ArtCardData[];
  /** Callback when an art card is clicked */
  onItemClick?: (item: ArtCardData) => void;
  /** Reverse column fill so first column is longer (mobile only) */
  reverseColumnsMobile?: boolean;
  /** Use masonry layout on mobile instead of grid (default: false) */
  masonryMobile?: boolean;
};

/**
 * Art Gallery component - displays a responsive masonry layout of art cards
 * - Mobile/Tablet: 2 columns (grid by default, masonry if masonryMobile=true)
 * - Desktop (lg): 3 columns masonry
 */
export default function ArtGallery({ 
  className, 
  items,
  onItemClick,
  reverseColumnsMobile = false,
  masonryMobile = false
}: ArtGalleryProps) {
  return (
    <div 
      className={clsx(
        "w-full max-w-full",
        masonryMobile 
          ? "columns-2 gap-4 lg:columns-3"
          : "grid grid-cols-2 gap-4 items-start lg:block lg:columns-3",
        className
      )}
    >
      {items.map((item) => (
        <ScrollReveal key={item.id} className={clsx("break-inside-avoid", masonryMobile ? "mb-4" : "lg:mb-4")}>
          <ArtCard
            data={item}
            onClick={() => onItemClick?.(item)}
          />
        </ScrollReveal>
      ))}
    </div>
  );
}




