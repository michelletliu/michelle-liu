import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Book } from "./types";
import { useScrollLock } from "../../utils/useScrollLock";

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
  isPopupMode?: boolean;
}

// Parse inline text formatting: <i>italic</i> and <b>bold</b> for simple text fields like titles
export function formatText(text: string): React.ReactNode[] {
  const formatPattern = /(<b>[^<]+<\/b>|<i>[^<]+<\/i>)/g;
  const parts = text.split(formatPattern);
  
  return parts.map((part, index) => {
    if (!part) return null;
    
    if (part.startsWith('<b>') && part.endsWith('</b>')) {
      return <strong key={index}>{part.slice(3, -4)}</strong>;
    } else if (part.startsWith('<i>') && part.endsWith('</i>')) {
      return <em key={index}>{part.slice(3, -4)}</em>;
    }
    return <span key={index}>{part}</span>;
  }).filter(Boolean);
}

// Recursively parse inline formatting tags: <i>, <b>, <l> (supports nesting)
function parseInlineFormatting(text: string, keyPrefix: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let remaining = text;
  let partIndex = 0;
  
  while (remaining.length > 0) {
    // Find the next opening tag anywhere in the string
    const openTagMatch = remaining.match(/<(i|b|l)>/);
    
    if (!openTagMatch || openTagMatch.index === undefined) {
      // No more tags, add remaining text
      result.push(<span key={`${keyPrefix}-${partIndex++}`}>{remaining}</span>);
      break;
    }
    
    // Add text before the tag
    if (openTagMatch.index > 0) {
      result.push(<span key={`${keyPrefix}-${partIndex++}`}>{remaining.slice(0, openTagMatch.index)}</span>);
    }
    
    const tag = openTagMatch[1];
    const afterOpenTag = remaining.slice(openTagMatch.index + openTagMatch[0].length);
    
    // Find the matching closing tag
    const closeTag = `</${tag}>`;
    const closeIndex = afterOpenTag.indexOf(closeTag);
    
    if (closeIndex === -1) {
      // No closing tag found, treat rest as plain text
      result.push(<span key={`${keyPrefix}-${partIndex++}`}>{remaining}</span>);
      break;
    }
    
    const content = afterOpenTag.slice(0, closeIndex).replace(/^\s+/, '');
    
    // Recursively parse content inside the tag
    const innerContent = parseInlineFormatting(content, `${keyPrefix}-${partIndex}`);
    const key = `${keyPrefix}-${partIndex++}`;
    
    if (tag === 'i') {
      result.push(<em key={key}>{innerContent}</em>);
    } else if (tag === 'b') {
      result.push(<span key={key} className="font-semibold">{innerContent}</span>);
    } else if (tag === 'l') {
      result.push(<span key={key} className="text-gray-400 text-sm not-italic uppercase">{innerContent}</span>);
    }
    
    remaining = afterOpenTag.slice(closeIndex + closeTag.length);
  }
  
  return result;
}

// Parse text formatting: **bold**, *italic*, <b>bold</b>, <i>italic</i>, <l>light</l>, and --- horizontal lines
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
        <div key={`hr-${sectionIndex}`} className="w-full h-px bg-zinc-100 my-10" />
      );
    }
    
    // Parse inline formatting with nested tag support
    const formatted = parseInlineFormatting(trimmedSection, `${sectionIndex}`);
    result.push(...formatted);
    
    return result;
  });
}

export function BookDetailModal({ book, onClose, isPopupMode = false }: BookDetailModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open (flicker-free implementation)
  useScrollLock();

  // Show scrollbar only when actively scrolling
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    
    let scrollTimeout: ReturnType<typeof setTimeout>;
    
    const handleScroll = () => {
      modal.classList.add('is-scrolling');
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        modal.classList.remove('is-scrolling');
      }, 1000);
    };
    
    modal.addEventListener('scroll', handleScroll);
    return () => {
      modal.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200); // Match animation duration
  };

  return createPortal(
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-[100] ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`}
        style={{ backgroundImage: "linear-gradient(90deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.05) 100%), linear-gradient(90deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.25) 100%)" }}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] flex flex-col rounded-2xl overflow-y-auto modal-scroll-container bg-white border border-[rgba(0,0,0,0.1)] shadow-[0px_4px_36px_0px_rgba(0,0,0,0.15)] ${
          isPopupMode 
            ? 'gap-4 sm:gap-5 p-12 sm:p-16 w-[min(700px,85vw)] max-h-[70vh]' 
            : 'gap-6 sm:gap-8 md:gap-10 px-12 py-12 sm:p-10 md:p-16 lg:p-20 w-[calc(100vw-32px)] sm:w-[calc(100vw-80px)] md:w-[min(1137px,90vw)] max-h-[80vh] sm:max-h-[90vh]'
        } ${isClosing ? 'animate-modal-scale-out' : 'animate-modal-scale-in'}`}
      >
        {/* Mobile layout */}
        <div className="flex flex-col gap-12 sm:hidden w-full">
          {/* Book cover - centered */}
          <div 
            className={`w-[142px] h-[219px] shrink-0 mx-auto group ${book.goodreadsUrl ? 'cursor-pointer' : ''}`}
            onClick={(e) => {
              if (book.goodreadsUrl) {
                e.stopPropagation();
                window.open(book.goodreadsUrl, '_blank');
              }
            }}
          >
            <img 
              alt={`${book.title} by ${book.author}`} 
              className={`w-full h-full object-cover rounded-md shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] ${book.goodreadsUrl ? 'transition-transform duration-300 group-hover:rotate-[2.5deg]' : ''}`}
              src={book.coverImage} 
            />
          </div>
          
          {/* Title, Author & Meta - grouped with smaller gap */}
          <div className="flex flex-col gap-6">
            {/* Title & Author - left aligned */}
            <div className="flex flex-col gap-0.5">
              <h2 
                className="font-['SF_Pro:Regular',sans-serif] font-medium text-xl text-black"
                style={{ fontVariationSettings: "'wdth' 100" }}
              >
                {formatText(book.title)}
              </h2>
              <p 
                className="font-['SF_Pro:Regular',sans-serif] text-lg text-gray-500"
                style={{ fontVariationSettings: "'wdth' 100" }}
              >
                {book.author}
              </p>
            </div>
            
            {/* Meta info - two column layout with fixed label width */}
            <div className="flex flex-col gap-3">
            {/* Rating */}
            {book.rating > 0 && (
              <div className="flex items-center">
                <span 
                  className="font-['SF_Pro:Medium',sans-serif] font-medium text-base text-gray-400 w-[100px] shrink-0"
                  style={{ fontVariationSettings: "'wdth' 100" }}
                >
                  Rating
                </span>
                <span className="font-['DM_Sans:Medium','Noto_Sans_Symbols2:Regular',sans-serif] text-lg">
                  <span className="text-gray-600">{"★".repeat(book.rating)}</span>
                  <span className="text-gray-200">{"★".repeat(5 - book.rating)}</span>
                </span>
              </div>
            )}
            
            {/* Shelf */}
            {(book.isFavorite || book.year) && (
              <div className="flex items-center">
                <span 
                  className="font-['SF_Pro:Medium',sans-serif] font-medium text-base text-gray-400 w-[100px] shrink-0"
                  style={{ fontVariationSettings: "'wdth' 100" }}
                >
                  Shelf
                </span>
                <div className="flex flex-wrap gap-2">
                  {book.isFavorite && (
                    <span className="bg-gray-100 px-3 py-1 rounded-full font-medium font-['SF_Pro:Regular',sans-serif] text-base text-gray-600" style={{ fontVariationSettings: "'wdth' 100" }}>
                      favorites
                    </span>
                  )}
                  {book.year && (
                    <span className="bg-gray-100 px-3 py-1 rounded-full font-medium font-['SF_Pro:Regular',sans-serif] text-base text-gray-600" style={{ fontVariationSettings: "'wdth' 100" }}>
                      {book.year}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Dates Read */}
            {(book.dateStarted || book.dateFinished || book.dateRead) && (
              <div className="flex items-start">
                <span 
                  className="font-['SF_Pro:Medium',sans-serif] font-medium text-base text-gray-400 w-[100px] shrink-0"
                  style={{ fontVariationSettings: "'wdth' 100" }}
                >
                  {book.dateStarted && book.dateFinished ? 'Dates Read' : 'Date Read'}
                </span>
                <span 
                  className="font-['SF_Pro:Regular',sans-serif] text-base text-gray-600"
                  style={{ fontVariationSettings: "'wdth' 100" }}
                >
                  {book.dateStarted && book.dateFinished ? (
                    <>
                      {new Date(book.dateStarted).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {' → '}
                      {new Date(book.dateFinished).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </>
                  ) : (
                    new Date(book.dateFinished || book.dateRead || '').toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  )}
                </span>
              </div>
            )}
            
            </div>
          </div>
        </div>
        
        {/* Desktop layout */}
        <div className="hidden sm:flex flex-row gap-9 md:gap-11 w-full">
          {/* Book cover */}
          <div 
            className={`w-[142px] h-[219px] shrink-0 group ${book.goodreadsUrl ? 'cursor-pointer' : ''}`}
            onClick={(e) => {
              if (book.goodreadsUrl) {
                e.stopPropagation();
                window.open(book.goodreadsUrl, '_blank');
              }
            }}
          >
            <img 
              alt={`${book.title} by ${book.author}`} 
              className={`w-full h-full object-cover rounded-md shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] ${book.goodreadsUrl ? 'transition-transform duration-300 group-hover:rotate-[2.5deg]' : ''}`}
              src={book.coverImage} 
            />
          </div>
          
          {/* Info section */}
          <div className="flex flex-col gap-7 md:gap-8 flex-1">
            {/* Title & Author */}
            <div className="flex flex-col gap-0.5">
              <h2 
                className="font-['SF_Pro:Regular',sans-serif] font-medium text-xl text-black"
                style={{ fontVariationSettings: "'wdth' 100" }}
              >
                {formatText(book.title)}
              </h2>
              <p 
                className="font-['SF_Pro:Regular',sans-serif] text-lg text-gray-500"
                style={{ fontVariationSettings: "'wdth' 100" }}
              >
                {book.author}
              </p>
            </div>
            
            {/* Meta info */}
            <div className="flex flex-col gap-4">
              {/* Rating */}
              {book.rating > 0 && (
                <div className="flex flex-row gap-6 md:gap-8 lg:gap-10 items-center">
                  <span 
                    className="font-['SF_Pro:Medium',sans-serif] font-medium text-base text-gray-400 w-[88px] shrink-0"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                  >
                    Rating
                  </span>
                  <span className="font-['DM_Sans:Medium','Noto_Sans_Symbols2:Regular',sans-serif] text-[19px] md:text-xl">
                    <span className="text-gray-600">{"★".repeat(book.rating)}</span>
                    <span className="text-gray-200">{"★".repeat(5 - book.rating)}</span>
                  </span>
                </div>
              )}
              
              {/* Shelf (favorites + year tags) */}
              {(book.isFavorite || book.year) && (
                <div className="flex flex-row gap-6 md:gap-8 lg:gap-10 items-center">
                  <span 
                    className="font-['SF_Pro:Medium',sans-serif] font-medium text-base text-gray-400 w-[88px] shrink-0"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                  >
                    Shelf
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {book.isFavorite && (
                      <span className="bg-gray-100 px-3 py-1 rounded-full font-medium font-['SF_Pro:Regular',sans-serif] text-[16px] text-gray-600" style={{ fontVariationSettings: "'wdth' 100" }}>
                        favorites
                      </span>
                    )}
                    {book.year && (
                      <span className="bg-gray-100 px-3 py-1 rounded-full font-medium font-['SF_Pro:Regular',sans-serif] text-[16px] text-gray-600" style={{ fontVariationSettings: "'wdth' 100" }}>
                        {book.year}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Date Read */}
              {(book.dateStarted || book.dateFinished || book.dateRead) && (
                <div className="flex flex-row gap-6 md:gap-8 lg:gap-10 items-center">
                  <span 
                    className="font-['SF_Pro:Medium',sans-serif] font-medium text-base text-gray-400 w-[88px] shrink-0"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                  >
                    {book.dateStarted && book.dateFinished ? 'Dates Read' : 'Date Read'}
                  </span>
                  <span 
                    className="font-['SF_Pro:Regular',sans-serif] text-base text-gray-600"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                  >
                    {book.dateStarted && book.dateFinished ? (
                      <>
                        {new Date(book.dateStarted).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        {' → '}
                        {new Date(book.dateFinished).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </>
                    ) : (
                      new Date(book.dateFinished || book.dateRead || '').toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    )}
                  </span>
                </div>
              )}
              
            </div>
          </div>
        </div>
        
        {/* Divider above Review */}
        {book.review && (
          <div className="w-full bg-zinc-100" style={{ height: '1px', flexShrink: 0 }} />
        )}
        
        {/* Review */}
        {book.review && (
          <div className="flex flex-col gap-3 sm:gap-6 w-full">
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
    </>,
    document.body
  );
}
