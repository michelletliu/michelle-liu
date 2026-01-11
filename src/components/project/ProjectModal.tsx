import React, { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { PortableText } from "@portabletext/react";
import type { PortableTextComponents } from "@portabletext/react";
import { client, urlFor } from "../../sanity/client";
import { PROJECT_BY_COMPANY_QUERY } from "../../sanity/queries";
import { getCachedData } from "../../sanity/preload";
import type { Project, ContentSection } from "../../sanity/types";
import Footer from "../Footer";
import VideoPlayer from "../VideoPlayer";
import ViewAllProjectsButton from "./ViewAllProjectsButton";
import AlsoCheckOut from "./AlsoCheckOut";
import ProjectCardSection from "./ProjectCardSection";
import SideQuestSection from "./SideQuestSection";
import { TwoColumnImageSectionComponent } from "./TwoColumnImageSection";
import { ScrollReveal } from "../ScrollReveal";
import { useScrollLock } from "../../utils/useScrollLock";
import lockIcon from "../../assets/lock.svg";
import expandIcon from "../../assets/Expand.svg";
import quoteGraphic from "../../assets/quote gray 200.png";

// Helper to render text with highlighted portion
function renderHighlightedText(text: string, highlightedText?: string, highlightColor?: string): React.ReactNode {
  if (!highlightedText) {
    return text;
  }
  // Case-insensitive search
  const lowerText = text.toLowerCase();
  const lowerHighlight = highlightedText.toLowerCase();
  const index = lowerText.indexOf(lowerHighlight);
  
  if (index === -1) {
    return text;
  }
  
  // Use the original case from the text
  const before = text.substring(0, index);
  const match = text.substring(index, index + highlightedText.length);
  const after = text.substring(index + highlightedText.length);
  const color = highlightColor || '#3b82f6';
  
  return (
    <>
      {before}
      <span style={{ color }}>{match}</span>
      {after}
    </>
  );
}

// Factory function to create PortableText components with highlighting support
function createPortableTextComponents(highlightedText?: string, highlightColor?: string): PortableTextComponents {
  // Helper to extract text content from React nodes
  const getTextContent = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(getTextContent).join('');
    return '';
  };

  // Helper to check if this node should be highlighted
  const shouldHighlight = (children: React.ReactNode): boolean => {
    if (!highlightedText) return false;
    const textContent = getTextContent(children);
    return textContent.toLowerCase().includes(highlightedText.toLowerCase());
  };

  // Helper to apply highlighting to specific text within children
  const applyHighlight = (children: React.ReactNode): React.ReactNode => {
    if (!highlightedText) {
      return children;
    }
    
    // Get the text content to check if highlight text exists
    const textContent = getTextContent(children);
    const lowerText = textContent.toLowerCase();
    const lowerHighlight = highlightedText.toLowerCase();
    
    // If highlight text not found, return original children
    if (!lowerText.includes(lowerHighlight)) {
      return children;
    }
    
    // Apply highlighting to the specific text content
    return renderHighlightedText(textContent, highlightedText, highlightColor);
  };

  const color = highlightColor || '#3b82f6';

  return {
    block: {
      h1: ({ children }) => <h1 className="text-3xl font-semibold mb-4 mt-8 first:mt-0">{applyHighlight(children)}</h1>,
      h2: ({ children }) => <h2 className="text-2xl font-medium mb-3 mt-6 first:mt-0">{applyHighlight(children)}</h2>,
      h3: ({ children }) => <h3 className="text-xl font-medium mb-3 mt-5 first:mt-0">{applyHighlight(children)}</h3>,
      h4: ({ children }) => {
        // If this h4 contains the highlight text, apply color to the whole element and remove text color class
        if (shouldHighlight(children)) {
          return <h4 className="font-normal mb-2 mt-4 first:mt-0" style={{ fontSize: '1.125rem', lineHeight: '1.75rem', color }}>{children}</h4>;
        }
        return <h4 className="text-lg font-normal mb-2 mt-4 first:mt-0">{children}</h4>;
      },
      normal: ({ children }) => <p className="mb-6 last:mb-0">{children}</p>,
    },
    marks: {
      strong: ({ children }) => {
        // If this strong contains the highlight text, apply color to the whole element
        if (shouldHighlight(children)) {
          return <strong className="font-semibold" style={{ color }}>{children}</strong>;
        }
        return <strong className="font-semibold">{children}</strong>;
      },
      em: ({ children }) => <em className="italic">{children}</em>,
      code: ({ children }) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
    },
    list: {
      bullet: ({ children }) => <ul className="list-disc ml-5 space-y-2 mb-4">{children}</ul>,
      number: ({ children }) => <ol className="list-decimal ml-5 space-y-2 mb-4">{children}</ol>,
    },
  };
}

// Default PortableText components (without highlighting)
const portableTextComponents = createPortableTextComponents();

// Helper functions for tracking unlocked projects in session
const UNLOCKED_PROJECTS_KEY = 'unlockedProjects';

function getUnlockedProjects(): string[] {
  try {
    const stored = sessionStorage.getItem(UNLOCKED_PROJECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function markProjectUnlocked(projectId: string): void {
  try {
    const unlocked = getUnlockedProjects();
    if (!unlocked.includes(projectId)) {
      unlocked.push(projectId);
      sessionStorage.setItem(UNLOCKED_PROJECTS_KEY, JSON.stringify(unlocked));
    }
  } catch {
    // Silently fail if sessionStorage is unavailable
  }
}

function isProjectUnlocked(projectId: string): boolean {
  return getUnlockedProjects().includes(projectId);
}

// Chevron right icon for breadcrumb
const ChevronRightIcon = () => (
  <svg className="block size-full" viewBox="0 0 16 16" fill="none">
    <path
      d="M6 12L10 8L6 4"
      stroke="#9CA3AF"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Breadcrumb component for fullscreen modal header
type BreadcrumbProps = {
  projectName: string;
  onWorkClick?: () => void;
  isScrolled?: boolean;
  isPastHero?: boolean;
};

function Breadcrumb({ projectName, onWorkClick, isScrolled = false, isPastHero = false }: BreadcrumbProps) {
  return (
    <div className={clsx(
      "flex items-center transition-all duration-300 ease-out",
      isPastHero ? "opacity-0 pointer-events-none" : "opacity-100"
    )}>
      {/* Work link - clickable with hover state, fades out on scroll */}
      <button
        onClick={onWorkClick}
        className={clsx(
          "flex items-center justify-center py-0.5 rounded-md transition-all duration-300 ease-out hover:bg-[#f3f4f6]",
          isScrolled ? "opacity-0 pointer-events-none w-0 px-0 overflow-hidden" : "opacity-100 px-1.5 ml-2"
        )}
      >
        <span className="font-['Figtree:Medium',sans-serif] font-medium text-sm leading-normal text-[#4b5563] whitespace-nowrap">
          Work
        </span>
      </button>

      {/* Chevron separator */}
      <div className="shrink-0 size-4">
        <ChevronRightIcon />
      </div>

      {/* Project name - not clickable */}
      <div className="flex items-center justify-center px-1 py-0.5">
        <span className="font-['Figtree:Medium',sans-serif] font-medium text-sm leading-normal text-[#1f2937]">
          {projectName}
        </span>
      </div>
    </div>
  );
}

// YouTube seamless loop component - uses two iframes to crossfade for gapless looping
function YouTubeSeamlessLoop({ videoId }: { videoId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const player1Ref = useRef<YTPlayer | null>(null);
  const player2Ref = useRef<YTPlayer | null>(null);
  const [activePlayer, setActivePlayer] = useState<1 | 2>(1);
  const [apiReady, setApiReady] = useState(false);
  const checkIntervalRef = useRef<number | null>(null);
  // Unique ID for this instance to support multiple videos on page
  const instanceId = useRef(`yt-${videoId}-${Math.random().toString(36).substr(2, 9)}`);
  const player1Id = `${instanceId.current}-1`;
  const player2Id = `${instanceId.current}-2`;

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    // Check periodically if YT is ready (in case onYouTubeIframeAPIReady was already called)
    const checkYT = setInterval(() => {
      if (window.YT && window.YT.Player) {
        setApiReady(true);
        clearInterval(checkYT);
      }
    }, 100);

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevCallback?.();
      setApiReady(true);
      clearInterval(checkYT);
    };

    return () => {
      clearInterval(checkYT);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  // Initialize players when API is ready
  useEffect(() => {
    if (!apiReady || !window.YT?.Player) return;

    const createPlayer = (elementId: string, ref: React.MutableRefObject<YTPlayer | null>, autoplay: boolean) => {
      ref.current = new window.YT.Player(elementId, {
        videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          mute: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (autoplay) {
              event.target.playVideo();
            }
          },
        },
      });
    };

    createPlayer(player1Id, player1Ref, true);
    createPlayer(player2Id, player2Ref, false);

    return () => {
      player1Ref.current?.destroy();
      player2Ref.current?.destroy();
    };
  }, [apiReady, videoId, player1Id, player2Id]);

  // Monitor playback and seamlessly loop
  useEffect(() => {
    if (!apiReady) return;

    const checkAndLoop = () => {
      const activePlayerRef = activePlayer === 1 ? player1Ref : player2Ref;
      const standbyPlayerRef = activePlayer === 1 ? player2Ref : player1Ref;
      const player = activePlayerRef.current;
      const standby = standbyPlayerRef.current;

      if (!player || !standby) return;

      try {
        const currentTime = player.getCurrentTime?.();
        const duration = player.getDuration?.();

        if (currentTime && duration && duration > 0) {
          // When video is near end (0.3s before), start standby and crossfade
          if (currentTime >= duration - 0.3) {
            standby.seekTo(0, true);
            standby.playVideo();
            setActivePlayer(activePlayer === 1 ? 2 : 1);
          }
        }
      } catch {
        // Player not ready yet
      }
    };

    checkIntervalRef.current = window.setInterval(checkAndLoop, 50);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [apiReady, activePlayer]);

  return (
    <div ref={containerRef} className="aspect-video w-full overflow-hidden rounded-3xl relative pointer-events-none">
      <div
        id={player1Id}
        className={clsx(
          "absolute inset-0 w-full h-full transition-opacity duration-200 scale-[1.5] [&>iframe]:w-full [&>iframe]:h-full",
          activePlayer === 1 ? "opacity-100 z-10" : "opacity-0 z-0"
        )}
      />
      <div
        id={player2Id}
        className={clsx(
          "absolute inset-0 w-full h-full transition-opacity duration-200 scale-[1.5] [&>iframe]:w-full [&>iframe]:h-full",
          activePlayer === 2 ? "opacity-100 z-10" : "opacity-0 z-0"
        )}
      />
    </div>
  );
}

// YouTube IFrame API types
interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

interface YTPlayerEvent {
  target: YTPlayer;
}

interface YTPlayerOptions {
  videoId: string;
  playerVars?: {
    autoplay?: number;
    mute?: number;
    controls?: number;
    disablekb?: number;
    fs?: number;
    iv_load_policy?: number;
    modestbranding?: number;
    rel?: number;
    showinfo?: number;
    playsinline?: number;
    origin?: string;
  };
  events?: {
    onReady?: (event: YTPlayerEvent) => void;
  };
}

interface YTPlayerConstructor {
  new (elementId: string, options: YTPlayerOptions): YTPlayer;
}

interface YTAPI {
  Player: YTPlayerConstructor;
}

// Extend Window interface for YouTube API
declare global {
  interface Window {
    YT: YTAPI;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Close icon SVG
const CloseIcon = () => (
  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
    <path
      d="M9.76256 1.17736C10.0791 0.860788 10.0791 0.347859 9.76256 0.031284C9.44599 -0.285291 8.93306 -0.285291 8.61648 0.031284L5 3.64776L1.38352 0.031284C1.06694 -0.285291 0.554014 -0.285291 0.237439 0.031284C-0.0791362 0.347859 -0.0791362 0.860788 0.237439 1.17736L3.85392 4.79384L0.237439 8.41032C-0.0791362 8.7269 -0.0791362 9.23982 0.237439 9.5564C0.554014 9.87297 1.06694 9.87297 1.38352 9.5564L5 5.93992L8.61648 9.5564C8.93306 9.87297 9.44599 9.87297 9.76256 9.5564C10.0791 9.23982 10.0791 8.7269 9.76256 8.41032L6.14608 4.79384L9.76256 1.17736Z"
      fill="currentColor"
    />
  </svg>
);

// Back arrow icon - uses Expand.svg
const BackArrowIcon = () => (
  <img src={expandIcon} alt="Expand" className="block size-full" />
);

// Arrow right icon SVG (for password input submit button)
const ArrowRightIcon = () => (
  <svg
    className="block size-full"
    viewBox="0 0 12 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6 0C6.41421 0 6.75 0.335786 6.75 0.75V11.4393L10.7197 7.46967C11.0126 7.17678 11.4874 7.17678 11.7803 7.46967C12.0732 7.76256 12.0732 8.23744 11.7803 8.53033L6.53033 13.7803C6.23744 14.0732 5.76256 14.0732 5.46967 13.7803L0.21967 8.53033C-0.0732233 8.23744 -0.0732233 7.76256 0.21967 7.46967C0.512563 7.17678 0.987437 7.17678 1.28033 7.46967L5.25 11.4393V0.75C5.25 0.335786 5.58579 0 6 0Z"
      fill="#9CA3AF"
    />
  </svg>
);

// Eye icon for showing password (gray-400 to match arrow)
const EyeIcon = () => (
  <svg className="block size-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5.25C4.5 5.25 1.5 12 1.5 12C1.5 12 4.5 18.75 12 18.75C19.5 18.75 22.5 12 22.5 12C22.5 12 19.5 5.25 12 5.25Z" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75Z" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Eye-off icon for hiding password (gray-400 to match arrow)
const EyeOffIcon = () => (
  <svg className="block size-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.12 14.12C13.5646 14.6755 12.7998 14.9855 12 14.9855C11.2002 14.9855 10.4354 14.6755 9.88 14.12C9.32457 13.5646 9.0145 12.7998 9.0145 12C9.0145 11.2002 9.32457 10.4354 9.88 9.88" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4.5 4.5L19.5 19.5" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.75 5.5C10.485 5.34 11.235 5.25 12 5.25C19.5 5.25 22.5 12 22.5 12C22.02 12.945 21.42 13.815 20.73 14.61" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.94 17.94C16.23 19.17 14.16 19.875 12 19.875C4.5 19.875 1.5 13.125 1.5 13.125C2.505 11.205 3.975 9.54 5.775 8.355" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Laptop icon for mobile not available message
const LaptopIcon = () => (
  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="12" width="44" height="30" rx="2" stroke="#9ca3af" strokeWidth="2" fill="none"/>
    <rect x="12" y="16" width="36" height="22" rx="1" fill="#e5e7eb"/>
    <path d="M4 42h52v2a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-2z" fill="#d1d5db"/>
  </svg>
);

// Password input component with local state
function PasswordInput({ expectedPassword, onUnlock }: { expectedPassword: string; onUnlock?: () => void }) {
  const [passwordValue, setPasswordValue] = useState("");
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      // Check for mobile breakpoint (768px is Tailwind's md breakpoint)
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordValue === expectedPassword) {
      // Password correct - unlock the content
      setError(false);
      setPasswordValue("");
      onUnlock?.();
    } else {
      setError(true);
      // Error stays until user types again
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordValue(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full max-w-[313px]">
      <div className={clsx(
        "bg-white border border-solid content-stretch flex items-center justify-between pl-4 pr-3 py-2 relative rounded-full shrink-0 w-full transition-colors duration-200",
        error ? "border-[#f87171]" : "border-[#e5e7eb]"
      )}>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Enter"
          value={passwordValue}
          onChange={handleInputChange}
          className="leading-5 relative shrink-0 text-black text-base bg-transparent border-none outline-none flex-1 placeholder:text-[#9ca3af]"
        />
        <div className="flex items-center gap-2.5">
          {/* Show/Hide password toggle - only visible when there's input */}
          <button
            type="button"
            onClick={toggleShowPassword}
            className={clsx(
              "relative shrink-0 size-[18px] hover:opacity-70 transition-all duration-200",
              passwordValue.length > 0 ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
          {/* Submit arrow */}
          <button
            type="submit"
            className="relative shrink-0 size-[14px] rotate-[-90deg] hover:opacity-70 transition-opacity"
          >
            <ArrowRightIcon />
          </button>
        </div>
      </div>
      {/* Error Message with smooth animation */}
      <div 
        className={clsx(
          "overflow-hidden transition-all duration-300 ease-out",
          error ? "max-h-6 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="text-[#f87171] text-sm leading-5 px-2">
          Please try again!
        </p>
      </div>
    </form>
  );
}

// Logo component for fullscreen header
const LogoIcon = () => (
  <img
    src="/logo.png"
    alt="Michelle Liu"
    className="size-[44px] object-cover"
  />
);

// Horizontal line separator
function Line() {
  return (
    <div className="h-px relative shrink-0 w-full">
      <div className="absolute bg-[#e5e7eb] inset-0" />
    </div>
  );
}

type ProjectModalProps = {
  projectId: string; // company name: "apple", "roblox", "adobe", "nasa"
  onClose: () => void;
  onBack?: () => void;
  onExpandToFullscreen?: () => void;
  onCollapseFromFullscreen?: () => void;
  initialFullscreen?: boolean;
  onProjectClick?: (projectId: string) => void;
  onViewAllProjects?: () => void;
};

export default function ProjectModal({
  projectId,
  onClose,
  onBack,
  onExpandToFullscreen,
  onCollapseFromFullscreen,
  initialFullscreen = false,
  onProjectClick,
  onViewAllProjects,
}: ProjectModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const [showSkipLink, setShowSkipLink] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Check if project was previously unlocked in this session
  const [isUnlocked, setIsUnlocked] = useState(() => isProjectUnlocked(projectId));
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const heroRef = React.useRef<HTMLDivElement>(null);
  const missionRef = React.useRef<HTMLDivElement>(null);
  const skipStartRef = React.useRef<HTMLDivElement>(null);
  const skipEndRef = React.useRef<HTMLDivElement>(null);
  
  // Fullscreen state is controlled by URL via initialFullscreen prop
  const isFullscreen = initialFullscreen;

  // Fetch project data from Sanity (uses preloaded cache if available)
  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true);
        
        // Check cache first (populated by preloadLikelyPages)
        const cacheKey = `project:${projectId}`;
        const cachedData = getCachedData<Project>(cacheKey);
        
        if (cachedData) {
          setProject(cachedData);
          setError(null);
          setLoading(false);
          return;
        }
        
        // Fallback to fetching from Sanity
        const data = await client.fetch<Project>(PROJECT_BY_COMPANY_QUERY, {
          company: projectId,
        });
        setProject(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Failed to load project");
      } finally {
        setLoading(false);
      }
    }

    fetchProject();
  }, [projectId]);

  // Lock body scroll when modal is open (popup mode only, flicker-free implementation)
  useScrollLock(!isFullscreen);

  // Trigger enter animation on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  // Handle scroll for header effects (shrink in fullscreen, hide in popup)
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    let scrollHandler: (() => void) | null = null;
    
    // Helper to get element's position relative to scroll container
    const getOffsetTop = (element: HTMLElement, container: HTMLElement): number => {
      let offsetTop = 0;
      let currentElement: HTMLElement | null = element;
      
      while (currentElement && currentElement !== container) {
        offsetTop += currentElement.offsetTop;
        currentElement = currentElement.offsetParent as HTMLElement | null;
      }
      
      return offsetTop;
    };
    
    // Wait a bit for content to render
    const timeoutId = setTimeout(() => {
      scrollHandler = () => {
        const scrollTop = scrollContainer.scrollTop;
        setIsScrolled(scrollTop > 20);
        
        // Check if we should show the skip link (between configured start and end sections)
        if (skipStartRef.current && skipEndRef.current) {
          const startTop = getOffsetTop(skipStartRef.current, scrollContainer);
          const endTop = getOffsetTop(skipEndRef.current, scrollContainer);
          const scrollPosition = scrollTop;
          
          // Show link if we've scrolled past start section but not yet reached end section
          setShowSkipLink(scrollPosition >= (startTop - 200) && scrollPosition < (endTop - 200));
        }
      };

      if (scrollHandler) {
        scrollContainer.addEventListener("scroll", scrollHandler);
        // Run once immediately to check initial state
        scrollHandler();
      }
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (scrollHandler) {
        scrollContainer.removeEventListener("scroll", scrollHandler);
      }
    };
  }, [project, loading]);

  // Observe when mission section leaves the viewport (for hiding breadcrumb)
  useEffect(() => {
    const missionElement = missionRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!missionElement || !scrollContainer || !isFullscreen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Check if mission has scrolled OUT OF VIEW (above the viewport)
          const missionTop = entry.boundingClientRect.top;
          const rootTop = entry.rootBounds?.top ?? 0;
          
          // Mission is past when its bottom is above the visible area (scrolled up and out)
          const isPast = !entry.isIntersecting && missionTop < rootTop;
          setIsPastHero(isPast);
        });
      },
      {
        root: scrollContainer,
        threshold: 0,
        rootMargin: "0px 0px 0px 0px",
      }
    );

    observer.observe(missionElement);
    return () => observer.disconnect();
  }, [isFullscreen, project]);

  // Handle ESC key to close modal (only in popup mode, not fullscreen)
  useEffect(() => {
    if (isFullscreen) return; // Don't close fullscreen with ESC
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleExpandToFullscreen = () => {
    if (onExpandToFullscreen) {
      onExpandToFullscreen();
    }
  };

  const handleBack = () => {
    if (isFullscreen) {
      // In fullscreen mode, clicking logo should go to homepage top
      if (onViewAllProjects) {
        onViewAllProjects();
      }
    } else if (onBack) {
      setIsClosing(true);
      setIsVisible(false);
      setTimeout(() => {
        onBack();
      }, 300);
    }
  };

  // Handle unlocking a password-protected project
  const handleUnlock = () => {
    // Mark project as unlocked in session storage
    markProjectUnlocked(projectId);
    setIsUnlocked(true);
    
    // Scroll to top helper - aggressive scrolling for all scrollable elements
    const scrollToTop = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    
    // If in modal mode, expand to fullscreen
    // The fullscreen page will naturally start from the top
    if (!isFullscreen && onExpandToFullscreen) {
      onExpandToFullscreen();
      // Scroll after fullscreen mode has rendered
      setTimeout(scrollToTop, 50);
      setTimeout(scrollToTop, 100);
      setTimeout(scrollToTop, 200);
    } else {
      // Already in fullscreen - scroll to top after content re-renders
      // Use multiple attempts with increasing delays to ensure scroll happens after React re-renders
      scrollToTop();
      setTimeout(scrollToTop, 50);
      setTimeout(scrollToTop, 100);
      setTimeout(scrollToTop, 200);
      setTimeout(scrollToTop, 300);
      setTimeout(scrollToTop, 500);
    }
  };

  // Handle skip to final designs
  const handleSkipToFinalDesigns = (e: React.MouseEvent) => {
    e.preventDefault();
    if (skipEndRef.current && scrollContainerRef.current) {
      // Use the same getOffsetTop helper to get correct position
      const getOffsetTop = (element: HTMLElement, container: HTMLElement): number => {
        let offsetTop = 0;
        let currentElement: HTMLElement | null = element;
        
        while (currentElement && currentElement !== container) {
          offsetTop += currentElement.offsetTop;
          currentElement = currentElement.offsetParent as HTMLElement | null;
        }
        
        return offsetTop;
      };
      
      const skipEndTop = getOffsetTop(skipEndRef.current, scrollContainerRef.current);
      scrollContainerRef.current.scrollTo({ top: skipEndTop - 20, behavior: 'smooth' });
    }
  };

  const handleProjectClick = (company: string) => {
    if (onProjectClick) {
      // Navigate immediately - the key prop in App.tsx will ensure
      // a fresh modal instance is created for the new project
      onProjectClick(company);
    }
  };

  return (
    <div className={clsx(
      "fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ease-out",
      isFullscreen ? "px-0" : "px-8"
    )}>
      {/* Overlay */}
      <div
        className={clsx(
          "absolute inset-0 bg-black/20 transition-opacity duration-500",
          isVisible && !isFullscreen ? "opacity-100" : "opacity-0",
          isFullscreen && "pointer-events-none"
        )}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={clsx(
          "relative bg-white flex flex-col overflow-hidden transition-all duration-500 ease-out",
          isFullscreen
            ? "w-full h-full rounded-none"
            : "rounded-[26px] w-[calc(100%*10/12)] max-md:w-full max-h-[80vh] sm:max-h-[90vh]",
          isVisible
            ? "opacity-100 translate-y-0"
            : isClosing
            ? "opacity-0 translate-y-4"
            : "opacity-0 translate-y-8"
        )}
      >
        {/* Inner container */}
        <div className="flex flex-col flex-1 min-h-0 relative">
          {/* Non-fullscreen header - absolutely positioned to float over content */}
          {!isFullscreen && (
            /* Modal header with expand button */
            <div className="absolute top-0 left-0 right-0 flex items-start justify-start px-7 pt-6 pb-3 z-10">
              {/* Expand button */}
              <button
                onClick={handleExpandToFullscreen}
                className="content-stretch flex items-center justify-center relative shrink-0 size-6 cursor-pointer rounded-sm hover:bg-gray-200 transition-colors duration-200 ease-out text-[#4b5563]"
              >
                <div className="relative shrink-0 size-[18px]">
                  <BackArrowIcon />
                </div>
              </button>
            </div>
          )}

          {/* Skip to Final Designs Link */}
          <a
            href="#final-designs"
            onClick={handleSkipToFinalDesigns}
            className={clsx(
              "fixed z-[100] font-medium text-gray-400 hover:text-blue-500 cursor-pointer leading-tight",
              "transition-all duration-300 ease-in-out",
              showSkipLink ? "opacity-100" : "opacity-0 pointer-events-none",
              isFullscreen ? "top-16 left-14 max-md:left-6" : "top-16 left-8"
            )}
          >
            <div className="flex flex-col gap-0.5 items-start">
              <span className="text-[0.8rem]">↓ SKIP TO</span>
              <span className="text-[0.8rem]">DESIGNS</span>
            </div>
          </a>

          {/* Scrollable content */}
          <div ref={scrollContainerRef} className={clsx(
            "overflow-y-auto overflow-x-hidden flex-1",
            !isFullscreen && "rounded-t-[26px]"
          )}>
          {/* Fullscreen header - INSIDE scroll container so sticky works and gradient fades content */}
          {isFullscreen && (
            <div 
              className={clsx(
                "content-stretch flex flex-col items-start px-14 max-md:px-6 relative shrink-0 w-full md:sticky md:top-0 z-10 transition-all duration-300 ease-out",
                isScrolled ? "py-4" : "py-8"
              )}
              /*style={{ 
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.5) 33%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.2) 60%, rgba(255,255,255,0.1) 70%, rgba(255,255,255,0) 100%)'
              }} */
            >
              <div className="content-stretch flex gap-1.5 items-center relative shrink-0 w-full">
                <button
                  onClick={handleBack}
                  className={clsx(
                    "overflow-clip relative shrink-0 cursor-pointer hover:opacity-80 transition-all duration-300 ease-out p-0 border-0 bg-transparent",
                    isScrolled ? "size-7" : "size-[44px]"
                  )}
                >
                  <img
                    src="/logo.png"
                    alt="Michelle Liu"
                    className="size-full object-cover"
                  />
                </button>
                
                {/* Breadcrumb navigation */}
                <Breadcrumb 
                  projectName={project?.title || projectId.charAt(0).toUpperCase() + projectId.slice(1)}
                  onWorkClick={onViewAllProjects}
                  isScrolled={isScrolled}
                  isPastHero={isPastHero}
                />
              </div>
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center py-32">
              <div className="text-gray-400">Loading...</div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-32">
              <div className="text-red-500">{error}</div>
            </div>
          )}

          {!loading && !error && project && (
            <div className="flex flex-col pb-16">
              {/* Mobile not available message - shown only after unlocking on mobile */}
              {isUnlocked && isMobile && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
                  <LaptopIcon />
                  <p className="text-[#6b7280] text-base leading-6 px-12 mt-4">
                    This page isn't available on mobile yet. You can view it on desktop instead! {";)"}
                  </p>
                </div>
              )}
              
              {/* Project Hero Header - hidden on mobile when unlocked */}
              {!(isUnlocked && isMobile) && (
              <>
              <div className="content-stretch flex flex-col gap-8 items-start justify-center px-8 md:px-[8%] xl:px-[175px] pt-32 pb-16 relative shrink-0 w-full">
                {/* Logo */}
                {project.logo && (
                  <ScrollReveal variant="fade" rootMargin="0px">
                    <div className="relative shrink-0 size-20 rounded-[16px] overflow-hidden">
                      <img
                        className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
                        alt=""
                        src={urlFor(project.logo).width(160).height(160).url()}
                      />
                    </div>
                  </ScrollReveal>
                )}

                {/* Title and Metadata */}
                <div className="content-stretch flex flex-col gap-10 items-start relative shrink-0 w-full">
                  {/* Title */}
                  <ScrollReveal variant="fade" delay={80} rootMargin="0px">
                    <p className="font-normal leading-5 relative shrink-0 text-4xl text-black">
                      {project.title}
                    </p>
                  </ScrollReveal>

                  {/* Metadata Grid */}
                  {project.metadata && project.metadata.length > 0 && (
                    <div className="content-stretch flex gap-5 items-start relative shrink-0 w-full max-md:grid max-md:grid-cols-2 max-md:gap-4">
                      {project.metadata.map((item) => (
                        <ScrollReveal key={item._key} variant="fade" delay={160} rootMargin="0px" className="flex-[1_0_0] min-h-px min-w-px">
                          <div className="content-stretch flex flex-col gap-3 items-start leading-5 relative shrink-0 text-base whitespace-pre-wrap">
                            <p className="font-medium relative shrink-0 text-[#9ca3af]">
                              {item.label}
                            </p>
                            <p className="font-normal relative shrink-0 text-black">
                              {item.value.map((v, i) => (
                                <React.Fragment key={i}>
                                  {v}
                                  {i < item.value.length - 1 && <br />}
                                </React.Fragment>
                              ))}
                              {item.subValue && (
                                <>
                                  <br />
                                  <span className="italic text-gray-600">{item.subValue}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </ScrollReveal>
                      ))}
                    </div>
                  )}
                </div>

                {/* Separator Line */}
                <ScrollReveal variant="fade" delay={400} rootMargin="0px" className="w-full">
                  <Line />
                </ScrollReveal>

                {/* Hero Video or Image */}
                {project.heroVideo ? (
                  <ScrollReveal delay={480} rootMargin="0px" className="w-full">
                    <div ref={heroRef} className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full">
                      <div className="aspect-[1090/591] relative rounded-[26px] shrink-0 w-full overflow-hidden bg-gray-100">
                        {/* Fallback image while video loads */}
                        {project.heroImage && (
                          <img
                            className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[26px] size-full"
                            alt=""
                            src={urlFor(project.heroImage).width(1200).url()}
                          />
                        )}
                        {/* Hero video */}
                        <VideoPlayer
                          src={`https://stream.mux.com/${project.heroVideo}.m3u8`}
                          className="absolute inset-0 max-w-none object-cover rounded-[26px] size-full"
                          autoPlay
                          muted
                          loop
                          controls={false}
                          poster={project.heroImage ? urlFor(project.heroImage).width(1200).url() : undefined}
                        />
                      </div>
                    </div>
                  </ScrollReveal>
                ) : project.heroImage ? (
                  <ScrollReveal delay={480} rootMargin="0px" className="w-full">
                    <div ref={heroRef} className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full">
                      <div className="aspect-[1090/591] relative rounded-[26px] shrink-0 w-full">
                        <img
                          className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[26px] size-full"
                          alt=""
                          src={urlFor(project.heroImage).width(1200).url()}
                        />
                      </div>
                    </div>
                  </ScrollReveal>
                ) : null}
              </div>

              {/* Dynamic Content Sections */}
              {(() => {
                // Filter content based on unlock state and visibility settings
                let sections = project.content || [];
                
                // Helper to check if a section should be visible
                const shouldShowSection = (section: ContentSection) => {
                  // ProtectedSection: only show when locked
                  if (section._type === "protectedSection") {
                    return !isUnlocked;
                  }
                  
                  // Check visibility setting (default to "both" if not set)
                  const visibility = (section as any).visibility || "both";
                  if (visibility === "both") return true;
                  if (visibility === "locked") return !isUnlocked;
                  if (visibility === "unlocked") return isUnlocked;
                  return true;
                };
                
                // Filter by visibility first
                sections = sections.filter(shouldShowSection);
                
                // When locked, also include the protectedSection at its original position
                // No longer truncating - just let visibility settings control everything
                
                return sections.map((section) => 
                  // Testimonials have interactive expand/collapse - skip ScrollReveal
                  // to prevent animation from replaying when clicking "Read more"
                  section._type === "testimonialSection" ? (
                    <ContentBlock
                      key={section._key}
                      section={section}
                      isFullscreen={isFullscreen}
                      isUnlocked={isUnlocked}
                      onUnlock={handleUnlock}
                      projectId={projectId}
                      skipStartRef={skipStartRef}
                      skipEndRef={skipEndRef}
                      scrollContainerRef={scrollContainerRef}
                      missionRef={missionRef}
                    />
                  ) : (
                    <ScrollReveal key={section._key}>
                      <ContentBlock 
                        section={section} 
                        isFullscreen={isFullscreen} 
                        isUnlocked={isUnlocked} 
                        onUnlock={handleUnlock}
                        skipStartRef={skipStartRef}
                        skipEndRef={skipEndRef}
                        scrollContainerRef={scrollContainerRef}
                        projectId={projectId}
                        missionRef={missionRef}
                      />
                    </ScrollReveal>
                  )
                );
              })()}

              {/* Also Check Out Section */}
              {project.relatedProjects && project.relatedProjects.length > 0 && (
                <ScrollReveal variant="fade">
                  <AlsoCheckOut
                    projects={project.relatedProjects.map((related) => ({
                      id: related._id,
                      title: related.title,
                      year: related.year,
                      description: related.shortDescription || "",
                      imageSrc: related.heroImage ? urlFor(related.heroImage).width(800).height(434).url() : "",
                    }))}
                    onProjectClick={(proj) => {
                      // Find the original related project to get the company name
                      const relatedProject = project.relatedProjects?.find((r) => r._id === proj.id);
                      if (relatedProject?.company) {
                        handleProjectClick(relatedProject.company);
                      }
                    }}
                    onViewAll={isFullscreen ? onViewAllProjects : undefined}
                  />
                </ScrollReveal>
              )}
              </>
              )}
            </div>
          )}

          {!loading && !error && !project && (
            <div className="flex items-center justify-center py-32">
              <div className="text-gray-400">Project not found</div>
            </div>
          )}

          {/* Footer - only shown in fullscreen mode */}
          {isFullscreen && <Footer />}
        </div>
        </div>
      </div>
    </div>
  );
}

// Collapse arrow icon for testimonial (diagonal arrow pointing up-left)
const CollapseArrowIcon = () => (
  <svg
    className="block size-full"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.7803 14.7803C14.4874 15.0732 14.0126 15.0732 13.7197 14.7803L6.5 7.56066V13.25C6.5 13.6642 6.16421 14 5.75 14C5.33579 14 5 13.6642 5 13.25V5.75C5 5.33579 5.33579 5 5.75 5H13.25C13.6642 5 14 5.33579 14 5.75C14 6.16421 13.6642 6.5 13.25 6.5H7.56066L14.7803 13.7197C15.0732 14.0126 15.0732 14.4874 14.7803 14.7803Z"
      fill="#9CA3AF"
    />
  </svg>
);

// Expand arrow icon for mobile (diagonal arrow pointing down-right)
const ExpandArrowIcon = () => (
  <svg
    className="block size-full rotate-180"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.7803 14.7803C14.4874 15.0732 14.0126 15.0732 13.7197 14.7803L6.5 7.56066V13.25C6.5 13.6642 6.16421 14 5.75 14C5.33579 14 5 13.6642 5 13.25V5.75C5 5.33579 5.33579 5 5.75 5H13.25C13.6642 5 14 5.33579 14 5.75C14 6.16421 13.6642 6.5 13.25 6.5H7.56066L14.7803 13.7197C15.0732 14.0126 15.0732 14.4874 14.7803 14.7803Z"
      fill="#9CA3AF"
    />
  </svg>
);

// Testimonial Block Component - matches Figma design
type TestimonialBlockProps = {
  sectionLabel?: string;
  sectionTitle?: string;
  highlightedText?: string;
  highlightColor?: string;
  quote?: string;
  fullQuote?: string[];
  authorName?: string;
  authorTitle?: string;
  authorCompany?: string;
  authorImage?: any;
  isFullscreen?: boolean;
};

function TestimonialBlock({
  sectionLabel = "Feedback",
  sectionTitle = "Kind words from my manager",
  highlightedText,
  highlightColor,
  quote,
  fullQuote,
  authorName,
  authorTitle,
  authorCompany,
  authorImage,
  isFullscreen = false,
}: TestimonialBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sectionRef = React.useRef<HTMLDivElement>(null);

  const toggleExpanded = () => {
    const wasExpanded = isExpanded;
    setIsAnimating(true);
    setIsExpanded(!isExpanded);
    
    // If collapsing, scroll to the section after a short delay
    if (wasExpanded && sectionRef.current) {
      // Wait for the collapse animation to start, then scroll
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 50);
    }
    
    // Reset animating state after transition completes
    setTimeout(() => setIsAnimating(false), 400);
  };

  // Combine title and company for display
  const authorSubtitle = authorCompany
    ? `${authorTitle}, ${authorCompany}`
    : authorTitle;

  return (
    <div 
      ref={sectionRef}
      className="content-stretch flex flex-col items-start justify-center px-8 md:px-[8%] xl:px-[175px] py-10 relative shrink-0 w-full scroll-mt-8"
    >
      <div className="content-stretch flex flex-col gap-[100px] max-md:gap-16 items-start relative shrink-0 w-full">
        {/* Header Section */}
        <div className="content-stretch flex flex-col gap-5 items-start relative shrink-0 w-full">
          <p className="leading-5 relative shrink-0 text-[#9ca3af] uppercase text-base">
            {sectionLabel}
          </p>
          <p className="leading-7 min-w-full relative shrink-0 text-2xl text-black whitespace-pre-wrap">
            {sectionTitle && renderHighlightedText(sectionTitle, highlightedText, highlightColor)}
          </p>
        </div>

        {/* Quote Section - Layout changes based on expanded state */}
        <div
          className={clsx(
            "content-stretch flex items-start relative shrink-0 w-full",
            // Desktop: side-by-side layout, with horizontal padding only in fullscreen
            "justify-between",
            isFullscreen && "px-[111px]",
            // Mobile: stacked layout with horizontal padding
            "max-md:flex-col max-md:gap-16 max-md:px-12"
          )}
        >
          {/* Author Info - Left Side */}
          <div
            className={clsx(
              "content-stretch flex relative shrink-0",
              // Desktop: vertical stack
              "flex-col gap-6 items-start w-[202px]",
              // Mobile: horizontal layout
              "max-md:flex-row max-md:gap-8 max-md:items-center max-md:w-auto"
            )}
          >
            {/* Avatar */}
            <div className="relative rounded-full shrink-0 size-[120px] overflow-hidden bg-gray-100">
              {authorImage && (
                <img
                  className="absolute inset-0 max-w-none object-cover pointer-events-none size-full"
                  alt={authorName || ""}
                  src={urlFor(authorImage).width(240).height(240).url()}
                />
              )}
            </div>

            {/* Name and Title */}
            <div className="content-stretch flex flex-col gap-1 items-start leading-5 relative shrink-0 text-base max-md:flex-1">
              <p className="relative shrink-0 text-black">{authorName}</p>
              <p className="relative shrink-0 text-[#9ca3af]">{authorSubtitle}</p>
            </div>
          </div>

          {/* Quote Content - Right Side */}
          <div
            className={clsx(
              "content-stretch flex flex-col gap-6 relative shrink-0",
              // Keep alignment consistent - no change on expand to prevent weird transition
              "items-start justify-center",
              // Mobile: full width
              "max-md:w-full"
            )}
          >
            {/* Quote Graphic - positioned above quote */}
            <div
              className={clsx(
                "absolute pointer-events-none",
                // Desktop positioning
                "-top-[77px] -left-[77px] w-[121px] h-[120px]",
                // Mobile positioning
                "max-md:-left-[50px] max-md:-top-[50px] max-md:w-[80px] max-md:h-[80px]"
              )}
            >
              <img
                src={quoteGraphic}
                alt=""
                className="w-full h-full object-contain"
              />
            </div>

            {/* Quote Text Container - simple show/hide without layout shifts */}
            <div className="relative w-[424px] max-md:w-full">
              {/* Short Quote - shown when collapsed */}
              {!isExpanded && (
                <div className="leading-normal text-[#1f2937] text-xl whitespace-pre-wrap">
                  <p>{quote}</p>
                </div>
              )}

              {/* Full Quote - shown when expanded */}
              {isExpanded && (
                <div className="leading-normal text-[#1f2937] text-xl whitespace-pre-wrap">
                  {fullQuote?.map((paragraph, index) => (
                    <p
                      key={index}
                      className={index < (fullQuote?.length || 0) - 1 ? "mb-6" : ""}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Action Button - Read More or Collapse */}
            <button
              onClick={toggleExpanded}
              className={clsx(
                "relative shrink-0 cursor-pointer transition-colors duration-300 ease-out",
                isExpanded
                  ? "size-6 hover:opacity-70"
                  : "leading-5 text-[#9ca3af] text-base hover:text-[#6b7280] text-left"
              )}
            >
              {!isExpanded ? (
                fullQuote && fullQuote.length > 0 ? "Read more" : null
              ) : (
                <div className="relative shrink-0 size-5">
                  {/* Desktop: up-left arrow, Mobile: down-right arrow */}
                  <span className="hidden max-md:block">
                    <ExpandArrowIcon />
                  </span>
                  <span className="block max-md:hidden">
                    <CollapseArrowIcon />
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Content section renderer component
function ContentBlock({ 
  section, 
  isFullscreen = false, 
  isUnlocked = false, 
  onUnlock,
  skipStartRef,
  skipEndRef,
  scrollContainerRef,
  projectId,
  missionRef
}: { 
  section: ContentSection; 
  isFullscreen?: boolean; 
  isUnlocked?: boolean; 
  onUnlock?: () => void;
  skipStartRef?: React.RefObject<HTMLDivElement | null>;
  skipEndRef?: React.RefObject<HTMLDivElement | null>;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  projectId?: string;
  missionRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const renderContent = () => {
    switch (section._type) {
      case "missionSection":
      // Check if there's description content and image
      const hasDescription = section.missionDescription && section.missionDescription.length > 0;
      const hasImage = !!section.missionImage;
      
      // Centered layout when image is provided
      if (hasImage) {
        return (
          <div ref={missionRef} className="flex flex-col items-center px-8 md:px-[8%] xl:px-[175px] py-10 relative shrink-0 w-full">
            {/* Label + Title */}
            <div className="flex flex-col gap-5 items-center text-center w-[410px] max-md:w-full">
              <p className="leading-5 text-[#9ca3af] uppercase text-base">
                {section.sectionLabel || "The Mission"}
              </p>
              <p className="leading-7 text-2xl text-black whitespace-pre-wrap text-pretty">
                {renderHighlightedText(section.missionTitle, section.highlightedText, section.highlightColor)}
              </p>
            </div>

            {/* Image */}
            <div className="relative mt-8 w-[410px] max-md:w-full">
              <img
                src={urlFor(section.missionImage).width(820).url()}
                alt=""
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Description */}
            {hasDescription && (
              <div className="flex flex-col gap-8 mt-8 w-[410px] max-md:w-full px-8 max-md:px-0">
                <div className="leading-normal text-[#4b5563] text-base whitespace-pre-wrap prose prose-p:my-6 prose-ul:list-disc prose-ul:ml-5 prose-ul:space-y-2 prose-ol:list-decimal prose-ol:ml-5 prose-ol:space-y-2 first:prose-p:mt-0 last:prose-p:mb-0">
                  <PortableText value={section.missionDescription} components={portableTextComponents} />
                </div>

                {/* Italic Note */}
                {section.missionNote && (
                  <p className="text-[#9ca3af] text-base italic leading-5">
                    {section.missionNote}
                  </p>
                )}
              </div>
            )}

            {/* Italic Note (when no description) */}
            {!hasDescription && section.missionNote && (
              <p className="text-[#9ca3af] text-base italic leading-5 mt-8 w-[410px] max-md:w-full px-8 max-md:px-0">
                {section.missionNote}
              </p>
            )}
          </div>
        );
      }
      
      // Original layout (no image)
      return (
        <div ref={missionRef} className={clsx(
          "content-stretch items-start px-8 md:px-[8%] xl:px-[175px] py-16 relative shrink-0 w-full",
          // Use flex column layout when no description
          !hasDescription && "flex flex-col gap-5 justify-center",
          // Use grid layout when there is description (two-column)
          hasDescription && "grid grid-cols-[2fr_1fr_2fr] max-md:flex max-md:flex-col max-md:gap-8"
        )}>
          {/* Left: Label + Title */}
          <div className={clsx(
            "content-stretch flex flex-col gap-5 items-start relative",
            // When no description, constrain title width to max 646px (per Figma) but allow shrinking
            !hasDescription && "max-w-[646px] w-full",
            hasDescription && "col-start-1"
          )}>
            <p className="leading-5 relative shrink-0 text-[#9ca3af] uppercase text-base">
              {section.sectionLabel || "The Mission"}
            </p>
            <p className="leading-7 w-full relative shrink-0 text-2xl text-black whitespace-pre-wrap text-pretty">
              {renderHighlightedText(section.missionTitle, section.highlightedText, section.highlightColor)}
            </p>
          </div>

          {/* Right: Description - only shown when there is description content */}
          {hasDescription && (
            <div className="leading-normal relative text-[#4b5563] text-base whitespace-pre-wrap col-start-3 max-md:col-start-auto max-md:w-full prose prose-p:my-6 prose-ul:list-disc prose-ul:ml-5 prose-ul:space-y-2 prose-ol:list-decimal prose-ol:ml-5 prose-ol:space-y-2 first:prose-p:mt-0 last:prose-p:mb-0">
              <PortableText value={section.missionDescription} components={portableTextComponents} />
            </div>
          )}
        </div>
      );

    case "protectedSection":
      // Check visibility setting
      const shouldShowProtected = 
        section.visibility === 'both' || 
        (section.visibility === 'locked' && !isUnlocked) || 
        (section.visibility === 'unlocked' && isUnlocked) ||
        (!section.visibility && !isUnlocked); // Default behavior: show when locked
      
      if (!shouldShowProtected) return null;
      
      const hasPassword = !!(section.showPasswordProtection && section.password);
      return (
        <div className="content-stretch flex flex-col items-start px-8 md:px-[8%] xl:px-[175px] py-10 relative shrink-0 w-full">
          <div className="bg-gray-100 content-stretch flex flex-col items-center justify-center overflow-clip p-16 max-md:p-8 relative rounded-[26px] shrink-0 w-full">
            <div className={clsx(
              "content-stretch flex flex-col items-start relative shrink-0 w-full",
              hasPassword && "gap-8"
            )}>
              <div className="content-stretch flex flex-col gap-8 items-start justify-center relative shrink-0">
                {/* Lock Icon with shadow */}
                <div className="relative shrink-0 size-[60px]">
                  <div className="absolute inset-0 rounded-full bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.08),0px_1px_2px_-1px_rgba(0,0,0,0.08)] flex items-center justify-center">
                    <img src={lockIcon} alt="" className="w-[19px] h-[28px]" />
                  </div>
                </div>

                {/* Text Content */}
                <div className="content-stretch flex flex-col gap-2 items-start relative shrink-0 w-full">
                  <p className="leading-7 relative shrink-0 text-2xl text-black">
                    {(section.title || (projectId === "apple" ? "This work is confidential." : hasPassword ? "This case study is password-protected." : "Confidential")).replace(/\n/g, ' ')}
                  </p>
                  <p className="leading-6 relative shrink-0 text-[#9ca3af] text-lg">
                    {projectId === "apple" ? "Please " : hasPassword ? "Curious? Feel free to " : (section.message || "Interested? Please ")}
                    {section.contactEmail ? (
                      <>
                        <a
                          href={`mailto:${section.contactEmail}`}
                          className="underline decoration-solid hover:text-blue-500 transition-colors"
                        >
                          email me
                        </a>
                        {projectId === "apple" ? " if you'd like to chat!" : "!"}
                      </>
                    ) : (
                      projectId === "apple" ? "email me if you'd like to chat!" : "email me!"
                    )}
                  </p>
                </div>
              </div>

              {/* Password Input - shown when password is set in Sanity */}
              {hasPassword && !isUnlocked && (
                <PasswordInput expectedPassword={section.password || ''} onUnlock={onUnlock} />
              )}
            </div>
          </div>
        </div>
      );

    case "featureSection":
      const featureImageSrc = section.externalImageUrl
        ? section.externalImageUrl
        : section.image
          ? urlFor(section.image).width(2400).url()
          : null;

      const hasVideo = section.mediaType === 'video' && section.muxPlaybackId;
      const isStacked = section.layout === 'stacked';
      const mediaOnLeft = section.mediaPosition === 'left';
      
      // Determine vertical padding
      const paddingMap = {
        small: 'py-10',
        normal: 'py-16',
        large: 'py-20',
      };
      const verticalPadding = paddingMap[section.verticalPadding || 'normal'];

      if (isStacked) {
        // Check if there's any text content
        const hasTextContent = section.sectionNumber || section.sectionLabel || section.problemLabel || section.heading || (section.description && section.description.length > 0);
        
        // Stacked layout - text above (two-col format), media below (full width)
        return (
          <div className="flex flex-col">
            <div
              className="content-stretch flex flex-col items-start px-8 md:px-[8%] xl:px-[175px] relative shrink-0 w-full"
              style={{ backgroundColor: section.backgroundColor || '#f9fafb' }}
            >
              <div className={clsx("content-stretch flex flex-col justify-between relative shrink-0 w-full", verticalPadding)}>
                {/* Text content in two-column grid - only render if there's text */}
                {hasTextContent && (
                  <div className="flex flex-row items-start gap-32 w-full max-md:flex max-md:flex-col max-md:gap-8 mb-8">
                    {/* Left column: Labels and heading */}
                    <div className="content-stretch flex w-120 flex-col gap-3 items-start relative col-start-1">
                      {/* Section Number + Label */}
                      {(section.sectionNumber || section.sectionLabel) && (
                        <div className="flex items-center gap-2">
                          {section.sectionNumber && (
                            <p className="leading-5 relative shrink-0 text-[#3b82f6] uppercase text-base font-medium">
                              {section.sectionNumber}
                            </p>
                          )}
                          {section.sectionLabel && (
                            <p className="leading-5 relative shrink-0 uppercase text-base">
                              {section.sectionLabel}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Problem Label */}
                      {section.problemLabel && (
                        <p className="leading-5 relative shrink-0 uppercase text-[#9ca3af] text-base">
                          {section.problemLabel}
                        </p>
                      )}

                      {/* Heading */}
                      {section.heading && (
                        <p className="leading-7 min-w-120 relative shrink-0 text-2xl text-black whitespace-pre-wrap">
                          {renderHighlightedText(section.heading, section.highlightedText, section.highlightColor)}
                        </p>
                      )}
                    </div>

                    {/* Right column: Description */}
                    {section.description && section.description.length > 0 && (
                      <div className="leading-normal max-w-120 relative text-gray-500 text-base col-start-3 max-md:col-start-auto max-md:w-full prose prose-p:my-6 prose-ul:list-disc prose-ul:ml-5 prose-ul:space-y-2 prose-ol:list-decimal prose-ol:ml-5 prose-ol:space-y-2 first:prose-p:mt-0 last:prose-p:mb-0 [&>p]:whitespace-pre-wrap">
                        <PortableText value={section.description} components={createPortableTextComponents(section.descriptionHighlightedText, section.descriptionHighlightColor)} />
                      </div>
                    )}
                  </div>
                )}

                {/* Media content - full width */}
                <div className="w-full">
                  {/* Video */}
                  {hasVideo && (
                    <div className="w-full overflow-hidden rounded-[26px]">
                      <div className="aspect-video w-full">
                        <VideoPlayer
                          src={`https://stream.mux.com/${section.muxPlaybackId}.m3u8`}
                          className="w-full h-full object-cover"
                          controls={false}
                          autoPlay
                          muted
                          loop
                        />
                      </div>
                    </div>
                  )}

                  {/* Image */}
                  {!hasVideo && featureImageSrc && (
                    <div className="overflow-hidden rounded-[26px] w-full">
                      <img
                        className="w-full object-cover"
                        alt={section.imageAlt || ""}
                        src={featureImageSrc}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Side-by-side layout (original)
      // Check if there's any text content
      const hasTextContent = section.sectionNumber || section.sectionLabel || section.problemLabel || section.heading || (section.description && section.description.length > 0);
      
      return (
        <div className="flex flex-col">
        <div
          className="content-stretch flex flex-col items-start px-8 md:px-[8%] xl:px-[175px] relative shrink-0 w-full"
          style={{ backgroundColor: section.backgroundColor || '#f9fafb' }}
        >
          <div className={clsx(
            "content-stretch items-center flex flex-col gap-32 relative shrink-0 w-full md:flex-row max-md:gap-8",
            mediaOnLeft && "md:flex-row-reverse",
            verticalPadding,
            !hasTextContent && "justify-center"
          )}>
            {/* Left: Number, Label, and Heading - only render if there's text */}
            {hasTextContent && (
              <div className="min-w-120 shrink-0 content-stretch flex flex-col gap-3 items-start relative col-start-1 max-md:w-full max-md:min-w-0">
              {/* Section Number + Label */}
              {(section.sectionNumber || section.sectionLabel) && (
                <div className="flex items-center gap-2">
                  {section.sectionNumber && (
                    <p className="leading-5 relative shrink-0 text-[#3b82f6] text-base font-medium">
                      {section.sectionNumber}
                    </p>
                  )}
                  {section.sectionLabel && (
                    <p className="leading-5 relative shrink-0 uppercase text-base">
                      {section.sectionLabel}
                    </p>
                  )}
                </div>
              )}
              
              {/* Problem Label */}
              {section.problemLabel && (
                <p className="leading-5 relative shrink-0 uppercase text-[#9ca3af] text-base">
                  {section.problemLabel}
                </p>
              )}
              
              {/* Heading */}
              {section.heading && (
                <p className="leading-7 min-w-120 relative shrink-0 text-2xl text-black whitespace-pre-wrap">
                  {renderHighlightedText(section.heading, section.highlightedText, section.highlightColor)}
                </p>
              )}

              {/* Description */}
            {section.description && section.description.length > 0 && (
                <div className="pt-6 max-w-120 prose prose-p:my-6 prose-ul:list-disc prose-ul:ml-5 prose-ul:space-y-2 prose-ol:list-decimal prose-ol:ml-5 prose-ol:space-y-2 first:prose-p:mt-0 last:prose-p:mb-0 text-gray-500 [&>p]:whitespace-pre-wrap">
                  <PortableText value={section.description} components={createPortableTextComponents(section.descriptionHighlightedText, section.descriptionHighlightColor)} />
                </div>
              )}
            </div>
            )}

            {/* Right: Image/Video and Description */}
            <div className="leading-5 max-w-120 flex-items-center relative text-[#4b5563] text-base whitespace-pre-wrap items-center flex flex-col gap-8">
              {/* Video */}
              {hasVideo && (
                <div className="w-full min-w-200 overflow-hidden rounded-[26px] ">
                  <div className="aspect-video w-full">
                    <VideoPlayer
                      src={`https://stream.mux.com/${section.muxPlaybackId}.m3u8`}
                      className="w-full h-full object-cover"
                      controls={false}
                      autoPlay
                      muted
                      loop
                    />
                  </div>
                </div>
              )}
              
              {/* Image */}
              {!hasVideo && featureImageSrc && (
                <div className="overflow-hidden rounded-[26px] w-full">
                  <img
                    className="w-full object-cover"
                    alt={section.imageAlt || ""}
                    src={featureImageSrc}
                  />
                </div>
              )}
              
              
            </div>
          
          </div>
        </div>
        </div>
      );

    case "gallerySection":
      const colsClass =
        section.layout === "2-col"
          ? "grid-cols-2"
          : section.layout === "3-col"
          ? "grid-cols-3"
          : "grid-cols-4";
      return (
        <div className="content-stretch flex flex-col gap-4 px-8 md:px-[8%] xl:px-[175px] py-10 relative shrink-0 w-full">
          {/* Image Grid */}
          <div
            className={`content-stretch grid gap-4 items-center relative w-full max-md:grid-cols-2 ${colsClass}`}
          >
            {section.images?.map((image) => (
              <div
                key={image._key}
                className="aspect-[200/300] content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px overflow-clip relative rounded-[26px] shadow-[0px_2px_8px_0px_#eaeaea] shrink-0"
              >
                <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-[26px] shrink-0 w-full">
                  <img
                    className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[26px] size-full"
                    alt={image.alt || ""}
                    src={urlFor(image).width(400).height(600).url()}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Caption/Title below gallery */}
          {section.title && (
            <p className="font-normal pt-4 leading-5 relative shrink-0 text-gray-400 text-base text-center w-full">
              {section.title}
            </p>
          )}
        </div>
      );

    case "textSection":
      if (section.layout === "two-col") {
        return (
          <div className="flex gap-20 items-start px-8 md:px-[8%] xl:px-[175px] py-10 relative shrink-0 w-full max-md:flex-col max-md:gap-8">
            <div className="w-[49%] shrink-0 content-stretch flex flex-col gap-3 items-start relative max-md:w-full">
              {section.label && (
                <p className="leading-5 relative uppercase shrink-0 text-[#9ca3af] text-base">
                  {section.label}
                </p>
              )}
              {section.heading && (
                <p className="leading-7 relative shrink-0 text-2xl text-black whitespace-pre-wrap">
                  {renderHighlightedText(section.heading, section.highlightedText, section.highlightColor)}
                </p>
              )}
            </div>
            <div className="flex-1 leading-normal relative text-[#4b5563] text-base whitespace-pre-wrap max-md:w-full prose prose-p:my-6 prose-ul:list-disc prose-ul:ml-5 prose-ul:space-y-2 prose-ol:list-decimal prose-ol:ml-5 prose-ol:space-y-2 first:prose-p:mt-0 last:prose-p:mb-0">
              {section.body && <PortableText value={section.body} components={portableTextComponents} />}
            </div>
          </div>
        );
      }
      if (section.layout === "centered") {
        return (
          <div className="content-stretch flex flex-col gap-4 items-center px-8 md:px-[8%] xl:px-[175px] py-10 relative shrink-0 w-full">
            {section.label && (
              <p className="leading-5 relative shrink-0 uppercase text-[#9ca3af] text-base text-center">
                {section.label}
              </p>
            )}
            {section.heading && (
              <p className="leading-7 relative shrink-0 text-2xl text-black text-center whitespace-pre-line">
                {renderHighlightedText(section.heading, section.highlightedText, section.highlightColor)}
              </p>
            )}
            {section.body && (
              <div className="leading-normal relative text-[#4b5563] text-base whitespace-pre-wrap text-center prose prose-p:my-6 prose-ul:list-disc prose-ul:ml-5 prose-ul:space-y-2 prose-ol:list-decimal prose-ol:ml-5 prose-ol:space-y-2 first:prose-p:mt-0 last:prose-p:mb-0 max-w-[600px]">
                <PortableText value={section.body} components={portableTextComponents} />
              </div>
            )}
          </div>
        );
      }
      if (section.layout === "single-col") {
        return (
          <div className="content-stretch grid grid-cols-[2fr_1fr_2fr] items-start px-8 md:px-[8%] xl:px-[175px] py-10 relative shrink-0 w-full max-md:flex max-md:flex-col max-md:gap-8">
            <div className="content-stretch flex flex-col gap-3 items-start relative col-start-1">
              {section.label && (
                <p className="leading-5 relative shrink-0 uppercase text-[#9ca3af] text-base">
                  {section.label}
                </p>
              )}
              {section.heading && (
                <p className="leading-7 min-w-full relative shrink-0 text-2xl text-black whitespace-pre-wrap">
                  {renderHighlightedText(section.heading, section.highlightedText, section.highlightColor)}
                </p>
              )}
              {section.body && (
                <div className="leading-normal pt-4 relative text-[#4b5563] max-w-100 text-base whitespace-pre-wrap prose prose-p:my-6 prose-ul:list-disc prose-ul:ml-5 prose-ul:space-y-2 prose-ol:list-decimal prose-ol:ml-5 prose-ol:space-y-2 first:prose-p:mt-0 last:prose-p:mb-0 w-full">
                  <PortableText value={section.body} components={portableTextComponents} />
                </div>
              )}
            </div>
          </div>
        );
      }
      return (
        <div className="content-stretch flex flex-col gap-4 items-start px-8 md:px-[8%] xl:px-[175px] py-10 relative shrink-0 w-full">
          {section.label && (
            <p className="leading-5 relative shrink-0 uppercase text-[#9ca3af] text-base">
              {section.label}
            </p>
          )}
          {section.heading && (
            <p className="leading-7 relative shrink-0 text-2xl text-black whitespace-pre-line">
              {renderHighlightedText(section.heading, section.highlightedText, section.highlightColor)}
            </p>
          )}
          {section.body && (
            <div className="leading-normal relative text-[#4b5563] text-base whitespace-pre-wrap prose prose-p:my-6 prose-ul:list-disc prose-ul:ml-5 prose-ul:space-y-2 prose-ol:list-decimal prose-ol:ml-5 prose-ol:space-y-2 first:prose-p:mt-0 last:prose-p:mb-0">
              <PortableText value={section.body} components={portableTextComponents} />
            </div>
          )}
        </div>
      );

    case "imageSection":
      // Support both Sanity images and external URLs
      const imageSrc = section.externalImageUrl 
        ? section.externalImageUrl 
        : section.image 
          ? urlFor(section.image).width(2400).url()
          : null;
      
      if (!imageSrc) return null;
      
      // Determine size classes based on section.size
      const sizeClasses = {
        full: "w-full",
        large: "w-full max-w-[900px]",
        medium: "w-full max-w-[600px]",
        small: "w-full max-w-[400px]",
      };
      const imageSize = section.size || "large";
      const sizeClass = sizeClasses[imageSize as keyof typeof sizeClasses] || sizeClasses.large;
      
      return (
        <div className={clsx(
          "content-stretch flex flex-col py-10 relative shrink-0 w-full",
          imageSize === "full" ? "items-start px-8 md:px-[8%] xl:px-[175px]" : "items-center px-8"
        )}>
          <div
            className={clsx(
              "overflow-hidden",
              sizeClass,
              section.rounded !== false && "rounded-[26px]"
            )}
          >
            <img
              className="w-full object-cover"
              alt={section.alt || ""}
              src={imageSrc}
            />
          </div>
          {section.caption && (
            <p className={clsx("mt-3 text-center text-gray-400", sizeClass)}>{section.caption}</p>
          )}
        </div>
      );

    case "overlayImageSection":
      // Support both Sanity images and external URLs for base and overlay
      const baseImageSrc = section.externalBaseImageUrl 
        ? section.externalBaseImageUrl 
        : section.baseImage 
          ? urlFor(section.baseImage).width(2400).url()
          : null;
      
      const overlayImageSrc = section.externalOverlayImageUrl 
        ? section.externalOverlayImageUrl 
        : section.overlayImage 
          ? urlFor(section.overlayImage).width(800).url()
          : null;
      
      if (!baseImageSrc) return null;
      
      // Determine size classes
      const overlaySizeClasses = {
        full: "w-full",
        large: "w-full max-w-[900px]",
        medium: "w-full max-w-[600px]",
        small: "w-full max-w-[400px]",
      };
      const overlayImageSize = section.size || "large";
      const overlaySizeClass = overlaySizeClasses[overlayImageSize as keyof typeof overlaySizeClasses] || overlaySizeClasses.large;
      
      // Overlay size mapping
      const overlayWidthClass = section.overlaySize === 'small' ? 'w-80' : section.overlaySize === 'large' ? 'w-120' : 'w-100';
      
      // Get position values
      const overlayX = section.overlayPosition?.x ?? 50;
      const overlayY = section.overlayPosition?.y ?? 50;
      
      // Conditional padding based on background color
      const hasBgColor = !!section.backgroundColor;
      
      return (
        <div 
          className={clsx(
            "content-stretch flex flex-col relative shrink-0 w-full",
            hasBgColor && "py-10"
          )}
        >
          <div
            className={clsx(
              "flex flex-col relative shrink-0 w-full",
              overlayImageSize === "full" ? "items-start px-8 md:px-[8%] xl:px-[175px]" : "items-center px-8",
              !hasBgColor && "py-10"
            )}
            style={{ backgroundColor: section.backgroundColor || 'transparent' }}
          >
          <div
            className={clsx(
              "relative",
              overlaySizeClass,
              section.rounded !== false && "rounded-[26px]"
            )}
          >
            {/* Base Image */}
            <img
              className={clsx(
                "w-full object-cover",
                section.rounded !== false && "rounded-[26px]"
              )}
              alt=""
              src={baseImageSrc}
            />
            
            {/* Overlay Image */}
            {overlayImageSrc && (
              <img
                src={overlayImageSrc}
                alt=""
                className={clsx(
                  "absolute",
                  overlayWidthClass,
                  "pointer-events-none"
                )}
                style={{
                  left: `${overlayX}%`,
                  top: `${overlayY}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            )}
          </div>
          </div>
        </div>
      );

    case "videoSection":
      // Extract YouTube video ID from various URL formats
      const getYouTubeId = (url: string): string | null => {
        const patterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        ];
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      };

      // Extract Vimeo video ID from URL
      const getVimeoId = (url: string): string | null => {
        const match = url.match(/vimeo\.com\/(\d+)/);
        return match ? match[1] : null;
      };

      const youtubeId = section.youtubeUrl ? getYouTubeId(section.youtubeUrl) : null;
      const vimeoId = section.vimeoUrl ? getVimeoId(section.vimeoUrl) : null;
      
      // Determine size class
      const videoSize = section.size || 'full';
      const videoSizeClass = videoSize === 'medium' ? 'max-w-[800px]' : 'w-full';
      
      return (
        <div
          className="content-stretch flex flex-col items-center px-8 md:px-[8%] xl:px-[175px] py-10 relative shrink-0 w-full"
          style={{ backgroundColor: section.backgroundColor || 'transparent' }}
        >
          <div className={clsx("w-full", videoSizeClass)}>
          {section.videoType === "mux" && section.muxPlaybackId && (
            <div className="aspect-video w-full overflow-hidden rounded-3xl">
              <VideoPlayer
                src={`https://stream.mux.com/${section.muxPlaybackId}.m3u8`}
                className="w-full h-full object-cover"
                controls={false}
                autoPlay
                muted
                loop
                poster={
                  section.posterImage
                    ? urlFor(section.posterImage).width(1200).url()
                    : `https://image.mux.com/${section.muxPlaybackId}/thumbnail.png`
                }
              />
            </div>
          )}
          {section.videoType === "youtube" && youtubeId && (
            <YouTubeSeamlessLoop videoId={youtubeId} />
          )}
          {section.videoType === "vimeo" && vimeoId && (
            <div className="aspect-video w-full overflow-hidden rounded-3xl relative pointer-events-none">
              <iframe
                src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&controls=0&background=1`}
                className="absolute inset-0 w-full h-full scale-[1.5]"
                allow="autoplay; fullscreen; picture-in-picture"
                title={section.title || "Video"}
              />
            </div>
          )}
          {(section.title || section.caption) && (
            <div className="flex flex-col items-center gap-2 mt-8 text-center">
              {section.title && (
                <p className="text-xl text-black">{section.title}</p>
              )}
              {section.caption && (
                <p className="text-base text-[#9ca3af]">{section.caption}</p>
              )}
            </div>
          )}
          </div>
        </div>
      );

      case "testimonialSection":
        // Testimonial has interactive expand/collapse - don't double-wrap with ScrollReveal
        // to prevent animation from replaying when clicking "Read more"
        return (
          <TestimonialBlock
            sectionLabel={section.sectionLabel}
            sectionTitle={section.sectionTitle}
            highlightedText={section.highlightedText}
            highlightColor={section.highlightColor}
            quote={section.quote}
            fullQuote={section.fullQuote}
            authorName={section.authorName}
            authorTitle={section.authorTitle}
            authorCompany={section.authorCompany}
            authorImage={section.authorImage}
            isFullscreen={isFullscreen}
          />
        );

      case "projectCardSection":
        return section.cards && section.cards.length > 0 ? (
          <ProjectCardSection cards={section.cards} />
        ) : null;

      case "sideQuestSection":
        return (
          <SideQuestSection
            label={section.label}
            title={section.title}
            highlightedText={section.highlightedText}
            highlightColor={section.highlightColor}
            subtitle={section.subtitle}
            image={section.image}
            imageCaption={section.imageCaption}
            teamLabel={section.teamLabel}
            teamMembers={section.teamMembers}
            description={section.description}
          />
        );

      case "dividerSection":
        return (
          <div className="px-8 md:px-[8%] xl:px-[175px] py-8 w-full">
            <div className="h-px relative shrink-0 w-full">
              <div className="absolute bg-[#e5e7eb] inset-0" />
            </div>
          </div>
        );

      case "phoneVideoSection":
        const isVideoLeft = section.layout !== 'video-right';
        const isVideo = section.mediaType !== 'gif';
        const gifSrc = section.externalGifUrl 
          ? section.externalGifUrl 
          : section.gifImage 
            ? urlFor(section.gifImage).width(800).url()
            : null;
        
        return (
          <div className="content-stretch flex flex-col items-start px-8 md:px-[8%] xl:px-[175px] py-10 relative shrink-0 w-full">
            <div className={clsx(
              "flex items-center gap-20 w-full",
              isVideoLeft ? "flex-row" : "flex-row-reverse",
              "max-md:flex-col max-md:gap-8"
            )}>
              {/* Media Container - Black rounded square */}
              <div 
                className="flex items-center justify-center w-[49%] aspect-[1/1] rounded-[26px] shrink-0 max-md:w-full max-md:h-auto max-md:aspect-square p-6"
                style={{ backgroundColor: section.backgroundColor || '#000000' }}
              >
                {/* Video */}
                {isVideo && section.muxPlaybackId && (
                  <div className="w-[90%] h-[90%] overflow-hidden rounded-3xl flex items-center justify-center">
                    <VideoPlayer
                      src={`https://stream.mux.com/${section.muxPlaybackId}.m3u8`}
                      className="max-h-full max-w-full object-contain rounded-3xl"
                      controls={false}
                      autoPlay
                      muted
                      loop
                    />
                  </div>
                )}
                
                {/* GIF/Image */}
                {!isVideo && gifSrc && (
                  <div className="w-[90%] h-[90%] overflow-hidden rounded-3xl flex items-center justify-center">
                    <img
                      src={gifSrc}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Text Content */}
              <div className="flex flex-col gap-6 flex-1">
                {/* Emoji */}
                {section.emoji && (
                  <div className="text-5xl">
                    {section.emoji}
                  </div>
                )}

                <div className="flex flex-col gap-1">

                {/* Section Number + Heading */}
                <div className="flex flex-row gap-2 items-center">
                  {section.sectionNumber && (
                    <p className="text-xl font-normal text-gray-400">
                      {section.sectionNumber}
                    </p>
                  )}
                  
                  {section.heading && (
                    <h3 className="text-xl font-normal text-black leading-normal whitespace-pre-line">
                      {renderHighlightedText(section.heading, section.highlightedText, section.highlightColor)}
                    </h3>
                  )}
                </div>

                {/* Subheading */}
                {section.subheading && (
                  <p className="text-base text-gray-500 max-w-100 leading-normal whitespace-pre-line">
                    {section.subheading}
                  </p>
                )}

                {/* Bullet Points */}
                {section.bulletPoints && section.bulletPoints.length > 0 && (
                  <ul className="flex flex-col gap-3">
                    {section.bulletPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-600">
                        <span className="text-gray-600 mt-0.5 font-bold">•</span>
                        <span className="flex-1 leading-normal">{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
                </div>
              </div>
            </div>
          </div>
        );

      case "learningsSection":
        return (
          <div className="content-stretch flex flex-col items-start px-8 md:px-[8%] xl:px-[175px] py-10 relative shrink-0 w-full">
            {section.sectionTitle && (
              <h3 className="text-2xl font-normal text-black mb-8">
                {section.sectionTitle}
              </h3>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {section.learnings?.map((learning) => (
                <div
                  key={learning._key}
                  className="flex flex-col gap-3 py-6 px-6 rounded-3xl"
                >
                  {/* Emoji */}
                  {learning.emoji && (
                    <div className="text-4xl">
                      {learning.emoji}
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-1">
                  {/* Title */}
                  <h4 className="text-xl font-medium text-gray-700">
                    {learning.title}
                  </h4>
                  
                  {/* Description */}
                  {learning.description && (
                    <p className="text-base text-gray-400 leading-relaxed">
                      {learning.description}
                    </p>
                  )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "sectionTitleSection":
        // Add refs based on skip link flags
        const sectionRef = section.isSkipLinkStart ? skipStartRef : section.isSkipLinkEnd ? skipEndRef : undefined;
        
        return (
          <div 
            ref={sectionRef}
            data-section-number={section.number}
            className="content-stretch flex flex-col gap-5 items-start justify-center px-8 md:px-[8%] xl:px-[175px] py-16 relative shrink-0 w-full"
          >
            {/* Number + Title */}
            <div className="content-stretch flex font-normal gap-5 items-start leading-7 relative shrink-0 text-2xl w-full">
              {section.number && (
                <p className="relative shrink-0" style={{ color: section.numberColor || '#7fa2ff' }}>
                  {section.number}
                </p>
              )}
              {section.title && (
                <p className="relative shrink-0" style={{ color: section.titleColor || '#2e5ede' }}>
                  {section.title}
                </p>
              )}
            </div>
            
            {/* Line */}
            {section.showLine !== false && (
              <div className="h-px relative shrink-0 w-full">
                <div 
                  className="absolute inset-0" 
                  style={{ backgroundColor: section.lineColor || '#e5e7eb' }}
                />
              </div>
            )}
            
            {/* Subtitle */}
            {section.subtitle && (
              <p className="text-lg -mt-1 text-gray-400 font-normal whitespace-pre-wrap">
                {section.subtitle}
              </p>
            )}
          </div>
        );

      case "twoColumnTextImageSection":
        const textImageBgColor = section.backgroundColor || '#FFFFFF';
        const textImageSrc = section.imageUrl 
          ? section.imageUrl 
          : section.image 
            ? urlFor(section.image).width(1200).url()
            : null;

        return (
          <div
            className="content-stretch flex flex-col py-8 max-md:flex-col w-full relative shrink-0"
          >
            {/* Left: Text Content */}
            <div className="max-md:w-full px-8 md:px-[8%] xl:px-[175px] flex flex-col ">
              {/* Heading */}
              {section.heading && (
                <h2 className="text-lg font-normal text-gray-600 whitespace-pre-wrap">
                  {renderHighlightedText(section.heading, section.highlightedText, section.highlightColor)}
                </h2>
              )}

              {/* Text Content */}
              {section.textContent && section.textContent.length > 0 && (
                <div className="text-base text-gray-600 leading-normal prose prose-ul:list-disc prose-ul:ml-5 prose-ul:space-y-2 prose-ol:list-decimal prose-ol:ml-5 prose-ol:space-y-2">
                  <PortableText value={section.textContent} components={portableTextComponents} />
                </div>
              )}
            </div>

{/* Background with Image */}
<div className="max-md:w-full relative -mt-3 max-md:min-h-[300px] flex items-center justify-center px-8 md:px-[8%] xl:px-[175px] py-8">
  {textImageSrc && (
    <div className="inline-block rounded-3xl"             style={{ backgroundColor: textImageBgColor }}>
      <img
        src={textImageSrc}
        alt=""
        className="block max-w-full max-h-full object-contain rounded-lg"
      />
    </div>
  )}
</div>

          </div>
        );

      case "statsCardSection":
        const statsStatColor = section.statColor || '#ec4899';
        const statsTitleColor = section.titleColor || '#9ca3af';
        
        // Layout classes
        const statsLayoutMap = {
          '2-col': 'grid-cols-1 md:grid-cols-2',
          '3-col': 'grid-cols-1 md:grid-cols-3',
          '4-col': 'grid-cols-2 md:grid-cols-4',
        };
        const statsLayout = statsLayoutMap[section.layout || '3-col'];
        
        // Helper to render description with **bold** syntax
        const renderStatsDescription = (text: string) => {
          const parts = text.split(/(\*\*[^*]+\*\*)/g);
          return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
            }
            return part;
          });
        };
        
        return (
          <div className="content-stretch flex flex-col items-start px-8 md:px-[8%] xl:px-[175px] py-10 relative shrink-0 w-full">
            {/* Section Title with optional divider line */}
            {section.sectionTitle && (
              <div className="flex items-center gap-6 w-full mb-10">
                <span 
                  className="text-xl italic whitespace-nowrap"
                  style={{ color: statsTitleColor }}
                >
                  {section.sectionTitle}
                </span>
                {section.showDividerLine !== false && (
                  <div className="flex-1 h-px bg-gray-200" />
                )}
              </div>
            )}
            
            {/* Stats Grid */}
            {section.cards && section.cards.length > 0 && (
              <div className={clsx("grid gap-8 w-full", statsLayout)}>
                {section.cards.map((card) => {
                  const cardStatColor = card.statColorOverride || statsStatColor;
                  
                  return (
                    <div
                      key={card._key}
                      className="flex items-start gap-4"
                    >
                      {/* Stat Value */}
                      <span 
                        className="text-5xl font-light italic leading-none shrink-0"
                        style={{ color: cardStatColor }}
                      >
                        {card.statValue}
                      </span>
                      
                      {/* Description */}
                      {card.description && (
                        <p className="text-base text-gray-700 leading-snug pt-2">
                          {renderStatsDescription(card.description)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "highlightCardSection":
        const highlightBgColor = section.backgroundColor || 'transparent';
        
        // Layout classes
        const highlightLayoutMap = {
          '2-col': 'grid-cols-1 md:grid-cols-2 px-8 md:px-[8%] xl:px-[175px]',
          '3-col': 'grid-cols-1 md:grid-cols-2 gap-4 lg:grid-cols-3 px-8 md:px-[8%] xl:px-[175px]',
          'stacked': 'grid-cols-1',
        };
        const highlightLayout = highlightLayoutMap[section.layout || '2-col'];
        
        // Card style classes
        const getCardStyleClasses = (style: string, cardBgColor?: string) => {
          if (style === 'with-border') {
            return 'border border-gray-50 shadow-default rounded-3xl';
          }
          if (style === 'no-bg') {
            return '';
          }
          // with-bg (default)
          return cardBgColor ? 'rounded-3xl' : 'bg-gray-50 rounded-3xl';
        };
        
        // Aspect ratio classes
        const aspectRatioMap = {
          'square': 'aspect-square',
          'landscape': 'aspect-video',
          'portrait': 'aspect-[3/4]',
          'auto': '',
        };

        // Rounded corners classes
        const roundedCornersMap = {
          'none': 'rounded-none',
          'small': 'rounded-lg',
          'medium': 'rounded-xl',
          'large': 'rounded-2xl',
          'full': 'rounded-full',
        };
        
        return (
          <div
            className="content-stretch flex flex-col px-0 pb-10 relative shrink-0 w-full"
            style={{ backgroundColor: highlightBgColor }}
          >
            {section.cards && section.cards.length > 0 && (
              <div className={clsx(
                "grid w-full",
                highlightLayout,
                section.layout === 'stacked' ? 'px-8 md:px-[8%] xl:px-[175px]' : '',
                section.showDividers ? 'divide-y divide-gray-200 [&>*]:py-16' : 'gap-12'
              )}>
                {section.cards.map((card) => {
                  const cardImgSrc = card.externalImageUrl 
                    ? card.externalImageUrl 
                    : card.image 
                      ? urlFor(card.image).width(800).url()
                      : null;
                  
                  const cardStyle = getCardStyleClasses(
                    section.cardStyle || 'with-bg', 
                    card.cardBackgroundColor
                  );
                  
                  const aspectRatio = aspectRatioMap[card.imageAspectRatio || 'landscape'];
                  const isStackedLayout = card.cardLayout !== 'side-by-side';
                  const imageOnLeft = card.imagePosition !== 'right';
                  const imageRounded = roundedCornersMap[card.imageRoundedCorners || 'medium'];
                  
                  // Stacked layout (image above text)
                  if (isStackedLayout) {
                    return (
                      <div
                        key={card._key}
                        className={clsx(
                          "flex gap-6 p-12 py-16 items-start",
                          imageOnLeft ? "flex-col" : "flex-col-reverse",
                          "max-md:flex-col",
                          cardStyle,
                          section.showDividers && "py-8"
                        )}
                        style={{ backgroundColor: card.cardBackgroundColor }}
                      >
                        {/* Image */}
                        {cardImgSrc && (
                          <div className={clsx(
                            "w-20 h-20 shrink-0 overflow-hidden max-md:w-full max-md:h-auto",
                            imageRounded,
                            !aspectRatio && "max-md:aspect-video"
                          )}>
                            <img
                              src={cardImgSrc}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Text Content */}
                        <div className="flex flex-col gap-2 flex-1">
                          {/* Headline */}
                          <h3 
                            className={clsx(
                              card.headline.length < 5 ? "text-3xl" : "text-xl",
                              "font-normal leading-tight whitespace-pre-wrap"
                            )}
                            style={{ color: card.headlineColor || '#111827' }}
                          >
                            {renderHighlightedText(card.headline, card.highlightedText, card.highlightColor)}
                          </h3>
                          
                          {/* Description */}
                          {card.description && card.description.length > 0 && (
                            <div className="text-base text-gray-600 leading-relaxed">
                              <PortableText value={card.description} components={portableTextComponents} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  // Side-by-side layout (image next to text)
                  return (
                    <div
                      key={card._key}
                      className={clsx(
                        "flex flex-1 flex-row w-full gap-12 px-8 p-6", 
                        cardStyle,
                        section.showDividers && "py-8"
                      )}
                      style={{ backgroundColor: card.cardBackgroundColor }}
                    >
                      {/* Headline */}
                      <h3 
                        className={clsx(
                          card.headline.length < 5 ? "text-3xl" : "text-xl",
                          "w-56 font-normal leading-normal whitespace-pre-wrap"
                        )}
                        style={{ color: card.headlineColor || '#111827' }}
                      >
                        {renderHighlightedText(card.headline, card.highlightedText, card.highlightColor)}
                      </h3>
                      
                      {/* Image */}
                      {cardImgSrc && (
<div className={clsx("h-24 shrink-0 object-center overflow-hidden", imageRounded)}>
<img src={cardImgSrc} alt="" className="h-full w-auto object-contain" />
</div>
)}
                      <div className="flex flex-1 flex-col justify-center items-stretch">
                      {/* Description */}
                      {card.description && card.description.length > 0 && (
                        <div className="text-base text-gray-500 self-end max-w-120 leading-relaxed">
                          <PortableText value={card.description} components={portableTextComponents} />
                        </div>
                      )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "sectionHeaderBar":
        const headerBgColor = section.backgroundColor || '#fdf2f8';
        const headerTextColor = section.textColor || '#ec4899';
        
        // Image size classes
        const headerImageSizeMap = {
          small: 'w-8 h-8',
          medium: 'w-12 h-12',
          large: 'w-16 h-16',
        };
        const headerImageSize = headerImageSizeMap[section.imageSize || 'medium'];
        
        // Padding classes
        const headerPaddingMap = {
          small: 'py-4',
          normal: 'py-6',
          large: 'py-10',
        };
        const headerPadding = headerPaddingMap[section.verticalPadding || 'normal'];
        
        // Get image sources
        const headerLeftImgSrc = section.leftImageUrl 
          ? section.leftImageUrl 
          : section.leftImage 
            ? urlFor(section.leftImage).width(128).height(128).url()
            : null;
        
        const headerRightImgSrc = section.rightImageUrl 
          ? section.rightImageUrl 
          : section.rightImage 
            ? urlFor(section.rightImage).width(128).height(128).url()
            : null;
        
        return (
          <div 
            className={clsx(
              "content-stretch flex items-center justify-between px-8 md:px-[8%] xl:px-[175px] relative shrink-0 w-full",
              headerPadding
            )}
            style={{ backgroundColor: headerBgColor }}
          >
            {/* Left side: Optional image + Number */}
            <div className="flex items-center gap-4">
              {headerLeftImgSrc && (
                <div className={clsx("rounded-lg overflow-hidden shrink-0", headerImageSize)}>
                  <img
                    src={headerLeftImgSrc}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {section.number && (
                <span 
                  className="text-2xl font-normal"
                  style={{ color: headerTextColor }}
                >
                  {section.number}
                </span>
              )}
            </div>
            
            {/* Center: Title */}
            {section.title && (
              <span 
                className="text-2xl font-semibold"
                style={{ color: headerTextColor }}
              >
                {section.title}
              </span>
            )}
            
            {/* Right side: Subtitle + Optional image */}
            <div className="flex items-center gap-4">
              {section.subtitle && (
                <span 
                  className="text-2xl font-normal"
                  style={{ color: headerTextColor }}
                >
                  {section.subtitle}
                </span>
              )}
              {headerRightImgSrc && (
                <div className={clsx("rounded-lg overflow-hidden shrink-0", headerImageSize)}>
                  <img
                    src={headerRightImgSrc}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case "tableOfContentsSection":
        const tocBgColor = section.backgroundColor || '#f3f4f6';
        const tocAccentColor = section.accentColor || '#ec4899';
        const hasHeaderContent = section.sectionNumber || section.sectionTitle || section.subtitle || section.hintText || section.sectionDescription;
        
        return (
          <div 
            className="content-stretch flex flex-col items-start gap-12 px-6 md:px-6 xl:px-[175px] py-16 relative shrink-0 w-full"
            style={{ backgroundColor: tocBgColor }}
          >
            {/* Only render header wrapper if there's content */}
            {hasHeaderContent && (
              <div className="w-full mx-auto gap-2 flex flex-col items-start">
                {/* Header: Number + Title + Subtitle */}
                {(section.sectionNumber || section.sectionTitle || section.subtitle) && (
                  <div className="flex items-center gap-4">
                    {section.sectionNumber && (
                      <span 
                        className="text-2xl font-normal"
                        style={{ color: tocAccentColor }}
                      >
                        {section.sectionNumber}
                      </span>
                    )}
                    {section.sectionTitle && (
                      <span 
                        className="text-2xl font-semibold"
                        style={{ color: tocAccentColor }}
                      >
                        {section.sectionTitle}
                      </span>
                    )}
                    {section.subtitle && (
                      <span 
                        className="text-2xl font-normal"
                        style={{ color: tocAccentColor }}
                      >
                        {section.subtitle}
                      </span>
                    )}
                  </div>
                )}

                {/* Hint Text */}
                {section.hintText && (
                  <div className="flex items-center text-gray-500">
                    <span className="text-base">{section.hintText}</span>
                  </div>
                )}

                {/* Section Description - below horizontal line */}
                {section.sectionDescription && (
                  <>
                    <div className="w-full h-px bg-gray-300 mt-4" />
                    <p className="text-base text-gray-400 mt-4 whitespace-pre-wrap">
                      {section.sectionDescription}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* TOC Items Grid */}
            {section.items && section.items.length > 0 && (
              <div className="flex gap-12 w-full">
                {section.items.map((item) => {
                  const itemImageSrc = item.externalImageUrl 
                    ? item.externalImageUrl 
                    : item.image 
                      ? urlFor(item.image).width(200).height(200).url()
                      : null;
                  
                  return (
                    <button
                      key={item._key}
                      type="button"
                      onClick={() => {
                        // Scroll to target section if specified
                        if (item.targetSectionId && scrollContainerRef?.current) {
                          const targetElement = scrollContainerRef.current.querySelector(
                            `[data-section-number="${item.targetSectionId}"]`
                          );
                          if (targetElement) {
                            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }
                      }}
                      className="flex flex-col items-start gap-3 p-8 py-12 bg-white rounded-3xl shadow-default hover:shadow-2xl hover:scale-[1.005] transition-all duration-200 cursor-pointer text-left group flex-1"
                    >
                      {/* Image/Icon */}
                      {itemImageSrc && (
                        <div className="w-16 h-16 shadow-none rounded-xl overflow-hidden bg-gray-100">
                          <img
                            src={itemImageSrc}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-1">
                      {/* Number */}
                      {item.number && (
                        <span className="text-xl text-gray-400">
                          {item.number}
                        </span>
                      )}
                      
                      {/* Title */}
                      <span className="text-xl text-gray-900">
                        {item.title}
                      </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "twoColumnImageSection":
        return (
          <TwoColumnImageSectionComponent
            section={section}
            renderHighlightedText={renderHighlightedText}
            portableTextComponents={portableTextComponents}
          />
        );

      default:
        return null;
    }
  };

  const content = renderContent();
  if (!content) return null;
  
  // Testimonials are excluded from ScrollReveal at the parent level
  // to prevent animation replaying on expand/collapse
  if (section._type === "testimonialSection") {
    return content;
  }
  
  return (
    <ScrollReveal>
      {content}
    </ScrollReveal>
  );
}

