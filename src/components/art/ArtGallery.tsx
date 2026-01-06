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
        // 2 columns on mobile, 3 columns on desktop
        "columns-2 gap-4 lg:columns-3",
        className
      )}
    >
      {items.map((item) => (
        <ScrollReveal key={item.id} className="break-inside-avoid">
          <ArtCard
            data={item}
            onClick={() => onItemClick?.(item)}
          />
        </ScrollReveal>
      ))}
    </div>
  );
}




