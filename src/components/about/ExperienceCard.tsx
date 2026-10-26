import clsx from "clsx";

export type ExperienceCardData = {
  id: string;
  /** Company/organization logo */
  logoSrc?: string;
  /** Company/organization name */
  company: string;
  /** Role/position title */
  role: string;
  /** Time period (e.g., "2024-Present") */
  period?: string;
  /** Optional secondary subtitle (e.g., client list) */
  subtitle?: string;
};

type ExperienceCardProps = {
  className?: string;
  data: ExperienceCardData;
};

/**
 * ExperienceCard - Displays work experience with logo, company, role, and dates.
 * Designed for Sanity CMS integration.
 */
export default function ExperienceCard({ className, data }: ExperienceCardProps) {
  return (
    <div
      className={clsx(
        "flex items-center gap-5 w-full",
        className
      )}
    >
      {/* Logo */}
      <div className="relative size-14 shrink-0 overflow-hidden rounded-full md:size-20">
        {data.logoSrc ? (
          <img
            src={data.logoSrc}
            alt={`${data.company} logo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-zinc-100" />
        )}
      </div>

      {/* Company + subtitle */}
      <div className="flex flex-1 flex-col items-start min-w-0">
        <p className="whitespace-pre-wrap tracking-[0.005em] text-base md:text-lg font-medium leading-snug text-zinc-700">
          {data.company}
        </p>
        {data.subtitle && (
          <p className="text-sm md:text-base tracking-[0.005em] font-normal leading-snug text-zinc-400">
            {data.subtitle}
          </p>
        )}
      </div>

      {/* Period */}
      {data.period && (
        <span className="shrink-0 text-sm md:text-base tracking-[0.005em] font-normal text-zinc-400 whitespace-nowrap">
          {data.period}
        </span>
      )}
    </div>
  );
}




