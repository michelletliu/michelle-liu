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
  /** Optional title/caption displayed below the gallery */
  title?: string;
  /** Layout option for number of columns */
  layout?: "4-col" | "3-col" | "2-col" | "masonry";
};

export default function Gallery({ 
  device = "Default", 
  images, 
  title,
  layout = "4-col"
}: GalleryProps) {
  const isDesktop = device === "Default";
  const isMobile = device === "Mobile";

  // Determine column class based on layout
  const colsClass = layout === "2-col" 
    ? "grid-cols-2" 
    : layout === "3-col" 
    ? "grid-cols-3" 
    : "grid-cols-4";

  return (
    <div className="content-stretch flex flex-col gap-4 px-[175px] max-md:px-8 py-16 relative shrink-0 w-full">
      {/* Image Grid */}
      <div
        className={clsx(
          "gap-4 relative w-full",
          isDesktop && `content-stretch grid items-center ${colsClass} max-md:grid-cols-2`,
          isMobile && "grid grid-cols-2 grid-rows-[repeat(2,_fit-content(100%))]"
        )}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className={clsx(
              "aspect-[200/300] content-stretch flex flex-col items-start overflow-clip relative rounded-xl shadow-[0px_2px_8px_0px_#eaeaea] shrink-0",
              isDesktop && "flex-[1_0_0] min-h-px min-w-px",
              isMobile && index < 2 && "row-[1]",
              isMobile && index >= 2 && "row-[2]",
              isMobile && index % 2 === 0 && "col-[1] justify-self-stretch",
              isMobile && index % 2 === 1 && "col-[2] justify-self-stretch"
            )}
          >
            <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-xl shrink-0 w-full">
              <img
                className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-xl size-full"
                alt={image.alt || ""}
                src={image.src}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Caption/Title below gallery */}
      {title && (
        <p className="font-normal !pt-8 leading-5 relative shrink-0 text-[#9ca3af] text-base text-center w-full">
          {title}
        </p>
      )}
    </div>
  );
}
