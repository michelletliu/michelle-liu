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

export default function StartupCard({ className, data }: StartupCardProps) {
  const content = (
    <div
      className={clsx(
        "flex flex-col items-center gap-2 group md:w-20",
        className
      )}
    >
      <div className="relative size-14 md:size-20 shrink-0 overflow-hidden rounded-full bg-zinc-100">
        {data.logoSrc ? (
          <img
            src={data.logoSrc}
            alt={`${data.name} logo`}
            className="h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-zinc-200" />
        )}
      </div>

      <span className="whitespace-nowrap text-sm md:text-base text-zinc-600 font-medium tracking-[0.005em] text-center transition-colors duration-200 group-hover:text-blue-500">
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
        className="block md:flex-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
      >
        {content}
      </a>
    );
  }

  return content;
}
