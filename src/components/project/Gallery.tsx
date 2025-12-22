import React from "react";
import clsx from "clsx";

type GalleryImage = {
  src: string;
  alt?: string;
};

type GalleryProps = {
  device?: "Default" | "Mobile";
  /** Array of images to display in the gallery */
  images: GalleryImage[];
};

export default function Gallery({ device = "Default", images }: GalleryProps) {
  const isDesktop = device === "Default";
  const isMobile = device === "Mobile";

  // Ensure we have exactly 4 images (pad with empty if needed)
  const displayImages = images.slice(0, 4);

  return (
    <div
      className={clsx(
        "gap-8 py-16 relative",
        isDesktop && "content-stretch flex items-center px-[175px] w-[1440px]",
        isMobile && "grid grid-cols-2 grid-rows-[repeat(2,_fit-content(100%))] px-8 w-[640px]"
      )}
    >
      {displayImages.map((image, index) => (
        <div
          key={index}
          className={clsx(
            "aspect-[200/300] content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shadow-[0px_2px_8px_0px_#eaeaea] shrink-0",
            isDesktop && "flex-[1_0_0] min-h-px min-w-px",
            isMobile && index < 2 && "row-[1]",
            isMobile && index >= 2 && "row-[2]",
            isMobile && index % 2 === 0 && "col-[1] justify-self-stretch",
            isMobile && index % 2 === 1 && "col-[2] justify-self-stretch"
          )}
        >
          <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-[26px] shrink-0 w-full">
            <img
              className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[26px] size-full"
              alt={image.alt || ""}
              src={image.src}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
