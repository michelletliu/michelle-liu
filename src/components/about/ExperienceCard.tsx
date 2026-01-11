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
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full md:h-24 md:w-24">
        {data.logoSrc ? (
          <img
            src={data.logoSrc}
            alt={`${data.company} logo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gray-200" />
        )}
      </div>

      {/* Text content */}
      <div className="flex flex-1 flex-col items-start">
        <p className="whitespace-pre-wrap text-base tracking-[0.005em] text-lg font-medium leading-[1.4] text-gray-700">
          {data.company}
        </p>
        <div className="flex flex-wrap items-baseline gap-1 text-base tracking-[0.005em] font-normal leading-[1.4]">
          <span className="text-gray-500">
            {data.role}
            {data.period && <span className="text-gray-400">,</span>}
          </span>
          {data.period && (
            <span className="text-gray-400 whitespace-nowrap">{data.period}</span>
          )}
        </div>
      </div>
    </div>
  );
}




