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
  /** Instagram URL for the community/organization */
  instagramUrl?: string;
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
        "flex w-full flex-col gap-12 py-2",
        className
      )}
    >
      {/* Mobile: Logo, Title, Description stacked */}
      <div className="flex w-full shrink-0 flex-col gap-6 lg:hidden">
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
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-medium text-gray-900">{data.title}</h3>
            {data.instagramUrl && (
              <a
                href={data.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-6 w-6 items-center justify-center text-gray-500 transition-colors hover:text-gray-700"
                aria-label={`${data.title} Instagram`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 1.80078C12.6719 1.80078 12.9883 1.8125 14.0391 1.85937C15.0156 1.90234 15.543 2.06641 15.8945 2.20313C16.3594 2.38281 16.6953 2.60156 17.043 2.94922C17.3945 3.30078 17.6094 3.63281 17.7891 4.09766C17.9258 4.44922 18.0898 4.98047 18.1328 5.95313C18.1797 7.00781 18.1914 7.32422 18.1914 9.99219C18.1914 12.6641 18.1797 12.9805 18.1328 14.0313C18.0898 15.0078 17.9258 15.5352 17.7891 15.8867C17.6094 16.3516 17.3906 16.6875 17.043 17.0352C16.6914 17.3867 16.3594 17.6016 15.8945 17.7813C15.543 17.918 15.0117 18.082 14.0391 18.125C12.9844 18.1719 12.668 18.1836 10 18.1836C7.32813 18.1836 7.01172 18.1719 5.96094 18.125C4.98438 18.082 4.45703 17.918 4.10547 17.7813C3.64063 17.6016 3.30469 17.3828 2.95703 17.0352C2.60547 16.6836 2.39063 16.3516 2.21094 15.8867C2.07422 15.5352 1.91016 15.0039 1.86719 14.0313C1.82031 12.9766 1.80859 12.6602 1.80859 9.99219C1.80859 7.32031 1.82031 7.00391 1.86719 5.95313C1.91016 4.97656 2.07422 4.44922 2.21094 4.09766C2.39063 3.63281 2.60938 3.29687 2.95703 2.94922C3.30859 2.59766 3.64063 2.38281 4.10547 2.20313C4.45703 2.06641 4.98828 1.90234 5.96094 1.85937C7.01172 1.8125 7.32813 1.80078 10 1.80078ZM10 0C7.28516 0 6.94531 0.0117188 5.87891 0.0585938C4.81641 0.105469 4.08594 0.277344 3.45313 0.523437C2.79297 0.78125 2.23438 1.12109 1.67969 1.67969C1.12109 2.23438 0.78125 2.79297 0.523438 3.44922C0.277344 4.08594 0.105469 4.8125 0.0585938 5.875C0.0117188 6.94531 0 7.28516 0 10C0 12.7148 0.0117188 13.0547 0.0585938 14.1211C0.105469 15.1836 0.277344 15.9141 0.523438 16.5469C0.78125 17.207 1.12109 17.7656 1.67969 18.3203C2.23438 18.875 2.79297 19.2188 3.44922 19.4727C4.08594 19.7188 4.8125 19.8906 5.875 19.9375C6.94141 19.9844 7.28125 19.9961 9.99609 19.9961C12.7109 19.9961 13.0508 19.9844 14.1172 19.9375C15.1797 19.8906 15.9102 19.7188 16.543 19.4727C17.1992 19.2188 17.7578 18.875 18.3125 18.3203C18.8672 17.7656 19.2109 17.207 19.4648 16.5508C19.7109 15.9141 19.8828 15.1875 19.9297 14.125C19.9766 13.0586 19.9883 12.7188 19.9883 10.0039C19.9883 7.28906 19.9766 6.94922 19.9297 5.88281C19.8828 4.82031 19.7109 4.08984 19.4648 3.45703C19.2188 2.79297 18.8789 2.23438 18.3203 1.67969C17.7656 1.125 17.207 0.78125 16.5508 0.527344C15.9141 0.28125 15.1875 0.109375 14.125 0.0625C13.0547 0.0117188 12.7148 0 10 0Z"
                    fill="currentColor"
                  />
                  <path
                    d="M10 4.86328C7.16406 4.86328 4.86328 7.16406 4.86328 10C4.86328 12.8359 7.16406 15.1367 10 15.1367C12.8359 15.1367 15.1367 12.8359 15.1367 10C15.1367 7.16406 12.8359 4.86328 10 4.86328ZM10 13.332C8.16016 13.332 6.66797 11.8398 6.66797 10C6.66797 8.16016 8.16016 6.66797 10 6.66797C11.8398 6.66797 13.332 8.16016 13.332 10C13.332 11.8398 11.8398 13.332 10 13.332Z"
                    fill="currentColor"
                  />
                  <path
                    d="M16.5391 4.66016C16.5391 5.32422 16 5.85938 15.3398 5.85938C14.6758 5.85938 14.1406 5.32031 14.1406 4.66016C14.1406 3.99609 14.6797 3.46094 15.3398 3.46094C16 3.46094 16.5391 4 16.5391 4.66016Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
            )}
          </div>
          {data.description && (
            <p className="text-sm text-gray-400">
              {data.description}
            </p>
          )}
        </div>
      </div>

      {/* Desktop: Logo + Title on left, Description on right - single row */}
      <div className="hidden w-full items-start py-8 justify-between lg:flex">
        {/* Logo + Title + Instagram */}
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
          <h3 className="text-2xl font-medium leading-[1.4] text-gray-700">{data.title}</h3>
          {data.instagramUrl && (
            <a
              href={data.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-6 w-6 items-center justify-center text-gray-400 transition-colors hover:text-gray-500"
              aria-label={`${data.title} Instagram`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 1.80078C12.6719 1.80078 12.9883 1.8125 14.0391 1.85937C15.0156 1.90234 15.543 2.06641 15.8945 2.20313C16.3594 2.38281 16.6953 2.60156 17.043 2.94922C17.3945 3.30078 17.6094 3.63281 17.7891 4.09766C17.9258 4.44922 18.0898 4.98047 18.1328 5.95313C18.1797 7.00781 18.1914 7.32422 18.1914 9.99219C18.1914 12.6641 18.1797 12.9805 18.1328 14.0313C18.0898 15.0078 17.9258 15.5352 17.7891 15.8867C17.6094 16.3516 17.3906 16.6875 17.043 17.0352C16.6914 17.3867 16.3594 17.6016 15.8945 17.7813C15.543 17.918 15.0117 18.082 14.0391 18.125C12.9844 18.1719 12.668 18.1836 10 18.1836C7.32813 18.1836 7.01172 18.1719 5.96094 18.125C4.98438 18.082 4.45703 17.918 4.10547 17.7813C3.64063 17.6016 3.30469 17.3828 2.95703 17.0352C2.60547 16.6836 2.39063 16.3516 2.21094 15.8867C2.07422 15.5352 1.91016 15.0039 1.86719 14.0313C1.82031 12.9766 1.80859 12.6602 1.80859 9.99219C1.80859 7.32031 1.82031 7.00391 1.86719 5.95313C1.91016 4.97656 2.07422 4.44922 2.21094 4.09766C2.39063 3.63281 2.60938 3.29687 2.95703 2.94922C3.30859 2.59766 3.64063 2.38281 4.10547 2.20313C4.45703 2.06641 4.98828 1.90234 5.96094 1.85937C7.01172 1.8125 7.32813 1.80078 10 1.80078ZM10 0C7.28516 0 6.94531 0.0117188 5.87891 0.0585938C4.81641 0.105469 4.08594 0.277344 3.45313 0.523437C2.79297 0.78125 2.23438 1.12109 1.67969 1.67969C1.12109 2.23438 0.78125 2.79297 0.523438 3.44922C0.277344 4.08594 0.105469 4.8125 0.0585938 5.875C0.0117188 6.94531 0 7.28516 0 10C0 12.7148 0.0117188 13.0547 0.0585938 14.1211C0.105469 15.1836 0.277344 15.9141 0.523438 16.5469C0.78125 17.207 1.12109 17.7656 1.67969 18.3203C2.23438 18.875 2.79297 19.2188 3.44922 19.4727C4.08594 19.7188 4.8125 19.8906 5.875 19.9375C6.94141 19.9844 7.28125 19.9961 9.99609 19.9961C12.7109 19.9961 13.0508 19.9844 14.1172 19.9375C15.1797 19.8906 15.9102 19.7188 16.543 19.4727C17.1992 19.2188 17.7578 18.875 18.3125 18.3203C18.8672 17.7656 19.2109 17.207 19.4648 16.5508C19.7109 15.9141 19.8828 15.1875 19.9297 14.125C19.9766 13.0586 19.9883 12.7188 19.9883 10.0039C19.9883 7.28906 19.9766 6.94922 19.9297 5.88281C19.8828 4.82031 19.7109 4.08984 19.4648 3.45703C19.2188 2.79297 18.8789 2.23438 18.3203 1.67969C17.7656 1.125 17.207 0.78125 16.5508 0.527344C15.9141 0.28125 15.1875 0.109375 14.125 0.0625C13.0547 0.0117188 12.7148 0 10 0Z"
                  fill="currentColor"
                />
                <path
                  d="M10 4.86328C7.16406 4.86328 4.86328 7.16406 4.86328 10C4.86328 12.8359 7.16406 15.1367 10 15.1367C12.8359 15.1367 15.1367 12.8359 15.1367 10C15.1367 7.16406 12.8359 4.86328 10 4.86328ZM10 13.332C8.16016 13.332 6.66797 11.8398 6.66797 10C6.66797 8.16016 8.16016 6.66797 10 6.66797C11.8398 6.66797 13.332 8.16016 13.332 10C13.332 11.8398 11.8398 13.332 10 13.332Z"
                  fill="currentColor"
                />
                <path
                  d="M16.5391 4.66016C16.5391 5.32422 16 5.85938 15.3398 5.85938C14.6758 5.85938 14.1406 5.32031 14.1406 4.66016C14.1406 3.99609 14.6797 3.46094 15.3398 3.46094C16 3.46094 16.5391 4 16.5391 4.66016Z"
                  fill="currentColor"
                />
              </svg>
            </a>
          )}
        </div>
        
        {/* Description on the right */}
        {data.description && (
          <p className="w-100 mr-12 shrink-0 whitespace-pre-wrap text-base font-normal leading-[1.4] text-gray-400">
            {data.description}
          </p>
        )}
      </div>

      {/* Photo Collage - full width below header */}
      {photos.length > 0 && (
        <div className="relative w-full shrink-0 overflow-visible px-4 lg:h-[400px]">
          {/* Mobile: vertical stacked layout */}
          <div className="flex w-full flex-col items-center gap-10 lg:hidden">
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
          <div className="hidden h-full w-full items-start justify-center lg:flex">
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

