"use client";

import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import {
  consumeHomeScrollReturn,
  rememberHomeScrollForReturn,
} from "@/components/shared/homeScrollReturn";
import dynamic from "next/dynamic";
import { useNavigate } from "@/lib/navigation";
import {
  bookSlugFromPathname,
  pushPathPreservingSearch,
  replacePathPreservingSearch,
} from "@/lib/shallowPath";
import clsx from "clsx";
import { ArrowUpRight } from "../icons/ArrowUpRight";
import { TouchIcon } from "../icons/TouchIcon";
import { LinkIcon } from "../icons/LinkIcon";
import { XLogo } from "../icons/XLogo";
import VideoPlayer from "../shared/VideoPlayer";
import ShimmerImage from "../shared/ShimmerImage";
import ShimmerVideo from "../shared/ShimmerVideo";
import Footer from "../layout/Footer";
import { buttonClassName } from "../shared/Button";
import { TryItOutButton } from "../shared/TryItOutButton";
import {
  getCachedData,
  setCachedData,
  preloadLikelyPages,
  preloadProject,
  WORK_SANITY_PROJECTS_KEY,
  WORK_EXPERIMENT_PROJECTS_KEY,
} from "../../sanity/preload";
import PageHeader from "../layout/PageHeader";
import { client, urlFor } from "../../sanity/client";
import { PROJECTS_QUERY, EXPERIMENT_PROJECTS_QUERY } from "../../sanity/queries";
import type { SanityImage } from "../../sanity/types";
import { useScrollLock } from "../../utils/useScrollLock";
import ContactBadge from "../shared/ContactBadge";
import { INLINE_LINK_CLASS } from "../shared/inlineLink";
import NavigationTabs from "../layout/NavigationTabs";
import { HorizontalLine } from "../shared/HorizontalLine";
import { muxPosterUrl, posterTimeForProject } from "../../lib/muxPoster";
import { posthog, posthogEnabled } from "../../lib/posthog";
import { useHeroAnimation } from "../../hooks/useHeroAnimation";
import { fadeUpStyles } from "../../styles/animations";

// Keep Work's initial chunk light — these modals (and ExperimentModal's
// eager experiment-page imports) made About → Work wait on ~4k+ lines of JS.
const ExperimentModal = dynamic(() => import("../experiments/ExperimentModal"), {
  ssr: false,
});
const SanityProjectModal = dynamic(() => import("../project/ProjectModal"), {
  ssr: false,
});

// TextScramble is now imported from shared component when needed in this file's scope.
// The HomePageClient doesn't directly render TextScramble — it's used in Footer.

type ToolCategory = {
  label: string;
  tools: string[];
};

type Project = {
  id: string;
  title: string;
  year: string;
  description: string;
  imageSrc: string;
  videoSrc?: string;
  /** Full/uncropped Mux assets for ExperimentModal / ExperimentSiteEmbed. */
  popupImageSrc?: string;
  popupVideoSrc?: string;
  xLink?: string;
  tryItOutHref?: string;
  backgroundColor?: string;
  toolCategories?: ToolCategory[];
};

function getMuxUrls(playbackId: string, projectId?: string) {
  return {
    imageSrc: muxPosterUrl(playbackId, { projectId, width: 1920 }),
    videoSrc: `https://stream.mux.com/${playbackId}.m3u8`,
  };
}

function projectForExperimentModal(project: Project): Project {
  return {
    ...project,
    imageSrc: project.popupImageSrc || project.imageSrc,
    videoSrc: project.popupVideoSrc || project.videoSrc,
  };
}

const DESIGN_MEETUP_CLIP_PLAYBACK_ID =
  "cwG7dhOYn4rCjWNSPxUFuUMSzdh6wv9qFNG00xjHs4pU";
const DESIGN_MEETUP_FULL_PLAYBACK_ID =
  "J17VrkI9XmtbUJLyqPhw7Z8mXa1YNxQS02Rk97uSet2s";
const designMeetupClip = getMuxUrls(
  DESIGN_MEETUP_CLIP_PLAYBACK_ID,
  "design-meetup",
);
const designMeetupFull = getMuxUrls(
  DESIGN_MEETUP_FULL_PLAYBACK_ID,
  "design-meetup",
);

const staticProjects: Project[] = [
  {
    id: "apple",
    title: "Apple",
    year: "2025",
    description: "Designing new features to drive engagement and user delight.",
    imageSrc: "",
    videoSrc: "",
  },
  {
    id: "roblox",
    title: "Roblox",
    year: "2024",
    description: "Reimagining the future of social gameplay and user communication.",
    imageSrc: "",
    videoSrc: "",
  },
  {
    id: "adobe",
    title: "Adobe",
    year: "2023",
    description: "Product strategy to drive user acquisition on college campuses.",
    imageSrc: "",
    videoSrc: "",
  },
  {
    id: "nasa",
    title: "NASA JPL",
    year: "2023-24",
    description: "Daring (& designing) mighty things at NASA's in-house DesignLab.",
    imageSrc: "",
    videoSrc: "",
  },
  {
    id: "design-meetup",
    title: "Design Meetup",
    year: "2026",
    description: "A new site for Design Meetup, a nationwide community I help run for designers & creatives!",
    imageSrc: designMeetupClip.imageSrc,
    videoSrc: designMeetupClip.videoSrc,
    popupImageSrc: designMeetupFull.imageSrc,
    popupVideoSrc: designMeetupFull.videoSrc,
    tryItOutHref: "https://designmeetup.info",
    xLink: "https://x.com/michelletliu/status/2087998088409653321?s=20",
    backgroundColor: "#ffffff",
    toolCategories: [
      { label: 'UI & Motion', tools: ['Tailwind CSS', 'Motion'] },
      { label: 'Frontend', tools: ['Next.js', 'React', 'TypeScript'] },
      { label: 'Data', tools: ['Supabase'] },
      { label: 'AI', tools: ['Cursor', 'Opus 4.6'] },
    ],
  },
  {
    id: "screentime",
    title: "Screentime Receipt",
    year: "2025",
    description: "A receipt for your daily or weekly screentime.",
    imageSrc: "https://image.mux.com/AdZWDHKkfyhXntZy01keNYtPB7Q6w8GxeaUWmP8501SLI/thumbnail.png?width=1920",
    videoSrc: "https://stream.mux.com/AdZWDHKkfyhXntZy01keNYtPB7Q6w8GxeaUWmP8501SLI.m3u8",
    xLink: "https://x.com/michelletliu/status/2000987498550383032",
    backgroundColor: "#f4f4f5",
    toolCategories: [
      { label: 'Design', tools: ['Figma'] },
      { label: 'Frontend', tools: ['TypeScript', 'React', 'Vite'] },
      { label: 'Styling', tools: ['Tailwind CSS'] },
      { label: 'AI', tools: ['Figma Make', 'Cursor'] },
    ],
  },
  {
    id: "sketchbook",
    title: "Digital Sketchbook",
    year: "2025",
    description: "A digital home for sketches and visual journaling.",
    imageSrc: "https://image.mux.com/iEo013MYI028Zit3nPTJetFvqbgweCC8e2NHbY702qsQBg/thumbnail.png?width=1920",
    videoSrc: "https://stream.mux.com/iEo013MYI028Zit3nPTJetFvqbgweCC8e2NHbY702qsQBg.m3u8",
    backgroundColor: "#ffffff",
    toolCategories: [
      { label: 'Design', tools: ['Figma'] },
      { label: 'Frontend', tools: ['TypeScript', 'React', 'Vite'] },
      { label: 'Styling', tools: ['Tailwind CSS'] },
      { label: 'AI', tools: ['Figma Make', 'Cursor'] },
    ],
  },
  {
    id: "film",
    title: "Film Diary",
    year: "2025",
    description: "A scroll-driven photo strip of life moments.",
    imageSrc: "https://image.mux.com/p66bkVMzjdu5wUtVpCZX41TwUzNOwWEfbSdtVefW9Vw/thumbnail.png?width=1920",
    videoSrc: "https://stream.mux.com/p66bkVMzjdu5wUtVpCZX41TwUzNOwWEfbSdtVefW9Vw.m3u8",
    xLink: "https://x.com/michelletliu/status/1925775994930327773",
    backgroundColor: "#ffffff",
    toolCategories: [
      { label: 'Design', tools: ['Figma'] },
      { label: 'Frontend', tools: ['TypeScript', 'React', 'Framer Motion', 'Tailwind CSS'] },
      { label: 'Data', tools: ['Notion API'] },
      { label: 'AI', tools: ['Cursor', 'Opus 4.6'] },
    ],
  },
  {
    id: "library",
    title: "Personal Library",
    year: "2025",
    description: "My dream digital bookshelf",
    imageSrc: "https://image.mux.com/a3NxNdblQi02JVCg0177eEWZRycP1BduGb2pt7o00FUPfo/thumbnail.png?width=1920",
    videoSrc: "https://stream.mux.com/a3NxNdblQi02JVCg0177eEWZRycP1BduGb2pt7o00FUPfo.m3u8",
    xLink: "https://x.com/michelletliu/status/1981030966044061894",
    backgroundColor: "#ffffff",
    toolCategories: [
      { label: 'Design', tools: ['Figma'] },
      { label: 'Frontend', tools: ['TypeScript', 'React', 'Vite'] },
      { label: 'Styling', tools: ['Tailwind CSS'] },
      { label: 'AI', tools: ['Figma Make', 'Cursor'] },
    ],
  },
  {
    id: "polaroid",
    title: "Polaroid Studio",
    year: "2025",
    description: "A digital way to customize your own polaroid.",
    imageSrc: "https://image.mux.com/XJFJ1P3u9pKsFYvH9lTtOp4gPRydSpMkRrX9dRmNE5w/thumbnail.png?width=1920",
    videoSrc: "https://stream.mux.com/XJFJ1P3u9pKsFYvH9lTtOp4gPRydSpMkRrX9dRmNE5w.m3u8",
    xLink: "https://x.com/michelletliu/status/1991201412072734777",
    backgroundColor: "#eff6ff",
    toolCategories: [
      { label: 'Design', tools: ['Figma'] },
      { label: 'Frontend', tools: ['TypeScript', 'React', 'Vite'] },
      { label: 'Styling', tools: ['Tailwind CSS'] },
      { label: 'AI', tools: ['Figma Make', 'Cursor'] },
    ],
  },
  {
    id: "gallery",
    title: "Gallery",
    year: "2026",
    description: "An interactive art gallery to visualize your ideas.",
    imageSrc: "https://image.mux.com/UBPHbQ7lhjoY6bt3d8OXMRNBV3FRhr2au00FALYZ02zn4/thumbnail.png?width=1920&time=0",
    videoSrc: "https://stream.mux.com/UBPHbQ7lhjoY6bt3d8OXMRNBV3FRhr2au00FALYZ02zn4.m3u8",
    backgroundColor: "#ffffff",
    toolCategories: [
      { label: 'Interface', tools: ['Next.js', 'React'] },
      { label: 'Scene', tools: ['Three.js'] },
      { label: 'Data', tools: ['The Met API', 'Open Access'] },
      { label: 'Motion', tools: ['Framer Motion'] },
    ],
  },
  {
    id: "sundays",
    title: "Sundays",
    year: "2026",
    description: "A new site for Sundays, a weekly coworking session I help host for creatives in LA.",
    imageSrc: "https://image.mux.com/RmmMHG2l02e02I3powzzRYb6qWuW00HwxAAcB7wo41FGo00/thumbnail.png?width=1920&time=0",
    videoSrc: "https://stream.mux.com/RmmMHG2l02e02I3powzzRYb6qWuW00HwxAAcB7wo41FGo00.m3u8",
    xLink: "https://x.com/michelletliu/status/2044470508641784033",
    backgroundColor: "#ffffff",
    toolCategories: [
      { label: 'UI & Motion', tools: ['Tailwind CSS', 'Framer Motion'] },
      { label: 'Frontend', tools: ['Next.js', 'React', 'TypeScript'] },
      { label: '3D', tools: ['Three.js', 'React Three Fiber'] },
      { label: 'Content & Infra', tools: ['Notion API', 'Vercel'] },
    ],
  },
];

type ProjectMediaProps = {
  imageSrc: string;
  videoSrc?: string;
};

const ProjectMedia = React.memo(function ProjectMedia({ imageSrc, videoSrc }: ProjectMediaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset image-loaded state when src changes (e.g. when Sanity data swaps in a new URL)
  useEffect(() => {
    setImageLoaded(false);
  }, [imageSrc]);

  // Catch images already cached by the browser, where onLoad may fire before the listener is attached
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setImageLoaded(true);
    }
  }, [imageSrc]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let readyTimeout: ReturnType<typeof setTimeout> | null = null;
    let idleHandle: number | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Defer video mount to idle time so multiple cards don't all spin up
            // Mux/HLS players simultaneously and block main-thread input.
            const markReady = () => setVideoReady(true);
            const ric = (window as Window & {
              requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
            }).requestIdleCallback;
            if (typeof ric === "function") {
              idleHandle = ric(markReady, { timeout: 1500 });
            } else {
              readyTimeout = setTimeout(markReady, 600);
            }
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (readyTimeout) clearTimeout(readyTimeout);
      if (idleHandle !== null) {
        const cic = (window as Window & {
          cancelIdleCallback?: (handle: number) => void;
        }).cancelIdleCallback;
        if (typeof cic === "function") cic(idleHandle);
      }
    };
  }, []);

  if (videoSrc) {
    return (
      <div
        ref={containerRef}
        className="aspect-[678/367.625] relative isolate rounded-[26px] shrink-0 w-full overflow-hidden bg-[#e4e4e7]"
      >
        {/* High-res thumbnail shown once fully loaded, fades out when video is ready */}
        {imageSrc && (
          <img
            ref={imgRef}
            src={imageSrc}
            alt=""
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className={clsx(
              "absolute max-w-none object-cover size-full rounded-[26px] transition-opacity duration-500 ease-out pointer-events-none z-10",
              videoLoaded ? "opacity-0" : "opacity-100"
            )}
          />
        )}
        {isVisible && videoReady && imageLoaded && (
          <>
            <VideoPlayer
              src={videoSrc}
              className="absolute max-w-none object-cover rounded-[26px] size-full"
              autoPlay
              muted
              loop
              controls={false}
              muxEnvKey="e4cc19a78gcf0tbtfmu4m7ruf"
              onLoaded={() => setVideoLoaded(true)}
            />
            <div className="absolute inset-0 z-[2] rounded-[26px] pointer-events-none" />
          </>
        )}
        {/* Shimmer overlay covers progressive decode until the thumbnail (or video, if no thumbnail) is fully ready */}
        <div
          className={clsx(
            "absolute inset-0 rounded-[26px] bg-[#e4e4e7] animate-shimmer transition-opacity duration-500 ease-out pointer-events-none z-20",
            (imageSrc ? imageLoaded : videoLoaded) ? "opacity-0" : "opacity-100"
          )}
        />
      </div>
    );
  }

  if (!imageSrc) {
    return (
      <div 
        ref={containerRef}
        className="aspect-[678/367.625] relative isolate rounded-[26px] shrink-0 w-full overflow-hidden bg-[#e4e4e7]"
      >
        <div className="absolute inset-0 rounded-[26px] bg-[#e4e4e7] animate-shimmer" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="aspect-[678/367.625] relative isolate rounded-[26px] shrink-0 w-full overflow-hidden">
      <ShimmerImage
        alt=""
        className="absolute max-w-none object-cover size-full"
        wrapperClassName="absolute inset-0"
        rounded="rounded-[26px]"
        src={imageSrc}
        loading="lazy"
      />
    </div>
  );
});

// SocialLinksBackgroundImage and LinksBackgroundImageAndText are now in src/components/SocialLinks.tsx

function getExperimentLink(projectId: string): { href: string; label: string; external: boolean } | null {
  switch (projectId) {
    case 'polaroid': return { href: '/polaroid', label: 'Try It Out!', external: false };
    case 'screentime': return { href: '/screentime', label: 'Try It Out!', external: false };
    case 'sketchbook': return { href: '/sketchbook', label: 'Try It Out!', external: false };
    case 'library': return { href: '/library', label: 'Try It Out!', external: false };
    case 'film': return { href: '/film', label: 'Try It Out!', external: false };
    case 'sundays': return { href: 'https://sundays.rsvp', label: 'Visit Site', external: true };
    case 'design-meetup': return { href: 'https://designmeetup.info', label: 'Visit Site', external: true };
    case 'gallery': return { href: '/gallery', label: 'Try It Out!', external: false };
    default: return null;
  }
}

type ProjectCardProps = {
  project: Project;
  onProjectClick: (projectId: string) => void;
  featured?: boolean;
  /** Order index used to stagger the entrance animation */
  index?: number;
};

const SIDE_PROJECT_IDS = ["design-meetup", "screentime", "sketchbook", "film", "library", "polaroid", "gallery", "sundays"];
/** Experiments kept in data/routes but omitted from the home experiments grid. */
const HIDDEN_EXPERIMENT_IDS: string[] = [];
/** Experiments that skip the preview modal and navigate straight to their page. */
const DIRECT_NAV_EXPERIMENT_IDS = ["gallery"];
const MAIN_PROJECT_IDS = ["apple", "roblox", "adobe", "nasa"];

function isVisibleOnHomeGrid(project: Project): boolean {
  return !HIDDEN_EXPERIMENT_IDS.includes(project.id);
}

/** Library before sketchbook on small screens, without a non-transitive sort. */
function projectsForMobileHomeGrid(projects: Project[]): Project[] {
  const visible = projects.filter(isVisibleOnHomeGrid);
  const sketchIndex = visible.findIndex((project) => project.id === "sketchbook");
  const libraryIndex = visible.findIndex((project) => project.id === "library");
  if (sketchIndex === -1 || libraryIndex === -1 || libraryIndex < sketchIndex) {
    return visible;
  }
  const ordered = visible.slice();
  const [library] = ordered.splice(libraryIndex, 1);
  ordered.splice(sketchIndex, 0, library);
  return ordered;
}

const ProjectCard = React.memo(function ProjectCard({ project, onProjectClick, featured = false, index = 0 }: ProjectCardProps) {
  const experimentLink = getExperimentLink(project.id);
  const hasTryItOut = experimentLink !== null;
  
  const handleClick = () => {
    const isDesktop = window.innerWidth >= 768;

    // Gallery (and similar) skip the film-style /project preview modal.
    if (
      experimentLink &&
      !experimentLink.external &&
      DIRECT_NAV_EXPERIMENT_IDS.includes(project.id)
    ) {
      rememberHomeScrollForReturn();
      window.location.href = experimentLink.href;
      return;
    }
    
    if (experimentLink && !experimentLink.external && !isDesktop) {
      if (DIRECT_NAV_EXPERIMENT_IDS.includes(project.id)) {
        rememberHomeScrollForReturn();
      }
      window.location.href = experimentLink.href;
    } else {
      onProjectClick(project.id);
    }
  };

  const warmProject = () => {
    if (
      process.env.NODE_ENV !== "development" &&
      MAIN_PROJECT_IDS.includes(project.id)
    ) {
      void preloadProject(project.id);
    }
  };

  const enterStyle = { animationDelay: `${Math.min(index * 60, 300)}ms` };

  if (featured) {
    return (
      <button
        onClick={handleClick}
        onMouseEnter={warmProject}
        onFocus={warmProject}
        onTouchStart={warmProject}
        style={enterStyle}
        className="content-stretch flex flex-col gap-3 items-start relative shrink-0 w-full cursor-pointer group project-card"
      >
        <div 
          className="content-stretch flex flex-col items-start justify-end overflow-clip relative rounded-[26px] shrink-0 w-full transition-transform duration-300 group-hover:scale-[0.99]"
        >
          <ProjectMedia imageSrc={project.imageSrc} videoSrc={project.videoSrc} />
          <div aria-hidden="true" className="absolute border border-zinc-100 inset-0 pointer-events-none rounded-[26px]" />
          <div className="absolute bottom-0 left-0 p-3 hidden md:block">
            <div className="bg-white border border-[#f4f4f5] border-solid flex items-center justify-center px-3 pt-[5px] pb-[4.8px] rounded-full">
              <p className="font-['Michelle',sans-serif] font-medium tracking-[0.005em] leading-snug text-[#18181b] text-base">
                <span>{project.title}</span>
                {!hasTryItOut && (
                  <span className="text-[#a1a1aa]"> • {project.year}</span>
                )}
                {hasTryItOut && (
                  <>
                    <span className="text-[#a1a1aa] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"> • </span>
                    <a
                      href={experimentLink!.href}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-end gap-1 align-baseline leading-none text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"
                      {...(experimentLink!.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {experimentLink!.label}{experimentLink!.external && <ArrowUpRight />}
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex content-stretch items-start px-[13px] py-0 -mt-1.5 -mb-0.5 relative shrink-0 w-full">
          <p className="font-['Michelle',sans-serif] font-normal leading-snug text-[#a1a1aa] text-base tracking-[0.005em] text-left project-hover-text">{project.description}</p>
        </div>
        <div className="md:hidden content-stretch flex flex-col font-['Michelle',sans-serif] font-normal items-start leading-snug px-[13px] py-0 relative shrink-0 text-base tracking-[0.01em] gap-1">
          <div className="flex items-center w-full">
            <p className="relative shrink-0 text-[#18181b] text-left project-hover-text">
              <span>{project.title}</span>
              {!hasTryItOut && (
                <span className="text-[#a1a1aa]"> • {project.year}</span>
              )}
            </p>
            {hasTryItOut && (
              <a
                href={experimentLink!.href}
                onClick={(e) => e.stopPropagation()}
                className="ml-auto inline-flex items-center shrink-0 text-zinc-400 hover:text-zinc-500"
                aria-label={experimentLink!.label}
                {...(experimentLink!.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {experimentLink!.external ? (
                  <LinkIcon className="text-zinc-500" />
                ) : (
                  <TouchIcon />
                )}
              </a>
            )}
          </div>
          <p className="relative shrink-0 text-[#a1a1aa] w-full text-left font-normal leading-tight">{project.description}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={warmProject}
      onFocus={warmProject}
      onTouchStart={warmProject}
      style={enterStyle}
      className="content-stretch flex flex-col gap-3 items-start relative shrink-0 w-full cursor-pointer group project-card"
    >
      <div 
        className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full transition-transform duration-300 group-hover:scale-[0.99]"
      >
        <ProjectMedia imageSrc={project.imageSrc} videoSrc={project.videoSrc} />
        <div aria-hidden="true" className="absolute border border-zinc-100 inset-0 pointer-events-none rounded-[26px]" />
      </div>
      <div className="content-stretch flex font-['Michelle',sans-serif] md:-mt-1.5 md:-mb-0.5 font-normal items-start leading-snug px-[13px] py-0 relative shrink-0 text-base tracking-[0.005em] w-full project-hover-text">
        <p className="relative text-[#18181b] text-left">
          <span>{project.title}</span>
          <span className="text-[#a1a1aa]"> • {project.year}</span>
        </p>
        {hasTryItOut && (
          <a
            href={experimentLink!.href}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-start ml-auto shrink-0 text-zinc-400 hover:text-zinc-500 md:text-blue-400 md:hover:text-blue-300"
            {...(experimentLink!.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            aria-label={experimentLink!.label}
          >
            {experimentLink!.external ? (
              <LinkIcon className="text-zinc-500 md:text-inherit" />
            ) : (
              <TouchIcon />
            )}
          </a>
        )}
      </div>
    </button>
  );
});

type ProjectModalProps = {
  project: Project;
  onClose: () => void;
};

function ToolsSection({ categories }: { categories: ToolCategory[] }) {
  if (!categories || categories.length === 0) return null;
  
  return (
    <div className="flex w-full flex-col gap-2">
      <HorizontalLine />
      <div className="font-['Michelle',sans-serif] font-normal gap-4 grid-cols-4 relative shrink-0 text-base w-full hidden md:grid">
        {categories.map((category, idx) => (
          <div key={idx} className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0">
            <p className="leading-normal relative shrink-0 text-[#a1a1aa]">
              {category.label}
            </p>
            <div className="content-stretch flex flex-col items-start relative shrink-0 text-[#52525b] tracking-[0.005em]">
              {category.tools.map((tool, toolIdx) => (
                <div key={toolIdx} className="flex flex-col justify-center relative shrink-0">
                  <p className="leading-normal whitespace-nowrap">{tool}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="font-['Michelle',sans-serif] font-normal flex flex-col gap-1.5 relative shrink-0 text-sm w-full md:hidden">
        {categories.map((category, idx) => (
          <div key={idx} className="flex items-baseline gap-6">
            <p className="leading-normal shrink-0 text-[#a1a1aa] w-[72px]">
              {category.label}
            </p>
            <p className="leading-normal text-[#52525b] tracking-[0.005em]">
              {category.tools.join(', ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleProjectModal({ project, onClose }: ProjectModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useScrollLock();

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
    const timer = setTimeout(() => {
      setVideoReady(true);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-8">
      <div 
        className={`absolute inset-0 bg-zinc-900/20 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
        onClick={handleClose} 
      />
      
      <div 
        className={clsx(
          "relative bg-white rounded-[26px] flex flex-col w-[calc(100%*10/12)] max-md:w-full max-h-[90vh] overflow-hidden transition-all duration-300 ease-out",
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : isClosing 
              ? 'opacity-0 translate-y-4' 
              : 'opacity-0 translate-y-8'
        )}
      >
        {/* Top white gradient overlay - desktop only */}
        <div className="hidden md:block absolute top-0 left-0 right-0 h-32 pointer-events-none z-20" style={{
          background: 'linear-gradient(180deg, hsla(0,0%,100%,.5) 0%, hsla(0,0%,100%,.369) 19%, hsla(0,0%,100%,.271) 34%, hsla(0,0%,100%,.191) 47%, hsla(0,0%,100%,.139) 56.5%, hsla(0,0%,100%,.097) 65%, hsla(0,0%,100%,.063) 73%, hsla(0,0%,100%,.038) 80.2%, hsla(0,0%,100%,.021) 86.1%, hsla(0,0%,100%,.011) 91%, hsla(0,0%,100%,.004) 95.2%, hsla(0,0%,100%,.001) 98.2%, transparent 100%)'
        }} />

        <div className="flex flex-col flex-1 min-h-0 pt-6 max-md:pt-4">
          <div className="overflow-y-auto flex-1">
            <div className="content-stretch flex flex-col gap-5 items-start px-44 max-md:px-10 pt-16 max-md:pt-4 pb-8 max-md:pb-10 relative shrink-0 w-full">
          <div className="hidden md:flex gap-2 items-start relative shrink-0 w-full">
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-h-px min-w-px relative shrink-0">
              <div className="content-stretch flex items-start relative shrink-0 w-full">
                <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                  <p className="font-['Michelle',sans-serif] font-normal leading-normal relative shrink-0 text-xl text-zinc-900">
                    {project.title}
                  </p>
                  <p className="font-['Michelle',sans-serif] font-medium leading-snug relative shrink-0 text-[#a1a1aa] text-base tracking-[0.005em]">
                    •
                  </p>
                  <p className="font-['Michelle',sans-serif] font-normal leading-normal relative shrink-0 text-[#a1a1aa] text-xl">
                    {project.year}
                  </p>
                </div>
              </div>
              
              <div className="content-stretch flex gap-2 items-start relative w-full">
                <p className="font-['Michelle',sans-serif] font-normal leading-normal relative text-[#71717a] text-base tracking-[0.005em]">
                  {project.description}
                </p>
              </div>
            </div>

            {(project.id === 'polaroid' || project.id === 'library' || project.id === 'screentime' || project.id === 'sketchbook') && (
              <TryItOutButton href={project.id === 'polaroid' ? '/polaroid' : project.id === 'screentime' ? '/screentime' : project.id === 'sketchbook' ? '/sketchbook' : '/library'} />
            )}
          </div>

          <div className="md:hidden flex flex-col gap-3 items-start relative shrink-0 w-full">
            <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
              <div className="content-stretch flex items-start relative shrink-0 w-full">
                <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                  <p className="font-['Michelle',sans-serif] font-normal leading-normal relative shrink-0 text-xl text-zinc-900">
                    {project.title}
                  </p>
                  <p className="font-['Michelle',sans-serif] font-medium leading-snug relative shrink-0 text-[#a1a1aa] text-base tracking-[0.005em]">
                    •
                  </p>
                  <p className="font-['Michelle',sans-serif] font-normal leading-normal relative shrink-0 text-[#a1a1aa] text-xl">
                    {project.year}
                  </p>
                </div>
              </div>
              
              <div className="content-stretch flex gap-2 items-start relative w-full">
                <p className="font-['Michelle',sans-serif] font-normal leading-normal relative text-[#71717a] text-base tracking-[0.005em]">
                  {project.description}
                </p>
              </div>
            </div>

            {(project.id === 'polaroid' || project.id === 'library' || project.id === 'screentime' || project.id === 'sketchbook') && (
              <TryItOutButton href={project.id === 'polaroid' ? '/polaroid' : project.id === 'screentime' ? '/screentime' : project.id === 'sketchbook' ? '/sketchbook' : '/library'} />
            )}
          </div>

          {project.xLink && (
            <a
              href={project.xLink}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClassName({
                variant: "primary",
                size: "md",
                className: "relative mt-1 gap-1 whitespace-nowrap",
              })}
            >
              <span className="relative shrink-0 leading-normal tracking-[0.005em] whitespace-nowrap">
                View on
              </span>
              <XLogo size="14px" className="text-white" />
              <span className="inline-flex items-center text-white">
                <ArrowUpRight size="14px" />
              </span>
            </a>
          )}

          {project.toolCategories && project.toolCategories.length > 0 && (
            <ToolsSection categories={project.toolCategories} />
          )}

          <div className="relative rounded-2xl w-full aspect-[1097/616] overflow-hidden bg-zinc-100 shrink-0 mt-3">
            <ShimmerImage
              alt=""
              className="absolute object-cover size-full"
              wrapperClassName="absolute inset-0"
              rounded="rounded-2xl"
              src={project.imageSrc}
            />
            {project.videoSrc && videoReady && (
              <ShimmerVideo
                key={project.id}
                src={project.videoSrc}
                className="absolute object-cover size-full rounded-2xl"
                wrapperClassName="absolute inset-0"
                rounded="rounded-2xl"
                autoPlay
                muted
                loop
                controls={false}
                muxEnvKey="e4cc19a78gcf0tbtfmu4m7ruf"
              />
            )}
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type SanityProject = {
  company: string;
  heroVideo?: string;
};

type SanityExperimentProject = {
  _id: string;
  projectId: string;
  title: string;
  year: string;
  description: string;
  muxPlaybackIdClip?: string;
  muxPlaybackId?: string;
  fallbackThumbnail?: SanityImage;
  xLink?: string;
  tryItOutHref?: string;
  backgroundColor?: string;
  toolCategories?: ToolCategory[];
};

function mergeWorkProjects(
  sanityProjects: SanityProject[],
  experimentProjects: SanityExperimentProject[],
): Project[] {
  const heroVideoMap: Record<string, string> = {};
  sanityProjects.forEach((sp) => {
    if (sp.company && sp.heroVideo) {
      heroVideoMap[sp.company] = sp.heroVideo;
    }
  });

  const experimentMap: Record<string, SanityExperimentProject> = {};
  experimentProjects.forEach((ep) => {
    if (ep.projectId) {
      experimentMap[ep.projectId] = ep;
    }
  });

  return staticProjects.map((project) => {
    if (MAIN_PROJECT_IDS.includes(project.id)) {
      const heroVideo = heroVideoMap[project.id];
      if (heroVideo) {
        const muxUrls = getMuxUrls(heroVideo);
        return {
          ...project,
          imageSrc: muxUrls.imageSrc,
          videoSrc: muxUrls.videoSrc,
        };
      }
    }

    if (SIDE_PROJECT_IDS.includes(project.id)) {
      const experimentData = experimentMap[project.id];
      if (experimentData) {
        const clipPlaybackId =
          experimentData.muxPlaybackIdClip || experimentData.muxPlaybackId;
        const fullPlaybackId =
          experimentData.muxPlaybackId || clipPlaybackId;
        const muxUrls = clipPlaybackId
          ? getMuxUrls(clipPlaybackId, project.id)
          : { imageSrc: project.imageSrc, videoSrc: project.videoSrc };
        const popupMuxUrls = fullPlaybackId
          ? getMuxUrls(fullPlaybackId, project.id)
          : {
              imageSrc: project.popupImageSrc || muxUrls.imageSrc,
              videoSrc: project.popupVideoSrc || muxUrls.videoSrc,
            };
        const fallbackUrl = experimentData.fallbackThumbnail
          ? urlFor(experimentData.fallbackThumbnail).width(1920).url()
          : undefined;
        // Pinned first-frame posters must not be replaced by a settled CMS screenshot.
        const imageSrc =
          posterTimeForProject(project.id) !== undefined
            ? muxUrls.imageSrc
            : fallbackUrl || muxUrls.imageSrc;
        return {
          ...project,
          title: experimentData.title,
          year: experimentData.year,
          description: experimentData.description,
          imageSrc,
          videoSrc: muxUrls.videoSrc,
          popupImageSrc: popupMuxUrls.imageSrc,
          popupVideoSrc: popupMuxUrls.videoSrc,
          xLink: experimentData.xLink || project.xLink,
          tryItOutHref:
            experimentData.tryItOutHref || project.tryItOutHref,
          backgroundColor:
            experimentData.backgroundColor || project.backgroundColor,
          toolCategories:
            experimentData.toolCategories || project.toolCategories,
        };
      }
    }

    return project;
  });
}

const HERO_COMPANY_HREFS = {
  apple: "https://www.apple.com",
  roblox: "https://about.roblox.com/",
  nasa: "https://www.jpl.nasa.gov/",
  cognition: "https://cognition.ai",
  luma: "https://luma.com",
  pika: "https://pika.art",
} as const;

const APPLE_LOGO_PATH =
  "M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z";

function HeroCompanyLink({
  href,
  children,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <span className="text-[#3f3f46]">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className={INLINE_LINK_CLASS}
      >
        {children}
      </a>
    </span>
  );
}

type HomePageClientProps = {
  slug?: string;
  mode?: string;
  bookSlug?: string;
};

export default function HomePageClient({ slug, mode, bookSlug }: HomePageClientProps) {
  const navigate = useNavigate();
  const [isContactBadgeExpanded, setIsContactBadgeExpanded] = useState(false);

  const [projects, setProjects] = useState<Project[]>(staticProjects);

  const heroAnimationPlayed = useHeroAnimation();

  useEffect(() => {
    async function fetchSanityProjects() {
      try {
        const cachedProjects = getCachedData<SanityProject[]>(
          WORK_SANITY_PROJECTS_KEY,
        );
        const cachedExperiments = getCachedData<SanityExperimentProject[]>(
          WORK_EXPERIMENT_PROJECTS_KEY,
        );

        // Already hydrated from preload — skip the network round-trip.
        if (cachedProjects && cachedExperiments) {
          setProjects(mergeWorkProjects(cachedProjects, cachedExperiments));
          return;
        }

        const [sanityProjects, experimentProjects] = await Promise.all([
          cachedProjects ?? client.fetch<SanityProject[]>(PROJECTS_QUERY),
          cachedExperiments ??
            client.fetch<SanityExperimentProject[]>(EXPERIMENT_PROJECTS_QUERY),
        ]);

        if (!cachedProjects) {
          setCachedData(WORK_SANITY_PROJECTS_KEY, sanityProjects);
        }
        if (!cachedExperiments) {
          setCachedData(WORK_EXPERIMENT_PROJECTS_KEY, experimentProjects);
        }

        setProjects(mergeWorkProjects(sanityProjects, experimentProjects));
      } catch (error) {
        console.error("Error fetching Sanity projects:", error);
      }
    }

    fetchSanityProjects();
  }, []);

  useEffect(() => {
    preloadLikelyPages();
  }, []);

  /*
   * Fallback for the reload route out of Gallery (extra history entries, so
   * back was not available). Never touch `history.scrollRestoration` here —
   * that is per-entry state, and forcing it to manual would stop the browser
   * restoring this page on the back route, which is the no-flash path.
   */
  useLayoutEffect(() => {
    const y = consumeHomeScrollReturn();
    if (y == null) return;
    window.scrollTo(0, y);
    // Cards settle as media resolves; re-assert once after that first layout.
    const id = window.requestAnimationFrame(() => window.scrollTo(0, y));
    return () => window.cancelAnimationFrame(id);
  }, []);

  // Local slug for instant modal open — set immediately on click, URL syncs in background
  const [localSlug, setLocalSlug] = useState(slug);

  // Sync when the Next.js router eventually catches up (e.g. back/forward navigation)
  useEffect(() => {
    setLocalSlug(slug);
  }, [slug]);

  const selectedProject = localSlug ? projects.find(p => p.id === localSlug) || null : null;

  // Local fullscreen state for instant expand/collapse; URL syncs in background
  const [localFullscreen, setLocalFullscreen] = useState(mode === "full");
  const [localBookSlug, setLocalBookSlug] = useState(() => {
    if (typeof window !== "undefined" && slug) {
      return (
        bookSlugFromPathname(
          window.location.pathname,
          slug,
          window.location.pathname.includes("/full"),
        ) ?? bookSlug
      );
    }
    return bookSlug;
  });

  // Sync when the Next.js router eventually catches up
  useEffect(() => {
    setLocalFullscreen(mode === "full");
  }, [mode]);

  useEffect(() => {
    setLocalBookSlug(bookSlug);
  }, [bookSlug]);

  // Keep local book state in sync with back/forward after shallow history updates.
  useEffect(() => {
    const onPopState = () => {
      if (!localSlug || !SIDE_PROJECT_IDS.includes(localSlug)) return;
      const fullscreen = window.location.pathname.includes("/full");
      setLocalFullscreen(fullscreen);
      setLocalBookSlug(
        bookSlugFromPathname(window.location.pathname, localSlug, fullscreen),
      );
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [localSlug]);

  /*
   * Deep links to /project/gallery should land on the real page, not a preview
   * modal. No scroll is recorded for the trip: this replaces the entry instead
   * of pushing, so whatever sits behind it is not this page, and the seal must
   * not try to reach it with back. Card clicks never reach here — they are
   * intercepted for direct nav before the slug can be set.
   */
  useEffect(() => {
    if (slug === "gallery" || localSlug === "gallery") {
      window.location.replace("/gallery");
    }
  }, [slug, localSlug]);

  const isFullscreenFromUrl = localFullscreen;

  const handleProjectClick = useCallback((projectId: string) => {
    // Direct-nav experiments never open ExperimentModal /film-style popup routes.
    if (DIRECT_NAV_EXPERIMENT_IDS.includes(projectId)) {
      const link = getExperimentLink(projectId);
      if (link && !link.external) {
        if (posthogEnabled) {
          posthog.capture("project_opened", {
            project_id: projectId,
            view_mode: "direct",
          });
        }
        rememberHomeScrollForReturn();
        window.location.href = link.href;
        return;
      }
    }

    const isMobile = window.innerWidth < 768;
    const shouldGoFullscreen = projectId === 'film' || (isMobile && projectId !== 'sketchbook' && projectId !== 'sundays' && projectId !== 'design-meetup');

    if (posthogEnabled) {
      posthog.capture("project_opened", {
        project_id: projectId,
        view_mode: shouldGoFullscreen ? "fullscreen" : "popup",
      });
    }

    if (shouldGoFullscreen) {
      setLocalSlug(projectId);
      setLocalFullscreen(true);
      setLocalBookSlug(undefined);
      navigate(projectId === 'film' ? '/film' : `/project/${projectId}/full`);
    } else {
      setLocalSlug(projectId);
      setLocalFullscreen(false);
      setLocalBookSlug(undefined);
      navigate(projectId === 'film' ? '/film/popup' : `/project/${projectId}`);
    }
  }, [navigate]);

  const handleModalClose = () => {
    setLocalSlug(undefined);
    setLocalFullscreen(false);
    setLocalBookSlug(undefined);
    navigate("/");
  };

  const handleExpandToFullscreen = () => {
    if (localSlug) {
      setLocalFullscreen(true);
      setLocalBookSlug(undefined);
      navigate(localSlug === 'film' ? '/film' : `/project/${localSlug}/full`);
    }
  };

  const handleExpandExperimentToFullscreen = (bookSlug?: string) => {
    if (localSlug) {
      setLocalFullscreen(true);
      setLocalBookSlug(bookSlug);
      const nextPath = bookSlug
        ? `/project/${localSlug}/full/${encodeURIComponent(bookSlug)}`
        : (localSlug === 'film' ? '/film' : `/project/${localSlug}/full`);
      // Preserve ?shelf= so the library filter doesn't bounce through a second nav.
      navigate(
        typeof window !== "undefined"
          ? `${nextPath}${window.location.search}`
          : nextPath,
      );
    }
  };

  const handleCollapseFromFullscreen = () => {
    if (localSlug) {
      setLocalFullscreen(false);
      setLocalBookSlug(undefined);
      navigate(localSlug === 'film' ? '/film/popup' : `/project/${localSlug}`);
    }
  };

  const handleExperimentBookSlugChange = (nextBookSlug?: string, options?: { replace?: boolean }) => {
    if (!localSlug) return;

    const basePath = localFullscreen
      ? (localSlug === 'film' ? '/film' : `/project/${localSlug}/full`)
      : (localSlug === 'film' ? '/film/popup' : `/project/${localSlug}`);
    const nextPath = nextBookSlug
      ? `${basePath}/${encodeURIComponent(nextBookSlug)}`
      : basePath;

    // Local state opens the modal immediately. Soft-update the URL with the
    // History API so Next doesn't remount the library across the bookSlug
    // page segment (that remount is the flicker when clicking books).
    setLocalBookSlug(nextBookSlug);
    if (options?.replace) {
      replacePathPreservingSearch(nextPath);
    } else {
      pushPathPreservingSearch(nextPath);
    }
  };

  const handleProjectSwitch = (projectId: string) => {
    setLocalSlug(projectId);
    setLocalBookSlug(undefined);
    const newPath = isFullscreenFromUrl
      ? (projectId === 'film' ? '/film' : `/project/${projectId}/full`)
      : (projectId === 'film' ? '/film/popup' : `/project/${projectId}`);
    navigate(newPath);
  };

  const handleViewAllProjects = () => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-white content-stretch flex flex-col items-center relative size-full min-h-screen">
      <style>{fadeUpStyles}</style>

      <PageHeader variant="work" heroAnimationPlayed={heroAnimationPlayed}>
        <>
          <div>
                <span
                  className={clsx(
                    "transition-opacity duration-200 max-md:opacity-100",
                    isContactBadgeExpanded ? "opacity-20" : "opacity-100",
                  )}
                >
                  Designing tools for human connection & creativity.
                </span>
                <span
                  className={clsx(
                    "transition-opacity duration-200 max-md:opacity-100",
                    isContactBadgeExpanded ? "opacity-20" : "opacity-100",
                  )}
                >
                  <br aria-hidden="true" />
                  {`Clients include `}
                  <HeroCompanyLink href={HERO_COMPANY_HREFS.cognition}>Cognition</HeroCompanyLink>
                  <span>{`, `}</span>
                  <HeroCompanyLink href={HERO_COMPANY_HREFS.luma}>Luma</HeroCompanyLink>
                  <span>{`, & `}</span>
                  <HeroCompanyLink href={HERO_COMPANY_HREFS.pika}>Pika</HeroCompanyLink>
                  <span>{`. Prev. in-house at `}</span>
                  <span style={{ fontVariationSettings: "'wdth' 100" }}>
                    <HeroCompanyLink href={HERO_COMPANY_HREFS.apple} ariaLabel="Apple">
                      <svg
                        className="inline w-[0.9em] h-[0.9em]"
                        style={{ verticalAlign: "-0.075em" }}
                        viewBox="0 0 814 1000"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d={APPLE_LOGO_PATH} />
                      </svg>
                    </HeroCompanyLink>
                  </span>
                  <span>{`, `}</span>
                  <HeroCompanyLink href={HERO_COMPANY_HREFS.roblox}>Roblox</HeroCompanyLink>
                  <span>{`, & `}</span>
                  <HeroCompanyLink href={HERO_COMPANY_HREFS.nasa}>NASA</HeroCompanyLink>
                  <span>.</span>
                </span>
                <ContactBadge
                  hoverMode
                  size="lg"
                  className="max-md:hidden"
                  onExpandedChange={setIsContactBadgeExpanded}
                />
          </div>
        </>
      </PageHeader>

      <NavigationTabs activeTab="work" heroAnimationPlayed={heroAnimationPlayed} />

      <div className="hidden md:grid gap-6 grid-cols-2 px-16 max-md:px-8 pt-2.5 pb-2 relative shrink-0 w-full">
          {projects.filter(isVisibleOnHomeGrid).map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              onProjectClick={handleProjectClick}
              featured={index < 4}
              index={Math.floor(index / 2)}
            />
          ))}
        </div>

        <div className="md:hidden flex flex-col gap-8 px-6 py-4 relative shrink-0 w-full">
          {projectsForMobileHomeGrid(projects).map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              onProjectClick={handleProjectClick}
              featured={index < 4}
              index={index}
            />
          ))}
        </div>

      <Footer />

      {selectedProject &&
        !DIRECT_NAV_EXPERIMENT_IDS.includes(selectedProject.id) && (
        SIDE_PROJECT_IDS.includes(selectedProject.id) ? (
          <ExperimentModal 
            key={selectedProject.id}
            projectId={selectedProject.id}
            project={projectForExperimentModal(selectedProject)} 
            onClose={handleModalClose}
            onExpandToFullscreen={handleExpandExperimentToFullscreen}
            onCollapseFromFullscreen={handleCollapseFromFullscreen}
            bookSlug={localBookSlug}
            onBookSlugChange={handleExperimentBookSlugChange}
            initialFullscreen={isFullscreenFromUrl}
          />
        ) : (
          <SanityProjectModal
            key={selectedProject.id}
            projectId={selectedProject.id}
            onClose={handleModalClose}
            onBack={isFullscreenFromUrl ? handleCollapseFromFullscreen : handleModalClose}
            onExpandToFullscreen={handleExpandToFullscreen}
            onCollapseFromFullscreen={handleCollapseFromFullscreen}
            initialFullscreen={isFullscreenFromUrl}
            onProjectClick={(projectId) => {
              handleProjectSwitch(projectId);
            }}
            onViewAllProjects={handleViewAllProjects}
          />
        )
      )}
    </div>
  );
}
