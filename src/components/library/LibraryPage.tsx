"use client";

import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "@/lib/navigation";
import clsx from "clsx";
import { client, urlFor } from "../../sanity/client";
import { SHELF_BOOKS_QUERY, BOOK_YEARS_QUERY } from "../../sanity/queries";
import { BookCard } from "./BookCard";
import { BookDetailModal } from "./BookDetailModal";
import { AddBookModal } from "./AddBookModal";
import { ChevronDownIcon, PlusIcon } from "./icons";
import type { Book, ShelfBookData } from "./types";
import imgLogo from '../../assets/logo.png';
import InfoButton from '../InfoButton';
import { useExperimentProject } from '../../hooks/useExperimentProject';
import { posthog, posthogEnabled } from '../../lib/posthog';

// Default project info (fallback if Sanity fetch fails)
const DEFAULT_LIBRARY_PROJECT = {
  id: 'library',
  title: 'Personal Library',
  year: '2025',
  description: 'My dream digital bookshelf',
  imageSrc: 'https://image.mux.com/a3NxNdblQi02JVCg0177eEWZRycP1BduGb2pt7o00FUPfo/thumbnail.png',
  videoSrc: 'https://stream.mux.com/a3NxNdblQi02JVCg0177eEWZRycP1BduGb2pt7o00FUPfo.m3u8',
  xLink: 'https://x.com/michelletliu/status/1981030966044061894',
  tryItOutHref: '/library',
  backgroundColor: '#ffffff',
  toolCategories: [
    { label: 'Design', tools: ['Figma'] },
    { label: 'Frontend', tools: ['TypeScript', 'React', 'Vite'] },
    { label: 'Styling', tools: ['Tailwind CSS'] },
    { label: 'AI', tools: ['Figma Make', 'Cursor'] },
  ],
};

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
    review: item.review,
    dateRead: item.dateRead,
    dateStarted: item.dateStarted,
    dateFinished: item.dateFinished,
  };
}

// Filter type: "favorites", "all", or a year string like "2025"
type FilterOption = {
  value: string;
  label: string;
  isFavorites?: boolean;
  isAll?: boolean;
};

export default function LibraryPage({ bookSlug }: { bookSlug?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Fetch project info from Sanity (with fallback to defaults)
  const projectInfo = useExperimentProject('library', DEFAULT_LIBRARY_PROJECT);
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
  const [isPopupMode, setIsPopupMode] = useState(false);
  const logoRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousPopupModeRef = useRef(false);

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const getBookSlug = (book: Book) => slugify(book.title);

  const findBookBySlug = (slug: string) => {
    // Current format: title-only slug
    const exact = books.find((book) => getBookSlug(book) === slug);
    if (exact) return exact;

    // Backward compatibility for old title+idSuffix slugs
    const legacyMatch = slug.match(/^(.*)-([a-f0-9]{8})$/i);
    if (legacyMatch?.[1]) {
      const titleOnlySlug = legacyMatch[1];
      return books.find((book) => getBookSlug(book) === titleOnlySlug);
    }

    return undefined;
  };

  const openBookPath = (slug: string) => {
    if (isPopupMode || location.pathname.startsWith("/project/library/full")) {
      return `/project/library/full/${encodeURIComponent(slug)}`;
    }
    return `/library/${encodeURIComponent(slug)}`;
  };

  const closeBookPath = () =>
    location.pathname.startsWith("/project/library/full")
      ? "/project/library/full"
      : "/library";

  const setFilterFromBookYear = (book: Book) => {
    if (book.year && book.year.trim()) {
      setActiveFilter(book.year);
      return;
    }
    setActiveFilter("all");
  };

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

  // Detect popup mode (inside experiment modal but not fullscreen)
  useEffect(() => {
    const checkPopupMode = () => {
      if (containerRef.current) {
        const isInModal = containerRef.current.closest('.experiment-modal-embed:not(.fullscreen)') !== null;
        
        // Reset exiting state when transitioning from popup to fullscreen
        if (previousPopupModeRef.current && !isInModal) {
          setIsExiting(false);
          setIsEntering(false);
        }
        
        previousPopupModeRef.current = isInModal;
        setIsPopupMode(isInModal);
      }
    };
    
    checkPopupMode();
    window.addEventListener('resize', checkPopupMode);
    
    // Watch for class changes on the modal embed (for fullscreen transitions)
    const modalEmbed = containerRef.current?.closest('.experiment-modal-embed');
    let observer: MutationObserver | null = null;
    if (modalEmbed) {
      observer = new MutationObserver(checkPopupMode);
      observer.observe(modalEmbed, { attributes: true, attributeFilter: ['class'] });
    }
    
    return () => {
      window.removeEventListener('resize', checkPopupMode);
      observer?.disconnect();
    };
  }, []);

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

  // Open selected book from path slug (shareable URL)
  useEffect(() => {
    if (!bookSlug || books.length === 0 || selectedBook) return;

    const book = findBookBySlug(decodeURIComponent(bookSlug));
    if (book) {
      setSelectedBook(book);
      setFilterFromBookYear(book);
    }
  }, [bookSlug, books, selectedBook]);

  // Backward compatibility for old ?book=<id> links: resolve and redirect to slug path
  useEffect(() => {
    const bookParam = searchParams.get("book");
    if (!bookParam || books.length === 0 || selectedBook) return;

    const decoded = decodeURIComponent(bookParam);
    const book =
      books.find((b) => b.id === decoded) ||
      findBookBySlug(decoded);

    if (book) {
      const slug = getBookSlug(book);
      setSelectedBook(book);
      setFilterFromBookYear(book);
      setSearchParams({}, { replace: true });
      const targetPath = openBookPath(slug);
      if (window.location.pathname !== targetPath) {
        window.history.replaceState(null, '', targetPath);
      }
    }
  }, [searchParams, books, selectedBook, setSearchParams, location.pathname, navigate, isPopupMode]);

  // Handle entrance animation and reset exit state when in fullscreen
  useEffect(() => {
    const isFullscreen = window.location.pathname.includes('/full');
    // If we're in fullscreen mode, ensure we're not in exiting state
    if (isFullscreen) {
      setIsExiting(false);
    }
    
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle navigation back to home
  const handleBackToHome = () => {
    const isFullscreen = window.location.pathname.includes('/full');
    const isMobile = window.innerWidth < 768;
    
    if (isFullscreen) {
      if (isMobile) {
        // Mobile fullscreen: go directly to homepage
        navigate('/');
      } else {
        // Desktop fullscreen: go to popup mode
        navigate('/project/library');
      }
      return;
    }
    
    // Popup mode: animate exit then go to home
    setIsExiting(true);
    setTimeout(() => {
      navigate('/');
    }, 280);
  };

  const handleAddBook = async (title: string, senderNote?: string) => {
    const response = await fetch('/api/submit-book-suggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookTitle: title.trim(), senderNote: senderNote?.trim() || undefined }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to submit book suggestion');
    }
  };

  return (
    <>
      <div 
        ref={containerRef}
        className={`relative min-h-screen w-full bg-white transition-[opacity,transform] ${
          isExiting ? 'opacity-0 scale-[0.985]' : isEntering ? 'opacity-0 scale-[1.01]' : 'opacity-100 scale-100'
        }`} 
        style={{ 
          backgroundImage: "linear-gradient(90deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.02) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)",
          transitionDuration: isExiting ? '100ms' : '300ms',
          transitionTimingFunction: isExiting ? 'cubic-bezier(0.4, 0, 0.2, 1)' : 'ease-out'
        }}
      >
        {/* Info Button - scrolls with content */}
        <InfoButton project={projectInfo} />

        {/* Logo - scrolls with content */}
        <div className="absolute top-0 left-0 pt-8 px-6 md:px-16 z-10">
          <button
            ref={logoRef}
            onClick={handleBackToHome}
            className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
            aria-label="Go back to home"
          >
            <img
              src={imgLogo}
              alt="Michelle Liu Logo"
              className="size-8 md:size-[44px] object-contain"
            />
          </button>
        </div>

        {/* Header */}
        <div className="pt-8 px-8 md:px-16">
          <div className="flex flex-col gap-10 md:gap-12 items-start pb-5 md:pb-6">
            {/* Logo spacer - matches the logo size */}
            <div className="size-8 md:size-[44px] shrink-0" />
          
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
                  <span className="font-['Michelle',sans-serif] font-medium text-base tracking-[0.01em] whitespace-nowrap text-gray-500">
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
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div 
                  className={clsx(
                    "absolute left-0 top-[calc(100%+4px)] bg-white rounded-xl shadow-lg border border-gray-100 z-50 w-36 transition-all duration-200 ease-out",
                    showFilterDropdown ? "pointer-events-auto" : "pointer-events-none",
                    isDropdownVisible 
                      ? "opacity-100 translate-y-0" 
                      : "opacity-0 -translate-y-1"
                  )}
                >
                    <div className="flex flex-col gap-1 py-1.5 px-1.5">
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
                              if (posthogEnabled) {
                                posthog.capture("book_filter_changed", { filter: option.value });
                              }
                              setActiveFilter(option.value);
                              setShowFilterDropdown(false);
                            }}
                            className={clsx(
                              "flex items-center px-3 py-1 rounded-[10px] transition-colors text-left",
                              isActive ? "bg-gray-100" : "hover:bg-gray-50"
                            )}
                          >
                            <span className={clsx(
                              "font-['Michelle',sans-serif] font-medium text-base tracking-[0.01em]",
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
              onClick={() => {
                if (!showAddBookModal) {
                  setShowAddBookModal(true);
                }
              }}
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
      <div className={`px-8 md:px-16 pb-[60px] md:pb-[100px] ${isPopupMode ? 'pt-3 md:pt-4' : 'pt-6 md:pt-8'}`}>
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
              className="library-book-grid grid grid-cols-4 gap-x-8 gap-y-2 md:grid-cols-[repeat(4,auto)] md:gap-x-0 md:gap-y-8 md:justify-between lg:grid-cols-[repeat(5,auto)] xl:grid-cols-[repeat(6,auto)] w-full"
            >
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} onClick={() => {
                  if (posthogEnabled) {
                    posthog.capture("book_viewed", {
                      book_title: book.title,
                      book_rating: book.rating,
                      book_year: book.year,
                      is_favorite: book.isFavorite,
                    });
                  }
                  const slug = getBookSlug(book);
                  setSelectedBook(book);
                  const nextPath = openBookPath(slug);
                  if (window.location.pathname !== nextPath) {
                    window.history.pushState(null, '', nextPath);
                  }
                }} />
              ))}
            </div>
          )}
        </div>
      </div>

      </div>

      {/* Book Detail Modal - outside transformed container for proper viewport centering */}
      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => {
            setSelectedBook(null);
            const closePath = closeBookPath();
            if (window.location.pathname !== closePath) {
              window.history.replaceState(null, '', closePath);
            }
          }}
          isPopupMode={isPopupMode}
        />
      )}
    </>
  );
}
