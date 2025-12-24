import clsx from "clsx";

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
        "group flex w-full flex-col items-start gap-2 text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2",
        className
      )}
    >
      {/* Image */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-xl transition-transform group-hover:scale-[1.005] md:h-52">
        {hasImage ? (
          <img
            src={data.imageSrc}
            alt={data.headline}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="h-full w-full rounded-xl"
            style={{ backgroundColor: bgColor }}
          />
        )}
      </div>

      {/* Caption */}
      <div className="flex w-full flex-col px-1 text-base font-normal pt-1">
        <p>
          <span className="text-gray-800 text-[1.115rem] leading-0 font-medium">{data.headline}</span>
          {data.date && <span className="pl-1 text-[1.115rem] font-medium text-gray-400"> {data.date}</span>}
        </p>
        {data.description && (
          <p className="whitespace-pre-wrap pt-1 text-gray-400">{data.description}</p>
        )}
      </div>
    </button>
  );
}


