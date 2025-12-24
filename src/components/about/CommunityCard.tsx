import clsx from "clsx";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export type CommunityPhoto = {
  id: string;
  /** Image source */
  imageSrc: string;
  /** Caption text displayed below the photo */
  caption?: string;
  /** Rotation angle in degrees (positive = clockwise) */
  rotation?: number;
  /** Image orientation - horizontal (landscape) or vertical (portrait) */
  orientation?: "horizontal" | "vertical";
  /** Y offset value (e.g., "-8", "0", "12") */
  yOffset?: string;
  /** X offset value (e.g., "-8", "0", "12") */
  xOffset?: string;
};

export type CommunityCardData = {
  id: string;
  /** Logo/icon image source */
  logoSrc?: string;
  /** Title of the community/organization */
  title: string;
  /** Short name for the sidebar navigation */
  sidebarName?: string;
  /** Description text */
  description?: string;
  /** Array of photos for the collage */
  photos?: CommunityPhoto[];
};

type CommunityCardProps = {
  className?: string;
  data: CommunityCardData;
};

/**
 * CommunityCard - A card showcasing community involvement with
 * a logo, title, description, and scattered photo collage.
 * Designed for Sanity CMS integration.
 */
export default function CommunityCard({ className, data }: CommunityCardProps) {
  const photos = data.photos || [];
  const [expandedPhotoId, setExpandedPhotoId] = useState<string | null>(null);

  // Default rotations for photos if not specified
  const defaultRotations = [11, -2, -11, -9];

  // Find the expanded photo data
  const expandedPhoto = expandedPhotoId
    ? photos.find((p) => p.id === expandedPhotoId)
    : null;

  // Handle escape key to close expanded view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && expandedPhotoId) {
        setExpandedPhotoId(null);
      }
    };

    if (expandedPhotoId) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [expandedPhotoId]);

  return (
    <div
      className={clsx(
        "flex w-full flex-col gap-8",
        className
      )}
    >
      {/* Mobile: Logo, Title, Description stacked */}
      <div className="flex w-full shrink-0 flex-col gap-6 md:hidden">
        {/* Logo */}
        {data.logoSrc && (
          <div className="relative h-16 w-16 shrink-0">
            <img
              src={data.logoSrc}
              alt={`${data.title} logo`}
              className="h-full w-full object-contain"
            />
          </div>
        )}

        {/* Text content */}
        <div className="flex w-full max-w-xs flex-col gap-4 whitespace-pre-wrap font-normal leading-[1.2]">
          <h3 className="text-xl font-medium text-gray-900">{data.title}</h3>
          {data.description && (
            <p className="text-sm text-gray-400">
              {data.description}
            </p>
          )}
        </div>
      </div>

      {/* Desktop: Logo + Title on left, Description on right - single row */}
      <div className="hidden w-full items-start pb-8 justify-between md:flex">
        {/* Logo + Title */}
        <div className="flex shrink-0 items-center gap-8">
          {data.logoSrc && (
            <div className="relative h-[90px] w-[90px] shrink-0">
              <img
                src={data.logoSrc}
                alt={`${data.title} logo`}
                className="h-full w-full object-contain"
              />
            </div>
          )}
          <h3 className="text-2xl font-medium leading-[1.4] text-gray-900">{data.title}</h3>
        </div>
        
        {/* Description on the right */}
        {data.description && (
          <p className="w-[440px] shrink-0 whitespace-pre-wrap text-base font-normal leading-[1.4] text-gray-400">
            {data.description}
          </p>
        )}
      </div>

      {/* Photo Collage - full width below header */}
      {photos.length > 0 && (
        <div className="relative w-full shrink-0 overflow-visible px-4 md:h-[400px]">
          {/* Mobile: vertical stacked layout */}
          <div className="flex w-full flex-col items-center gap-10 md:hidden">
            {photos.slice(0, 4).map((photo, index) => {
              const rotation = photo.rotation ?? defaultRotations[index] ?? 0;
              const isVertical = photo.orientation === "vertical";

              return (
                <div
                  key={photo.id}
                  className="relative cursor-pointer"
                  onClick={() => setExpandedPhotoId(photo.id)}
                >
                  <div
                    className="relative flex flex-col gap-1"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    <div className="relative transition-transform duration-200 hover:scale-[1.01]">
                      <div className="absolute -inset-2 rounded-sm border border-gray-100 bg-white shadow-[0px_4px_8px_0px_rgba(0,0,0,0.15)]" />
                      <div
                        className={clsx(
                          "relative overflow-hidden rounded-sm",
                          isVertical ? "h-52 w-44" : "h-44 w-52"
                        )}
                      >
                        <img
                          src={photo.imageSrc}
                          alt={photo.caption || "Community photo"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    {photo.caption && (
                      <p
                        className={clsx(
                          "mt-3 font-['DM_Sans'] text-sm font-normal text-gray-500",
                          isVertical ? "w-44" : "w-52"
                        )}
                        style={{ fontVariationSettings: "'opsz' 9" }}
                      >
                        {photo.caption}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: flexbox centered layout - scaled up */}
          <div className="hidden h-full w-full items-start justify-center md:flex">
            {photos.slice(0, 4).map((photo, index) => {
              const rotation = photo.rotation ?? defaultRotations[index] ?? 0;
              const isVertical = photo.orientation === "vertical";
              const yOffsetValue = parseInt(photo.yOffset || "0", 10) * 4; // Convert to pixels (Tailwind scale: 1 = 4px)
              const xOffsetValue = parseInt(photo.xOffset || "0", 10) * 4;

              // Negative margins to create overlap effect
              const marginClasses = [
                "",
                "-ml-2",
                "-ml-2",
                "-ml-2",
              ];

              return (
                <div
                  key={photo.id}
                  className={clsx(
                    "cursor-pointer",
                    marginClasses[index]
                  )}
                  style={{ transform: `translate(${xOffsetValue}px, ${yOffsetValue}px)` }}
                  onClick={() => setExpandedPhotoId(photo.id)}
                >
                  <div
                    className="relative flex flex-col gap-1"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    <div className="relative transition-transform duration-200 hover:scale-[1.01]">
                      <div className="absolute -inset-2 rounded-sm border border-gray-100 bg-white shadow-[0px_4px_8px_0px_rgba(0,0,0,0.15)]" />
                      <div
                        className={clsx(
                          "relative overflow-hidden rounded-sm",
                          isVertical ? "h-72 w-60" : "h-60 w-72"
                        )}
                      >
                        <img
                          src={photo.imageSrc}
                          alt={photo.caption || "Community photo"}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    {photo.caption && (
                      <p
                        className={clsx(
                          "mt-2 font-['DM_Sans'] text-sm font-normal leading-tight text-gray-500",
                          isVertical ? "w-60" : "w-72"
                        )}
                        style={{ fontVariationSettings: "'opsz' 9" }}
                      >
                        {photo.caption}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expanded Photo Modal - renders via portal to cover entire page */}
      {expandedPhoto &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-[fadeIn_200ms_ease-out]"
            onClick={() => setExpandedPhotoId(null)}
          >
            {/* Light grey translucent overlay */}
            <div className="absolute inset-0 bg-gray-100/95" />

            {/* Close button - fixed to top right of screen */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedPhotoId(null);
              }}
              className="fixed right-4 top-4 z-[10000] flex h-10 w-10 items-center justify-center transition-all duration-200 hover:scale-110 animate-[fadeSlideDown_300ms_ease-out]"
              aria-label="Close expanded photo"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1L13 13M1 13L13 1"
                  stroke="#374151"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Expanded photo container */}
            <div
              className="relative z-10 flex max-h-[85vh] max-w-[90vw] flex-col items-center animate-[scaleIn_300ms_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Photo card - polaroid style */}
              <div className="relative flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="absolute -inset-3 rounded-sm border border-gray-100 bg-white shadow-[0px_8px_24px_0px_rgba(0,0,0,0.15)]" />
                  <div
                    className={clsx(
                      "relative overflow-hidden rounded-sm",
                      expandedPhoto.orientation === "vertical"
                        ? "h-[65vh] max-h-[500px] w-auto"
                        : "h-auto max-h-[55vh] w-[80vw] max-w-[600px]"
                    )}
                  >
                    <img
                      src={expandedPhoto.imageSrc}
                      alt={expandedPhoto.caption || "Community photo"}
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
                {expandedPhoto.caption && (
                  <p
                    className="mt-6 max-w-[600px] text-center font-['DM_Sans'] text-base font-normal leading-relaxed text-gray-600 animate-[fadeSlideUp_300ms_ease-out_100ms_both]"
                    style={{ fontVariationSettings: "'opsz' 9" }}
                  >
                    {expandedPhoto.caption}
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

