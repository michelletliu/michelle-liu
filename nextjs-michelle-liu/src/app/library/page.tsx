'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { client } from "../../sanity/client";
import { urlFor } from "../../sanity/image";
import { BOOKS_QUERY, BOOK_SHELVES_QUERY } from "../../sanity/queries";
import type { Book, SanityBookData } from "../../sanity/types";

const imgLogo = '/logo.png';

// Helper to format dates from Sanity
function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

// Transform Sanity book data to component format
function transformBook(sanityBook: SanityBookData): Book {
  // Get cover image URL - prefer uploaded image, fallback to URL
  let coverImageUrl = '';
  if (sanityBook.coverImage?.asset) {
    coverImageUrl = urlFor(sanityBook.coverImage).width(400).url();
  } else if (sanityBook.coverUrl) {
    coverImageUrl = sanityBook.coverUrl;
  }

  return {
    id: sanityBook._id,
    title: sanityBook.title,
    author: sanityBook.author,
    coverImage: coverImageUrl,
    rating: sanityBook.rating,
    shelf: sanityBook.shelf,
    datesRead: sanityBook.dateStarted && sanityBook.dateFinished ? {
      start: formatDate(sanityBook.dateStarted),
      end: formatDate(sanityBook.dateFinished),
    } : undefined,
    review: sanityBook.review,
  };
}

// BookCard Component
function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  return (
    <div className="relative cursor-pointer group" onClick={onClick}>
      {/* Book cover */}
      <div className="relative w-[120px] h-[180px] rounded-[4px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] transition-all duration-[400ms] ease-out group-hover:scale-[1.025] group-hover:-translate-y-3 group-hover:shadow-none overflow-hidden">
        <img
          alt={`${book.title} by ${book.author}`}
          className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[4px] size-full"
          src={book.coverImage}
        />
      </div>

      {/* Text content - appears on hover, centered below cover */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[186px] w-[160px] flex flex-col gap-[3px] items-center text-center opacity-0 transition-opacity duration-[400ms] ease-out group-hover:opacity-100">
        <div className="font-['SF_Pro:Regular',sans-serif] font-normal text-[18px] text-black tracking-[-0.45px]" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[22px]">{book.title}</p>
        </div>
        <div className="font-['SF_Pro:Regular',sans-serif] font-normal text-[15px] text-[rgba(0,0,0,0.5)] tracking-[-0.43px]" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[19px]">{book.author}</p>
        </div>
        <p className="font-['DM_Sans:Medium','Noto_Sans_Symbols2:Regular',sans-serif] leading-[1.4] text-[15px] text-nowrap tracking-[0.51px]">
          <span className="text-gray-500">{"★".repeat(book.rating)}</span>
          <span className="text-gray-300">{"★".repeat(5 - book.rating)}</span>
        </p>
      </div>
    </div>
  );
}

// BookDetailModal Component
function BookDetailModal({ book, onClose }: { book: Book; onClose: () => void }) {
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40" 
        style={{ backgroundImage: "linear-gradient(90deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.05) 100%), linear-gradient(90deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.25) 100%)" }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 content-stretch flex flex-col gap-[24px] sm:gap-[32px] md:gap-[40px] items-start p-[24px] sm:p-[40px] md:p-[60px] lg:p-[80px] xl:p-[100px] rounded-[16px] sm:rounded-[18px] md:rounded-[20px] w-[calc(100vw-32px)] sm:w-[calc(100vw-80px)] md:w-[min(1137px,90vw)] max-h-[calc(100vh-32px)] sm:max-h-[90vh] overflow-y-auto" style={{ backgroundImage: "linear-gradient(90deg, rgba(0, 0, 0, 0.01) 0%, rgba(0, 0, 0, 0.01) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
        <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[16px] sm:rounded-[18px] md:rounded-[20px] shadow-[0px_4px_36px_0px_rgba(0,0,0,0.15)]" />
        
        <div className="content-stretch flex flex-col sm:flex-row gap-[32px] sm:gap-[36px] md:gap-[44px] items-start relative shrink-0 w-full">
          <div className="h-[219px] relative shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)] shrink-0 w-[142.004px] group cursor-pointer mx-auto sm:mx-0">
            <div className="absolute h-[219px] left-0 rounded-[6px] top-0 w-[142.004px] transition-transform duration-300 group-hover:rotate-[2.5deg]">
              <img alt={`${book.title} by ${book.author}`} className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[6px] size-full" src={book.coverImage} />
            </div>
          </div>
          
          <div className="basis-0 content-stretch flex flex-col gap-[24px] sm:gap-[28px] md:gap-[32px] lg:gap-[36px] grow items-start min-h-px min-w-px relative shrink-0 w-full sm:w-auto">
            <div className="content-stretch flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal gap-[4px] items-start leading-[0] relative shrink-0 text-[24px] sm:text-[26px] md:text-[28px] text-nowrap tracking-[0.38px] max-w-full">
              <div style={{ fontVariationSettings: "'wdth' 100" }} className="flex flex-col justify-center relative shrink-0 text-black">
                <p className="leading-[34px] text-nowrap">{book.title}</p>
              </div>
              <div style={{ fontVariationSettings: "'wdth' 100" }} className="flex flex-col justify-center relative shrink-0 text-[rgba(0,0,0,0.4)]">
                <p className="leading-[34px] text-nowrap">{book.author}</p>
              </div>
            </div>
            
            <div className="content-stretch flex flex-col gap-[12px] sm:gap-[14px] md:gap-[16px] items-start relative shrink-0 w-full">
              <div className="content-stretch flex flex-col sm:flex-row gap-[8px] sm:gap-[24px] md:gap-[32px] lg:gap-[40px] items-start sm:items-center leading-[0] relative shrink-0 text-nowrap w-full">
                <div style={{ fontVariationSettings: "'wdth' 100" }} className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center relative shrink-0 text-[rgba(0,0,0,0.4)] text-[15px] sm:text-[16px] md:text-[17px] tracking-[-0.43px]">
                  <p className="leading-[22px] text-nowrap">Rating</p>
                </div>
                <p className="font-['DM_Sans:Medium','Noto_Sans_Symbols2:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-gray-500 text-[0px] text-[18px] sm:text-[19px] md:text-[20px] text-black text-center tracking-[0.6px]">
                  {"★".repeat(book.rating)}{"☆".repeat(5 - book.rating)}
                </p>
              </div>
              
              <div className="content-stretch flex flex-col sm:flex-row gap-[8px] sm:gap-[24px] md:gap-[32px] lg:gap-[40px] items-start sm:items-center relative shrink-0 w-full">
                <div style={{ fontVariationSettings: "'wdth' 100" }} className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center relative shrink-0 text-[17px] text-[rgba(0,0,0,0.4)] tracking-[-0.43px] leading-[0] w-auto sm:w-[88px]">
                  <p className="leading-[22px]">Shelf</p>
                </div>
                <div className="bg-gray-100 content-stretch flex items-center justify-center px-[12px] py-[4px] relative rounded-[99px] shrink-0">
                  <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-gray-800 text-[15px] sm:text-[16px] text-nowrap tracking-[-0.31px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                    <p className="leading-[21px]">{book.shelf}</p>
                  </div>
                </div>
              </div>
              
              {book.datesRead && (
                <div className="content-stretch flex flex-col sm:flex-row gap-[8px] sm:gap-[24px] md:gap-[32px] lg:gap-[40px] items-start sm:items-center leading-[0] relative shrink-0 text-[15px] sm:text-[16px] md:text-[17px] text-nowrap tracking-[-0.43px] w-full">
                  <div style={{ fontVariationSettings: "'wdth' 100" }} className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center relative shrink-0 text-[rgba(0,0,0,0.4)]">
                    <p className="leading-[22px] text-nowrap">Dates Read</p>
                  </div>
                  <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center relative shrink-0 text-black text-[15px] sm:text-[16px] md:text-[17px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                    <p className="leading-[22px] text-nowrap">{`${book.datesRead.start} → ${book.datesRead.end}`}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="h-0 relative shrink-0 w-full">
          <div className="absolute inset-[-1px_0_0_0]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 937 1">
              <line stroke="black" strokeOpacity="0.1" x2="937" y1="0.5" y2="0.5" />
            </svg>
          </div>
        </div>
        
        {book.review && (
          <div className="content-stretch flex flex-col gap-[12px] sm:gap-[14px] md:gap-[16px] items-start leading-[0] relative shrink-0 w-full">
            <div style={{ fontVariationSettings: "'wdth' 100" }} className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center relative shrink-0 text-[17px] text-[rgba(0,0,0,0.4)] tracking-[-0.43px] text-nowrap">
              <p className="leading-[22px]">Review</p>
            </div>
            <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center min-w-full relative shrink-0 text-[17px] sm:text-[18px] md:text-[19px] lg:text-[20px] text-black tracking-[-0.45px] w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
              <p className="leading-[24px] sm:leading-[26px] md:leading-[28px]">{book.review}</p>
            </div>
          </div>
        )}
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-[16px] sm:right-[20px] md:right-[24px] top-[16px] sm:top-[20px] md:top-[24px] content-stretch flex gap-[8px] items-center justify-center rounded-[1000px] size-[32px] sm:size-[34px] md:size-[36px] transition-all hover:bg-[rgba(0,0,0,0.05)]"
        >
          <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[18px] sm:text-[19px] md:text-[20px] text-[rgba(20,20,20,0.7)] text-center text-nowrap tracking-[-0.26px]" style={{ fontVariationSettings: "'wdth' 100" }}>
            <p className="leading-[24px] sm:leading-[25px] md:leading-[26px]">􀆄</p>
          </div>
        </button>
      </div>
    </>
  );
}

// AddBookModal Component
function AddBookModal({ onClose, onAddBook }: { onClose: () => void; onAddBook: (title: string) => void }) {
  const [bookTitle, setBookTitle] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (bookTitle.trim()) {
      onAddBook(bookTitle);
      setIsSubmitted(true);
      
      // Auto-close after showing thank you message
      setTimeout(() => {
        setBookTitle("");
        setIsSubmitted(false);
        onClose();
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitted) {
      handleSubmit();
    }
  };

  return (
    <>
      {/* Modal - positioned below the button, right-aligned with plus button */}
      <div className="absolute right-0 top-[calc(100%+12px)] z-50 bg-white rounded-[16px] w-[calc(100vw-40px)] sm:w-[420px] max-w-[420px] animate-in fade-in slide-in-from-top-2 duration-300">
        <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.2)] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)]" />
        <div className="content-stretch flex flex-col gap-[23px] items-start p-[24px] relative w-full">
          <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[20px] tracking-[-0.45px] text-black w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
            <p className="leading-[25px]">
              Have a book suggestion?
              <br />
              <span className="text-[rgba(0,0,0,0.6)]">Please drop it here!</span>
            </p>
          </div>
          
          <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
            <div className="basis-0 bg-gray-100 grow h-[44px] min-h-px min-w-px relative rounded-[999px] shrink-0">
              <div 
                aria-hidden="true" 
                className={`absolute border-2 border-solid inset-0 pointer-events-none rounded-[999px] transition-colors duration-300 ${
                  isSubmitted ? "border-[rgba(0,0,0,0.1)]" : "border-[#2883de]"
                }`}
              />
              <div className="flex flex-row items-center size-full">
                <div className="content-stretch flex items-center px-[20px] py-[16px] relative size-full">
                  {isSubmitted ? (
                    <div className="content-stretch flex items-end relative shrink-0">
                      <div 
                        className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[20px] text-[#2883de] text-nowrap tracking-[-0.45px] transition-opacity duration-300"
                        style={{ fontVariationSettings: "'wdth' 100" }}
                      >
                        <p className="leading-[25px]">Thank you!</p>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder=""
                      className="w-full bg-transparent outline-none font-['SF_Pro:Regular',sans-serif] font-normal text-[20px] text-[rgba(0,0,0,0.8)] tracking-[-0.45px] leading-[0] transition-opacity duration-300"
                      style={{ fontVariationSettings: "'wdth' 100" }}
                      autoFocus
                    />
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!bookTitle.trim() || isSubmitted}
              className={`content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[14px] relative rounded-[1000px] shrink-0 size-[44px] transition-all duration-300 ${
                isSubmitted ? "bg-[#2883de]" : "bg-[#2883de] hover:bg-[#2070ba]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div 
                className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[22px] text-center text-nowrap text-white tracking-[-0.26px] transition-transform duration-300" 
                style={{ fontVariationSettings: "'wdth' 100" }}
              >
                <p className="leading-[28px]">{isSubmitted ? "􀎸" : "􀈟"}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [shelves, setShelves] = useState<string[]>(['favorites', 'read']);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("favorites");
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const logoRef = useRef<HTMLButtonElement>(null);

  // Fetch books from Sanity
  useEffect(() => {
    async function fetchBooks() {
      try {
        const [booksData, shelvesData] = await Promise.all([
          client.fetch<SanityBookData[]>(BOOKS_QUERY),
          client.fetch<string[]>(BOOK_SHELVES_QUERY),
        ]);
        
        setBooks(booksData.map(transformBook));
        
        // Update shelves if we got data, otherwise use defaults
        if (shelvesData && shelvesData.length > 0) {
          setShelves(shelvesData);
          // Set initial filter to first available shelf
          if (!shelvesData.includes(activeFilter)) {
            setActiveFilter(shelvesData[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBooks();
  }, []);

  const filteredBooks = books.filter(book => book.shelf === activeFilter);

  // Handle entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle navigation back to home
  const handleBackToHome = () => {
    setIsExiting(true);

    setTimeout(() => {
      router.push('/projects/library');
    }, 280);
  };

  const handleAddBook = (title: string) => {
    // Handle book suggestion submission
    console.log("Book suggestion:", title);
    // You could add this to a database or state here
  };

  return (
    <>
      <div 
        className={`relative min-h-screen w-full bg-white transition-all ${
          isExiting ? 'opacity-0 scale-[0.985]' : isEntering ? 'opacity-0 scale-[1.01]' : 'opacity-100 scale-100'
        }`} 
        style={{ 
          backgroundImage: "linear-gradient(90deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.02) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)",
          transitionDuration: isExiting ? '280ms' : '300ms',
          transitionTimingFunction: isExiting ? 'cubic-bezier(0.4, 0, 0.2, 1)' : 'ease-out'
        }}
      >
        {/* Header */}
        <div className="pt-[32px] px-[60px]">
          <div className="flex flex-col gap-5 sm:gap-6 md:gap-7 lg:gap-8 items-start pb-[20px] sm:pb-[24px] md:pb-[28px] lg:pb-[32px]">
            {/* Logo */}
            <button
              ref={logoRef}
              onClick={handleBackToHome}
              className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
              aria-label="Go back to home"
            >
              <img
                src={imgLogo}
                alt="Michelle Liu Logo"
                className="w-[44px] h-[44px] object-contain"
              />
            </button>
          
          <div className="flex items-start justify-between w-full">
          {/* Title and Filter */}
          <div className="flex flex-col gap-[8px] items-start shrink-0">
            <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[34px] relative shrink-0 text-[28px] text-black tracking-[0.38px]" style={{ fontVariationSettings: "'wdth' 100" }}>
              library
            </p>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
              <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[25px] relative shrink-0 text-[20px] text-[rgba(0,0,0,0.4)] text-nowrap tracking-[-0.45px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                shelf
              </p>
              <div className="relative">
                <button 
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="bg-gray-200 content-stretch flex font-['SF_Pro:Regular',sans-serif] font-normal gap-[8px] items-center justify-center leading-[0] px-[16px] py-[6px] relative rounded-[99px] shrink-0 text-nowrap hover:bg-gray-300 transition-colors"
                >
                  <div className="flex flex-col justify-center relative shrink-0 text-[20px] tracking-[-0.45px] text-gray-600" style={{ fontVariationSettings: "'wdth' 100" }}>
                    <p className="leading-[25px] text-nowrap">{activeFilter}</p>
                  </div>
                  <div className={`flex flex-col justify-center relative shrink-0 text-[15px] tracking-[-0.23px] text-gray-400 transition-transform duration-300 ${showFilterDropdown ? 'rotate-180' : 'rotate-0'}`} style={{ fontVariationSettings: "'wdth' 100" }}>
                    <p className="leading-[20px] text-nowrap">􀆈</p>
                  </div>
                </button>
                
                {showFilterDropdown && (
                  <div className="absolute left-0 top-[calc(100%+4px)] bg-white rounded-[8px] shrink-0 z-50 animate-in fade-in slide-in-from-top-1 duration-200 min-w-full">
                    <div aria-hidden="true" className="absolute border border-gray-100 border-solid inset-0 pointer-events-none rounded-[8px]" />
                    <div className="content-stretch flex flex-col items-start px-[8px] py-[6px] relative shrink-0 w-full">
                      {shelves.map((shelf) => (
                        <button
                          key={shelf}
                          onClick={() => {
                            setActiveFilter(shelf);
                            setShowFilterDropdown(false);
                          }}
                          className="content-stretch flex flex-col items-start px-0 py-[4px] relative shrink-0 w-full"
                        >
                          <div className={`relative rounded-[99px] shrink-0 w-full transition-colors ${
                            activeFilter === shelf ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'
                          }`}>
                            <div className="flex flex-row items-center size-full">
                              <div className="content-stretch flex items-center px-[16px] py-[6px] relative w-full">
                                <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-gray-400 text-[20px] text-nowrap tracking-[-0.45px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                                  <p className="leading-[25px]">{shelf}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Plus button and modal container */}
          <div className="relative">
            <button 
              onClick={() => setShowAddBookModal(!showAddBookModal)}
              className="bg-[rgba(0,0,0,0.05)] content-stretch flex gap-[4px] items-center justify-center px-[20px] py-[14px] rounded-[1000px] size-[40px] hover:bg-[rgba(0,0,0,0.1)] transition-all duration-300"
            >
              <div 
                style={{ fontVariationSettings: "'wdth' 100" }} 
                className={`flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[22px] text-center text-nowrap tracking-[-0.26px] text-[rgba(20,20,20,0.4)] transition-transform duration-300 ${showAddBookModal ? 'rotate-45' : 'rotate-0'}`}
              >
                <p className="leading-[28px]">􀅼</p>
              </div>
            </button>
            
            {/* Add Book Modal - positioned relative to plus button */}
            {showAddBookModal && (
              <AddBookModal onClose={() => setShowAddBookModal(false)} onAddBook={handleAddBook} />
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Bookshelf Grid */}
      <div className="pt-[20px] sm:pt-[24px] md:pt-[28px] lg:pt-[32px] px-[60px] pb-[60px] sm:pb-[80px] md:pb-[100px]">
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                <p className="font-['SF_Pro:Regular',sans-serif] text-[16px] text-[rgba(0,0,0,0.4)]">Loading books...</p>
              </div>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <p className="font-['SF_Pro:Regular',sans-serif] text-[18px] text-[rgba(0,0,0,0.4)]">
                No books on this shelf yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-[32px] gap-y-[80px]">
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} onClick={() => setSelectedBook(book)} />
              ))}
            </div>
          )}
        </div>
      </div>

      </div>

      {/* Book Detail Modal - outside transformed container for proper viewport centering */}
      {selectedBook && (
        <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}

    </>
  );
}
