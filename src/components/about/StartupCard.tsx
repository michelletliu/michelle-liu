import clsx from "clsx";

export type StartupCardData = {
  id: string;
  /** Startup logo */
  logoSrc?: string;
  /** Startup name */
  name: string;
  /** Optional link URL */
  link?: string;
};

type StartupCardProps = {
  className?: string;
  data: StartupCardData;
};

/**
 * StartupCard - A compact card for displaying startup logos with names.
 * Shows a circular logo with the startup name below.
 * Designed for Sanity CMS integration.
 */
export default function StartupCard({ className, data }: StartupCardProps) {
  const content = (
    <div
      className={clsx(
        "flex flex-col items-center gap-2 group",
        className
      )}
    >
      {/* Logo */}
      <div className="relative h-14 w-14 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {data.logoSrc ? (
          <img
            src={data.logoSrc}
            alt={`${data.name} logo`}
            className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-gray-200" />
        )}
      </div>

      {/* Name */}
      <span className="text-sm md:text-base text-gray-600 font-medium tracking-[0.005em] text-center">
        {data.name}
      </span>
    </div>
  );

  if (data.link) {
    return (
      <a
        href={data.link}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
      >
        {content}
      </a>
    );
  }

  return content;
}
