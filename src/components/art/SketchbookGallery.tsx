import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronLeftIcon, ChevronRightIcon } from "./ChevronIcons";
import EdgeGradients from "./EdgeGradients";

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

        {/* Left navigation button - centered on left edge of first image */}
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className={clsx(
            "absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 z-10 size-9 flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors",
            canScrollLeft ? "text-gray-600 hover:text-gray-800" : "text-gray-300 cursor-default"
          )}
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="size-5" />
        </button>

        {/* Right navigation button - centered on right edge of last visible image */}
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={clsx(
            "absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 z-10 size-9 flex items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors",
            canScrollRight ? "text-gray-600 hover:text-gray-800" : "text-gray-300 cursor-default"
          )}
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="size-5" />
        </button>
      </div>
    </div>
  );
}

