import clsx from "clsx";
import { useEffect, useRef, useState, useCallback } from "react";

export type MediaCardData = {
  id: string;
  /** Image source for the media item (book cover, album cover, etc.) */
  imageSrc?: string;
  /** Title of the media item */
  title?: string;
  /** Type of media (defaults to "Book") */
  type?: "Book" | "Music" | "Movie" | "Quote";
  /** Year of the item (for filtering) */
  year?: string;
  /** Whether this item is featured (shows in default view) */
  isFeatured?: boolean;
  /** For Book type: Goodreads book URL */
  goodreadsUrl?: string;
  /** For Movie type: Letterboxd URL slug for linking to reviews */
  letterboxdSlug?: string;
  /** For Music type: Spotify album URL */
  spotifyUrl?: string;
  /** For Quote type: emoji to display */
  emoji?: string;
  /** For Quote type: the main quote title/phrase */
  quoteTitle?: string;
  /** For Quote type: the actual quote text */
  quoteText?: string;
  /** For Quote type: part of the text to be underlined with animation */
  quoteUnderlinedText?: string;
  /** For Quote type: attribution/author */
  quoteAuthor?: string;
};

type MediaCardProps = {
  className?: string;
  data?: MediaCardData;
  /** Visual variant for different display contexts (used with Book/Music types) */
  variant?: "default" | "expanded";
  /** Override aspect ratio (square for albums, portrait for books/movies) */
  aspectRatio?: "square" | "portrait";
  onClick?: () => void;
  /** For Quote type: whether this card is in the top row (more top padding) */
  topRow?: boolean;
};

/**
 * Renders quote text with an optional animated underline for specified text.
 * The underline animates from left to right when the card scrolls into view.
 */
function QuoteTextWithUnderline({
  text,
  underlinedText,
  isRevealed,
}: {
  text: string;
  underlinedText?: string;
  isRevealed: boolean;
}) {
  if (!underlinedText || !text.includes(underlinedText)) {
    return <>{text}</>;
  }

  const index = text.indexOf(underlinedText);
  const before = text.slice(0, index);
  const after = text.slice(index + underlinedText.length);

  return (
    <>
      {before}
      <span className="quote-underline-wrapper">
        <span
          className={clsx(
            "quote-animated-underline",
            isRevealed && "revealed"
          )}
        >
          {underlinedText}
        </span>
      </span>
      {after}
    </>
  );
}

/**
 * MediaCard - A versatile card component for books, music, and quotes.
 * Designed for Sanity CMS integration.
 */
export default function MediaCard({
  className,
  data,
  variant = "default",
  aspectRatio,
  onClick,
  topRow = false,
}: MediaCardProps) {
  const type = data?.type || "Book";
  const hasImage = !!data?.imageSrc;
  // Use explicit aspectRatio if provided, otherwise infer from type
  const isSquare = aspectRatio ? aspectRatio === "square" : type === "Music";
  const cardRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Observe when the card scrolls into view
  useEffect(() => {
    if (type !== "Quote") return;

    const element = cardRef.current;
    if (!element) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add delay to let the card's scroll-reveal animation start first
            setTimeout(() => {
              setIsRevealed(true);
            }, 400);
            observer.unobserve(element);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: "0px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [type]);

  // Quote card has a completely different layout
  if (type === "Quote") {
    return (
      <div
        ref={cardRef}
        className={clsx(
          "flex h-full min-h-[260px] md:min-h-[280px] flex-col items-start overflow-hidden rounded-3xl border border-gray-100 bg-white transition-shadow duration-200",
          "shadow-[0px_4px_16px_0px_rgba(209,213,219,0.65)]",
          "md:rounded-3xl",
          className
        )}
      >
        <div className={clsx(
          "flex w-full flex-col gap-4 px-12 pb-12 md:gap-4 md:px-12 md:pb-12",
          topRow ? "pt-14 md:pt-18" : "pt-14 md:pt-14"
        )}>
          {/* Emoji */}
          {data?.emoji && (
            <p className="font-['Figtree'] text-4xl">
              {data.emoji}
            </p>
          )}

          {/* Quote Title */}
          {data?.quoteTitle && (
            <p className="whitespace-pre-wrap font-['Figtree'] -mb-1 text-2xl tracking-[0.01em] font-medium text-gray-700">
              {data.quoteTitle}
            </p>
          )}

          {/* Quote Text & Author */}
          <div className="flex flex-col items-start text-base tracking-[0.005em] md:text-base">
            {data?.quoteText && (
              <p className="font-['Figtree'] font-normal text-gray-500 mb-0.5">
                <QuoteTextWithUnderline
                  text={data.quoteText}
                  underlinedText={data.quoteUnderlinedText}
                  isRevealed={isRevealed}
                />
              </p>
            )}
            {data?.quoteAuthor && (
              <p className="font-['Figtree'] font-normal text-gray-400">
                {data.quoteAuthor}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Get external link URL if available
  const getExternalUrl = (): string | undefined => {
    if (type === "Book" && data?.goodreadsUrl) {
      return data.goodreadsUrl;
    } else if (type === "Music" && data?.spotifyUrl) {
      return data.spotifyUrl;
    } else if (type === "Movie" && data?.letterboxdSlug) {
      return `https://letterboxd.com/liumichelle/film/${data.letterboxdSlug}/`;
    }
    return undefined;
  };

  const externalUrl = getExternalUrl();

  // Image loading state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Reset image loading state when imageSrc changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [data?.imageSrc]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const showShimmer = hasImage && !imageLoaded && !imageError;

  // Shared class names for both anchor and button
  const sharedClasses = clsx(
    "relative overflow-hidden transition-transform hover:scale-[1.01]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2",
    // Aspect ratio: Music/square albums vs portrait books/movies (210:271 from Figma)
    isSquare ? "aspect-square" : "aspect-[210/310]",
    // Border radius based on variant
    variant === "default" && "rounded-xl md:rounded-md",
    variant === "expanded" && "rounded-lg md:rounded-md",
    // Placeholder background when no image
    !hasImage && "bg-gray-300",
    // Cursor style - pointer if has link
    externalUrl ? "cursor-pointer" : "",
    className
  );

  // Card content (shared between anchor and button)
  const cardContent = (
    <>
      {/* Shimmer placeholder while image is loading */}
      {showShimmer && (
        <div className="absolute inset-0 animate-shimmer transition-opacity duration-500 ease-out" />
      )}
      
      {hasImage && (
        <img
          src={data.imageSrc}
          alt={data.title || "Media cover"}
          className={clsx(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </>
  );

  // Use anchor tag for external links (faster navigation, no about:blank delay)
  if (externalUrl) {
    return (
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(sharedClasses, "block")}
        title={data?.title}
        aria-label={data?.title || "Media item"}
      >
        {cardContent}
      </a>
    );
  }

  // Use button for onClick handlers only
  return (
    <button
      onClick={onClick}
      className={sharedClasses}
      title={data?.title}
      aria-label={data?.title || "Media item"}
    >
      {cardContent}
    </button>
  );
}
