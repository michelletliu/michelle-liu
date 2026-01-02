import clsx from "clsx";

export type ArtCardData = {
  id: string;
  imageSrc: string;
  title: string;
  /** Medium, Size, Date info */
  metadata?: string;
};

type ArtCardProps = {
  className?: string;
  data: ArtCardData;
  onClick?: () => void;
};

export default function ArtCard({ className, data, onClick }: ArtCardProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col gap-2 items-start w-full cursor-pointer group text-left break-inside-avoid mb-5",
        className
      )}
    >
      {/* Image - fills width, height scales to maintain aspect ratio */}
      <img
        src={data.imageSrc}
        alt={data.title}
        className="w-full h-auto rounded-xl object-contain"
      />
      {/* Caption */}
      <p className="font-medium leading-[1.4] px-2 text-sm">
        <span className="text-gray-500">{data.title}</span>
        {data.metadata && (
          <>
            <span className="text-gray-400">{", "}</span>
            <span className="text-gray-400">{data.metadata}</span>
          </>
        )}
      </p>
    </button>
  );
}




