import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

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
          "flex flex-col items-start overflow-hidden rounded-3xl border border-gray-100 bg-white transition-shadow duration-200",
          "shadow-[0px_4px_16px_0px_rgba(209,213,219,0.65)] hover:shadow-[0px_4px_16px_0px_rgba(209,213,219,0.9)]",
          "md:rounded-3xl",
          className
        )}
      >
        <div className="flex h-64 w-full items-start flex-col gap-4 overflow-hidden px-12 py-12 md:h-76 md:gap-4 md:px-12 md:py-16">
          {/* Emoji */}
          {data?.emoji && (
            <p className="font-['Figtree'] text-4xl font-bold md:text-5xl">
              {data.emoji}
            </p>
          )}

          {/* Quote Title */}
          {data?.quoteTitle && (
            <p className="whitespace-pre-wrap font-['Figtree'] -mb-1 text-lg font-semibold text-gray-700 md:text-xl">
              {data.quoteTitle}
            </p>
          )}

          {/* Quote Text & Author */}
          <div className="flex flex-col items-start text-sm md:text-base">
            {data?.quoteText && (
              <p className="font-['Figtree'] font-normal text-gray-600 mb-0.5">
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

  // Book and Music cards share similar structure
  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative overflow-hidden transition-transform hover:scale-[1.01]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2",
        // Aspect ratio: Music/square albums vs portrait books/movies (210:271 from Figma)
        isSquare ? "aspect-square" : "aspect-[210/310]",
        // Border radius based on variant
        variant === "default" && "rounded-xl md:rounded-[md",
        variant === "expanded" && "rounded-lg md:rounded-md",
        // Placeholder background when no image
        !hasImage && "bg-gray-300",
        className
      )}
      title={data?.title}
      aria-label={data?.title || "Media item"}
    >
      {hasImage && (
        <img
          src={data.imageSrc}
          alt={data.title || "Media cover"}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      )}
    </button>
  );
}
