"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useScrollLock } from "../../utils/useScrollLock";
import { useNavigate } from "@/lib/navigation";
import clsx from "clsx";
import { ScrollReveal } from "../shared/ScrollReveal";
import PageHeader from "../layout/PageHeader";
import { useHeroAnimation } from "../../hooks/useHeroAnimation";
import { fadeUpStyles } from "../../styles/animations";
import SectionHeading from "../shared/SectionHeading";
import LoadingSpinner from "../shared/LoadingSpinner";

// Above-the-fold About chrome stays eager; heavier sections load as separate
// chunks so Work → About isn't blocked on Community/Shelf/Lore JS.
import ExperienceCard from "./ExperienceCard";
import StartupCard from "./StartupCard";
import AboutSidebar from "./AboutSidebar";
import Footer from "../layout/Footer";
import { ArrowUpRight } from "../icons/ArrowUpRight";
import { Chevron } from "../icons/Chevron";
import { iconSize } from "../shared/iconSizes";
import ContactBadge from "../shared/ContactBadge";
import NavigationTabs from "../layout/NavigationTabs";

import type { AboutCategory, ShelfSubcategory } from "./AboutSidebar";
import {
  ABOUT_SCROLL_THRESHOLD_PX,
  resolveAboutCategory,
} from "./aboutScrollSpy";
import {
  orderCommunitiesForDisplay,
  splitCommunityNav,
} from "./communityNav";

// Assets
import profilePic from "../../assets/Website Profile Pic.png";
import mapPinIcon from "../../assets/map-pin.svg";
import academicCapIcon from "../../assets/academic-cap.svg";
import heartIcon from "../../assets/HeartFill.svg";

// Sanity
import { client, urlFor } from "../../sanity/client";
import {
  EXPERIENCES_QUERY,
  COMMUNITIES_QUERY,
  SHELF_ITEMS_QUERY,
  LORE_ITEMS_QUERY,
  QUOTES_QUERY,
  STARTUPS_QUERY,
} from "../../sanity/queries";
import { getCachedData, setCachedData, preloadLikelyPages } from "../../sanity/preload";
import type {
  Experience,
  Community,
  ShelfItem,
  LoreItem,
  AboutQuote,
  Startup,
} from "../../sanity/types";

// Types for component data
import type { ExperienceCardData } from "./ExperienceCard";
import type { CommunityCardData, CommunityPhoto as CommunityPhotoType } from "./CommunityCard";
import type { LoreCardData } from "./LoreCard";
import type { StartupCardData } from "./StartupCard";
import type { MediaCardData } from "./MediaCard";
import {
  getShelfCoverDateLabel,
  resolveShelfCoverDateRaw,
} from "./shelfCoverDate";
import { Close } from "../icons/Close";
import { ghostIconButtonClass } from "../shared/ghostIconButton";

const CommunityCard = dynamic(() => import("./CommunityCard"));
const ShelfSection = dynamic(() => import("./ShelfSection"));
const LoreCard = dynamic(() => import("./LoreCard"));
const MediaCard = dynamic(() => import("./MediaCard"));

// fadeUpStyles imported from shared animations

function StartupLogosRow({
  startups,
  startDelay = 0,
  onRevealComplete,
}: {
  startups: StartupCardData[];
  startDelay?: number;
  onRevealComplete?: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      onRevealComplete?.();
      return;
    }

    let revealTimeout: ReturnType<typeof setTimeout> | undefined;
    let completionTimeout: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          revealTimeout = setTimeout(() => setRevealed(true), startDelay);
          completionTimeout = setTimeout(
            () => onRevealComplete?.(),
            startDelay + Math.max(0, startups.length - 1) * 40 + 400,
          );
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -20px 0px" }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (revealTimeout) clearTimeout(revealTimeout);
      if (completionTimeout) clearTimeout(completionTimeout);
    };
  }, [onRevealComplete, startDelay, startups.length]);

  return (
    <div
      ref={rowRef}
      className="mx-auto flex w-full max-w-[26rem] flex-wrap justify-between gap-y-6 px-3 md:mx-0 md:max-w-lg md:px-0"
    >
      {startups.map((startup, i) => (
        <div
          key={startup.id}
          className="w-14 md:w-auto"
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 400ms cubic-bezier(0.4,0,0.2,1), transform 300ms cubic-bezier(0.25,0.1,0.25,1)',
            transitionDelay: revealed ? `${i * 40}ms` : '0ms',
            willChange: revealed ? 'auto' : 'opacity, transform',
          }}
        >
          <StartupCard data={startup} />
        </div>
      ))}
    </div>
  );
}

// Profile photo component with expandable modal
function ProfilePhoto({ imageSrc, caption }: { imageSrc?: string; caption?: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useScrollLock(isExpanded);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsExpanded(false);
      setIsClosing(false);
    }, 200);
  }, [isClosing]);

  useEffect(() => {
    if (!isExpanded) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isExpanded, handleClose]);

  return (
    <>
      <div className="flex flex-col gap-3 w-72 md:w-76">
        <div
          className="rounded-lg overflow-hidden cursor-zoom-in"
          onClick={() => imageSrc && setIsExpanded(true)}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Michelle Liu"
              decoding="async"
              width={304}
              height={389}
              className="w-full h-auto rounded-lg transition-transform duration-200 ease-out hover:scale-[0.99]"
            />
          ) : (
            <div className="w-full aspect-[3/4] bg-gradient-to-br from-zinc-200 to-zinc-300 rounded-lg" />
          )}
        </div>
        {caption && (
          <div className="px-6">
            <p className="text-sm text-zinc-400 text-center">
              {caption}
            </p>
          </div>
        )}
      </div>

      {isExpanded && imageSrc && createPortal(
        <div
          className={`fixed inset-0 z-[99999] isolate flex items-center justify-center p-4 transition-opacity duration-200 ease-out ${isClosing ? 'opacity-0' : 'animate-[fadeIn_200ms_ease-out]'}`}
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-zinc-100/95" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className={`${ghostIconButtonClass("sm", "fixed right-4 top-4 z-10 text-zinc-500")} ${isClosing ? '' : 'animate-[fadeSlideDown_300ms_ease-out]'}`}
            aria-label="Close expanded photo"
          >
            <Close size="12px" />
          </button>

          <div
            className={`relative z-10 flex max-h-[85vh] max-w-[90vw] flex-col items-center transition-all duration-200 ease-out ${isClosing ? 'opacity-0 scale-95' : 'animate-[scaleIn_300ms_ease-out]'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex flex-col items-center gap-1">
              <div className="relative">
                <img
                  src={imageSrc}
                  alt="Michelle Liu"
                  className="object-contain rounded-lg max-h-[65vh] w-auto relative"
                />
              </div>
              {caption && (
                <p
                  className={`mt-6 max-w-[600px] text-center font-['Michelle',sans-serif] text-base tracking-[0.005em] font-normal leading-relaxed text-zinc-500 [&_a]:text-zinc-800 [&_a:hover]:text-zinc-900 ${isClosing ? '' : 'animate-[fadeSlideUp_300ms_ease-out_100ms_both]'}`}
                  style={{ fontVariationSettings: "'opsz' 9" }}
                >
                  {caption}
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
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
    isArchived: Boolean(community.isArchived),
    description: community.description,
    instagramUrl: community.instagramUrl,
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
  return data.map((item) => {
    const type =
      item.mediaType === "book"
        ? "Book"
        : item.mediaType === "music"
          ? "Music"
          : item.mediaType === "movie"
            ? "Movie"
            : "Book";

    const coverDateInput = {
      mediaType: item.mediaType,
      dateRead: item.dateRead,
      dateStarted: item.dateStarted,
      dateWatched: item.dateWatched,
      _createdAt: item._createdAt,
    };
    const coverDateRaw = resolveShelfCoverDateRaw(coverDateInput);
    const coverDateLabel = getShelfCoverDateLabel(coverDateInput);

    return {
      id: item._id,
      imageSrc: item.cover
        ? urlFor(item.cover).width(300).url()
        : item.externalCoverUrl || undefined,
      title: item.title,
      type,
      year: item.year,
      isFeatured: item.isFeatured,
      goodreadsUrl: item.goodreadsUrl,
      letterboxdSlug: item.letterboxdSlug,
      spotifyUrl: item.spotifyUrl,
      ...(coverDateRaw ? { coverDateRaw } : {}),
      ...(coverDateLabel ? { coverDateLabel } : {}),
    };
  });
}

function transformLoreItems(data: LoreItem[]): LoreCardData[] {
  const normalizeLoreLink = (link?: string) => {
    if (!link) return link;
    if (link.includes("instagram.com/https.croissant")) {
      return "https://www.instagram.com/studio.mliu";
    }
    return link;
  };

  return data.map((item) => ({
    id: item._id,
    imageSrc: item.image ? urlFor(item.image).width(600).url() : undefined,
    imageBackground: item.imageBackground,
    headline: item.headline,
    date: item.date,
    description: item.description,
    link: normalizeLoreLink(item.link),
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

function transformStartups(data: Startup[]): StartupCardData[] {
  return data.map((startup) => ({
    id: startup._id,
    logoSrc: startup.logo ? urlFor(startup.logo).width(200).url() : undefined,
    name: startup.name,
    link: startup.link,
  }));
}

function readCachedAboutPage(): {
  experiences: ExperienceCardData[];
  communities: CommunityCardData[];
  shelfItems: MediaCardData[];
  quotes: MediaCardData[];
  loreItems: LoreCardData[];
  startups: StartupCardData[];
} | null {
  const experiences = getCachedData<Experience[]>("about:experiences");
  const communities = getCachedData<Community[]>("about:communities");
  const shelfItems = getCachedData<ShelfItem[]>("about:shelfItems");
  const quotes = getCachedData<AboutQuote[]>("about:quotes");
  const loreItems = getCachedData<LoreItem[]>("about:loreItems");
  const startups = getCachedData<Startup[]>("about:startups");
  if (!experiences || !communities || !shelfItems || !quotes || !loreItems || !startups) {
    return null;
  }

  return {
    experiences: transformExperiences(experiences),
    communities: transformCommunities(communities),
    shelfItems: transformShelfItems(shelfItems),
    quotes: transformQuotes(quotes),
    loreItems: transformLoreItems(loreItems),
    startups: transformStartups(startups),
  };
}

export default function AboutPage() {
  const navigate = useNavigate();

  const heroAnimationPlayed = useHeroAnimation();

  // Active category for sidebar
  const [activeCategory, setActiveCategory] = useState<AboutCategory>("hi");

  // Section refs for scrolling
  const hiRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);
  const communityRef = useRef<HTMLDivElement>(null);
  const philosophyRef = useRef<HTMLDivElement>(null);
  const shelfRef = useRef<HTMLDivElement>(null);
  const loreRef = useRef<HTMLDivElement>(null);
  
  // Individual community card refs (for scrolling to specific communities)
  const communityRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const archivePanelRef = useRef<HTMLDivElement>(null);
  
  // Shelf subcategory refs
  const booksRef = useRef<HTMLDivElement>(null);
  const musicRef = useRef<HTMLDivElement>(null);
  const moviesRef = useRef<HTMLDivElement>(null);
  
  // Active community ID state (will be set to first community when data loads)
  const [activeCommunityId, setActiveCommunityId] = useState<string | undefined>();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const archiveNavHoldUntilRef = useRef(0);
  const syncNavFromScrollRef = useRef<() => void>(() => {});
  
  // Active shelf subcategory state
  const [activeShelfSubcategory, setActiveShelfSubcategory] = useState<ShelfSubcategory>("books");

  // Sanity data state — hydrate synchronously from preload cache when warm
  const [cachedInitial] = useState(readCachedAboutPage);
  const [experiences, setExperiences] = useState<ExperienceCardData[]>(
    () => cachedInitial?.experiences ?? [],
  );
  const [communities, setCommunities] = useState<CommunityCardData[]>(
    () => cachedInitial?.communities ?? [],
  );
  const [shelfItems, setShelfItems] = useState<MediaCardData[]>(
    () => cachedInitial?.shelfItems ?? [],
  );
  const [quotes, setQuotes] = useState<MediaCardData[]>(
    () => cachedInitial?.quotes ?? [],
  );
  const [loreItems, setLoreItems] = useState<LoreCardData[]>(
    () => cachedInitial?.loreItems ?? [],
  );
  const [startups, setStartups] = useState<StartupCardData[]>(
    () => cachedInitial?.startups ?? [],
  );
  const [startupsRevealed, setStartupsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(() => cachedInitial === null);
  const handleStartupsRevealComplete = useCallback(
    () => setStartupsRevealed(true),
    [],
  );
  const experiencesCanReveal = startups.length === 0 || startupsRevealed;

  // Shelf year filter state (for books, music, and movies)
  const [activeBooksYear, setActiveBooksYear] = useState<string | undefined>();
  const [activeMusicYear, setActiveMusicYear] = useState<string | undefined>();
  const [activeMoviesYear, setActiveMoviesYear] = useState<string | undefined>();

  useEffect(() => {
    preloadLikelyPages();
  }, []);

  // Fetch data from Sanity (uses preloaded cache if available)
  useEffect(() => {
    async function fetchAboutData() {
      try {
        const cachedExperiences = getCachedData<Experience[]>("about:experiences");
        const cachedCommunities = getCachedData<Community[]>("about:communities");
        const cachedShelfItems = getCachedData<ShelfItem[]>("about:shelfItems");
        const cachedQuotes = getCachedData<AboutQuote[]>("about:quotes");
        const cachedLoreItems = getCachedData<LoreItem[]>("about:loreItems");
        const cachedStartups = getCachedData<Startup[]>("about:startups");
        const hasFullCache = !!(
          cachedExperiences &&
          cachedCommunities &&
          cachedShelfItems &&
          cachedQuotes &&
          cachedLoreItems &&
          cachedStartups
        );

        // Only show spinner when we have nothing to render yet
        if (!hasFullCache) setIsLoading(true);

        const [
          experiencesData,
          communitiesData,
          shelfItemsData,
          quotesData,
          loreItemsData,
          startupsData,
        ] = await Promise.all([
          cachedExperiences ?? client.fetch<Experience[]>(EXPERIENCES_QUERY),
          cachedCommunities ?? client.fetch<Community[]>(COMMUNITIES_QUERY),
          cachedShelfItems ?? client.fetch<ShelfItem[]>(SHELF_ITEMS_QUERY),
          cachedQuotes ?? client.fetch<AboutQuote[]>(QUOTES_QUERY),
          cachedLoreItems ?? client.fetch<LoreItem[]>(LORE_ITEMS_QUERY),
          cachedStartups ?? client.fetch<Startup[]>(STARTUPS_QUERY),
        ]);

        if (!cachedExperiences && experiencesData) {
          setCachedData("about:experiences", experiencesData);
        }
        if (!cachedCommunities && communitiesData) {
          setCachedData("about:communities", communitiesData);
        }
        if (!cachedShelfItems && shelfItemsData) {
          setCachedData("about:shelfItems", shelfItemsData);
        }
        if (!cachedQuotes && quotesData) setCachedData("about:quotes", quotesData);
        if (!cachedLoreItems && loreItemsData) {
          setCachedData("about:loreItems", loreItemsData);
        }
        if (!cachedStartups && startupsData) {
          setCachedData("about:startups", startupsData);
        }

        setExperiences(transformExperiences(experiencesData || []));
        setCommunities(transformCommunities(communitiesData || []));
        setShelfItems(transformShelfItems(shelfItemsData || []));
        setQuotes(transformQuotes(quotesData || []));
        setLoreItems(transformLoreItems(loreItemsData || []));
        setStartups(transformStartups(startupsData || []));
      } catch (err) {
        console.error("Error fetching about data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAboutData();
  }, []);

  // Warm shelf images after first paint — don't compete with About mount.
  useEffect(() => {
    if (shelfItems.length === 0) return;

    const warm = () => {
      for (const item of shelfItems) {
        if (!item.imageSrc) continue;
        const img = new Image();
        img.src = item.imageSrc;
      }
    };

    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(warm, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }

    const timeout = setTimeout(warm, 800);
    return () => clearTimeout(timeout);
  }, [shelfItems]);

  const { active: activeCommunities, archived: archivedCommunities } =
    splitCommunityNav(communities);
  const activeCommunityCards = communities.filter((c) => !c.isArchived);
  const archivedCommunityCards = communities.filter((c) => Boolean(c.isArchived));
  const communityNavItems = [...activeCommunities, ...archivedCommunities];
  const communitySidebarItems = communityNavItems.map((c) => ({
    id: c.id,
    sidebarName: c.sidebarName,
    isArchived: c.isArchived,
  }));

  // Set first community as active when communities load
  useEffect(() => {
    if (communities.length > 0 && !activeCommunityId) {
      const firstNav =
        communities.find((c) => c.sidebarName && !c.isArchived) ??
        communities.find((c) => c.sidebarName);
      if (firstNav) {
        setActiveCommunityId(firstNav.id);
      }
    }
  }, [communities, activeCommunityId]);

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

  const scrollToCommunity = (communityId: string) => {
    const communityElement = communityRefs.current[communityId];
    if (communityElement) {
      communityElement.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (communityRef?.current) {
      communityRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCommunityClick = (communityId: string) => {
    const target = communities.find((c) => c.id === communityId);
    const willOpenArchive = Boolean(target?.isArchived) && !archiveOpen;
    if (willOpenArchive) setArchiveOpen(true);
    setActiveCommunityId(communityId);
    if (willOpenArchive) {
      window.setTimeout(() => scrollToCommunity(communityId), 200);
    } else {
      scrollToCommunity(communityId);
    }
  };

  const handleArchiveToggle = () => {
    const next = !archiveOpen;
    archiveNavHoldUntilRef.current = Date.now() + 300;
    setArchiveOpen(next);
    setActiveCategory("community");

    if (next) {
      const firstArchived = communities.find(
        (community) => community.sidebarName && community.isArchived,
      );
      if (firstArchived) setActiveCommunityId(firstArchived.id);
      window.setTimeout(() => {
        const panel = archivePanelRef.current;
        if (!panel) {
          archiveNavHoldUntilRef.current = 0;
          syncNavFromScrollRef.current();
          return;
        }
        const rect = panel.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
          archiveNavHoldUntilRef.current = Date.now() + 700;
          window.setTimeout(() => {
            archiveNavHoldUntilRef.current = 0;
            syncNavFromScrollRef.current();
          }, 700);
          return;
        }
        archiveNavHoldUntilRef.current = 0;
        syncNavFromScrollRef.current();
      }, 220);
      return;
    }

    const lastLive = [...communities]
      .reverse()
      .find((community) => community.sidebarName && !community.isArchived);
    if (lastLive) setActiveCommunityId(lastLive.id);
    window.setTimeout(() => {
      archiveNavHoldUntilRef.current = 0;
      syncNavFromScrollRef.current();
    }, 220);
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

      const sectionRects = sections.flatMap((section) => {
        if (!section.ref.current) return [];
        const rect = section.ref.current.getBoundingClientRect();
        return [{ id: section.id, top: rect.top, bottom: rect.bottom }];
      });

      const archiveBox = archivePanelRef.current?.getBoundingClientRect();
      const activeSection = resolveAboutCategory(
        sectionRects,
        ABOUT_SCROLL_THRESHOLD_PX,
        window.innerHeight,
        archiveBox
          ? { top: archiveBox.top, bottom: archiveBox.bottom }
          : null,
      );

      if (Date.now() < archiveNavHoldUntilRef.current) {
        return;
      }

      if (activeSection) {
        setActiveCategory(activeSection);
        
        // If community is active, also track which community is in view
        if (activeSection === "community") {
          const named = communities.filter((c) => c.sidebarName);
          const navCommunities = archiveOpen
            ? orderCommunitiesForDisplay(named)
            : named.filter((c) => !c.isArchived);
          let activeCommunity: string | null = null;
          
          // Check from bottom to top to find the one that's scrolled past the threshold
          for (let i = navCommunities.length - 1; i >= 0; i--) {
            const community = navCommunities[i];
            const element = communityRefs.current[community.id];
            if (element) {
              const rect = element.getBoundingClientRect();
              if (rect.top <= ABOUT_SCROLL_THRESHOLD_PX) {
                activeCommunity = community.id;
                break;
              }
            }
          }
          
          // Fallback: find first one in viewport
          if (!activeCommunity) {
            for (const community of navCommunities) {
              const element = communityRefs.current[community.id];
              if (element) {
                const rect = element.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                  activeCommunity = community.id;
                  break;
                }
              }
            }
          }
          
          if (activeCommunity) {
            setActiveCommunityId(activeCommunity);
          }
        }
        
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
              if (rect.top <= ABOUT_SCROLL_THRESHOLD_PX) {
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

    syncNavFromScrollRef.current = handleScroll;
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [communities, archiveOpen]);

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
      .filter(([year]) => Number(year) >= 2020) // Only show 2020 and newer
      .sort(([a], [b]) => Number(b) - Number(a)) // Sort descending
      .map(([year, count]) => ({ year, count }));
  };

  const bookYears = getYearsWithCounts(bookItems);
  const musicYears = getYearsWithCounts(musicItems);
  const movieYears = getYearsWithCounts(movieItems);

  return (
    <div className="bg-white flex flex-col items-center relative size-full min-h-screen">
      {/* Inject fade up animation styles */}
      <style>{fadeUpStyles}</style>

      {/* Header */}
      <PageHeader variant="about" heroAnimationPlayed={heroAnimationPlayed}>
        <>
          {/* Desktop */}
          <div className="hidden md:block">
            <p>Product, design, &lt;dev&gt;,</p>
            <p>&amp; everything in between.</p>
          </div>
          {/* Mobile */}
          <div className="md:hidden">
            <p className="mb-0">Product, design, &lt;dev&gt;,</p>
            <p>&amp; everything in between.</p>
          </div>
        </>
      </PageHeader>

      {/* Navigation */}
      <NavigationTabs activeTab="about" heroAnimationPlayed={heroAnimationPlayed} />

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-4 items-start px-16 max-md:px-6 pt-2 relative shrink-0 w-full">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden lg:block lg:sticky lg:top-8 pb-4 lg:pb-8 w-[202px] shrink-0 z-50">
          <AboutSidebar
            activeCategory={activeCategory}
            onCategoryClick={handleCategoryClick}
            communityItems={communitySidebarItems}
            activeCommunityId={activeCommunityId}
            onCommunityClick={handleCommunityClick}
            archiveOpen={archiveOpen}
            onArchiveToggle={handleArchiveToggle}
            activeShelfSubcategory={activeShelfSubcategory}
            onShelfSubcategoryClick={handleShelfSubcategoryClick}
            shelfCounts={{
              books: bookItems.length,
              music: musicItems.length,
              movies: movieItems.length,
            }}
          />
        </div>

        {/* Main Content — left-aligned like prod on laptop; on large monitors, center an 800px column beside the sidebar */}
        <div className="flex-1 flex min-w-0 w-full min-[1920px]:justify-center">
          <div className="flex flex-col gap-20 items-start pb-8 w-full min-[1920px]:max-w-[800px]">
          {/* HI! Section - Hardcoded */}
          <section ref={hiRef} className="flex flex-col md:flex-row gap-10 md:gap-16 items-center md:items-start w-full max-w-5xl scroll-mt-8">
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
                          className="text-zinc-600 hover:text-zinc-700 transition-colors"
                        >
                          Hung Liu
                        </a>
                      </>
                    }
                  />
              </div>
            </ScrollReveal>

            {/* Bio Content */}
            <div className="flex flex-col pt-8 gap-6 flex-1 max-w-xl">
              <ScrollReveal variant="fade" delay={150}>
                <h2 className="font-['Michelle',sans-serif] font-medium text-zinc-600 text-3xl md:text-3xl">
                  Hi, I'm Michelle!
                </h2>
              </ScrollReveal>

              {/* Location & Education */}
              <ScrollReveal variant="fade" delay={200}>
                <div className="flex flex-wrap gap-2 md:gap-6 text-base tracking-[0.005em] text-zinc-400">
                  <div className="flex items-center gap-2">
                    <img src={mapPinIcon} alt="" className="w-4 h-4" />
                    <span className="text-zinc-400">LA&nbsp;&nbsp;/&nbsp;&nbsp;NYC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={academicCapIcon} alt="" className="w-4 h-4" />
                    <span className="text-zinc-400">B.A. Art & B.S. Cognitive Science, UCLA</span>
                  </div>
                </div>
              </ScrollReveal>

              {/* Bio Paragraphs */}
              <ScrollReveal variant="fade" delay={250}>
                <div className="flex flex-col gap-4 text-zinc-600 text-base tracking-[0.005em] leading-relaxed">
                  <p>
                    I love art, business, technology, & the ways that they can work together to
                    create extraordinary products for people. I obsess over crafting beautiful
                    tools for creation & human connection.
                  </p>
                  <p>
                    I view myself as an artist at heart, designing where beauty meets tactile utility. I like to think of it as my <a href="https://en.wikipedia.org/wiki/Ikigai" target="_blank" rel="noopener noreferrer" className="text-zinc-600 font-semibold no-underline hover:text-blue-600 transition-colors">ikigai</a>: the
                    constant pursuit of an intersection between passion, profession, & personal mission.
                  </p>
                  <p>
                    3 words to describe me: Golden Retriever Energy (even on the bad days)
                  </p>
                </div>
              </ScrollReveal>

              {/* CTA Badge - Animates from dot to full on scroll */}
              <ScrollReveal variant="fade" delay={300}>
                <ContactBadge scrollExpandMode className="mt-2" />
              </ScrollReveal>
            </div>
          </section>

          {/* Experience Section */}
          <section ref={experienceRef} className="flex flex-col gap-16 md:flex-row md:justify-between md:gap-0 w-full scroll-mt-8">
            <ScrollReveal variant="fade">
              <div className="flex flex-col">
                <h2 className="font-['Michelle',sans-serif] font-medium text-zinc-700 text-3xl leading-normal shrink-0">
                  Experience
                </h2>
              </div>
            </ScrollReveal>
            {isLoading ? (
              <LoadingSpinner label="Loading..." className="py-4" />
            ) : experiences.length > 0 ? (
              <div className="flex flex-col gap-10 md:gap-12 md:pt-1.5 md:w-1/2 md:shrink-0">
                {/* Startups Section */}
                {startups.length > 0 && (
                  <div className="flex flex-col items-start gap-8 mb-4 md:mb-2">
                    <ScrollReveal>
                      <div className="flex flex-col">
                        <p className="pl-0.5 whitespace-nowrap text-base md:text-lg font-medium text-zinc-700 tracking-[0.005em]">
                          Independent Designer<span className="text-zinc-400 font-normal">, 2023 - Present</span>
                        </p>
                      </div>
                    </ScrollReveal>
                    <StartupLogosRow
                      startups={startups}
                      startDelay={200}
                      onRevealComplete={handleStartupsRevealComplete}
                    />
                  </div>
                )}

                {experiences.map((exp, index) => (
                  <ScrollReveal
                    key={exp.id}
                    className={clsx(!experiencesCanReveal && "invisible")}
                    delay={(index + (startups.length > 0 ? 1 : 0)) * 80}
                    disabled={!experiencesCanReveal}
                  >
                    <ExperienceCard data={exp} />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400 text-sm py-4">Add experience items in Sanity Studio.</p>
            )}
          </section>

          {/* Community Section */}
          <section ref={communityRef} className="flex flex-col gap-8 w-full scroll-mt-8 max-md:mt-10">
            <ScrollReveal variant="fade">
              <div className="flex flex-col">
                <h2 className="font-['Michelle',sans-serif] font-medium text-zinc-600 text-3xl leading-normal shrink-0">
                  My Communities
                </h2>
                <p className="font-['Michelle',sans-serif] tracking-wide font-normal text-zinc-400 text-lg flex items-center gap-1.5">
                  The people who make it all worth it
                  <img src={heartIcon} alt="" className="w-[12px] h-[12px]" style={{ filter: 'brightness(0) saturate(100%) invert(83%) sepia(8%) saturate(293%) hue-rotate(177deg) brightness(91%) contrast(87%)' }} />
                </p>
              </div>
            </ScrollReveal>
            {!isLoading && communityNavItems.length > 0 && (
              <AboutSidebar
                variant="communities"
                className="lg:hidden w-full min-w-0 [&_button]:min-h-8"
                activeCategory={activeCategory}
                onCategoryClick={handleCategoryClick}
                communityItems={communitySidebarItems}
                activeCommunityId={activeCommunityId}
                onCommunityClick={handleCommunityClick}
                archiveOpen={archiveOpen}
                onArchiveToggle={handleArchiveToggle}
              />
            )}
            {isLoading ? (
              <LoadingSpinner label="Loading..." className="py-4" />
            ) : activeCommunityCards.length > 0 || archivedCommunityCards.length > 0 ? (
              <div className="flex flex-col gap-12 pt-4">
                {activeCommunityCards.map((community, index) => (
                  <div
                    key={community.id}
                    ref={(el) => {
                      communityRefs.current[community.id] = el;
                    }}
                    className="scroll-mt-8"
                  >
                    <ScrollReveal delay={index * 100}>
                      <CommunityCard data={community} />
                      {index < activeCommunityCards.length - 1 && (
                        <div className="mt-12 h-px w-full bg-zinc-100" />
                      )}
                    </ScrollReveal>
                  </div>
                ))}

                {archivedCommunityCards.length > 0 && (
                  <div ref={archivePanelRef} className="scroll-mt-8">
                    <button
                      type="button"
                      aria-expanded={archiveOpen}
                      aria-controls="community-archive-content"
                      onClick={handleArchiveToggle}
                      className="group flex min-h-8 items-center gap-1.5 px-0.5 py-0 cursor-pointer"
                    >
                      <span className="text-lg font-medium tracking-wide text-zinc-300 transition-colors group-hover:text-zinc-400">
                        Archive
                      </span>
                      <Chevron
                        size={iconSize("sm")}
                        className={clsx(
                          "translate-y-px text-zinc-300 transition-[color,transform] duration-200 ease-out group-hover:text-zinc-400",
                          archiveOpen && "rotate-90",
                        )}
                      />
                    </button>
                    <div id="community-archive-content">
                      <div
                        className={clsx(
                          "grid w-full min-w-0 transition-[grid-template-rows,opacity] duration-200 ease-out",
                          archiveOpen
                            ? "grid-rows-[1fr] opacity-100"
                            : "pointer-events-none grid-rows-[0fr] opacity-0",
                        )}
                        aria-hidden={!archiveOpen}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <div className="flex flex-col gap-12 pt-8">
                            {archivedCommunityCards.map((community, index) => (
                              <div
                                key={community.id}
                                ref={(el) => {
                                  communityRefs.current[community.id] = el;
                                }}
                                className="scroll-mt-8"
                              >
                                <CommunityCard data={community} />
                                {index < archivedCommunityCards.length - 1 && (
                                  <div className="mt-12 h-px w-full bg-zinc-100" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-zinc-400 text-sm py-4">Add community items in Sanity Studio.</p>
            )}
          </section>

          {/* Philosophy Section - Hardcoded placeholder */}
          <section ref={philosophyRef} className="flex flex-col gap-12 w-full scroll-mt-8">
            <ScrollReveal variant="fade">
              <SectionHeading title="My Favorite Quotes" subtitle="a.k.a. my Design ( + Life ) Philosophy" />
            </ScrollReveal>
            {quotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:grid-rows-[1fr_1fr]">
                {quotes.map((quote, index) => (
                  <ScrollReveal key={quote.id} delay={index * 80} className="h-full">
                    <MediaCard data={quote} className="h-full" topRow={index < 2} />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400 text-sm py-4">Add quotes in Sanity Studio.</p>
            )}
          </section>

          {/* Shelf Section */}
          <section ref={shelfRef} className="flex flex-col gap-6 w-full scroll-mt-8">
            <ScrollReveal variant="fade">
              <SectionHeading title="Shelf" subtitle="★ - Favorites" />
            </ScrollReveal>
            
            {isLoading ? (
              <LoadingSpinner label="Loading..." className="py-4" />
            ) : (
              <div className="flex flex-col gap-8">
                {/* Books Shelf */}
                <div ref={booksRef} className="scroll-mt-8">
                  <ScrollReveal delay={100}>
                    <ShelfSection
                      title="★ Books"
                      count={bookItems.filter(item => item.isFeatured).length}
                      mediaType="book"
                      yearFilters={bookYears}
                      activeYear={activeBooksYear}
                      onYearChange={(year) => setActiveBooksYear(year || undefined)}
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
                      title="★ Music"
                      count={musicItems.filter(item => item.isFeatured).length}
                      mediaType="music"
                      yearFilters={musicYears}
                      activeYear={activeMusicYear}
                      onYearChange={(year) => setActiveMusicYear(year || undefined)}
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
                      title="★ Movies"
                      count={movieItems.filter(item => item.isFeatured).length}
                      mediaType="movie"
                      yearFilters={movieYears}
                      activeYear={activeMoviesYear}
                      onYearChange={(year) => setActiveMoviesYear(year || undefined)}
                      externalLink={{ label: "Letterboxd", href: "https://letterboxd.com/LiuMichelle/" }}
                      items={movieItems}
                      itemCount={5}
                      onItemClick={(item) => {
                        if (item.letterboxdSlug) {
                          window.open(`https://letterboxd.com/liumichelle/film/${item.letterboxdSlug}/`, '_blank');
                        }
                      }}
                    />
                  </ScrollReveal>
                </div>
              </div>
            )}
          </section>

          {/* Lore Section */}
          <section ref={loreRef} className="flex flex-col gap-12 w-full scroll-mt-8">
            <ScrollReveal variant="fade">
              <SectionHeading title="Lore ⟡˙⋆" subtitle="Fun snippets from past lives" />
            </ScrollReveal>
            {isLoading ? (
              <LoadingSpinner label="Loading..." className="py-4" />
            ) : loreItems.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 md:gap-y-5 md:gap-x-6">
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
              <p className="text-zinc-400 text-sm py-4">Add lore items in Sanity Studio.</p>
            )}
          </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
