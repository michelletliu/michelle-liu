import clsx from "clsx";
import ArtCard, { ArtCardData } from "./ArtCard";
import { ScrollReveal } from "../ScrollReveal";

type ArtGalleryProps = {
  className?: string;
  /** Array of art pieces to display */
  items: ArtCardData[];
  /** Callback when an art card is clicked */
  onItemClick?: (item: ArtCardData) => void;
};

/**
 * Art Gallery component - displays a responsive masonry layout of art cards
 * - Mobile/Tablet: 2 columns
 * - Desktop (lg): 3 columns
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
        // Use grid for mobile (2 columns) to align tops, columns for desktop masonry (3 columns)
        "grid grid-cols-2 gap-4 lg:block lg:columns-3",
        className
      )}
    >
      {items.map((item) => (
        <ScrollReveal key={item.id} className="lg:break-inside-avoid lg:mb-4">
          <ArtCard
            data={item}
            onClick={() => onItemClick?.(item)}
          />
        </ScrollReveal>
      ))}
    </div>
  );
}




