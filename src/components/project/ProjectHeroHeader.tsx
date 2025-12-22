import React from "react";
import clsx from "clsx";

type MetadataItem = {
  label: string;
  value: string | string[];
};

type ProjectHeroHeaderProps = {
  device?: "Default" | "Mobile";
  /** Company/project logo URL */
  logoSrc: string;
  /** Project title */
  title: string;
  /** Metadata fields (Timeline, Org, Role, With, Location, etc.) */
  metadata: MetadataItem[];
  /** Hero image URL */
  heroImageSrc: string;
};

// Horizontal line separator
function Line({ className }: { className?: string }) {
  return (
    <div className={clsx("relative", className)}>
      <div className="absolute bg-[#e5e7eb] inset-0" />
    </div>
  );
}

export default function ProjectHeroHeader({
  device = "Default",
  logoSrc,
  title,
  metadata,
  heroImageSrc,
}: ProjectHeroHeaderProps) {
  const isDesktop = device === "Default";
  const isMobile = device === "Mobile";

  return (
    <div
      className={clsx(
        "content-stretch flex flex-col gap-8 items-start justify-center py-16 relative",
        isDesktop && "px-[175px] w-[1440px]",
        isMobile && "px-8 w-[640px]"
      )}
    >
      {/* Logo */}
      <div className="relative shrink-0 size-20">
        <img
          className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
          alt=""
          src={logoSrc}
        />
      </div>

      {/* Title and Metadata */}
      <div
        className={clsx(
          "content-stretch flex flex-col gap-10 items-start relative shrink-0",
          isMobile && "w-full"
        )}
      >
        {/* Title */}
        <p className="font-normal leading-5 relative shrink-0 text-4xl text-black">
          {title}
        </p>

        {/* Metadata Grid */}
        <div
          className={clsx(
            "relative shrink-0",
            isDesktop && "content-stretch flex gap-5 items-start w-[1090px]",
            isMobile && "gap-4 grid grid-cols-2 grid-rows-[repeat(3,_fit-content(100%))] w-full"
          )}
        >
          {metadata.map((item, index) => (
            <div
              key={item.label}
              className={clsx(
                "content-stretch flex flex-col gap-3 items-start leading-5 relative shrink-0 text-base",
                isDesktop && "w-[202px]",
                isMobile && index % 2 === 0 && "col-[1] self-start",
                isMobile && index % 2 === 1 && "col-[2] self-start",
                isMobile && index < 2 && "row-[1]",
                isMobile && index >= 2 && index < 4 && "row-[2]",
                isMobile && index >= 4 && "row-[3]",
                "whitespace-pre-wrap"
              )}
            >
              <p className="font-semibold relative shrink-0 text-[#9ca3af]">
                {item.label}
              </p>
              <p className="font-normal relative shrink-0 text-black">
                {Array.isArray(item.value) ? (
                  item.value.map((v, i) => (
                    <React.Fragment key={i}>
                      {v}
                      {i < item.value.length - 1 && <br />}
                    </React.Fragment>
                  ))
                ) : (
                  item.value
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Separator Line */}
      <Line className="h-px shrink-0 w-full" />

      {/* Hero Image */}
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full">
        <div
          className={clsx(
            "relative rounded-[26px] shrink-0",
            isDesktop && "h-[591px] w-[1090px]",
            isMobile && "aspect-[678/367.625] w-full"
          )}
        >
          <img
            className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[26px] size-full"
            alt=""
            src={heroImageSrc}
          />
        </div>
      </div>
    </div>
  );
}
