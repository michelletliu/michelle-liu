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
        // Mobile: CSS grid with 2 columns (tops aligned in rows)
        // Desktop: CSS columns for masonry effect
        "grid grid-cols-2 gap-4 items-start lg:block lg:columns-3",
        className
      )}
    >
      {items.map((item) => (
        <ScrollReveal key={item.id} className="break-inside-avoid lg:mb-4">
          <ArtCard
            data={item}
            onClick={() => onItemClick?.(item)}
          />
        </ScrollReveal>
      ))}
    </div>
  );
}




