import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, useParams, useNavigate, useLocation } from "react-router-dom";
import svgPaths from "./imports/svg-2tsxp86msm";
import clsx from "clsx";
import { imgGroup } from "./imports/svg-poktt";
import VideoPlayer from "./components/VideoPlayer";
import Footer from "./components/Footer";
import { ProjectModal as SanityProjectModal } from "./components/project";
import ArtPage from "./components/art/ArtPage";
import { AboutPage } from "./components/about";
import { PolaroidPage } from "./components/polaroid";
import { LibraryPage } from "./components/library";
import { ScrollReveal } from "./components/ScrollReveal";
import { TryItOutButton } from "./components/TryItOutButton";
import { preloadLikelyPages } from "./sanity/preload";
import PageHeader from "./components/PageHeader";
import { client } from "./sanity/client";
import { PROJECTS_QUERY } from "./sanity/queries";

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

// Text Scramble Component
type TextScrambleProps = {
  text: string;
  className?: string;
};

function TextScramble({ text, className }: TextScrambleProps) {
  const elementRef = useRef<HTMLParagraphElement>(null);
  const isAnimatingRef = useRef(false);
  const textRef = useRef(text);
  const isVisibleRef = useRef(false);
  
  const chars = '!@#$%^&*()_+-;:,.<>?ADELPSTUadelpstu0123456789';

  // Keep text ref updated
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Generate scrambled text preserving spaces
  const generateScrambledText = (originalText: string) => {
    let scrambled = '';
    for (let i = 0; i < originalText.length; i++) {
      if (originalText[i] === ' ' || originalText[i] === ':' || originalText[i] === '-') {
        scrambled += originalText[i];
      } else {
        scrambled += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return scrambled;
  };

  // Run the scramble animation (defined as regular function to avoid stale closures)
  const runScrambleAnimation = () => {
    const el = elementRef.current;
    const targetText = textRef.current;
    if (!el || isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    const oldText = el.innerText;
    const length = Math.max(oldText.length, targetText.length);
    
    // Build queue for each character
    const queue: Array<{ from: string; to: string; start: number; end: number; char?: string }> = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = targetText[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      queue.push({ from, to, start, end });
    }
    
    let frame = 0;
    
    const update = () => {
      let output = '';
      let complete = 0;
      
      for (let i = 0; i < queue.length; i++) {
        const { from, to, start, end } = queue[i];
        
        if (frame >= end) {
          complete++;
          output += to;
        } else if (frame >= start) {
          if (!queue[i].char || Math.random() < 0.28) {
            queue[i].char = chars[Math.floor(Math.random() * chars.length)];
          }
          output += `<span style="color: #c4c4c4">${queue[i].char}</span>`;
        } else {
          output += from;
        }
      }
      
      el.innerHTML = output;
      
      if (complete === queue.length) {
        isAnimatingRef.current = false;
      } else {
        requestAnimationFrame(update);
        frame++;
      }
    };
    
    update();
  };

  // Initialize with scrambled text and set up observer
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    
    // Set initial scrambled text
    el.innerText = generateScrambledText(text);
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisibleRef.current) {
            // Element just became visible - trigger unscramble animation
            isVisibleRef.current = true;
            setTimeout(() => {
              runScrambleAnimation();
            }, 300);
          } else if (!entry.isIntersecting && isVisibleRef.current) {
            // Element left the viewport - reset to scrambled state
            isVisibleRef.current = false;
            if (!isAnimatingRef.current) {
              el.innerText = generateScrambledText(text);
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [text]);

  // Handle hover to re-trigger animation
  const handleMouseEnter = () => {
    if (!isAnimatingRef.current) {
      // Re-scramble first, then animate to unscrambled
      const el = elementRef.current;
      if (el) {
        el.innerText = generateScrambledText(text);
        setTimeout(() => {
          runScrambleAnimation();
        }, 50);
      }
    }
  };

  return (
    <p
      ref={elementRef}
      className={className}
      onMouseEnter={handleMouseEnter}
      style={{ cursor: 'default' }}
    />
  );
}

// Project data type
type Project = {
  id: string;
  title: string;
  year: string;
  description: string;
  imageSrc: string;
  videoSrc?: string; // Optional HLS video URL
  xLink?: string; // Optional X (Twitter) link
};

// Helper to generate Mux URLs from playback ID
function getMuxUrls(playbackId: string) {
  return {
    imageSrc: `https://image.mux.com/${playbackId}/thumbnail.png`,
    videoSrc: `https://stream.mux.com/${playbackId}.m3u8`,
  };
}

// Static project data - main projects (apple, roblox, adobe, nasa) get heroVideo from Sanity
const staticProjects: Project[] = [
  {
    id: "apple",
    title: "Apple",
    year: "2025",
    description: "Designing new features to drive engagement and user delight.",
    imageSrc: "", // Will be populated from Sanity
    videoSrc: "", // Will be populated from Sanity
  },
  {
    id: "roblox",
    title: "Roblox",
    year: "2024",
    description: "Reimagining the future of social gameplay and user communication.",
    imageSrc: "", // Will be populated from Sanity
    videoSrc: "", // Will be populated from Sanity
  },
  {
    id: "adobe",
    title: "Adobe",
    year: "2023",
    description: "Product strategy to drive user acquisition on college campuses.",
    imageSrc: "", // Will be populated from Sanity
    videoSrc: "", // Will be populated from Sanity
  },
  {
    id: "nasa",
    title: "NASA JPL",
    year: "2023-24",
    description: "Daring (& designing) mighty things at NASA's in-house DesignLab.",
    imageSrc: "", // Will be populated from Sanity
    videoSrc: "", // Will be populated from Sanity
  },
  {
    id: "polaroid",
    title: "Polaroid Studio",
    year: "2025",
    description: "A digital way to customize your own polaroid.",
    imageSrc: "https://image.mux.com/XJFJ1P3u9pKsFYvH9lTtOp4gPRydSpMkRrX9dRmNE5w/thumbnail.png",
    videoSrc: "https://stream.mux.com/XJFJ1P3u9pKsFYvH9lTtOp4gPRydSpMkRrX9dRmNE5w.m3u8",
    xLink: "https://x.com/michelletliu/status/1991201412072734777",
  },
  {
    id: "screentime",
    title: "Screentime Receipt",
    year: "2025",
    description: "A receipt for your daily or weekly screentime.",
    imageSrc: "https://image.mux.com/AdZWDHKkfyhXntZy01keNYtPB7Q6w8GxeaUWmP8501SLI/thumbnail.png",
    videoSrc: "https://stream.mux.com/AdZWDHKkfyhXntZy01keNYtPB7Q6w8GxeaUWmP8501SLI.m3u8",
    xLink: "https://x.com/michelletliu/status/2000987498550383032",
  },
  {
    id: "sketchbook",
    title: "Digital Sketchbook",
    year: "2024",
    description: "A digital home for sketches and visual journaling.",
    imageSrc: "https://image.mux.com/iEo013MYI028Zit3nPTJetFvqbgweCC8e2NHbY702qsQBg/thumbnail.png",
    videoSrc: "https://stream.mux.com/iEo013MYI028Zit3nPTJetFvqbgweCC8e2NHbY702qsQBg.m3u8",
  },
  {
    id: "library",
    title: "Personal Library",
    year: "2025",
    description: "My dream digital bookshelf",
    imageSrc: "https://image.mux.com/a3NxNdblQi02JVCg0177eEWZRycP1BduGb2pt7o00FUPfo/thumbnail.png",
    videoSrc: "https://stream.mux.com/a3NxNdblQi02JVCg0177eEWZRycP1BduGb2pt7o00FUPfo.m3u8",
    xLink: "https://x.com/michelletliu/status/1981030966044061894",
  },
];

type ProjectMediaProps = {
  imageSrc: string;
  videoSrc?: string;
};

function ProjectMedia({ imageSrc, videoSrc }: ProjectMediaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Intersection Observer to detect when card is visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Delay video loading slightly for smoother experience
            setTimeout(() => setVideoReady(true), 100);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // If there's a video, show placeholder until video is fully loaded
  if (videoSrc) {
    return (
      <div 
        ref={containerRef}
        className="aspect-[678/367.625] relative rounded-[26px] shrink-0 w-full overflow-hidden"
      >
        {/* Shimmer placeholder - visible while video is loading */}
        <div 
          className={clsx(
            "absolute inset-0 rounded-[26px] transition-opacity duration-500 ease-out",
            videoLoaded ? "opacity-0" : "opacity-100 animate-shimmer"
          )}
        />
        {/* Actual video - plays full duration when visible */}
        {isVisible && videoReady && (
          <VideoPlayer
            src={videoSrc}
            className={clsx(
              "absolute max-w-none object-cover rounded-[26px] size-full transition-opacity duration-500 ease-out",
              videoLoaded ? "opacity-100" : "opacity-0"
            )}
            autoPlay
            muted
            loop
            controls={false}
            muxEnvKey="e4cc19a78gcf0tbtfmu4m7ruf"
            onLoaded={() => setVideoLoaded(true)}
          />
        )}
      </div>
    );
  }

  // Otherwise show image
  return (
    <div ref={containerRef} className="aspect-[678/367.625] relative rounded-[26px] shrink-0 w-full">
      <img
        alt=""
        className="absolute max-w-none object-cover rounded-[26px] size-full"
        src={imageSrc}
        loading="lazy"
      />
    </div>
  );
}

function SocialLinksBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-6">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Social Links">{children}</g>
      </svg>
    </div>
  );
}

type LinksBackgroundImageAndTextProps = {
  text: string;
};

function LinksBackgroundImageAndText({ text }: LinksBackgroundImageAndTextProps) {
  return (
    <div className="content-stretch flex items-center justify-center px-0.5 py-0 relative rounded-full shrink-0">
      <p className="font-['Figtree',sans-serif] leading-5 relative shrink-0 text-[#9ca3af] text-base text-nowrap tracking-[0.16px]">
        {text}
      </p>
    </div>
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


type ProjectCardProps = {
  project: Project;
  onClick: () => void;
  featured?: boolean;
};

function ProjectCard({ project, onClick, featured = false }: ProjectCardProps) {
  const hasTryItOut = project.id === 'polaroid' || project.id === 'library';

  // Featured card style (for first 4 cards on desktop)
  if (featured) {
    return (
      <button
        onClick={onClick}
        className="content-stretch flex flex-col gap-3 items-start relative shrink-0 w-full cursor-pointer group project-card"
      >
        <div 
          className="content-stretch flex flex-col items-start justify-end overflow-clip relative rounded-[26px] shrink-0 w-full transition-transform duration-300 group-hover:scale-[0.99]"
        >
          <ProjectMedia imageSrc={project.imageSrc} videoSrc={project.videoSrc} />
          {/* Floating title pill inside the card - desktop only */}
          <div className="absolute bottom-0 left-0 p-3 hidden md:block">
            <div className="bg-white border border-[#f3f4f6] border-solid flex items-center justify-center px-3 py-1.5 rounded-full">
              <p className="font-['Figtree',sans-serif] font-medium leading-[1.4] text-[#111827] text-base">
                <span>{project.title} </span>
                <span className="text-[#9ca3af]">• {project.year}</span>
              </p>
            </div>
          </div>
        </div>
        {/* Desktop: description and Try It Out */}
        <div className="hidden md:flex content-stretch items-start justify-between px-[13px] py-0 -mt-0.5 relative shrink-0 w-full">
          <p className="font-['Figtree',sans-serif] font-normal leading-[1] text-[#9ca3af] text-base text-left project-hover-text">{project.description}</p>
          {/* Try It Out tag - appears on hover for polaroid and library */}
          {hasTryItOut && (
            <a 
              href={project.id === 'polaroid' ? '/polaroid' : '/library'}
              onClick={(e) => e.stopPropagation()}
              className="font-['Figtree',sans-serif] text-blue-500 text-base md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300 ease-out hover:text-blue-400"
            >
              Try It Out!
            </a>
          )}
        </div>
        {/* Mobile: title + description */}
        <div className="md:hidden content-stretch flex flex-col font-['Figtree',sans-serif] font-normal items-start leading-[1.4] px-[13px] py-0 relative shrink-0 text-base gap-1">
          <div className="flex justify-between w-full">
            <p className="relative shrink-0 text-[#111827] text-left project-hover-text">
              <span>{project.title} </span>
              <span className="text-[#9ca3af]">• {project.year}</span>
            </p>
            {/* Try It Out tag - always visible on mobile */}
            {hasTryItOut && (
              <a 
                href={project.id === 'polaroid' ? '/polaroid' : '/library'}
                onClick={(e) => e.stopPropagation()}
                className="font-['Figtree',sans-serif] text-blue-500 text-base hover:text-blue-400"
              >
                Try It Out!
              </a>
            )}
          </div>
          <p className="relative shrink-0 text-[#9ca3af] w-full text-left font-normal leading-[1.3]">{project.description}</p>
        </div>
      </button>
    );
  }

  // Default card style
  return (
    <button
      onClick={onClick}
      className="content-stretch flex flex-col gap-3 items-start relative shrink-0 w-full cursor-pointer group project-card"
    >
      <div 
        className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full transition-transform duration-300 group-hover:scale-[0.99]"
      >
        <ProjectMedia imageSrc={project.imageSrc} videoSrc={project.videoSrc} />
      </div>
      <div className="content-stretch flex font-['Figtree',sans-serif] -mt-1 font-normal items-start justify-between leading-[1.4] px-[13px] py-0 relative shrink-0 text-base w-full">
        <p className="relative shrink-0 text-[#111827] text-left project-hover-text">
          <span>{project.title} </span>
          <span className="text-[#9ca3af]">• {project.year}</span>
        </p>
        {/* Try It Out tag - appears on hover for polaroid and library */}
        {hasTryItOut && (
          <a 
            href={project.id === 'polaroid' ? '/polaroid' : '/library'}
            onClick={(e) => e.stopPropagation()}
            className="font-['Figtree',sans-serif] -mt-1 text-blue-500 text-base md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300 ease-out hover:text-blue-400"
          >
            Try It Out!
          </a>
        )}
      </div>
    </button>
  );
}

type ProjectModalProps = {
  project: Project;
  onClose: () => void;
};

// Close icon for popup modal (matches Figma design)
const PopupCloseIcon = () => (
  <svg className="block size-full" fill="none" viewBox="0 0 10 10">
    <path
      d="M9.76256 1.17736C10.0791 0.860788 10.0791 0.347859 9.76256 0.031284C9.44599 -0.285291 8.93306 -0.285291 8.61648 0.031284L5 3.64776L1.38352 0.031284C1.06694 -0.285291 0.554014 -0.285291 0.237439 0.031284C-0.0791362 0.347859 -0.0791362 0.860788 0.237439 1.17736L3.85392 4.79384L0.237439 8.41032C-0.0791362 8.7269 -0.0791362 9.23982 0.237439 9.5564C0.554014 9.87297 1.06694 9.87297 1.38352 9.5564L5 5.93992L8.61648 9.5564C8.93306 9.87297 9.44599 9.87297 9.76256 9.5564C10.0791 9.23982 10.0791 8.7269 9.76256 8.41032L6.14608 4.79384L9.76256 1.17736Z"
      fill="#4B5563"
    />
  </svg>
);

// Horizontal divider line for popup modal
function PopupLine() {
  return (
    <div className="h-px relative shrink-0 w-full">
      <div className="absolute bg-[#e5e7eb] inset-0" />
    </div>
  );
}

function ProjectModal({ project, onClose }: ProjectModalProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Trigger enter animation on mount
  useEffect(() => {
    // Small delay to ensure the initial state is rendered first
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
    // Delay video loading until after modal animation
    const timer = setTimeout(() => {
      setVideoReady(true);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-8">
      {/* Overlay */}
      <div 
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
        onClick={handleClose} 
      />
      
      {/* Modal - matches Figma PopUpCard design */}
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
        {/* Inner container with top padding to keep scrollbar away from rounded corners */}
        <div className="flex flex-col flex-1 min-h-0 pt-6 max-md:pt-4">
          {/* Close button row - stays fixed at top */}
          <div className="content-stretch flex items-start justify-end px-6 pb-0 max-md:px-4 -mt-6 max-md:-mt-4 pt-6 max-md:pt-4 shrink-0 w-full bg-white z-10">
            <button
              onClick={handleClose}
              className="content-stretch flex items-center justify-center relative shrink-0 size-6 cursor-pointer rounded-full hover:bg-[#F3F4F6] transition-colors duration-200 ease-out"
            >
              <div className="overflow-clip relative shrink-0 size-[10px]">
                <PopupCloseIcon />
              </div>
            </button>
          </div>

          {/* Scrollable content area */}
          <div className="overflow-y-auto flex-1">
            {/* Content area with horizontal padding */}
            <div className="content-stretch flex flex-col gap-3 items-start px-44 max-md:px-10 pt-16 max-md:pt-0 pb-8 max-md:pb-6 relative shrink-0 w-full">
          {/* Title, Description, and Try It Out button section */}
          {/* Desktop: row layout with button on right */}
          <div className="hidden md:flex gap-[6px] items-start relative shrink-0 w-full">
            {/* Title and Description - left side */}
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-h-px min-w-px relative shrink-0">
              {/* Title row: Project Title • Year */}
              <div className="content-stretch flex items-start relative shrink-0 w-full">
                <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                  <p className="font-['Figtree',sans-serif] font-normal leading-normal relative shrink-0 text-xl text-black">
                    {project.title}
                  </p>
                  <p className="font-['Figtree',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[#9ca3af] text-base">
                    •
                  </p>
                  <p className="font-['Figtree',sans-serif] font-normal leading-normal relative shrink-0 text-[#9ca3af] text-xl">
                    {project.year}
                  </p>
                </div>
              </div>
              
              {/* Description */}
              <div className="content-stretch flex gap-2 items-start relative w-full">
                <p className="font-['Figtree',sans-serif] font-normal leading-5 relative text-[#6b7280] text-base">
                  {project.description}
                </p>
              </div>
            </div>

            {/* Try It Out button - desktop */}
            {(project.id === 'polaroid' || project.id === 'library') && (
              <TryItOutButton href={project.id === 'polaroid' ? '/polaroid' : '/library'} />
            )}
          </div>

          {/* Mobile: stacked layout */}
          <div className="md:hidden flex flex-col gap-3 items-start relative shrink-0 w-full">
            {/* Title and Description */}
            <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full">
              {/* Title row: Project Title • Year */}
              <div className="content-stretch flex items-start relative shrink-0 w-full">
                <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                  <p className="font-['Figtree',sans-serif] font-normal leading-normal relative shrink-0 text-xl text-black">
                    {project.title}
                  </p>
                  <p className="font-['Figtree',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[#9ca3af] text-base">
                    •
                  </p>
                  <p className="font-['Figtree',sans-serif] font-normal leading-normal relative shrink-0 text-[#9ca3af] text-xl">
                    {project.year}
                  </p>
                </div>
              </div>
              
              {/* Description */}
              <div className="content-stretch flex gap-2 items-start relative w-full">
                <p className="font-['Figtree',sans-serif] font-normal leading-5 relative text-[#6b7280] text-base">
                  {project.description}
                </p>
              </div>
            </div>

            {/* Try It Out button - mobile */}
            {(project.id === 'polaroid' || project.id === 'library') && (
              <TryItOutButton href={project.id === 'polaroid' ? '/polaroid' : '/library'} />
            )}
          </div>

          {/* Divider line */}
          <PopupLine />

          {/* View on X link - only shown if xLink exists */}
          {project.xLink && (
            <a
              href={project.xLink}
              target="_blank"
              rel="noopener noreferrer"
              className="content-stretch flex items-center relative shrink-0 group/xlink"
            >
              <div className="content-stretch flex gap-[2px] items-center relative shrink-0">
                <p className="font-['Figtree',sans-serif] font-normal leading-5 relative shrink-0 text-[#9ca3af] text-base group-hover/xlink:text-blue-500 transition-colors">
                  View on
                </p>
                {/* X logo - small icon */}
                <div className="content-stretch flex items-center justify-center px-[4.667px] py-[6.667px] relative shrink-0 -mr-0.5">
                  <svg 
                    className="block w-[16px] h-[16px] fill-[#9ca3af] group-hover/xlink:fill-blue-500 transition-colors" 
                    viewBox="0 0 19 18"
                  >
                    <path d={svgPaths.p16308a80} />
                  </svg>
                </div>
                <p className="font-['Figtree',sans-serif] font-normal leading-5 relative shrink-0 text-[#9ca3af] text-base group-hover/xlink:text-blue-500 transition-colors">
                  ↗
                </p>
              </div>
            </a>
          )}

          {/* Video/Image content area with rounded corners */}
          <div className="relative rounded-[16px] w-full aspect-[1097/616] overflow-hidden bg-gray-100 shrink-0 mt-3">
            {/* Always show poster/thumbnail as background */}
            <img
              alt=""
              className="absolute object-cover size-full rounded-[16px]"
              src={project.imageSrc}
            />
            {/* Overlay video once ready */}
            {project.videoSrc && videoReady && (
              <VideoPlayer
                key={project.id}
                src={project.videoSrc}
                className="absolute object-cover size-full rounded-[16px]"
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

// Side project IDs that use the simple modal
const SIDE_PROJECT_IDS = ["polaroid", "screentime", "sketchbook", "library"];

// Main project IDs that get heroVideo from Sanity
const MAIN_PROJECT_IDS = ["apple", "roblox", "adobe", "nasa"];

// Sanity project type for fetching
type SanityProject = {
  company: string;
  heroVideo?: string;
};

// Main HomePage component that handles the portfolio display and modal routing
function HomePage() {
  const navigate = useNavigate();
  const { slug, mode } = useParams<{ slug?: string; mode?: string }>();
  
  const [badgeHovered, setBadgeHovered] = useState(false);
  const badgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for projects with Sanity data merged in
  const [projects, setProjects] = useState<Project[]>(staticProjects);
  
  // Track if hero animation has been played this session to prevent re-animation on tab switches
  const [heroAnimationPlayed, setHeroAnimationPlayed] = useState(() => {
    return sessionStorage.getItem('heroAnimationPlayed') === 'true';
  });
  
  // Fetch heroVideo from Sanity and merge with static project data
  useEffect(() => {
    async function fetchSanityProjects() {
      try {
        const sanityProjects = await client.fetch<SanityProject[]>(PROJECTS_QUERY);
        
        // Create a map of company -> heroVideo
        const heroVideoMap: Record<string, string> = {};
        sanityProjects.forEach((sp) => {
          if (sp.company && sp.heroVideo) {
            heroVideoMap[sp.company] = sp.heroVideo;
          }
        });
        
        // Merge Sanity heroVideo data with static projects
        const mergedProjects = staticProjects.map((project) => {
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
          return project;
        });
        
        setProjects(mergedProjects);
      } catch (error) {
        console.error("Error fetching Sanity projects:", error);
        // Keep static projects on error
      }
    }
    
    fetchSanityProjects();
  }, []);
  
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

  // Preload likely pages (Roblox, Apple, Art, About) when homepage loads
  useEffect(() => {
    preloadLikelyPages();
  }, []);

  // Find project based on URL slug
  const selectedProject = slug ? projects.find(p => p.id === slug) || null : null;
  
  // Determine if we're in fullscreen mode based on URL
  const isFullscreenFromUrl = mode === "full";

  const handleBadgeMouseEnter = () => {
    if (badgeTimeoutRef.current) {
      clearTimeout(badgeTimeoutRef.current);
      badgeTimeoutRef.current = null;
    }
    setBadgeHovered(true);
  };

  const handleBadgeMouseLeave = () => {
    badgeTimeoutRef.current = setTimeout(() => {
      setBadgeHovered(false);
    }, 600);
  };

  const handleProjectClick = (project: Project) => {
    // Navigate to the project overlay URL
    navigate(`/project/${project.id}`);
  };

  const handleModalClose = () => {
    // Navigate back to home
    navigate("/");
  };

  const handleExpandToFullscreen = () => {
    if (slug) {
      navigate(`/project/${slug}/full`);
    }
  };

  const handleCollapseFromFullscreen = () => {
    if (slug) {
      navigate(`/project/${slug}`);
    }
  };

  const handleProjectSwitch = (projectId: string) => {
    // When switching projects, maintain the current view mode
    const newPath = isFullscreenFromUrl 
      ? `/project/${projectId}/full` 
      : `/project/${projectId}`;
    navigate(newPath);
  };

  const handleViewAllProjects = () => {
    // Navigate to home and scroll to top
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-white content-stretch flex flex-col items-center relative size-full min-h-screen">
      {/* Inject fade up animation styles */}
      <style>{fadeUpStyles}</style>
      
      {/* SVG Gradient Definition for Social Icons */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="socialGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D79FE8">
              <animate attributeName="stop-color" values="#D79FE8; #4DACEA; #13B2EB; #D79FE8" dur="3.5s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#4DACEA">
              <animate attributeName="stop-color" values="#4DACEA; #13B2EB; #D79FE8; #4DACEA" dur="3.5s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#13B2EB">
              <animate attributeName="stop-color" values="#13B2EB; #D79FE8; #4DACEA; #13B2EB" dur="3.5s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
      </svg>
      {/* Header */}
      <PageHeader variant="work" heroAnimationPlayed={heroAnimationPlayed}>
        <>
                  <span>
                    Designing useful products to spark moments of{" "}</span>
                  <span>delight</span>
                  <span>{` & `}</span>
                  <span className="gradient-text-animated">human connection. ⟡˙⋆</span>
                  <span>
                    <br aria-hidden="true" />
                    {`Previously at `}
                  </span>
                  <span
                    className="text-[#374151]"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                  >
                    
                  </span>
                  <span className="font-['Figtree',sans-serif] text-[#374151]"></span>
                  <span>{`, `}</span>
                  <span className="text-[#374151]">Roblox</span>
                  <span>{`, & `}</span>
                  <span className="text-[#374151]">NASA</span>
                  <span>.</span>
                  <span 
                    className={clsx(
                      "relative inline-flex items-center justify-center rounded-[999px] align-middle -translate-y-[2px] transition-all duration-300 ease-in-out [cursor:inherit] before:content-[''] before:absolute before:-inset-[2px] before:rounded-[999px] before:pointer-events-none",
                      "max-md:hidden",
                      badgeHovered ? "gap-2 bg-[#ecfdf5] pl-1.5 pr-3.5 py-0.5 -my-0.5 md:ml-1" : "md:gap-0 md:bg-transparent md:p-0 md:ml-2"
                    )}
                    onMouseEnter={handleBadgeMouseEnter}
                    onMouseLeave={handleBadgeMouseLeave}
                  >
                    <span className="relative shrink-0 size-[16px] overflow-visible">
                      {/* Pulsing ring behind the badge */}
                      <span className={badgeHovered ? "green-pulse-ring-off" : "green-pulse-ring"} />
                      <svg className="block size-full relative z-10" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                        <g id="Background">
                          <rect fill="var(--fill-0, #A7F3D0)" height="16" rx="8" width="16" />
                          <circle cx="8" cy="8" fill="var(--fill-0, #10B981)" id="Ellipse 1" r="4" />
                        </g>
                      </svg>
                    </span>
                    <span className={clsx(
                      "font-['Figtree:Medium',sans-serif] font-normal text-[#10b981] text-base text-nowrap overflow-hidden transition-all duration-300 ease-in-out",
                      badgeHovered ? "max-w-[500px] opacity-100" : "max-w-0 opacity-0"
                    )}>
                      <span>Working on something cool? Get in</span>{" "}
                      <a href="mailto:michelletheresaliu@gmail.com" className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid underline hover:!text-emerald-600 transition-colors">touch</a>!
                    </span>
                  </span>
        </>
      </PageHeader>

      {/* Navigation */}
      <div className="content-stretch flex flex-col items-center pb-4 pt-0 px-0 relative shrink-0 w-full">
        <ScrollReveal variant="fade" delay={280} rootMargin="0px" className="relative shrink-0 w-full" disabled={heroAnimationPlayed}>
          <div className="size-full">
            <div className="content-stretch flex flex-col gap-3 items-start pb-0 pt-4 px-16 max-md:px-8 relative w-full">
              <div className="content-stretch flex gap-1 items-start relative shrink-0">
                <TagBackgroundImageAndText text="Work" active />
                <TagBackgroundImageAndText text="Art" onClick={() => navigate("/art")} />
                <TagBackgroundImageAndText text="About" onClick={() => navigate("/about")} />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Divider line */}
        <div className="px-17 max-md:px-8 w-full pt-3">
          <div className="bg-zinc-100 h-px shrink-0 w-full" />
        </div>

        {/* Projects Grid - Desktop (2 columns) */}
        <div className="hidden md:grid gap-6 grid-cols-2 px-16 py-4 pt-6 relative shrink-0 w-full">
          {projects.map((project, index) => (
            <ScrollReveal 
              key={project.id} 
              delay={Math.min(Math.floor(index / 2) * 80, 320)} 
              className="w-full"
              rootMargin="0px 0px -100px 0px"
            >
              <ProjectCard 
                project={project} 
                onClick={() => handleProjectClick(project)} 
                featured={index < 4} // First 4 cards use featured style on desktop
              />
            </ScrollReveal>
          ))}
        </div>

        {/* Projects Grid - Mobile (1 column) */}
        <div className="md:hidden flex flex-col gap-8 px-8 py-4 relative shrink-0 w-full">
          {projects.map((project, index) => (
            <ScrollReveal 
              key={project.id} 
              delay={Math.min(index * 60, 300)}
              rootMargin="0px 0px -50px 0px"
            >
              <ProjectCard 
                project={project} 
                onClick={() => handleProjectClick(project)} 
                featured={index < 4}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Project Modal - Simple modal for side projects, Sanity modal for main work */}
      {selectedProject && (
        // Side projects (polaroid, screentime, sketchbook, library) use simple modal
        SIDE_PROJECT_IDS.includes(selectedProject.id) ? (
          <ProjectModal 
            project={selectedProject} 
            onClose={handleModalClose} 
          />
        ) : (
          // Main work projects (apple, roblox, adobe, nasa) use Sanity-powered modal
          // key prop forces React to create a new component instance when project changes
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

export default function App() {
  return (
    <Routes>
      {/* Home page - no modal */}
      <Route path="/" element={<HomePage />} />
      
      {/* Project overlay modal */}
      <Route path="/project/:slug" element={<HomePage />} />
      
      {/* Project fullscreen/expanded view */}
      <Route path="/project/:slug/:mode" element={<HomePage />} />
      
      {/* Art page */}
      <Route path="/art" element={<ArtPage />} />
      
      {/* About page */}
      <Route path="/about" element={<AboutPage />} />
      
      {/* Polaroid Studio page */}
      <Route path="/polaroid" element={<PolaroidPage />} />

      {/* Library page */}
      <Route path="/library" element={<LibraryPage />} />
    </Routes>
  );
}
