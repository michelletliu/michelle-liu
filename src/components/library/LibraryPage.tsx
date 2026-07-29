"use client";

import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "@/lib/navigation";
import {
  pushPathPreservingSearch,
  replacePathPreservingSearch,
} from "@/lib/shallowPath";
import { client, urlFor } from "../../sanity/client";
import { SHELF_BOOKS_QUERY, BOOK_YEARS_QUERY } from "../../sanity/queries";
import { BookCard } from "./BookCard";
import { BookDetailModal } from "./BookDetailModal";
import { AddBookModal } from "./AddBookModal";
import { PlusIcon } from "./icons";
import type { Book, ShelfBookData } from "./types";
import { booksForShelf } from "./sortBooks";
import imgLogo from '../../assets/logo.png';
import InfoButton from '../InfoButton';
import { useExperimentProject } from '../../hooks/useExperimentProject';
import { FilterDropdown } from '../FilterDropdown';
import type { FilterDropdownOption } from '../FilterDropdown';
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

export default function LibraryPage({
  bookSlug: bookSlugProp,
  isFullscreen = false,
  onCollapse,
  onOpenBookInFullscreen,
  onBookSlugChange,
}: {
  bookSlug?: string;
  isFullscreen?: boolean;
  onCollapse?: () => void;
  onOpenBookInFullscreen?: (slug: string) => void;
  onBookSlugChange?: (slug?: string, options?: { replace?: boolean }) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive bookSlug from URL if not passed as prop (e.g. when rendered inside ExperimentModal)
  const bookSlugFromPath = (path: string) => {
    const fullMatch = path.match(/\/project\/library\/full\/(.+)/);
    if (fullMatch) return decodeURIComponent(fullMatch[1]);
    const directMatch = path.match(/\/library\/(.+)/);
    if (directMatch) return decodeURIComponent(directMatch[1]);
    return undefined;
  };

  // Shallow history updates don't notify usePathname — keep a local copy so the
  // modal still opens when we pushState instead of router.push.
  const [shallowBookSlug, setShallowBookSlug] = useState<string | undefined>(() =>
    bookSlugProp ?? bookSlugFromPath(location.pathname),
  );

  useEffect(() => {
    if (bookSlugProp !== undefined) {
      setShallowBookSlug(bookSlugProp);
      return;
    }
    setShallowBookSlug(bookSlugFromPath(location.pathname));
  }, [bookSlugProp, location.pathname]);

  useEffect(() => {
    if (bookSlugProp !== undefined) return;
    const onPopState = () => {
      setShallowBookSlug(bookSlugFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [bookSlugProp]);

  const bookSlug = bookSlugProp ?? shallowBookSlug;
  const [searchParams, setSearchParams] = useSearchParams();
  const isEmbedded = Boolean(onCollapse || onOpenBookInFullscreen || onBookSlugChange);
  const isPopupMode = isEmbedded && !isFullscreen;
  
  // Fetch project info from Sanity (with fallback to defaults)
  const projectInfo = useExperimentProject('library', DEFAULT_LIBRARY_PROJECT);
  const [books, setBooks] = useState<Book[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterDropdownOption[]>([{ value: 'favorites', label: 'favorites' }]);
  const [activeFilter, setActiveFilter] = useState<string>("favorites");
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const logoRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const didInitFilterRef = useRef(false);

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

  const updateStandaloneLibraryPath = (nextPath: string, options?: { replace?: boolean }) => {
    if (typeof window !== "undefined") {
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const target = `${nextPath}${window.location.search}${window.location.hash}`;
      if (current === target) return;
    }

    // Standalone /library and /project/library book opens need shallow history
    // updates — router.push across the bookSlug segment remounts the page and
    // flashes the loading state.
    if (
      (!isEmbedded && nextPath.startsWith("/library")) ||
      nextPath.startsWith("/project/library")
    ) {
      if (options?.replace) {
        replacePathPreservingSearch(nextPath);
      } else {
        pushPathPreservingSearch(nextPath);
      }
      return;
    }

    navigate(nextPath, { replace: options?.replace });
  };

  const selectedBook = (() => {
    if (!bookSlug || books.length === 0) return null;
    return findBookBySlug(decodeURIComponent(bookSlug)) ?? null;
  })();

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
        const transformedBooksForCounts = booksData.map(transformShelfBook);
        const favCount = transformedBooksForCounts.filter(b => b.isFavorite).length;
        const options: FilterDropdownOption[] = [
          { value: 'favorites', label: 'favorites', count: favCount },
          { value: 'all', label: 'all', count: transformedBooksForCounts.length },
          ...yearsData.map(year => ({ value: year, label: year, count: transformedBooksForCounts.filter(b => b.year === year).length }))
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

  // Sync the active filter with the URL (?shelf=). On first load, adopt a valid
  // ?shelf= value from the URL; afterwards, keep the URL in sync with the active
  // filter. Query writes use the live address-bar path so a shallow book-open
  // isn't clobbered by a stale usePathname(), and History API so restoring
  // ?shelf= doesn't trigger a Next soft-navigation flicker.
  // "favorites" is the default shelf, so it stays out of the URL for a clean link.
  useEffect(() => {
    const livePath =
      typeof window !== "undefined" ? window.location.pathname : location.pathname;
    const isLibraryPath =
      livePath === "/library" ||
      livePath.startsWith("/library/") ||
      livePath.startsWith("/project/library");
    if (!isLibraryPath) return;

    // First pass: adopt the filter from the URL, then let state settle.
    if (!didInitFilterRef.current) {
      if (isLoading) return;
      didInitFilterRef.current = true;
      const shelf =
        (typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("shelf")
          : null) ?? searchParams.get("shelf");
      if (shelf && filterOptions.some((option) => option.value === shelf)) {
        setActiveFilter(shelf);
        return;
      }
    }

    const current =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("shelf")
        : searchParams.get("shelf");
    const desired = activeFilter === "favorites" ? null : activeFilter;
    if ((current ?? null) === (desired ?? null)) return;

    const next = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : searchParams.toString(),
    );
    if (desired) next.set("shelf", desired);
    else next.delete("shelf");
    const qs = next.toString();
    const url = qs ? `${livePath}?${qs}` : livePath;
    window.history.replaceState(null, "", url);
  }, [activeFilter, isLoading, filterOptions, location.pathname, searchParams]);

  const filteredBooks = booksForShelf(books, activeFilter);

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
      setSearchParams({}, { replace: true });
      if (onBookSlugChange && location.pathname.startsWith("/project/library/full")) {
        onBookSlugChange(slug, { replace: true });
      } else {
        const targetPath = openBookPath(slug);
        updateStandaloneLibraryPath(targetPath, { replace: true });
      }
    }
  }, [searchParams, books, selectedBook, setSearchParams, location.pathname, navigate, isPopupMode, onBookSlugChange, isEmbedded]);

  // Handle entrance animation and reset exit state when in fullscreen
  useEffect(() => {
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
    const pathname = window.location.pathname;
    const isFullscreen = pathname.includes('/full');
    const isMobile = window.innerWidth < 768;
    const hasBookOpen = pathname.match(/\/full\/.+/);
    
    if (isFullscreen) {
      if (hasBookOpen) {
        // Book detail open → close book, stay on fullscreen library
        if (onBookSlugChange && pathname.startsWith("/project/library/full")) {
          onBookSlugChange(undefined, { replace: true });
        } else {
          const closePath = closeBookPath();
          updateStandaloneLibraryPath(closePath, { replace: true });
        }
      } else if (isMobile) {
        navigate('/');
      } else if (onCollapse) {
        onCollapse();
      } else {
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
        className={`relative z-[41] min-h-screen w-full bg-white transition-[opacity,transform] ${
          isExiting ? 'opacity-0 scale-[0.985]' : isEntering ? 'opacity-0 scale-[1.01]' : 'opacity-100 scale-100'
        }`} 
        style={{ 
          backgroundImage: "linear-gradient(90deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.02) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)",
          transitionDuration: isExiting ? '100ms' : '300ms',
          transitionTimingFunction: isExiting ? 'cubic-bezier(0.4, 0, 0.2, 1)' : 'ease-out'
        }}
      >
        {/* Top white gradient - sticky so it follows scroll, below logo (z-[5] < z-10) */}
        <div className="hidden md:block sticky top-0 left-0 right-0 h-32 -mb-32 pointer-events-none z-[5]" style={{
          background: 'linear-gradient(180deg, hsla(0,0%,100%,.5) 0%, hsla(0,0%,100%,.369) 19%, hsla(0,0%,100%,.271) 34%, hsla(0,0%,100%,.191) 47%, hsla(0,0%,100%,.139) 56.5%, hsla(0,0%,100%,.097) 65%, hsla(0,0%,100%,.063) 73%, hsla(0,0%,100%,.038) 80.2%, hsla(0,0%,100%,.021) 86.1%, hsla(0,0%,100%,.011) 91%, hsla(0,0%,100%,.004) 95.2%, hsla(0,0%,100%,.001) 98.2%, transparent 100%)'
        }} />

        {/* Info Button - scrolls with content */}
        <InfoButton project={projectInfo} />

        {/* Logo */}
        <div className="absolute top-0 left-0 pt-8 px-6 md:px-16 z-20">
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
        <div className="pt-8 px-8 md:px-16 relative z-10">
          <div className="flex flex-col gap-10 md:gap-12 items-start pb-5 md:pb-6">
            {/* Logo spacer - matches the logo size */}
            <div className="size-8 md:size-[44px] shrink-0" />
          
          <div className="flex items-start justify-between w-full">
          {/* Title and Filter */}
          <div className="flex flex-col gap-3 items-start shrink-0">
            <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-normal relative shrink-0 text-3xl text-zinc-900" style={{ fontVariationSettings: "'wdth' 100" }}>
              library
            </p>
            <FilterDropdown
                options={filterOptions}
                activeValue={activeFilter}
                onChange={(value) => {
                  if (posthogEnabled) {
                    posthog.capture("book_filter_changed", { filter: value });
                  }
                  setActiveFilter(value);
                }}
              />
          </div>
          
          {/* Plus button and modal container */}
          <div className="relative">
            <button 
              onClick={() => {
                if (!showAddBookModal) {
                  setShowAddBookModal(true);
                }
              }}
              className="bg-zinc-500/10 content-stretch flex items-center justify-center rounded-full size-[36px] hover:bg-[rgba(0,0,0,0.1)] transition-all duration-300"
            >
              <div className={`flex items-center justify-center text-zinc-400 transition-transform duration-300 ${showAddBookModal ? 'rotate-45' : 'rotate-0'}`}>
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
                <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
                <p className="font-['SF_Pro:Regular',sans-serif] text-base text-[rgba(0,0,0,0.4)]">Loading books...</p>
              </div>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <p className="font-['SF_Pro:Regular',sans-serif] text-lg text-[rgba(0,0,0,0.4)]">
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
                  if (isPopupMode && window.innerWidth >= 768) {
                    if (onOpenBookInFullscreen) {
                      onOpenBookInFullscreen(slug);
                    } else {
                      navigate(`/project/library/full/${encodeURIComponent(slug)}`);
                    }
                  } else {
                    // Already fullscreen or standalone → update the route for the selected book
                    if (onBookSlugChange && location.pathname.startsWith("/project/library/full")) {
                      onBookSlugChange(slug);
                    } else {
                      setShallowBookSlug(slug);
                      const nextPath = openBookPath(slug);
                      updateStandaloneLibraryPath(nextPath);
                    }
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
            if (onBookSlugChange && location.pathname.startsWith("/project/library/full")) {
              onBookSlugChange(undefined, { replace: true });
            } else {
              setShallowBookSlug(undefined);
              const closePath = closeBookPath();
              updateStandaloneLibraryPath(closePath, { replace: true });
            }
          }}
          isPopupMode={isPopupMode && window.innerWidth < 768}
        />
      )}
    </>
  );
}
