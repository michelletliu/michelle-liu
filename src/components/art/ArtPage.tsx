import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { ScrollReveal } from "../ScrollReveal";
import PageHeader from "../PageHeader";

// CSS for fade up animation
const fadeUpStyles = `
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-up {
  animation: fadeUp 400ms ease-out forwards;
}
`;
import Footer from "../Footer";
import HeaderBreakpoint from "./HeaderBreakpoint";
import ArtGallery from "./ArtGallery";
import ArtSidebar, { ArtCategory } from "./ArtSidebar";
import SketchbookGallery from "./SketchbookGallery";
import MuralGallery from "./MuralGallery";
import type { ArtCardData } from "./ArtCard";
import type { SketchbookData } from "./SketchbookGallery";
import type { MuralData } from "./MuralGallery";

// Sanity imports
import { client, urlFor } from "../../sanity/client";
import { ART_PIECES_QUERY, SKETCHBOOKS_QUERY, MURALS_QUERY } from "../../sanity/queries";
import { getCachedData } from "../../sanity/preload";
import type { ArtPiece, Sketchbook, Mural, ArtType } from "../../sanity/types";

type TagBackgroundImageAndTextProps = {
  text: string;
  active?: boolean;
  onClick?: () => void;
};

function TagBackgroundImageAndText({ text, active = false, onClick }: TagBackgroundImageAndTextProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "content-stretch flex items-center justify-center px-4 py-1 relative rounded-full shrink-0 cursor-pointer hover:bg-gray-100 transition-colors",
        active && "bg-[rgba(107,114,128,0.1)]"
      )}
    >
      <p
        className={clsx(
          "font-['Figtree',sans-serif] font-medium leading-normal relative shrink-0 text-lg text-nowrap",
          active ? "text-[#4b5563]" : "text-[#9ca3af]"
        )}
      >
        {text}
      </p>
    </button>
  );
}

// Transform Sanity data to component data formats
function transformArtPieces(sanityData: ArtPiece[]): ArtCardData[] {
  return sanityData.map((piece) => {
    const metadataParts = [piece.medium, piece.size, piece.year].filter(Boolean);
    const metadata = metadataParts.join(", ");

    return {
      id: piece._id,
      imageSrc: piece.image ? urlFor(piece.image).width(800).url() : "",
      title: piece.title,
      metadata: metadata || undefined,
    };
  });
}

function transformSketchbooks(sanityData: Sketchbook[]): SketchbookData[] {
  return sanityData.map((sketchbook) => ({
    id: sketchbook._id,
    title: sketchbook.title,
    sidebarLabel: sketchbook.sidebarLabel,
    date: sketchbook.date,
    images:
      sketchbook.images?.map((img) => ({
        id: img._key,
        imageSrc: img.asset ? urlFor(img).height(600).url() : "",
      })) || [],
  }));
}

function transformMurals(sanityData: Mural[]): MuralData[] {
  return sanityData.map((mural) => ({
    id: mural._id,
    title: mural.title,
    sidebarLabel: mural.sidebarLabel,
    location: mural.location,
    date: mural.date,
    description: mural.description,
    images:
      mural.images?.map((img) => ({
        id: img._key,
        imageSrc: img.asset ? urlFor(img).height(600).url() : "",
      })) || [],
  }));
}

// Group art pieces by type
function groupArtPiecesByType(pieces: ArtPiece[]): Record<ArtType, ArtPiece[]> {
  const grouped: Record<ArtType, ArtPiece[]> = {
    painting: [],
    conceptual: [],
    graphite: [],
  };

  pieces.forEach((piece) => {
    if (piece.artType && grouped[piece.artType]) {
      grouped[piece.artType].push(piece);
    }
  });

  return grouped;
}

export default function ArtPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<ArtCategory>("painting");
  const [activeSketchbookIndex, setActiveSketchbookIndex] = useState<number | undefined>(undefined);
  const [activeMuralIndex, setActiveMuralIndex] = useState<number | undefined>(undefined);

  // Track if hero animation has been played this session to prevent re-animation on tab switches
  const [heroAnimationPlayed, setHeroAnimationPlayed] = useState(() => {
    return sessionStorage.getItem('heroAnimationPlayed') === 'true';
  });
  
  useEffect(() => {
    if (!heroAnimationPlayed) {
      // Mark as played after a short delay to let the animation complete
      const timer = setTimeout(() => {
        sessionStorage.setItem('heroAnimationPlayed', 'true');
        setHeroAnimationPlayed(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [heroAnimationPlayed]);

  // Section refs for scrolling
  const paintingRef = useRef<HTMLDivElement>(null);
  const conceptualRef = useRef<HTMLDivElement>(null);
  const graphiteRef = useRef<HTMLDivElement>(null);
  const sketchbookRef = useRef<HTMLDivElement>(null);
  const muralsRef = useRef<HTMLDivElement>(null);
  
  // Individual sketchbook refs
  const sketchbookRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Individual mural refs
  const muralRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Sanity data state
  const [artPiecesByType, setArtPiecesByType] = useState<Record<ArtType, ArtCardData[]>>({
    painting: [],
    conceptual: [],
    graphite: [],
  });
  const [sketchbooks, setSketchbooks] = useState<SketchbookData[]>([]);
  const [murals, setMurals] = useState<MuralData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from Sanity (uses preloaded cache if available)
  useEffect(() => {
    async function fetchArtData() {
      try {
        setIsLoading(true);
        setError(null);

        // Check cache first (populated by preloadLikelyPages)
        const cachedArtPieces = getCachedData<ArtPiece[]>("art:pieces");
        const cachedSketchbooks = getCachedData<Sketchbook[]>("art:sketchbooks");
        const cachedMurals = getCachedData<Mural[]>("art:murals");

        // Fetch only what's not cached
        const [artPiecesData, sketchbooksData, muralsData] = await Promise.all([
          cachedArtPieces ?? client.fetch<ArtPiece[]>(ART_PIECES_QUERY),
          cachedSketchbooks ?? client.fetch<Sketchbook[]>(SKETCHBOOKS_QUERY),
          cachedMurals ?? client.fetch<Mural[]>(MURALS_QUERY),
        ]);

        // Group art pieces by type and transform
        const grouped = groupArtPiecesByType(artPiecesData || []);
        setArtPiecesByType({
          painting: transformArtPieces(grouped.painting),
          conceptual: transformArtPieces(grouped.conceptual),
          graphite: transformArtPieces(grouped.graphite),
        });
        setSketchbooks(transformSketchbooks(sketchbooksData || []));
        setMurals(transformMurals(muralsData || []));
      } catch (err) {
        console.error("Error fetching art data:", err);
        setError("Failed to load art content. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchArtData();
  }, []);

  // Scroll to section when category is clicked
  const handleCategoryClick = (category: ArtCategory) => {
    setActiveCategory(category);
    
    // Reset sketchbook index when clicking on sketchbook header or other categories
    if (category === "sketchbook") {
      setActiveSketchbookIndex(0); // Default to first sketchbook
      setActiveMuralIndex(undefined);
    } else if (category === "murals") {
      setActiveMuralIndex(0); // Default to first mural
      setActiveSketchbookIndex(undefined);
    } else {
      setActiveSketchbookIndex(undefined);
      setActiveMuralIndex(undefined);
    }

    const refMap: Record<ArtCategory, React.RefObject<HTMLDivElement | null>> = {
      painting: paintingRef,
      conceptual: conceptualRef,
      graphite: graphiteRef,
      sketchbook: sketchbookRef,
      murals: muralsRef,
    };

    const ref = refMap[category];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Scroll to specific sketchbook when subcategory is clicked
  const handleSketchbookClick = (index: number) => {
    setActiveCategory("sketchbook");
    setActiveSketchbookIndex(index);
    setActiveMuralIndex(undefined);
    
    const sketchbookElement = sketchbookRefs.current[index];
    if (sketchbookElement) {
      sketchbookElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Scroll to specific mural when subcategory is clicked
  const handleMuralClick = (index: number) => {
    setActiveCategory("murals");
    setActiveMuralIndex(index);
    setActiveSketchbookIndex(undefined);
    
    const muralElement = muralRefs.current[index];
    if (muralElement) {
      muralElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Track scroll position to update active category
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        { id: "painting" as ArtCategory, ref: paintingRef },
        { id: "conceptual" as ArtCategory, ref: conceptualRef },
        { id: "graphite" as ArtCategory, ref: graphiteRef },
        { id: "sketchbook" as ArtCategory, ref: sketchbookRef },
        { id: "murals" as ArtCategory, ref: muralsRef },
      ];

      // Use a threshold from the top of the viewport
      const viewportThreshold = 250; // pixels from top of viewport

      // Find the section that has scrolled past the threshold (from bottom to top order)
      // This selects the "topmost" section that's currently at or above the threshold
      let activeSection: ArtCategory | null = null;
      
      // Iterate from last section to first - find the last one that's above the threshold
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.ref.current) {
          const rect = section.ref.current.getBoundingClientRect();
          if (rect.top <= viewportThreshold) {
            activeSection = section.id;
            break;
          }
        }
      }
      
      // If no section has scrolled past threshold (we're at the very top), 
      // select the first visible section
      if (!activeSection) {
        for (const section of sections) {
          if (section.ref.current) {
            const rect = section.ref.current.getBoundingClientRect();
            // Select the first section that's visible in the viewport
            if (rect.top < window.innerHeight && rect.bottom > 0) {
              activeSection = section.id;
              break;
            }
          }
        }
      }

      // Update the state if we found an active section
      if (activeSection) {
        setActiveCategory(activeSection);
        
        // If in sketchbook section, determine which sketchbook is active
        if (activeSection === "sketchbook") {
          let foundSketchbookIndex = 0;
          for (let j = sketchbookRefs.current.length - 1; j >= 0; j--) {
            const sketchbookEl = sketchbookRefs.current[j];
            if (sketchbookEl) {
              const rect = sketchbookEl.getBoundingClientRect();
              if (rect.top <= viewportThreshold) {
                foundSketchbookIndex = j;
                break;
              }
            }
          }
          setActiveSketchbookIndex(foundSketchbookIndex);
          setActiveMuralIndex(undefined);
        } else if (activeSection === "murals") {
          // If in murals section, determine which mural is active
          let foundMuralIndex = 0;
          for (let j = muralRefs.current.length - 1; j >= 0; j--) {
            const muralEl = muralRefs.current[j];
            if (muralEl) {
              const rect = muralEl.getBoundingClientRect();
              if (rect.top <= viewportThreshold) {
                foundMuralIndex = j;
                break;
              }
            }
          }
          setActiveMuralIndex(foundMuralIndex);
          setActiveSketchbookIndex(undefined);
        } else {
          setActiveSketchbookIndex(undefined);
          setActiveMuralIndex(undefined);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    // Run once on mount to set initial state
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sketchbooks.length, murals.length]);

  const handleArtItemClick = (item: ArtCardData) => {
    console.log("Art item clicked:", item);
  };

  // Calculate counts for sidebar
  const categoryCounts = {
    painting: artPiecesByType.painting.length,
    conceptual: artPiecesByType.conceptual.length,
    graphite: artPiecesByType.graphite.length,
    sketchbook: sketchbooks.length,
    murals: murals.length,
  };

  return (
    <div className="bg-white flex flex-col items-center relative size-full min-h-screen">
      {/* Inject fade up animation styles */}
      <style>{fadeUpStyles}</style>
      
      {/* Header */}
      <PageHeader
        variant="art"
        heroAnimationPlayed={heroAnimationPlayed}
        nameAddon={
          <p className="font-['Figtree',sans-serif] font-normal text-gray-500 text-xl whitespace-pre-wrap">
            b. 2004
          </p>
        }
      >
        <div className="font-['Figtree',sans-serif] font-normal leading-7 max-md:leading-6 tracking-wide text-[#9ca3af] text-[1.2rem] max-md:text-[1.13rem] w-full whitespace-pre-wrap mt-1 max-md:mt-1">
          <p className="mb-0">Currently based in Los Angeles, CA.</p>
          <p>Also in between San Francisco &amp; New York City.</p>
        </div>
      </PageHeader>

      {/* Navigation */}
      <div className="content-stretch flex flex-col items-center pb-6 pt-0 px-0 relative shrink-0 w-full">
        <ScrollReveal variant="fade" delay={280} rootMargin="0px" className="relative shrink-0 w-full" disabled={heroAnimationPlayed}>
          <div className="size-full">
            <div className="content-stretch flex flex-col gap-3 items-start pb-0 pt-4 px-16 max-md:px-8 relative w-full">
              <div className="content-stretch flex gap-1 items-start relative shrink-0">
                <TagBackgroundImageAndText text="Work" onClick={() => navigate("/")} />
                <TagBackgroundImageAndText text="Art" active />
                <TagBackgroundImageAndText text="About" onClick={() => navigate("/about")} />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Divider line */}
        <div className="px-17 max-md:px-8 w-full pt-3">
          <div className="bg-zinc-100 h-px shrink-0 w-full" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-4 items-start px-16 max-md:px-8 pt-2 relative shrink-0 w-full">
        {/* Sidebar - stacks on top on mobile, left side on desktop */}
        <div className="lg:sticky lg:top-8 pb-4 lg:pb-8 w-full lg:w-[202px] shrink-0">
          <ArtSidebar
            activeCategory={activeCategory}
            onCategoryClick={handleCategoryClick}
            counts={categoryCounts}
            sketchbookLabels={sketchbooks.map((s) => 
              s.sidebarLabel || s.title.split(" ")[0].toUpperCase()
            )}
            sketchbookImageCounts={sketchbooks.map((s) => s.images.length)}
            activeSketchbookIndex={activeSketchbookIndex}
            onSketchbookClick={handleSketchbookClick}
            muralLabels={murals.map((m) => 
              m.sidebarLabel || m.title.split(" ")[0].toUpperCase()
            )}
            activeMuralIndex={activeMuralIndex}
            onMuralClick={handleMuralClick}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-12 items-start justify-center pb-8 min-w-0 w-full">
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center w-full py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                <p className="text-gray-400 text-base">Loading artwork...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex items-center justify-center w-full py-20">
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-gray-600 text-base">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          {!isLoading && !error && (
            <>
              {/* Painting Section */}
              <section ref={paintingRef} className="flex flex-col gap-4 items-start w-full">
                <ScrollReveal variant="fade" className="w-full">
                  <HeaderBreakpoint text="Painting" />
                </ScrollReveal>
                {artPiecesByType.painting.length > 0 ? (
                  <ScrollReveal delay={120}>
                    <ArtGallery 
                      items={artPiecesByType.painting} 
                      onItemClick={handleArtItemClick}
                    />
                  </ScrollReveal>
                ) : (
                  <p className="text-gray-400 text-sm py-8">No paintings yet.</p>
                )}
              </section>

              {/* Conceptual Section */}
              <section ref={conceptualRef} className="flex flex-col gap-4 items-start w-full">
                <ScrollReveal variant="fade" className="w-full">
                  <HeaderBreakpoint text="Conceptual" />
                </ScrollReveal>
                {artPiecesByType.conceptual.length > 0 ? (
                  <ScrollReveal delay={120}>
                    <ArtGallery 
                      items={artPiecesByType.conceptual} 
                      onItemClick={handleArtItemClick}
                    />
                  </ScrollReveal>
                ) : (
                  <p className="text-gray-400 text-sm py-8">No conceptual pieces yet.</p>
                )}
              </section>

              {/* Graphite Section */}
              <section ref={graphiteRef} className="flex flex-col gap-4 items-start w-full">
                <ScrollReveal variant="fade" className="w-full">
                  <HeaderBreakpoint text="Graphite" />
                </ScrollReveal>
                {artPiecesByType.graphite.length > 0 ? (
                  <ScrollReveal delay={120}>
                    <ArtGallery 
                      items={artPiecesByType.graphite} 
                      onItemClick={handleArtItemClick}
                    />
                  </ScrollReveal>
                ) : (
                  <p className="text-gray-400 text-sm py-8">No graphite drawings yet.</p>
                )}
              </section>

              {/* Sketchbook Section */}
              <section ref={sketchbookRef} className="flex flex-col gap-4 items-start w-full">
                <ScrollReveal variant="fade" className="w-full">
                  <HeaderBreakpoint className="-mb-4" text="Sketchbook" />
                </ScrollReveal>
                {sketchbooks.length > 0 ? (
                  <div className="flex flex-col gap-8 py-8 w-full">
                    {sketchbooks.map((sketchbook, index) => (
                      <ScrollReveal
                        key={sketchbook.id}
                        delay={index * 120}
                      >
                        <div ref={(el) => { sketchbookRefs.current[index] = el; }}>
                          <SketchbookGallery data={sketchbook} />
                        </div>
                      </ScrollReveal>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm py-8">No sketchbooks yet.</p>
                )}
              </section>

              {/* Murals Section */}
              <section ref={muralsRef} className="flex flex-col gap-4 items-start w-full">
                <ScrollReveal variant="fade" className="w-full">
                  <HeaderBreakpoint className="-mb-4" text="Murals" />
                </ScrollReveal>
                {murals.length > 0 ? (
                  <div className="flex flex-col gap-8 py-8 w-full">
                    {murals.map((mural, index) => (
                      <ScrollReveal
                        key={mural.id}
                        delay={index * 120}
                      >
                        <div ref={(el) => { muralRefs.current[index] = el; }}>
                          <MuralGallery data={mural} />
                        </div>
                      </ScrollReveal>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm py-8">No murals yet.</p>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

