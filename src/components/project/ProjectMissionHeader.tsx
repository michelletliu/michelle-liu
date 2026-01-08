import React from "react";
import clsx from "clsx";

type ProjectMissionHeaderProps = {
  type?: "Mission" | "Overview" | "Overview Centered";
  device?: "Default" | "Mobile";
  /** The label text (e.g., "The Mission") */
  label?: string;
  /** The main title text */
  title: string;
  /** The description paragraphs for Overview type */
  description?: string[];
  /** Image URL for centered layout (activates Overview Centered type when provided) */
  imageUrl?: string;
  /** Alt text for the image */
  imageAlt?: string;
  /** Optional italic note displayed at the bottom */
  note?: string;
};

export default function ProjectMissionHeader({
  type = "Mission",
  device = "Default",
  label = "The Mission",
  title,
  description = [],
  imageUrl,
  imageAlt = "",
  note,
}: ProjectMissionHeaderProps) {
  const isDesktop = device === "Default";
  const isMobile = device === "Mobile";
  
  // Auto-detect centered layout when image is provided
  const effectiveType = imageUrl ? "Overview Centered" : type;
  
  const isMission = effectiveType === "Mission";
  const isOverview = effectiveType === "Overview";
  const isOverviewCentered = effectiveType === "Overview Centered";
  const hasDescription = description.length > 0;

  // When Overview type has no description, render like Mission type (full-width title)
  const useFullWidthLayout = isMission || (isOverview && !hasDescription);

  // Centered layout
  if (isOverviewCentered) {
    return (
      <div
        className={clsx(
          "flex flex-col items-center py-16 relative",
          isDesktop && "px-[175px] w-[1400px]",
          isMobile && "px-8 w-[640px]"
        )}
      >
        {/* Label + Title */}
        <div
          className={clsx(
            "flex flex-col gap-5 items-center text-center",
            isDesktop && "w-[410px]",
            isMobile && "w-full"
          )}
        >
          <p className="leading-5 text-[#9ca3af] text-base">
            {label}
          </p>
          <p className="leading-7 text-2xl text-black whitespace-pre-wrap text-pretty">
            {title}
          </p>
        </div>

        {/* Image */}
        {imageUrl && (
          <div
            className={clsx(
              "relative mt-8",
              isDesktop && "w-[410px]",
              isMobile && "w-full"
            )}
          >
            <img
              src={imageUrl}
              alt={imageAlt}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Description */}
        {hasDescription && (
          <div
            className={clsx(
              "flex flex-col gap-8 mt-8 px-8",
              isDesktop && "w-[410px]",
              isMobile && "w-full px-0"
            )}
          >
            <div className="text-[#4b5563] text-base whitespace-pre-wrap">
              {description.map((paragraph, index) => (
                <p key={index} className={index < description.length - 1 ? "mb-4" : ""}>
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Italic Note */}
            {note && (
              <p className="text-[#9ca3af] text-base italic">
                {note}
              </p>
            )}
          </div>
        )}

        {/* Italic Note (when no description) */}
        {!hasDescription && note && (
          <p className={clsx(
            "text-[#9ca3af] text-base italic mt-8 px-8",
            isDesktop && "w-[410px]",
            isMobile && "w-full px-0"
          )}>
            {note}
          </p>
        )}
      </div>
    );
  }

  // Original layout (Mission / Overview)
  return (
    <div
      className={clsx(
        "content-stretch items-start py-16 relative",
        isDesktop && "px-[175px] w-[1400px]",
        isMobile && "px-8 w-[640px]",
        // Use flex column layout for Mission or Overview without description
        useFullWidthLayout && "flex flex-col gap-5 justify-center",
        // Only use grid when Overview has description
        isOverview && hasDescription && isDesktop && "grid grid-cols-[2fr_1fr_2fr]",
        isOverview && hasDescription && isMobile && "flex flex-col gap-8"
      )}
    >
      {/* Left Column: Label + Title */}
      <div
        className={clsx(
          "content-stretch flex flex-col items-start relative",
          // When no description, constrain title width to 646px (per Figma)
          useFullWidthLayout && isDesktop && "w-[646px]",
          useFullWidthLayout && "shrink-0",
          isOverview && hasDescription && isDesktop && "col-start-1",
          isMobile && "w-full"
        )}
      >
        <p className="relative shrink-0 text-[#9ca3af] text-base">
          {label}
        </p>
        <p className=" min-w-full leading-normal relative shrink-0 text-2xl text-black whitespace-pre-wrap text-pretty">
          {title}
        </p>
      </div>

      {/* Right Column: Description (Overview only, when description exists) */}
      {isOverview && hasDescription && (
        <div
          className={clsx(
            "leading-5 relative text-[#4b5563] text-base whitespace-pre-wrap",
            isDesktop && "col-start-3",
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



