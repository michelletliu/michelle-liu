import type { Book } from "./types";
import { CloseIcon } from "./icons";

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
}

// Parse **text** to bold and preserve line breaks
function formatReview(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function BookDetailModal({ book, onClose }: BookDetailModalProps) {
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40" 
        style={{ backgroundImage: "linear-gradient(90deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.05) 100%), linear-gradient(90deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.25) 100%)" }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col gap-6 sm:gap-8 md:gap-10 p-6 sm:p-10 md:p-16 lg:p-20 rounded-2xl w-[calc(100vw-32px)] sm:w-[calc(100vw-80px)] md:w-[min(1137px,90vw)] max-h-[calc(100vh-32px)] sm:max-h-[90vh] overflow-y-auto bg-white"
      >
        <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.1)] inset-0 pointer-events-none rounded-2xl shadow-[0px_4px_36px_0px_rgba(0,0,0,0.15)]" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 sm:right-5 md:right-6 top-4 sm:top-5 md:top-6 flex items-center justify-center rounded-full size-8 sm:size-9 md:size-10 transition-all hover:bg-black/5 z-10"
        >
          <CloseIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[rgba(20,20,20,0.7)]" />
        </button>
        
        {/* Header: Cover + Info */}
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-9 md:gap-11 w-full">
          {/* Book cover */}
          <div className="w-[142px] h-[219px] shrink-0 mx-auto sm:mx-0 group cursor-pointer">
            <img 
              alt={`${book.title} by ${book.author}`} 
              className="w-full h-full object-cover rounded-md shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] transition-transform duration-300 group-hover:scale-[1.02] group-hover:rotate-[1deg]" 
              src={book.coverImage} 
            />
          </div>
          
          {/* Info section */}
          <div className="flex flex-col gap-6 sm:gap-7 md:gap-8 flex-1 text-center sm:text-left">
            {/* Title & Author */}
            <div className="flex flex-col gap-1">
              <h2 
                className="font-['SF_Pro:Regular',sans-serif] text-2xl sm:text-[26px] md:text-[28px] text-black leading-tight"
                style={{ fontVariationSettings: "'wdth' 100" }}
              >
                {book.title}
              </h2>
              <p 
                className="font-['SF_Pro:Regular',sans-serif] text-2xl sm:text-[26px] md:text-[28px] text-black/40 leading-tight"
                style={{ fontVariationSettings: "'wdth' 100" }}
              >
                {book.author}
              </p>
            </div>
            
            {/* Meta info */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Rating */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 md:gap-8 lg:gap-10 items-center sm:items-center">
                <span 
                  className="font-['SF_Pro:Medium',sans-serif] font-medium text-[15px] sm:text-[16px] md:text-[17px] text-black/40 sm:w-[88px] shrink-0"
                  style={{ fontVariationSettings: "'wdth' 100" }}
                >
                  Rating
                </span>
                <span className="font-['DM_Sans:Medium','Noto_Sans_Symbols2:Regular',sans-serif] text-lg sm:text-[19px] md:text-xl">
                  <span className="text-[#797979]">{"★".repeat(book.rating)}</span>
                  <span className="text-[#e8e8e8]">{"☆".repeat(5 - book.rating)}</span>
                </span>
              </div>
              
              {/* Shelf */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 md:gap-8 lg:gap-10 items-center sm:items-center">
                <span 
                  className="font-['SF_Pro:Medium',sans-serif] font-medium text-[15px] sm:text-[16px] md:text-[17px] text-black/40 sm:w-[88px] shrink-0"
                  style={{ fontVariationSettings: "'wdth' 100" }}
                >
                  Shelf
                </span>
                <span className="bg-[#f0efed] px-3 py-1 rounded-full font-['SF_Pro:Regular',sans-serif] text-[15px] sm:text-[16px] text-[#2c2c2b]" style={{ fontVariationSettings: "'wdth' 100" }}>
                  {book.shelf}
                </span>
              </div>
              
              {/* Dates Read */}
              {book.datesRead && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 md:gap-8 lg:gap-10 items-center sm:items-center">
                  <span 
                    className="font-['SF_Pro:Medium',sans-serif] font-medium text-[15px] sm:text-[16px] md:text-[17px] text-black/40 sm:w-[88px] shrink-0"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                  >
                    Dates Read
                  </span>
                  <span 
                    className="font-['SF_Pro:Regular',sans-serif] text-[15px] sm:text-[16px] md:text-[17px] text-black"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                  >
                    {`${book.datesRead.start} → ${book.datesRead.end}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-full h-px bg-black/10" />
        
        {/* Review */}
        {book.review && (
          <div className="flex flex-col gap-3 sm:gap-4 w-full">
            <span 
              className="font-['SF_Pro:Medium',sans-serif] font-medium text-[17px] text-black/40"
              style={{ fontVariationSettings: "'wdth' 100" }}
            >
              Review
            </span>
            <p 
              className="font-['SF_Pro:Regular',sans-serif] text-[17px] sm:text-lg md:text-[19px] lg:text-xl text-black leading-relaxed whitespace-pre-wrap"
              style={{ fontVariationSettings: "'wdth' 100" }}
            >
              {formatReview(book.review)}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
