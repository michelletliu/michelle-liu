import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { client, urlFor } from "../../sanity/client";
import { SHELF_BOOKS_QUERY, BOOK_YEARS_QUERY } from "../../sanity/queries";
import { BookCard } from "./BookCard";
import { BookDetailModal } from "./BookDetailModal";
import { AddBookModal } from "./AddBookModal";
import { ChevronDownIcon, PlusIcon } from "./icons";
import type { Book, ShelfBookData } from "./types";
import imgLogo from '../../assets/logo.png';

// Transform shelfItem book data to component format
function transformShelfBook(item: ShelfBookData): Book {
  // Get cover image URL - prefer uploaded Sanity image, fallback to external URL
  let coverImageUrl = '';
  if (item.cover?.asset) {
    coverImageUrl = urlFor(item.cover).width(400).url();
  } else if (item.externalCoverUrl) {
    coverImageUrl = item.externalCoverUrl;
  }

  return {
    id: item._id,
    title: item.title,
    author: item.author || 'Unknown Author',
    coverImage: coverImageUrl,
    rating: item.rating || 0,
    year: item.year,
    isFavorite: item.isLibraryFavorite || false,
    goodreadsUrl: item.goodreadsUrl,
  };
}

// Filter type: "favorites", "all", or a year string like "2025"
type FilterOption = {
  value: string;
  label: string;
  isFavorites?: boolean;
  isAll?: boolean;
};

export default function LibraryPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([{ value: 'favorites', label: 'favorites', isFavorites: true }]);
  const [activeFilter, setActiveFilter] = useState<string>("favorites");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const logoRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle dropdown animation
  useEffect(() => {
    if (showFilterDropdown) {
      // Opening: make visible immediately, then animate in
      requestAnimationFrame(() => {
        setIsDropdownVisible(true);
      });
    } else {
      // Closing: animate out first
      setIsDropdownVisible(false);
    }
  }, [showFilterDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    }
    
    if (showFilterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterDropdown]);

  // Fetch books from Sanity (using shelfItem schema)
  useEffect(() => {
    async function fetchBooks() {
      try {
        // Fetch books and years in parallel
        const [booksData, yearsData] = await Promise.all([
          client.fetch<ShelfBookData[]>(SHELF_BOOKS_QUERY),
          client.fetch<string[]>(BOOK_YEARS_QUERY),
        ]);
        
        const transformedBooks = booksData.map(transformShelfBook);
        setBooks(transformedBooks);
        
        // Build filter options: "favorites" + "all" + unique years (already sorted desc from query)
        const options: FilterOption[] = [
          { value: 'favorites', label: 'favorites', isFavorites: true },
          { value: 'all', label: 'all', isAll: true },
          ...yearsData.map(year => ({ value: year, label: year }))
        ];
        
        setFilterOptions(options);
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBooks();
  }, []);

  // Filter books based on active filter (favorites, all, or by year)
  const filteredBooks = activeFilter === 'all' 
    ? books 
    : activeFilter === 'favorites'
    ? books.filter(book => book.isFavorite)
    : books.filter(book => book.year === activeFilter);

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
      navigate('/');
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
        <div className="pt-8 px-8 md:px-16">
          <div className="flex flex-col gap-10 md:gap-12 items-start pb-5 md:pb-6">
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
                className="size-[44px] object-cover"
              />
            </button>
          
          <div className="flex items-start justify-between w-full">
          {/* Title and Filter */}
          <div className="flex flex-col gap-3 items-start shrink-0">
            <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[34px] relative shrink-0 text-[28px] text-black" style={{ fontVariationSettings: "'wdth' 100" }}>
              library
            </p>
            <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors cursor-pointer bg-gray-500/10"
                >
                  <span className="font-['Figtree',sans-serif] font-semibold text-base tracking-[0.01em] whitespace-nowrap text-gray-500">
                    {activeFilter}
                    <span className="text-gray-400"> ({filteredBooks.length})</span>
                  </span>
                  <svg
                    className={clsx(
                      "w-3 h-3 text-gray-400 transition-transform duration-200",
                      showFilterDropdown && "rotate-180"
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div 
                  className={clsx(
                    "absolute left-0 top-[calc(100%+4px)] bg-white rounded-lg shadow-lg border border-gray-100 z-50 w-36 transition-all duration-200 ease-out max-h-[300px] overflow-y-auto",
                    showFilterDropdown ? "pointer-events-auto" : "pointer-events-none",
                    isDropdownVisible 
                      ? "opacity-100 translate-y-0" 
                      : "opacity-0 -translate-y-1"
                  )}
                >
                    <div className="flex flex-col py-1.5 px-1.5">
                      {filterOptions.map((option) => {
                        const isActive = activeFilter === option.value;
                        const count = option.isFavorites 
                          ? books.filter(b => b.isFavorite).length
                          : option.isAll 
                          ? books.length
                          : books.filter(b => b.year === option.value).length;
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              setActiveFilter(option.value);
                              setShowFilterDropdown(false);
                            }}
                            className={clsx(
                              "flex items-center px-3 py-1.5 rounded-md transition-colors text-left",
                              isActive ? "bg-gray-100" : "hover:bg-gray-50"
                            )}
                          >
                            <span className={clsx(
                              "font-['Figtree',sans-serif] font-semibold text-base tracking-[0.01em]",
                              isActive ? "text-gray-600" : "text-gray-400"
                            )}>
                              {option.label}
                              <span className={isActive ? "text-gray-400" : "text-gray-300"}>
                                {" "}({count})
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                </div>
              </div>
          </div>
          
          {/* Plus button and modal container */}
          <div className="relative">
            <button 
              onClick={() => setShowAddBookModal(!showAddBookModal)}
              className="bg-gray-500/10 content-stretch flex items-center justify-center rounded-full size-[36px] hover:bg-[rgba(0,0,0,0.1)] transition-all duration-300"
            >
              <div className={`flex items-center justify-center text-gray-400 transition-transform duration-300 ${showAddBookModal ? 'rotate-45' : 'rotate-0'}`}>
                <PlusIcon className="w-[14px] h-[14px]" />
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
      <div className="pt-6 md:pt-8 px-8 md:px-16 pb-[60px] md:pb-[100px]">
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-[#e7e5e4] border-t-[#57534e] rounded-full animate-spin" />
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
            <div 
              className="grid grid-cols-[repeat(3,auto)] md:grid-cols-[repeat(6,auto)] gap-y-[60px] sm:gap-y-[80px] md:gap-y-[100px] justify-between"
            >
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
