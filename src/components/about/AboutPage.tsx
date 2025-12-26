import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { ScrollReveal } from "../ScrollReveal";

// Components
import ExperienceCard from "./ExperienceCard";
import CommunityCard from "./CommunityCard";
import ShelfSection from "./ShelfSection";
import LoreCard from "./LoreCard";
import MediaCard from "./MediaCard";
import AboutSidebar from "./AboutSidebar";
import Footer from "../Footer";

import type { AboutCategory, ShelfSubcategory, CommunitySidebarItem } from "./AboutSidebar";

// Assets
import imgFinalSealLogo1 from "../../assets/logo.png";
import grainTexture from "../../assets/Rectangle Grain 1.png";
import profilePic from "../../assets/Website Profile Pic.png";
import mapPinIcon from "../../assets/map-pin.svg";
import academicCapIcon from "../../assets/academic-cap.svg";

// Sanity
import { client, urlFor } from "../../sanity/client";
import {
  EXPERIENCES_QUERY,
  COMMUNITIES_QUERY,
  SHELF_ITEMS_QUERY,
  LORE_ITEMS_QUERY,
  QUOTES_QUERY,
} from "../../sanity/queries";
import type {
  Experience,
  Community,
  ShelfItem,
  LoreItem,
  AboutQuote,
} from "../../sanity/types";

// Types for component data
import type { ExperienceCardData } from "./ExperienceCard";
import type { CommunityCardData, CommunityPhoto as CommunityPhotoType } from "./CommunityCard";
import type { LoreCardData } from "./LoreCard";
import type { MediaCardData } from "./MediaCard";

// CSS for animations
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

function FinalSealLogoBackgroundImage({ additionalClassNames = "" }: { additionalClassNames?: string }) {
  return (
    <img
      alt="Michelle Liu Logo"
      className={clsx("object-contain pointer-events-none", additionalClassNames)}
      src={imgFinalSealLogo1}
    />
  );
}

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

// Profile photo component
function ProfilePhoto({ imageSrc, caption }: { imageSrc?: string; caption?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 w-72 md:w-76">
      <div className="rounded-lg overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Michelle Liu"
            className="w-full h-auto rounded-lg"
          />
        ) : (
          <div className="w-full aspect-[3/4] bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg" />
        )}
      </div>
      {caption && (
        <div className="px-6">
          <p className="text-sm text-gray-400 text-center">
            {caption}
          </p>
        </div>
      )}
    </div>
  );
}

// Transform functions for Sanity data
function transformExperiences(data: Experience[]): ExperienceCardData[] {
  return data.map((exp) => ({
    id: exp._id,
    logoSrc: exp.logo ? urlFor(exp.logo).width(200).url() : undefined,
    company: exp.company,
    role: exp.role,
    period: exp.period,
  }));
}

function transformCommunities(data: Community[]): CommunityCardData[] {
  return data.map((community) => ({
    id: community._id,
    logoSrc: community.logo ? urlFor(community.logo).width(200).url() : undefined,
    title: community.title,
    sidebarName: community.sidebarName,
    description: community.description,
    photos: community.photos?.map((photo): CommunityPhotoType => ({
      id: photo._key,
      imageSrc: photo.image ? urlFor(photo.image).width(1200).quality(90).url() : "",
      caption: photo.caption,
      rotation: photo.rotation,
      orientation: photo.orientation,
      yOffset: photo.yOffset,
      xOffset: photo.xOffset,
    })),
  }));
}

function transformShelfItems(data: ShelfItem[]): MediaCardData[] {
  return data.map((item) => ({
    id: item._id,
    imageSrc: item.cover ? urlFor(item.cover).width(300).url() : undefined,
    title: item.title,
    type: item.mediaType === "book" ? "Book" 
      : item.mediaType === "music" ? "Music" 
      : item.mediaType === "movie" ? "Movie"
      : "Book",
    year: item.year,
  }));
}

function transformLoreItems(data: LoreItem[]): LoreCardData[] {
  return data.map((item) => ({
    id: item._id,
    imageSrc: item.image ? urlFor(item.image).width(600).url() : undefined,
    imageBackground: item.imageBackground,
    headline: item.headline,
    date: item.date,
    description: item.description,
    link: item.link,
  }));
}

function transformQuotes(data: AboutQuote[]): MediaCardData[] {
  return data.map((quote) => ({
    id: quote._id,
    type: "Quote" as const,
    emoji: quote.emoji,
    quoteTitle: quote.title,
    quoteText: quote.text,
    quoteUnderlinedText: quote.underlinedText,
    quoteAuthor: quote.author,
  }));
}

export default function AboutPage() {
  const navigate = useNavigate();

  // Track if hero animation has been played this session
  const [heroAnimationPlayed, setHeroAnimationPlayed] = useState(() => {
    return sessionStorage.getItem('heroAnimationPlayed') === 'true';
  });

  useEffect(() => {
    if (!heroAnimationPlayed) {
      const timer = setTimeout(() => {
        sessionStorage.setItem('heroAnimationPlayed', 'true');
        setHeroAnimationPlayed(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [heroAnimationPlayed]);

  // Active category for sidebar
  const [activeCategory, setActiveCategory] = useState<AboutCategory>("hi");

  // Section refs for scrolling
  const hiRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);
  const communityRef = useRef<HTMLDivElement>(null);
  const philosophyRef = useRef<HTMLDivElement>(null);
  const shelfRef = useRef<HTMLDivElement>(null);
  const loreRef = useRef<HTMLDivElement>(null);
  
  // Shelf subcategory refs
  const booksRef = useRef<HTMLDivElement>(null);
  const musicRef = useRef<HTMLDivElement>(null);
  const moviesRef = useRef<HTMLDivElement>(null);
  
  // Badge expansion state - animates from dot to full on scroll
  const badgeRef = useRef<HTMLSpanElement>(null);
  const [badgeExpanded, setBadgeExpanded] = useState(false);
  
  // Active community ID state (will be set to first community when data loads)
  const [activeCommunityId, setActiveCommunityId] = useState<string | undefined>();
  
  // Active shelf subcategory state
  const [activeShelfSubcategory, setActiveShelfSubcategory] = useState<ShelfSubcategory>("books");

  // Sanity data state
  const [experiences, setExperiences] = useState<ExperienceCardData[]>([]);
  const [communities, setCommunities] = useState<CommunityCardData[]>([]);
  const [shelfItems, setShelfItems] = useState<MediaCardData[]>([]);
  const [quotes, setQuotes] = useState<MediaCardData[]>([]);
  const [loreItems, setLoreItems] = useState<LoreCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Shelf year filter state (for books and movies)
  const [activeBooksYear, setActiveBooksYear] = useState<string | undefined>();
  const [activeMoviesYear, setActiveMoviesYear] = useState<string | undefined>();

  // Fetch data from Sanity
  useEffect(() => {
    async function fetchAboutData() {
      try {
        setIsLoading(true);

        const [
          experiencesData,
          communitiesData,
          shelfItemsData,
          quotesData,
          loreItemsData,
        ] = await Promise.all([
          client.fetch<Experience[]>(EXPERIENCES_QUERY),
          client.fetch<Community[]>(COMMUNITIES_QUERY),
          client.fetch<ShelfItem[]>(SHELF_ITEMS_QUERY),
          client.fetch<AboutQuote[]>(QUOTES_QUERY),
          client.fetch<LoreItem[]>(LORE_ITEMS_QUERY),
        ]);

        setExperiences(transformExperiences(experiencesData || []));
        setCommunities(transformCommunities(communitiesData || []));
        setShelfItems(transformShelfItems(shelfItemsData || []));
        setQuotes(transformQuotes(quotesData || []));
        setLoreItems(transformLoreItems(loreItemsData || []));
      } catch (err) {
        console.error("Error fetching about data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAboutData();
  }, []);

  // Set first community as active when communities load
  useEffect(() => {
    if (communities.length > 0 && !activeCommunityId) {
      const firstWithSidebarName = communities.find(c => c.sidebarName);
      if (firstWithSidebarName) {
        setActiveCommunityId(firstWithSidebarName.id);
      }
    }
  }, [communities, activeCommunityId]);

  // Badge scroll-triggered expansion animation
  useEffect(() => {
    const badge = badgeRef.current;
    if (!badge) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !badgeExpanded) {
            // Delay the expansion slightly for a nice effect
            setTimeout(() => {
              setBadgeExpanded(true);
            }, 400);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(badge);

    return () => {
      observer.disconnect();
    };
  }, [badgeExpanded]);

  // Handle category click - scroll to section
  const handleCategoryClick = (category: AboutCategory) => {
    setActiveCategory(category);
    const refMap: Record<AboutCategory, React.RefObject<HTMLDivElement | null>> = {
      hi: hiRef,
      experience: experienceRef,
      community: communityRef,
      philosophy: philosophyRef,
      shelf: shelfRef,
      lore: loreRef,
    };
    const ref = refMap[category];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Handle community click - scroll to community section
  const handleCommunityClick = (communityId: string) => {
    setActiveCommunityId(communityId);
    // For now, all communities are in the same section, so scroll to community
    if (communityRef?.current) {
      communityRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Handle shelf subcategory click - scroll to specific shelf section
  const handleShelfSubcategoryClick = (subcategory: ShelfSubcategory) => {
    setActiveShelfSubcategory(subcategory);
    const refMap: Record<ShelfSubcategory, React.RefObject<HTMLDivElement | null>> = {
      books: booksRef,
      music: musicRef,
      movies: moviesRef,
    };
    const ref = refMap[subcategory];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Track scroll position to update active category
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        { id: "hi" as AboutCategory, ref: hiRef },
        { id: "experience" as AboutCategory, ref: experienceRef },
        { id: "community" as AboutCategory, ref: communityRef },
        { id: "philosophy" as AboutCategory, ref: philosophyRef },
        { id: "shelf" as AboutCategory, ref: shelfRef },
        { id: "lore" as AboutCategory, ref: loreRef },
      ];

      const viewportThreshold = 250;
      let activeSection: AboutCategory | null = null;

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

      if (!activeSection) {
        for (const section of sections) {
          if (section.ref.current) {
            const rect = section.ref.current.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
              activeSection = section.id;
              break;
            }
          }
        }
      }

      if (activeSection) {
        setActiveCategory(activeSection);
        
        // If shelf is active, also track which shelf subcategory is in view
        if (activeSection === "shelf") {
          const shelfSubsections = [
            { id: "books" as ShelfSubcategory, ref: booksRef },
            { id: "music" as ShelfSubcategory, ref: musicRef },
            { id: "movies" as ShelfSubcategory, ref: moviesRef },
          ];
          
          let activeSubcategory: ShelfSubcategory | null = null;
          
          for (let i = shelfSubsections.length - 1; i >= 0; i--) {
            const subsection = shelfSubsections[i];
            if (subsection.ref.current) {
              const rect = subsection.ref.current.getBoundingClientRect();
              if (rect.top <= viewportThreshold) {
                activeSubcategory = subsection.id;
                break;
              }
            }
          }
          
          if (!activeSubcategory) {
            for (const subsection of shelfSubsections) {
              if (subsection.ref.current) {
                const rect = subsection.ref.current.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                  activeSubcategory = subsection.id;
                  break;
                }
              }
            }
          }
          
          if (activeSubcategory) {
            setActiveShelfSubcategory(activeSubcategory);
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter shelf items by media type
  const bookItems = shelfItems.filter((item) => item.type === "Book");
  const musicItems = shelfItems.filter((item) => item.type === "Music");
  const movieItems = shelfItems.filter((item) => item.type === "Movie");

  // Get unique years for filtering (from the year field on items)
  const getYearsWithCounts = (items: MediaCardData[]) => {
    const yearCounts: Record<string, number> = {};
    items.forEach((item) => {
      if (item.year) {
        yearCounts[item.year] = (yearCounts[item.year] || 0) + 1;
      }
    });
    return Object.entries(yearCounts)
      .sort(([a], [b]) => Number(b) - Number(a)) // Sort descending
      .map(([year, count]) => ({ year, count }));
  };

  const bookYears = getYearsWithCounts(bookItems);
  const movieYears = getYearsWithCounts(movieItems);

  return (
    <div className="bg-white flex flex-col items-center relative size-full min-h-screen">
      {/* Inject fade up animation styles */}
      <style>{fadeUpStyles}</style>

      {/* Header */}
      <div
        className="content-stretch flex flex-col items-start relative shrink-0 w-full"
        style={{
          backgroundImage:
            "linear-gradient(16deg, rgba(255, 255, 255, 1) 60%, rgba(243, 218, 255, 1) 81%, rgba(192, 221, 254, 1) 98%, rgba(154, 226, 244, 1) 100%)",
        }}
      >
        {/* Grain texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${grainTexture})`,
            backgroundRepeat: "repeat",
            backgroundSize: "auto",
            opacity: 0.8,
          }}
        />

        {/* Logo */}
        <div className="relative shrink-0 w-full z-[2]">
          <div className="size-full">
            <div className="content-stretch flex flex-col items-start px-16 pt-8 pb-8 max-md:px-8 max-md:pt-8 max-md:pb-4 relative w-full">
              <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
                <button onClick={() => navigate("/")} className="relative shrink-0 size-11 cursor-pointer">
                  <FinalSealLogoBackgroundImage additionalClassNames="size-full" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Text */}
        <div className="relative shrink-0 w-full z-[2]">
          <div className="size-full">
            <div className="content-stretch flex flex-col gap-4 items-start pb-6 pt-11 px-16 max-md:px-8 relative w-full">
              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                <ScrollReveal variant="fade" rootMargin="0px" disabled={heroAnimationPlayed}>
                  <p className="font-['Figtree',sans-serif] font-medium leading-normal text-[#374151] text-6xl max-md:text-5xl">
                    michelle liu
                  </p>
                </ScrollReveal>
                <ScrollReveal variant="fade" delay={150} rootMargin="0px">
                  <div className="font-['Figtree',sans-serif] font-normal leading-7 max-md:leading-6 tracking-wide text-[#9ca3af] text-[1.2rem] max-md:text-[1.13rem] w-full whitespace-pre-wrap -mt-2 max-md:mt-1">
                    <p>Product, design, &</p>
                    <p>every<span className="gradient-text-animated">thing in between. ⟡˙⋆</span></p>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="content-stretch flex flex-col items-center pb-4 pt-0 px-0 relative shrink-0 w-full">
        <ScrollReveal variant="fade" delay={280} rootMargin="0px" className="relative shrink-0 w-full" disabled={heroAnimationPlayed}>
          <div className="size-full">
            <div className="content-stretch flex flex-col gap-3 items-start pb-0 pt-4 px-16 max-md:px-8 relative w-full">
              <div className="content-stretch flex gap-1 items-start relative shrink-0">
                <TagBackgroundImageAndText text="Work" onClick={() => navigate("/")} />
                <TagBackgroundImageAndText text="Art" onClick={() => navigate("/art")} />
                <TagBackgroundImageAndText text="About" active />
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
        {/* Sidebar - hidden on mobile */}
        <div className="hidden lg:block lg:sticky lg:top-8 pb-4 lg:pb-8 w-[202px] shrink-0">
          <AboutSidebar
            activeCategory={activeCategory}
            onCategoryClick={handleCategoryClick}
            communityItems={communities
              .filter(c => c.sidebarName)
              .map(c => ({ id: c.id, sidebarName: c.sidebarName! }))}
            activeCommunityId={activeCommunityId}
            onCommunityClick={handleCommunityClick}
            activeShelfSubcategory={activeShelfSubcategory}
            onShelfSubcategoryClick={handleShelfSubcategoryClick}
            shelfCounts={{
              books: bookItems.length,
              music: musicItems.length,
              movies: movieItems.length,
            }}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-20 items-start pb-8 min-w-0 w-full">
          {/* HI! Section - Hardcoded */}
          <section ref={hiRef} className="flex flex-col md:flex-row gap-10 md:gap-16 items-start w-full max-w-5xl scroll-mt-8">
            {/* Profile Photo */}
            <ScrollReveal delay={100}>
              <div className="shrink-0">
                <ProfilePhoto
                    imageSrc={profilePic}
                    caption={
                      <>
                        A visit to the studio of one of my absolute favorite artists,{" "}
                        <a
                          href="https://artsandculture.google.com/story/artist-spotlight-hung-liu-national-museum-of-women-in-the-arts/3wVRJQ12cc4OEA?hl=en"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-700 transition-colors"
                        >
                          Hung Liu
                        </a>
                      </>
                    }
                  />
              </div>
            </ScrollReveal>

            {/* Bio Content */}
            <div className="flex flex-col pt-8 gap-6 flex-1">
              <ScrollReveal variant="fade" delay={150}>
                <h2 className="font-['Figtree',sans-serif] font-medium text-gray-600 text-3xl md:text-4xl">
                  Hi, I'm Michelle!
                </h2>
              </ScrollReveal>

              {/* Location & Education */}
              <ScrollReveal variant="fade" delay={200}>
                <div className="flex flex-wrap gap-2 md:gap-6 text-base tracking-wide font-medium text-gray-500">
                  <div className="flex items-center gap-2">
                    <img src={mapPinIcon} alt="" className="w-4 h-4" />
                    <span className="text-gray-400">SF — LA — NYC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={academicCapIcon} alt="" className="w-4 h-4" />
                    <span className="text-gray-400">B.A. Art, B.S. Cognitive Science - UCLA '26</span>
                  </div>
                </div>
              </ScrollReveal>

              {/* Bio Paragraphs */}
              <ScrollReveal variant="fade" delay={250}>
                <div className="flex flex-col gap-4 text-gray-500 text-base leading-relaxed">
                  <p>
                    I love art, business, technology, & the ways that they can work together to
                    create extraordinary products for people.
                  </p>
                  <p>
                    I believe thoughtful design makes life more intuitive (& beautiful). I want to
                    bring more of it into the world—whether through my creations or the
                    communities I'm helping to build. I like to think of it as my <a href="https://en.wikipedia.org/wiki/Ikigai" target="_blank" rel="noopener noreferrer" className="text-gray-700 font-medium no-underline hover:text-gray-800 transition-colors">ikigai</a>: the constant
                    pursuit of an intersection between passion, profession, and personal mission.
                  </p>
                  <p>
                    I also love discovering new hidden food spots, getting excited about
                    beautifully designed stationery, and listening to audiobooks on long drives.
                  </p>
                  <p>
                    3 words to describe me: <em>Golden Retriever Energy.</em> (even on the bad days)
                  </p>
                </div>
              </ScrollReveal>

              {/* CTA Badge - Animates from dot to full on scroll */}
              <ScrollReveal variant="fade" delay={300}>
                <span 
                  ref={badgeRef}
                  className={clsx(
                    "relative inline-flex items-center justify-center rounded-[999px] transition-all duration-[600ms] ease-out mt-2 w-fit",
                    badgeExpanded 
                      ? "gap-2 bg-[#ecfdf5] pl-1.5 pr-3.5 py-1" 
                      : "gap-0 bg-transparent p-0"
                  )}
                >
                  <span className="relative shrink-0 size-[16px] overflow-visible">
                    {/* Pulsing ring behind the badge - only when minimized */}
                    <span className={badgeExpanded ? "green-pulse-ring-off" : "green-pulse-ring"} />
                    <svg className="block size-full relative z-10" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                      <g id="Background">
                        <rect fill="var(--fill-0, #A7F3D0)" height="16" rx="8" width="16" />
                        <circle cx="8" cy="8" fill="var(--fill-0, #10B981)" id="Ellipse 1" r="4" />
                      </g>
                    </svg>
                  </span>
                  <span className={clsx(
                    "font-['Figtree:Medium',sans-serif] font-normal text-[#10b981] text-base text-nowrap overflow-hidden transition-all duration-[600ms] ease-out",
                    badgeExpanded ? "max-w-[500px] opacity-100" : "max-w-0 opacity-0"
                  )}>
                    <span>Working on something cool? Get in</span>{" "}
                    <a href="mailto:michelletheresaliu@gmail.com" className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid underline hover:!text-emerald-600 transition-colors">touch</a>!
                  </span>
                </span>
              </ScrollReveal>
            </div>
          </section>

          {/* Experience Section */}
          <section ref={experienceRef} className="flex flex-col gap-16 md:flex-row md:justify-between md:gap-0 w-full scroll-mt-8">
            <ScrollReveal variant="fade">
              <h2 className="font-['Figtree',sans-serif] font-medium text-gray-700 text-[40px] leading-normal shrink-0">
                Experience
              </h2>
            </ScrollReveal>
            {isLoading ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
                <span className="text-gray-400 text-sm">Loading...</span>
              </div>
            ) : experiences.length > 0 ? (
              <div className="flex flex-col gap-8 md:gap-8 w-full md:w-[560px]">
                {experiences.map((exp, index) => (
                  <ScrollReveal key={exp.id} delay={index * 80}>
                    <ExperienceCard data={exp} />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm py-4">Add experience items in Sanity Studio.</p>
            )}
          </section>

          {/* Community Section */}
          <section ref={communityRef} className="flex flex-col gap-8 w-full scroll-mt-8">
            <ScrollReveal variant="fade">
              <div className="flex flex-col">
                <h2 className="font-['Figtree',sans-serif] font-medium text-gray-600 text-[40px] leading-normal shrink-0">
                  My Communities
                </h2>
                <p className="font-['Figtree',sans-serif] font-normal text-gray-400 text-xl">
                  The people who make it all worth it
                </p>
              </div>
            </ScrollReveal>
            {isLoading ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
                <span className="text-gray-400 text-sm">Loading...</span>
              </div>
            ) : communities.length > 0 ? (
              <div className="flex flex-col gap-12 pt-4">
                {communities.map((community, index) => (
                  <ScrollReveal key={community.id} delay={index * 100}>
                    <CommunityCard data={community} />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm py-4">Add community items in Sanity Studio.</p>
            )}
          </section>

          {/* Philosophy Section - Hardcoded placeholder */}
          <section ref={philosophyRef} className="flex flex-col gap-12 w-full scroll-mt-8">
            <ScrollReveal variant="fade">
              <div className="flex flex-col">
                <h2 className="font-['Figtree',sans-serif] font-medium text-gray-600 text-[40px] leading-normal shrink-0">
                  My Favorite Quotes
                </h2>
                <p className="font-['Figtree',sans-serif] font-normal text-gray-400 text-xl">
                  a.k.a. my Design ( + Life ) Philosophy
                </p>
              </div>
            </ScrollReveal>
            {quotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quotes.map((quote, index) => (
                  <ScrollReveal key={quote.id} delay={index * 80}>
                    <MediaCard data={quote} />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm py-4">Add quotes in Sanity Studio.</p>
            )}
          </section>

          {/* Shelf Section */}
          <section ref={shelfRef} className="flex flex-col gap-6 w-full scroll-mt-8">
            <ScrollReveal variant="fade">
              <div className="flex flex-col">
                <h2 className="font-['Figtree',sans-serif] font-medium text-gray-600 text-[40px] leading-normal shrink-0">
                  Shelf
                </h2>
                <p className="font-['Figtree',sans-serif] font-medium text-gray-400 text-xl">
                  ★ - Favorites
                </p>
              </div>
            </ScrollReveal>
            
            {isLoading ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
                <span className="text-gray-400 text-sm">Loading...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {/* Books Shelf */}
                <div ref={booksRef} className="scroll-mt-8">
                  <ScrollReveal delay={100}>
                    <ShelfSection
                      title="★ BOOKS"
                      count={bookItems.length}
                      mediaType="book"
                      yearFilters={bookYears}
                      activeYear={activeBooksYear}
                      onYearChange={setActiveBooksYear}
                      externalLink={{ label: "Goodreads", href: "https://www.goodreads.com/user/show/126741914-michelletliu" }}
                      items={bookItems}
                      itemCount={5}
                      onItemClick={(item) => console.log("Book clicked:", item)}
                    />
                  </ScrollReveal>
                </div>

                {/* Music Shelf */}
                <div ref={musicRef} className="scroll-mt-8">
                  <ScrollReveal delay={200}>
                    <ShelfSection
                      title="★ MUSIC"
                      count={musicItems.length}
                      mediaType="music"
                      externalLink={{ label: "Spotify", href: "https://open.spotify.com/user/i4stx92bb6e14vmhqe5tl8az6?si=3b9ee8fc1b3a4784" }}
                      items={musicItems}
                      itemCount={5}
                      onItemClick={(item) => console.log("Music clicked:", item)}
                    />
                  </ScrollReveal>
                </div>

                {/* Movies Shelf */}
                <div ref={moviesRef} className="scroll-mt-8">
                  <ScrollReveal delay={300}>
                    <ShelfSection
                      title="★ MOVIES"
                      count={movieItems.length}
                      mediaType="movie"
                      yearFilters={movieYears}
                      activeYear={activeMoviesYear}
                      onYearChange={setActiveMoviesYear}
                      externalLink={{ label: "Letterboxd", href: "https://letterboxd.com/LiuMichelle/" }}
                      items={movieItems}
                      itemCount={5}
                      onItemClick={(item) => console.log("Movie clicked:", item)}
                    />
                  </ScrollReveal>
                </div>
              </div>
            )}
          </section>

          {/* Lore Section */}
          <section ref={loreRef} className="flex flex-col gap-6 w-full scroll-mt-8">
            <ScrollReveal variant="fade">
              <h2 className="font-['Figtree',sans-serif] font-medium text-gray-700 text-[40px] leading-normal shrink-0">
                Lore ⟡˙⋆
              </h2>
            </ScrollReveal>
            {isLoading ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
                <span className="text-gray-400 text-sm">Loading...</span>
              </div>
            ) : loreItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loreItems.map((lore, index) => (
                  <ScrollReveal key={lore.id} delay={index * 80}>
                    <LoreCard
                      data={lore}
                      onClick={() => console.log("Lore clicked:", lore)}
                    />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm py-4">Add lore items in Sanity Studio.</p>
            )}
          </section>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
