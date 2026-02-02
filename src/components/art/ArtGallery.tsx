import clsx from "clsx";
import ArtCard, { ArtCardData } from "./ArtCard";
import { ScrollReveal } from "../ScrollReveal";

type ArtGalleryProps = {
  className?: string;
  /** Array of art pieces to display */
  items: ArtCardData[];
  /** Callback when an art card is clicked */
  onItemClick?: (item: ArtCardData) => void;
  /** Reverse column fill so first column is longer (mobile only) */
  reverseColumnsMobile?: boolean;
};

/**
 * Art Gallery component - displays a responsive masonry layout of art cards
 * - Mobile/Tablet: 2 columns
 * - Desktop (lg): 3 columns
 */
export default function ArtGallery({ 
  className, 
  items,
  onItemClick,
  reverseColumnsMobile = false
}: ArtGalleryProps) {
  return (
    <div 
      className={clsx(
        "w-full max-w-full",
        // Use CSS columns for masonry effect on all screen sizes
        "columns-2 gap-4 lg:columns-3",
        // Reverse column fill on mobile so first column is longer
        reverseColumnsMobile && "max-lg:direction-rtl",
        className
      )}
    >
      {items.map((item) => (
        <ScrollReveal key={item.id} className={clsx("break-inside-avoid mb-4", reverseColumnsMobile && "max-lg:direction-ltr")}>
          <ArtCard
            data={item}
            onClick={() => onItemClick?.(item)}
          />
        </ScrollReveal>
      ))}
    </div>
  );
}




