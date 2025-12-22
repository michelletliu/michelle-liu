import React from "react";
import clsx from "clsx";

type ProjectMissionHeaderProps = {
  type?: "Mission" | "Overview";
  device?: "Default" | "Mobile";
  /** The label text (e.g., "The Mission") */
  label?: string;
  /** The main title text */
  title: string;
  /** The description paragraphs for Overview type */
  description?: string[];
};

export default function ProjectMissionHeader({
  type = "Mission",
  device = "Default",
  label = "The Mission",
  title,
  description = [],
}: ProjectMissionHeaderProps) {
  const isDesktop = device === "Default";
  const isMobile = device === "Mobile";
  const isMission = type === "Mission";
  const isOverview = type === "Overview";

  return (
    <div
      className={clsx(
        "content-stretch flex items-start py-16 relative",
        isDesktop && "px-[175px] w-[1400px]",
        isMobile && "px-8 w-[640px]",
        isMission && "flex-col gap-5 justify-center",
        isOverview && isDesktop && "justify-between",
        isOverview && isMobile && "flex-col gap-8"
      )}
    >
      {/* Left Column: Label + Title */}
      <div
        className={clsx(
          "content-stretch flex flex-col gap-5 items-start relative shrink-0",
          isDesktop && "w-[424px]",
          isMobile && "w-full"
        )}
      >
        <p className="leading-5 relative shrink-0 text-[#9ca3af] text-base">
          {label}
        </p>
        <p className="leading-7 min-w-full relative shrink-0 text-2xl text-black whitespace-pre-wrap">
          {title}
        </p>
      </div>

      {/* Right Column: Description (Overview only) */}
      {isOverview && description.length > 0 && (
        <div
          className={clsx(
            "leading-5 relative shrink-0 text-[#4b5563] text-base whitespace-pre-wrap",
            isDesktop && "w-[424px]",
            isMobile && "w-full"
          )}
        >
          {description.map((paragraph, index) => (
            <p key={index} className={index < description.length - 1 ? "mb-4" : ""}>
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
