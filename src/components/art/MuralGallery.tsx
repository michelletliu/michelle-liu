import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons/Chevron";
import EdgeGradients from "./EdgeGradients";
import LiquidGlassButton from "./LiquidGlassButton";

export type MuralImage = {
  id: string;
  imageSrc: string;
  fullImageSrc?: string;
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

// Individual image component with loading state
function MuralImageCard({ 
  image, 
  onClick,
  onLoad,
}: { 
  image: MuralImage; 
  onClick?: () => void;
  onLoad?: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <button
      onClick={onClick}
      className="flex-none inline-flex h-[200px] md:h-[250px] lg:h-96 rounded-xl overflow-hidden cursor-pointer transition-transform duration-300 items-center justify-center relative"
      style={{ width: "auto", minWidth: "150px" }}
    >
      {/* Shimmer placeholder */}
      <div 
        className={clsx(
          "absolute inset-0 rounded-xl transition-opacity duration-500 ease-out",
          imageLoaded ? "opacity-0" : "opacity-100 animate-shimmer"
        )}
      />
      <img
        src={image.imageSrc}
        alt=""
        className={clsx(
          "block h-[200px] md:h-[250px] lg:h-96 w-auto max-w-none object-contain transition-opacity duration-500 ease-out",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        style={{ maxWidth: "unset" }}
        onLoad={() => {
          setImageLoaded(true);
          onLoad?.();
        }}
      />
    </button>
  );
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const recenterRaf = useRef<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(data.images.length > 1);
  const [canScrollRight, setCanScrollRight] = useState(data.images.length > 1);
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const showArrows = isInView || isHovered;

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

    scheduleRecenter();

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", scheduleRecenter);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", scheduleRecenter);
      if (recenterRaf.current) cancelAnimationFrame(recenterRaf.current);
    };
  }, [data.images.length, loopedImages.length, scheduleRecenter]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  

  const handleImageLoad = () => {
    scheduleRecenter();
  };

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
    <div
      ref={containerRef}
      className={clsx("flex flex-col gap-4 pb-12 w-full", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header section */}
      <div className="flex flex-col items-start w-full">
        {/* Title */}
        <p className="font-medium leading-normal pt-4 text-zinc-900 text-lg mb-4">
          {data.title}
        </p>

        
        
        {/* Metadata row - responsive layout */}
        <div className="flex flex-col md:flex-row font-normal gap-6 items-start text-base w-full">
          {/* Location and Date */}
          <div className="flex flex-col items-start w-[202px] flex-shrink-0">
            <p className="text-zinc-500 font-medium">
              {data.location}
            </p>
            <p className="text-zinc-400">
              {data.date}
            </p>
          </div>
          
          {/* Description */}
          {data.description && (
            <p className="font-normal leading-normal pb-4 text-zinc-400 max-w-[366px] whitespace-pre-wrap">
              {data.description}
            </p>
          )}
        </div>
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
            <MuralImageCard
              key={`${image.id}-${index}`}
              image={image}
              onLoad={handleImageLoad}
              onClick={() => onImageClick?.(image)}
            />
          ))}
        </div>

        <EdgeGradients />

        {/* Left button */}
        <div className="absolute top-0 -left-1 md:left-0 h-full w-[20%] z-10 flex items-center">
          <div className={clsx(
            "md:-translate-x-1/2 transition-[opacity,transform] duration-200 ease-out",
            showArrows ? "md:opacity-100 md:scale-100" : "md:opacity-0 md:scale-90"
          )}>
            <LiquidGlassButton
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={clsx(
                canScrollLeft ? "text-zinc-600 hover:text-zinc-800" : "text-zinc-300/60 cursor-default"
              )}
              aria-label="Scroll left"
            >
              <ChevronLeftIcon className="size-5 -translate-x-px" />
            </LiquidGlassButton>
          </div>
        </div>

        {/* Right button */}
        <div className="absolute top-0 -right-1 md:right-0 h-full w-[20%] z-10 flex items-center justify-end">
          <div className={clsx(
            "md:translate-x-1/2 transition-[opacity,transform] duration-200 ease-out",
            showArrows ? "md:opacity-100 md:scale-100" : "md:opacity-0 md:scale-90"
          )}>
            <LiquidGlassButton
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className={clsx(
                canScrollRight ? "text-zinc-600 hover:text-zinc-800" : "text-zinc-300/60 cursor-default"
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

