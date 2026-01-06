import type { Book } from "./types";

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const handleClick = () => {
    if (book.goodreadsUrl) {
      window.open(book.goodreadsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative flex flex-col items-center w-[120px] sm:w-[136px] md:w-[148px] lg:w-[160px] h-[250px] sm:h-[280px] md:h-[320px] lg:h-[350px] group overflow-visible ${book.goodreadsUrl ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {/* Book cover - default state */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 h-[172px] sm:h-[197px] md:h-[222px] lg:h-[246.753px] w-[120px] sm:w-[136px] md:w-[148px] lg:w-[160px] rounded-sm shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] transition-all duration-[400ms] ease-out group-hover:top-[-12px] group-hover:sm:top-[-14px] group-hover:md:top-[-16px] group-hover:lg:top-[-18px] group-hover:h-[176px] group-hover:sm:h-[202px] group-hover:md:h-[227px] group-hover:lg:h-[253px] group-hover:w-[123px] group-hover:sm:w-[139px] group-hover:md:w-[152px] group-hover:lg:w-[164px] group-hover:shadow-none">
        <img
          alt={`${book.title} by ${book.author}`}
          className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-sm size-full"
          src={book.coverImage}
        />
      </div>

      {/* Text content - appears on hover, centered with cover */}
      <div className="absolute top-[175px] sm:top-[200px] md:top-[225px] lg:top-[250px] left-1/2 -translate-x-1/2 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] flex flex-col gap-[3px] sm:gap-[4px] items-center text-center leading-[0] opacity-0 transition-opacity duration-[400ms] ease-out group-hover:opacity-100">
        <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[16px] sm:text-[18px] md:text-[19px] lg:text-[20px] text-black" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[20px] sm:leading-[23px] md:leading-[24px] lg:leading-[25px]">{book.title}</p>
        </div>
        <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[14px] sm:text-[15px] md:text-[16px] lg:text-[17px] text-[rgba(0,0,0,0.5)]" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[18px] sm:leading-[20px] md:leading-[21px] lg:leading-[22px]">{book.author}</p>
        </div>
        <p className="font-['DM_Sans:Medium','Noto_Sans_Symbols2:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[14px] sm:text-[15px] md:text-[16px] lg:text-[17px] text-black text-nowrap">
          <span className="text-[#797979]">{"★".repeat(book.rating)}</span>
          <span className="text-[#e8e8e8]">{"★".repeat(5 - book.rating)}</span>
        </p>
      </div>
    </button>
  );
}
