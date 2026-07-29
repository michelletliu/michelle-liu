import { useState } from "react";
import clsx from "clsx";

export type ArtCardData = {
  id: string;
  imageSrc: string;
  /** Higher-res source for lightbox */
  fullImageSrc?: string;
  title: string;
  aspectRatio?: number;
  /** Medium, Size, Date info */
  metadata?: string;
};

type ArtCardProps = {
  className?: string;
  data: ArtCardData;
  onClick?: () => void;
};

export default function ArtCard({ className, data, onClick }: ArtCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col gap-2 items-start w-full cursor-pointer group text-left break-inside-avoid mb-0 md:mb-5",
        className
      )}
    >
      {/* Image container with shimmer placeholder */}
      <div
        className="relative w-full rounded-2xl overflow-hidden bg-zinc-100"
        style={{ aspectRatio: data.aspectRatio ?? 0.8 }}
      >
        {/* Shimmer placeholder - visible while image is loading */}
        <div 
          className={clsx(
            "absolute inset-0 rounded-2xl transition-opacity duration-500 ease-out",
            imageLoaded ? "opacity-0" : "opacity-100 animate-shimmer"
          )}
        />
        {/* Image - fills width, height scales to maintain aspect ratio */}
        <img
          src={data.imageSrc}
          alt={data.title}
          className={clsx(
            "absolute inset-0 size-full rounded-2xl object-cover transition-opacity duration-500 ease-out",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
        />
      </div>
      {/* Caption */}
      <p className="font-normal leading-snug px-2 text-sm">
        <span className="text-zinc-600">{data.title}</span>
        {data.metadata && (
          <>
            <span className="inline-block w-1.5" aria-hidden />
            <span className="text-zinc-400">{data.metadata}</span>
          </>
        )}
      </p>
    </button>
  );
}




