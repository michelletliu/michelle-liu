import { useState } from "react";
import type { Book } from "./types";
import { CloseIcon } from "./icons";

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
}

// Parse **text** to bold, preserve line breaks, and convert --- or ---- to horizontal lines
function formatReview(text: string): React.ReactNode[] {
  // First split by horizontal line patterns (3+ dashes on their own line)
  const sections = text.split(/\n*-{3,}\n*/g);
  
  return sections.flatMap((section, sectionIndex) => {
    const result: React.ReactNode[] = [];
    
    // Trim whitespace from section edges for consistent spacing
    const trimmedSection = section.trim();
    if (!trimmedSection) return result;
    
    // Add horizontal divider between sections (not before first)
    if (sectionIndex > 0) {
      result.push(
        <div key={`hr-${sectionIndex}`} className="w-full h-px bg-black/10 my-10" />
      );
    }
    
    // Parse bold text within each section
    const parts = trimmedSection.split(/(\*\*[^*]+\*\*)/g);
    parts.forEach((part, partIndex) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        result.push(<strong key={`${sectionIndex}-${partIndex}`}>{part.slice(2, -2)}</strong>);
      } else if (part) {
        result.push(<span key={`${sectionIndex}-${partIndex}`}>{part}</span>);
      }
    });
    
    return result;
  });
}

export function BookDetailModal({ book, onClose }: BookDetailModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200); // Match animation duration
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-40 ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`}
        style={{ backgroundImage: "linear-gradient(90deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.05) 100%), linear-gradient(90deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.25) 100%)" }}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className={`fixed left-1/2 top-1/2 z-50 flex flex-col gap-6 sm:gap-8 md:gap-10 p-6 sm:p-10 md:p-16 lg:p-20 rounded-2xl w-[calc(100vw-32px)] sm:w-[calc(100vw-80px)] md:w-[min(1137px,90vw)] max-h-[calc(100vh-32px)] sm:max-h-[90vh] overflow-y-auto bg-white border border-[rgba(0,0,0,0.1)] shadow-[0px_4px_36px_0px_rgba(0,0,0,0.15)] ${isClosing ? 'animate-modal-scale-out' : 'animate-modal-scale-in'}`}
      >
        
        {/* Close button */}
        <button
          onClick={handleClose}
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
              className="w-full h-full object-cover rounded-md shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] transition-transform duration-300 group-hover:rotate-[1deg]" 
              src={book.coverImage} 
            />
          </div>
          
          {/* Info section */}
          <div className="flex flex-col gap-6 sm:gap-7 md:gap-8 flex-1 text-center sm:text-left">
            {/* Title & Author */}
            <div className="flex flex-col gap-1">
              <h2 
                className="font-['SF_Pro:Regular',sans-serif] text-2xl text-black"
                style={{ fontVariationSettings: "'wdth' 100" }}
              >
                {book.title}
              </h2>
              <p 
                className="font-['SF_Pro:Regular',sans-serif] text-2xl text-gray-500"
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
                  className="font-['SF_Pro:Medium',sans-serif] font-medium text-base text-gray-400 sm:w-[88px] shrink-0"
                  style={{ fontVariationSettings: "'wdth' 100" }}
                >
                  Rating
                </span>
                <span className="font-['DM_Sans:Medium','Noto_Sans_Symbols2:Regular',sans-serif] text-lg sm:text-[19px] md:text-xl">
                  <span className="text-gray-600">{"★".repeat(book.rating)}</span>
                  <span className="text-gray-200">{"★".repeat(5 - book.rating)}</span>
                </span>
              </div>
              
              {/* Shelf */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 md:gap-8 lg:gap-10 items-center sm:items-center">
                <span 
                  className="font-['SF_Pro:Medium',sans-serif] font-medium text-base text-gray-400 sm:w-[88px] shrink-0"
                  style={{ fontVariationSettings: "'wdth' 100" }}
                >
                  Shelf
                </span>
                <span className="bg-gray-100 px-3 py-1 rounded-full font-medium font-['SF_Pro:Regular',sans-serif] text-base sm:text-[16px] text-gray-600" style={{ fontVariationSettings: "'wdth' 100" }}>
                  {book.shelf}
                </span>
              </div>
              
              {/* Dates Read */}
              {book.datesRead && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 md:gap-8 lg:gap-10 items-center sm:items-center">
                  <span 
                    className="font-['SF_Pro:Medium',sans-serif] font-medium text-base text-gray-400 sm:w-[88px] shrink-0"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                  >
                    Dates Read
                  </span>
                  <span 
                    className="font-['SF_Pro:Regular',sans-serif] text-base text-gray-600"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                  >
                    {`${book.datesRead.start} → ${book.datesRead.end}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Divider above Review */}
        {book.review && (
          <div className="w-full" style={{ height: '1px', backgroundColor: '#d1d5db', flexShrink: 0 }} />
        )}
        
        {/* Review */}
        {book.review && (
          <div className="flex flex-col gap-3 sm:gap-4 w-full">
            <span 
              className="font-['SF_Pro:Medium',sans-serif] font-medium text-base text-gray-400"
              style={{ fontVariationSettings: "'wdth' 100" }}
            >
              Review
            </span>
            <p 
              className="font-['SF_Pro:Regular',sans-serif] text-lg text-black leading-relaxed whitespace-pre-wrap"
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
