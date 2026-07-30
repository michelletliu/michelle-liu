import type { Book } from "./types";
import { formatText } from "./BookDetailModal";
import ShimmerImage from "../shared/ShimmerImage";

interface BookCardProps {
  book: Book;
  onClick: () => void;
}

export function BookCard({ book, onClick }: BookCardProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center w-full md:w-[148px] lg:w-[160px] aspect-[1/2] md:h-[320px] lg:h-[350px] group overflow-visible cursor-pointer"
    >
      {/* Book cover - default state */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-full md:w-[148px] lg:w-[160px] aspect-[2/3] md:h-[222px] lg:h-[246.753px] rounded-sm transition-all duration-[400ms] ease-out md:group-hover:top-[-16px] lg:group-hover:top-[-18px] md:group-hover:h-[227px] lg:group-hover:h-[253px] md:group-hover:w-[152px] lg:group-hover:w-[164px]">
        <ShimmerImage
          alt={`${book.title} by ${book.author}`}
          className="absolute inset-0 max-w-none object-cover pointer-events-none size-full shadow-media md:group-hover:shadow-none transition-shadow duration-[400ms] ease-out"
          detectWhiteBorder
          rounded="rounded-sm"
          wrapperClassName="absolute inset-0 size-full"
          src={book.coverImage}
        />
      </div>

      {/* Text content - appears on hover, centered with cover (desktop only) */}
      <div className="absolute top-[225px] lg:top-[250px] left-1/2 -translate-x-1/2 w-[150px] lg:w-[160px] hidden md:flex flex-col items-center text-center opacity-0 transition-opacity duration-[400ms] ease-out group-hover:opacity-100">
        <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-medium justify-center relative shrink-0 text-base text-zinc-900" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-normal line-clamp-2">{formatText(book.title)}</p>
        </div>
        <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center relative shrink-0 text-base text-zinc-500" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-normal">{book.author}</p>
        </div>
        <p className="font-['Michelle',sans-serif] leading-normal not-italic relative shrink-0 text-sm sm:text-base lg:text-lg text-zinc-900 text-nowrap">
          <span className="text-zinc-500">{"★".repeat(book.rating)}</span>
          <span className="text-zinc-200">{"★".repeat(5 - book.rating)}</span>
        </p>
      </div>
    </button>
  );
}
