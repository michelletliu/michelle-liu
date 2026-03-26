import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronLeftIcon, ChevronRightIcon } from "./ChevronIcons";
import EdgeGradients from "./EdgeGradients";
import LiquidGlassButton from "./LiquidGlassButton";

export type SketchbookItem = {
  id: string;
  imageSrc: string;
};

export type SketchbookData = {
  id: string;
  title: string;
  sidebarLabel?: string;
  date: string;
  images: SketchbookItem[];
};

type SketchbookGalleryProps = {
  className?: string;
  data: SketchbookData;
  /** Callback when an image is clicked */
  onImageClick?: (image: SketchbookItem) => void;
};

// Individual image component with loading state
function SketchbookImage({ 
  image, 
  onClick,
  onLoad,
}: { 
  image: SketchbookItem; 
  onClick?: () => void;
  onLoad?: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <button
      onClick={onClick}
      className="flex-none h-[200px] md:h-[300px] lg:h-96 rounded-xl overflow-hidden cursor-pointer relative w-fit"
    >
      {/* Shimmer placeholder - matches image size */}
      {!imageLoaded && (
        <div className="absolute inset-0 rounded-xl animate-shimmer" />
      )}
      <img
        src={image.imageSrc}
        alt=""
        className={clsx(
          "block h-[200px] md:h-[300px] lg:h-96 w-auto object-contain rounded-xl transition-opacity duration-500 ease-out",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => {
          setImageLoaded(true);
          onLoad?.();
        }}
      />
    </button>
  );
}

/**
 * Sketchbook Gallery component - horizontal scrolling carousel
 * with title/date caption and navigation arrows
 */
export default function SketchbookGallery({ 
  className, 
  data,
  onImageClick 
}: SketchbookGalleryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const recenterRaf = useRef<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(data.images.length > 1);
  const [canScrollRight, setCanScrollRight] = useState(data.images.length > 1);

  const loopedImages = useMemo(() => {
    if (data.images.length <= 1) return data.images;
    return [...data.images, ...data.images, ...data.images];
  }, [data.images]);

  const scheduleRecenter = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || loopedImages.length <= data.images.length) return;

    if (recenterRaf.current) cancelAnimationFrame(recenterRaf.current);
    recenterRaf.current = requestAnimationFrame(() => {
      recenterRaf.current = requestAnimationFrame(() => {
        const totalWidth = container.scrollWidth;
        if (!totalWidth) return;
        const third = totalWidth / 3;
        container.scrollLeft = third;
      });
    });
  }, [data.images.length, loopedImages.length]);

  useEffect(() => {
    const hasMultipleImages = data.images.length > 1;
    setCanScrollLeft(hasMultipleImages);
    setCanScrollRight(hasMultipleImages);
  }, [data.images.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || loopedImages.length <= data.images.length) return;

    const handleScroll = () => {
      const totalWidth = container.scrollWidth;
      if (!totalWidth) return;
      const third = totalWidth / 3;

      if (container.scrollLeft <= third * 0.1) {
        container.scrollLeft += third;
      } else if (container.scrollLeft >= third * 1.9) {
        container.scrollLeft -= third;
      }
    };

    // Recenters after the layout stabilizes so the user starts in the middle copy
    scheduleRecenter();

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", scheduleRecenter);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", scheduleRecenter);
      if (recenterRaf.current) cancelAnimationFrame(recenterRaf.current);
    };
  }, [data.images.length, loopedImages.length, scheduleRecenter]);

  const handleImageLoad = () => {
    scheduleRecenter();
  };

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Use the current card width for smoother responsive scrolling
    const cardWidth = Math.min(container.clientWidth * 0.82, 320);
    const scrollAmount = cardWidth + 16; // add the gap
    const targetScroll =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  return (
    <div className={clsx("flex flex-col gap-6 pb-6 w-full", className)}>
      {/* Caption: Title and Date */}
      <div className="flex flex-col font-medium items-start leading-[1.4] text-base">
        <p className="text-gray-900 text-lg">
          {data.title}
        </p>
        <p className="text-gray-400">
          {data.date}
        </p>
      </div>

      {/* Scrollable gallery container */}
      <div className="relative w-full">
        {/* Scroll container - images have no padding, they touch container edges */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 items-center justify-start overflow-x-auto w-full scrollbar-hide pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loopedImages.map((image, index) => (
            <SketchbookImage
              key={`${image.id}-${index}`}
              image={image}
              onClick={() => onImageClick?.(image)}
              onLoad={handleImageLoad}
            />
          ))}
        </div>

        <EdgeGradients />

        {/* Left hover zone + button */}
        <div className="group/left absolute top-0 -left-1 md:left-0 h-full w-[20%] z-10 flex items-center">
          <div className="md:-translate-x-1/2 md:opacity-0 md:scale-90 md:group-hover/left:opacity-100 md:group-hover/left:scale-100 transition-[opacity,transform] duration-150 ease-out">
            <LiquidGlassButton
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={clsx(
                canScrollLeft ? "text-gray-500 hover:text-gray-700" : "text-gray-300/60 cursor-default"
              )}
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className="size-5 -translate-x-px" />
            </LiquidGlassButton>
          </div>
        </div>

        {/* Right hover zone + button */}
        <div className="group/right absolute top-0 -right-1 md:right-0 h-full w-[20%] z-10 flex items-center justify-end">
          <div className="md:translate-x-1/2 md:opacity-0 md:scale-90 md:group-hover/right:opacity-100 md:group-hover/right:scale-100 transition-[opacity,transform] duration-150 ease-out">
            <LiquidGlassButton
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className={clsx(
                canScrollRight ? "text-gray-500 hover:text-gray-700" : "text-gray-300/60 cursor-default"
              )}
              aria-label="Scroll right"
            >
              <ChevronRightIcon className="size-5 translate-x-px" />
            </LiquidGlassButton>
          </div>
        </div>
      </div>
    </div>
  );
}

