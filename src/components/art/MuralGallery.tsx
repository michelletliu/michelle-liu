import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronLeftIcon, ChevronRightIcon } from "./ChevronIcons";

export type MuralImage = {
  id: string;
  imageSrc: string;
};

export type MuralData = {
  id: string;
  title: string;
  sidebarLabel?: string;
  location: string;
  date: string;
  description?: string;
  images: MuralImage[];
};

type MuralGalleryProps = {
  className?: string;
  data: MuralData;
  /** Callback when an image is clicked */
  onImageClick?: (image: MuralImage) => void;
};

/**
 * Mural Gallery component - horizontal scrolling carousel
 * with title, location, date, description and navigation arrows
 * 
 * Responsive behavior:
 * - Desktop: Location/Date and Description side by side
 * - Mobile: Location/Date and Description stacked vertically
 */
export default function MuralGallery({ 
  className, 
  data,
  onImageClick 
}: MuralGalleryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(data.images.length > 1);
  const [canScrollRight, setCanScrollRight] = useState(data.images.length > 1);

  const loopedImages = useMemo(() => {
    if (data.images.length <= 1) return data.images;
    return [...data.images, ...data.images, ...data.images];
  }, [data.images]);

  useEffect(() => {
    const hasMultipleImages = data.images.length > 1;
    setCanScrollLeft(hasMultipleImages);
    setCanScrollRight(hasMultipleImages);
  }, [data.images.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || loopedImages.length <= data.images.length) return;

    const recenter = () => {
      const totalWidth = container.scrollWidth;
      if (!totalWidth) return;
      container.scrollLeft = totalWidth / 3;
    };

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

    requestAnimationFrame(recenter);

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", recenter);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", recenter);
    };
  }, [data.images.length, loopedImages.length]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Responsive scroll distance based on current card size
    const cardWidth = Math.min(container.clientWidth * 0.82, 320);
    const scrollAmount = cardWidth + 16;
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
    <div className={clsx("flex flex-col gap-8 pb-12 w-full", className)}>
      {/* Header section */}
      <div className="flex flex-col items-start w-full">
        {/* Title */}
        <p className="font-medium leading-normal text-gray-900 text-base mb-6">
          {data.title}
        </p>

        {/* Divider 
        <div className="bg-zinc-100 h-px shrink-0 w-full mb-4" /> */}
        
        {/* Metadata row - responsive layout */}
        <div className="flex flex-col md:flex-row font-medium gap-5 items-start text-base w-full">
          {/* Location and Date */}
          <div className="flex flex-col items-start leading-[1.4] w-[202px] flex-shrink-0">
            <p className="text-gray-600">
              {data.location}
            </p>
            <p className="text-gray-400">
              {data.date}
            </p>
          </div>
          
          {/* Description */}
          {data.description && (
            <p className="leading-normal text-gray-400 max-w-[366px] whitespace-pre-wrap">
              {data.description}
            </p>
          )}
        </div>
      </div>

      {/* Scrollable gallery container */}
      <div className="relative w-full">
        {/* Scroll container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 items-center justify-start overflow-x-auto w-full scrollbar-hide pb-1 px-5 sm:px-8"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loopedImages.map((image, index) => (
            <button
              key={`${image.id}-${index}`}
              onClick={() => onImageClick?.(image)}
              className="flex-none inline-flex h-[200px] md:h-[250px] lg:h-96 rounded-xl overflow-hidden cursor-pointer transition-transform duration-300 bg-[#e3dff4] items-center justify-center"
              style={{ width: "auto" }}
            >
              <img
                src={image.imageSrc}
                alt=""
                className="block h-[200px] md:h-[250px] lg:h-96 w-auto max-w-none object-contain"
                style={{ maxWidth: "unset" }}
              />
            </button>
          ))}
        </div>

        {/* Left navigation button */}
        <div
          className="pointer-events-none absolute inset-y-0 left-5 sm:left-8 flex items-center z-10 -translate-x-1/2"
        >
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={clsx(
              "pointer-events-auto size-9 flex items-center justify-center rounded-full border border-gray-200 bg-white/95 shadow-sm transition-colors",
              canScrollLeft ? "text-gray-600 hover:text-gray-800" : "text-gray-300 cursor-default"
            )}
            aria-label="Scroll left"
          >
            <ChevronLeftIcon className="size-5" />
          </button>
        </div>

        {/* Right navigation button */}
        <div
          className="pointer-events-none absolute inset-y-0 right-5 sm:right-8 flex items-center z-10 translate-x-1/2"
        >
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={clsx(
              "pointer-events-auto size-9 flex items-center justify-center rounded-full border border-gray-200 bg-white/95 shadow-sm transition-colors",
              canScrollRight ? "text-gray-600 hover:text-gray-800" : "text-gray-300 cursor-default"
            )}
            aria-label="Scroll right"
          >
            <ChevronRightIcon className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

