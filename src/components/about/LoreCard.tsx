import clsx from "clsx";
import { ArrowUpRight } from "../icons/ArrowUpRight";
import ShimmerImage from "../shared/ShimmerImage";

export type LoreCardData = {
  id: string;
  /** Image source for the card */
  imageSrc?: string;
  /** Background color for the image placeholder (default: zinc-200) */
  imageBackground?: string;
  /** Main headline text */
  headline: string;
  /** Date or secondary text */
  date?: string;
  /** Description text */
  description?: string;
  /** Optional link URL */
  link?: string;
};

type LoreCardProps = {
  className?: string;
  data: LoreCardData;
  onClick?: () => void;
};

/**
 * LoreCard - A card component for displaying stories/experiences
 * with an image, headline, date, and description.
 * Arrow appears on hover anywhere on the card.
 * Designed for Sanity CMS integration.
 */
export default function LoreCard({ className, data, onClick }: LoreCardProps) {
  const hasImage = !!data.imageSrc;
  const bgColor = data.imageBackground;

  const sharedClassName = clsx(
    "group flex w-full flex-col items-start text-left",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2",
    className
  );

  const content = (
    <>
      {/* Image */}
      <div className="relative h-[140px] md:h-[200px] w-full shrink-0 rounded-2xl sm:rounded-3xl">
        {hasImage ? (
          <ShimmerImage
            src={data.imageSrc}
            alt={data.headline}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[0.99]"
            loading="lazy"
            rounded="rounded-2xl sm:rounded-3xl"
            wrapperClassName="absolute inset-0 h-full w-full"
          />
        ) : (
          <div
            className={clsx(
              "h-full w-full transition-transform duration-200 ease-out group-hover:scale-[0.99]",
              !bgColor && "bg-zinc-200"
            )}
            style={bgColor ? { backgroundColor: bgColor } : undefined}
          />
        )}
      </div>

      {/* Caption */}
      <div className="flex w-full flex-col px-1 font-['Michelle',sans-serif] pt-2 max-md:pb-4 text-base tracking-[0.005em] leading-tight">
        {/* Headline row with arrow */}
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col gap-0 max-md:gap-1">
            <span className="text-zinc-600 text-base font-medium leading-normal">
              {data.headline}
              {data.date && <span className="hidden md:inline text-zinc-400 text-base font-normal"> • {data.date}</span>}
            </span>
            {data.date && (
              <span className="md:hidden text-zinc-400 font-normal text-base leading-tight">{data.date}</span>
            )}
          </div>
          {/* Arrow - hidden on mobile, hover on desktop */}
          <span className="hidden text-zinc-700 text-sm opacity-0 transition-opacity duration-200 ease-out md:inline md:group-hover:opacity-100">
            <ArrowUpRight />
          </span>
        </div>
        {/* Description - always visible on mobile, fade up on hover for desktop */}
        {data.description && (
          <p className="whitespace-pre-wrap max-md:pt-1 pt-0.5 font-normal text-sm  sm:text-base tracking-[0.005em] leading-normal max-md:leading-snug text-zinc-400 md:opacity-0 md:translate-y-1 md:transition-all md:duration-300 md:ease-out md:group-hover:opacity-100 md:group-hover:translate-y-0">{data.description}</p>
        )}
      </div>
    </>
  );

  // Use anchor tag for external links to avoid about:blank flash
  if (data.link) {
    return (
      <a
        href={data.link}
        target="_blank"
        rel="noopener noreferrer"
        className={sharedClassName}
      >
        {content}
      </a>
    );
  }

  // Fallback to button for onClick handlers
  return (
    <button
      onClick={onClick}
      className={sharedClassName}
    >
      {content}
    </button>
  );
}
