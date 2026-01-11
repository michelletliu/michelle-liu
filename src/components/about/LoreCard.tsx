import clsx from "clsx";
import { ArrowUpRight } from "../ArrowUpRight";

export type LoreCardData = {
  id: string;
  /** Image source for the card */
  imageSrc?: string;
  /** Background color for the image placeholder (default: light purple) */
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
  const bgColor = data.imageBackground || "#e3dff4";

  const handleClick = () => {
    if (data.link) {
      window.open(data.link, "_blank", "noopener,noreferrer");
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={clsx(
        "group flex w-full flex-col items-start text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2",
        className
      )}
    >
      {/* Image */}
      <div className="relative h-[140px] md:h-[200px] w-full shrink-0 rounded-2xl sm:rounded-3xl">
        {hasImage ? (
          <img
            src={data.imageSrc}
            alt={data.headline}
            className="absolute inset-0 h-full w-full rounded-2xl sm:rounded-3xl object-cover transition-transform duration-200 ease-out group-hover:scale-[1.01]"
            loading="lazy"
          />
        ) : (
          <div
            className="h-full w-full transition-transform duration-200 ease-out group-hover:scale-[1.01]"
            style={{ backgroundColor: bgColor }}
          />
        )}
      </div>

      {/* Caption */}
      <div className="flex w-full flex-col px-1 font-['Figtree',sans-serif] pt-2 text-base tracking-[0.005em]">
        {/* Headline row with arrow */}
        <div className="flex w-full items-start justify-between">
          <div className="flex flex-col md:flex-row md:gap-1 md:items-center md:flex-wrap">
            <span className="text-gray-600 text-base font-medium md:text-lg">{data.headline}</span>
            {data.date && (
              <>
                <span className="hidden md:inline text-gray-400 text-base font-normal"> • {data.date}</span>
                <span className="md:hidden text-gray-400 font-normal text-sm">{data.date}</span>
              </>
            )}
          </div>
          {/* Arrow - always visible on mobile, hover on desktop */}
          <span className="text-gray-700 text-sm opacity-100 md:opacity-0 transition-opacity duration-200 ease-out md:group-hover:opacity-100">
            <ArrowUpRight />
          </span>
        </div>
        {/* Description - always visible on mobile, fade up on hover for desktop */}
        {data.description && (
          <p className="whitespace-pre-wrap font-normal text-sm sm:text-base tracking-[0.005em] leading-tight text-gray-400 md:opacity-0 md:translate-y-1 md:transition-all md:duration-300 md:ease-out md:group-hover:opacity-100 md:group-hover:translate-y-0">{data.description}</p>
        )}
      </div>
    </button>
  );
}


