import React, { useState, useEffect, useRef, useCallback } from "react";
import svgPaths from "./imports/svg-2tsxp86msm";
import clsx from "clsx";
import Hls from "hls.js";
import imgFinalSealLogo1 from "./assets/logo.png";
import grainTexture from "./assets/Rectangle Grain 1.png";
import { imgGroup } from "./imports/svg-poktt";

// Text Scramble Component
type TextScrambleProps = {
  text: string;
  className?: string;
};

function TextScramble({ text, className }: TextScrambleProps) {
  const elementRef = useRef<HTMLParagraphElement>(null);
  const [displayText, setDisplayText] = useState('');
  const hasAnimatedRef = useRef(false);
  const frameRef = useRef(0);
  const queueRef = useRef<Array<{ from: string; to: string; start: number; end: number; char?: string }>>([]);
  const animationFrameRef = useRef<number | null>(null);
  
  const chars = '!@#$%^&*()_+-;:,.<>?ADELPSTUadelpstu0123456789';

  // Generate scrambled text preserving spaces
  const generateScrambledText = useCallback((originalText: string) => {
    let scrambled = '';
    for (let i = 0; i < originalText.length; i++) {
      if (originalText[i] === ' ') {
        scrambled += ' ';
      } else {
        scrambled += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return scrambled;
  }, []);

  // Animation update function
  const update = useCallback(() => {
    let output = '';
    let complete = 0;

    for (let i = 0; i < queueRef.current.length; i++) {
      const item = queueRef.current[i];
      const { from, to, start, end } = item;

      if (frameRef.current >= end) {
        complete++;
        output += to;
      } else if (frameRef.current >= start) {
        if (!item.char || Math.random() < 0.10) {
          item.char = chars[Math.floor(Math.random() * chars.length)];
        }
        output += item.char;
      } else {
        output += from;
      }
    }

    setDisplayText(output);

    if (complete === queueRef.current.length) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    } else {
      animationFrameRef.current = requestAnimationFrame(update);
      frameRef.current++;
    }
  }, []);

  // Start scramble animation
  const startScramble = useCallback((newText: string, oldText: string) => {
    const length = Math.max(oldText.length, newText.length);
    queueRef.current = [];

    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 30);
      const end = start + Math.floor(Math.random() * 30);
      queueRef.current.push({ from, to, start, end });
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    frameRef.current = 0;
    update();
  }, [update]);

  // Initialize with scrambled text
  useEffect(() => {
    setDisplayText(generateScrambledText(text));
  }, [text, generateScrambledText]);

  // Set up intersection observer for scroll trigger
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;
            setTimeout(() => {
              startScramble(text, displayText);
            }, 200);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(element);

    // Check if already in view
    const timeoutId = setTimeout(() => {
      if (!hasAnimatedRef.current) {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          hasAnimatedRef.current = true;
          setTimeout(() => {
            startScramble(text, displayText);
          }, 200);
          observer.disconnect();
        }
      }
    }, 500);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [text, displayText, startScramble]);

  // Handle hover to re-trigger animation
  const handleMouseEnter = useCallback(() => {
    if (hasAnimatedRef.current) {
      startScramble(text, displayText);
    }
  }, [text, displayText, startScramble]);

  return (
    <p
      ref={elementRef}
      className={className}
      onMouseEnter={handleMouseEnter}
      style={{ cursor: 'default' }}
    >
      {displayText}
    </p>
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
};

// Project data
const projects: Project[] = [
  {
    id: "apple",
    title: "Apple",
    year: "2025",
    description: "Designing new features to drive engagement and user delight.",
    imageSrc: "https://image.mux.com/mO00LSDA3cQYKHdNhgbgYoQfaffVw2ZLzbJbVY0227kmU/thumbnail.png",
    videoSrc: "https://stream.mux.com/mO00LSDA3cQYKHdNhgbgYoQfaffVw2ZLzbJbVY0227kmU.m3u8",
  },
  {
    id: "roblox",
    title: "Roblox",
    year: "2024",
    description: "Reimagining the future of social gameplay and user communication.",
    imageSrc: "https://image.mux.com/01FcKJdkUWAarvsEU6iti801x025X2gTxxYCqhRflroCL8/thumbnail.png",
    videoSrc: "https://stream.mux.com/01FcKJdkUWAarvsEU6iti801x025X2gTxxYCqhRflroCL8.m3u8",
  },
  {
    id: "adobe",
    title: "Adobe",
    year: "2023",
    description: "Product strategy to drive user acquisition on college campuses.",
    imageSrc: "https://image.mux.com/15z5wuJU62pEJRzHyxUymxTaUeUwbpMD6jdujLx888M/thumbnail.png",
    videoSrc: "https://stream.mux.com/15z5wuJU62pEJRzHyxUymxTaUeUwbpMD6jdujLx888M.m3u8",
  },
  {
    id: "nasa",
    title: "NASA JPL",
    year: "2023-24",
    description: "Daring (& designing) mighty things at NASA's in-house DesignLab.",
    imageSrc: "https://image.mux.com/fpv3LqS007ZL8RqZtzGwAYICLErOTlpmTJwnf1nEbtHw/thumbnail.png",
    videoSrc: "https://stream.mux.com/fpv3LqS007ZL8RqZtzGwAYICLErOTlpmTJwnf1nEbtHw.m3u8",
  },
  {
    id: "polaroid",
    title: "Polaroid Studio",
    year: "2025",
    description: "Designing new features to drive engagement and user delight.",
    imageSrc: "https://image.mux.com/XJFJ1P3u9pKsFYvH9lTtOp4gPRydSpMkRrX9dRmNE5w/thumbnail.png",
    videoSrc: "https://stream.mux.com/XJFJ1P3u9pKsFYvH9lTtOp4gPRydSpMkRrX9dRmNE5w.m3u8",
  },
  {
    id: "screentime",
    title: "Screentime Receipt",
    year: "2025",
    description: "Designing new features to drive engagement and user delight.",
    imageSrc: "https://image.mux.com/AdZWDHKkfyhXntZy01keNYtPB7Q6w8GxeaUWmP8501SLI/thumbnail.png",
    videoSrc: "https://stream.mux.com/AdZWDHKkfyhXntZy01keNYtPB7Q6w8GxeaUWmP8501SLI.m3u8",
  },
  {
    id: "sketchbook",
    title: "Digital Sketchbook",
    year: "2024",
    description: "Designing new features to drive engagement and user delight.",
    imageSrc: "https://image.mux.com/iEo013MYI028Zit3nPTJetFvqbgweCC8e2NHbY702qsQBg/thumbnail.png",
    videoSrc: "https://stream.mux.com/iEo013MYI028Zit3nPTJetFvqbgweCC8e2NHbY702qsQBg.m3u8",
  },
  {
    id: "library",
    title: "Personal Library",
    year: "2025",
    description: "Designing new features to drive engagement and user delight.",
    imageSrc: "https://image.mux.com/a3NxNdblQi02JVCg0177eEWZRycP1BduGb2pt7o00FUPfo/thumbnail.png",
    videoSrc: "https://stream.mux.com/a3NxNdblQi02JVCg0177eEWZRycP1BduGb2pt7o00FUPfo.m3u8",
  },
];

type ProjectMediaProps = {
  imageSrc: string;
  videoSrc?: string;
};

function ProjectMedia({ imageSrc, videoSrc }: ProjectMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      hlsRef.current = hls;
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoSrc;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoSrc]);

  // If there's a video, show video only
  if (videoSrc) {
    return (
      <div className="aspect-[678/367.625] relative rounded-[26px] shrink-0 w-full">
        <video
          ref={videoRef}
          className="absolute max-w-none object-cover rounded-[26px] size-full"
          muted
          loop
          playsInline
          poster={imageSrc}
        />
      </div>
    );
  }

  // Otherwise show image
  return (
    <div className="aspect-[678/367.625] relative rounded-[26px] shrink-0 w-full">
      <img
        alt=""
        className="absolute max-w-none object-cover rounded-[26px] size-full"
        src={imageSrc}
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
};

function TagBackgroundImageAndText({ text, active = false }: TagBackgroundImageAndTextProps) {
  return (
    <button
      className={clsx(
        "content-stretch flex items-center justify-center px-3 py-1 relative rounded-full shrink-0 cursor-pointer hover:bg-[rgba(107,114,128,0.15)] transition-colors",
        active && "bg-[rgba(107,114,128,0.1)]"
      )}
    >
      <p
        className={clsx(
          "font-['Figtree',sans-serif] font-semibold leading-normal relative shrink-0 text-base text-nowrap tracking-[0.16px]",
          active ? "text-[#4b5563]" : "text-[#9ca3af]"
        )}
      >
        {text}
      </p>
    </button>
  );
}

type FinalSealLogoBackgroundImageProps = {
  additionalClassNames?: string;
};

function FinalSealLogoBackgroundImage({ additionalClassNames = "" }: FinalSealLogoBackgroundImageProps) {
  return (
    <img
      alt="Michelle Liu Logo"
      className={clsx("object-contain pointer-events-none", additionalClassNames)}
      src={imgFinalSealLogo1}
    />
  );
}

type ProjectCardProps = {
  project: Project;
  onClick: () => void;
  featured?: boolean;
};

function ProjectCard({ project, onClick, featured = false }: ProjectCardProps) {
  const [isMediaHovered, setIsMediaHovered] = useState(false);

  // Featured card style (for first 4 cards on desktop)
  if (featured) {
    return (
      <button
        onClick={onClick}
        className="content-stretch flex flex-col gap-3 items-start relative shrink-0 w-full cursor-pointer group"
      >
        <div 
          className="content-stretch flex flex-col items-start justify-end overflow-clip relative rounded-[26px] shrink-0 w-full transition-transform duration-300 group-hover:scale-[0.99]"
          onMouseEnter={() => setIsMediaHovered(true)}
          onMouseLeave={() => setIsMediaHovered(false)}
        >
          <ProjectMedia imageSrc={project.imageSrc} videoSrc={project.videoSrc} />
          {/* Floating title pill inside the card */}
          <div className="absolute bottom-0 left-0 p-3">
            <div className="bg-white border border-[#f3f4f6] border-solid flex items-center justify-center px-3 py-2 rounded-full">
              <p className="font-['Figtree',sans-serif] font-medium leading-[1.4] text-[#111827] text-base">
                <span>{project.title} </span>
                <span className="text-[#9ca3af]">• {project.year}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col items-start px-[13px] py-0 relative shrink-0">
          <p className={clsx(
            "font-['Figtree',sans-serif] font-medium leading-[1.4] text-[#9ca3af] text-base w-full text-left transition-all duration-300 ease-out",
            isMediaHovered ? "opacity-100 translate-y-0" : "opacity-100 translate-y-0 md:opacity-0 md:translate-y-2"
          )}>{project.description}</p>
        </div>
      </button>
    );
  }

  // Default card style
  return (
    <button
      onClick={onClick}
      className="content-stretch flex flex-col gap-3 items-start relative shrink-0 w-full cursor-pointer group"
    >
      <div 
        className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full transition-transform duration-300 group-hover:scale-[0.99]"
        onMouseEnter={() => setIsMediaHovered(true)}
        onMouseLeave={() => setIsMediaHovered(false)}
      >
        <ProjectMedia imageSrc={project.imageSrc} videoSrc={project.videoSrc} />
      </div>
      <div className="content-stretch flex flex-col font-['Figtree',sans-serif] font-normal items-start leading-[1.4] px-[13px] py-0 relative shrink-0 text-lg">
        <p className="relative shrink-0 text-[#111827] w-full text-left">
          <span>{project.title} </span>
          <span className="text-[#9ca3af]">• {project.year}</span>
        </p>
        <p className={clsx(
          "relative shrink-0 text-[#9ca3af] w-full text-left font-normal transition-all duration-300 ease-out",
          isMediaHovered ? "opacity-100 translate-y-0" : "opacity-100 translate-y-0 md:opacity-0 md:translate-y-2"
        )}>{project.description}</p>
      </div>
    </button>
  );
}

type ProjectModalProps = {
  project: Project;
  onClose: () => void;
};

function ProjectModal({ project, onClose }: ProjectModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-[26px] p-6 flex flex-col gap-5 items-end max-w-[90vw] max-h-[90vh] overflow-auto">
        <div className="content-stretch flex flex-col gap-1.5 items-start relative shrink-0 w-full">
          <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
            <div className="content-stretch flex gap-1.5 items-center relative shrink-0 text-nowrap">
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
            <button
              onClick={onClose}
              className="content-stretch flex items-center justify-center relative shrink-0 size-6 cursor-pointer hover:opacity-70 transition-opacity"
            >
              <div className="overflow-clip relative shrink-0 size-5">
                <div className="absolute inset-1/4">
                  <div className="absolute inset-0" style={{ "--fill-0": "rgba(75, 85, 99, 1)" } as React.CSSProperties}>
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
                      <path
                        d="M9.76256 1.17736C10.0791 0.860788 10.0791 0.347859 9.76256 0.031284C9.44599 -0.285291 8.93306 -0.285291 8.61648 0.031284L5 3.64776L1.38352 0.031284C1.06694 -0.285291 0.554014 -0.285291 0.237439 0.031284C-0.0791362 0.347859 -0.0791362 0.860788 0.237439 1.17736L3.85392 4.79384L0.237439 8.41032C-0.0791362 8.7269 -0.0791362 9.23982 0.237439 9.5564C0.554014 9.87297 1.06694 9.87297 1.38352 9.5564L5 5.93992L8.61648 9.5564C8.93306 9.87297 9.44599 9.87297 9.76256 9.5564C10.0791 9.23982 10.0791 8.7269 9.76256 8.41032L6.14608 4.79384L9.76256 1.17736Z"
                        fill="var(--fill-0, #4B5563)"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
          <p className="font-['Figtree',sans-serif] font-normal leading-normal relative shrink-0 text-[#6b7280] text-base w-full">
            {project.description}
          </p>
        </div>
        <div className="relative rounded-[15.637px] shrink-0 w-full max-w-[1097px] aspect-[1097/615.86]">
          <img
            alt=""
            className="absolute max-w-none object-cover size-full rounded-[15.637px]"
            src={project.imageSrc}
          />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <div className="bg-white content-stretch flex flex-col items-center relative size-full min-h-screen">
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
      <div
        className="content-stretch flex flex-col items-start relative shrink-0 w-full header-gradient"
      >
        {/* Grain texture overlay - sits on top of gradient but below content */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${grainTexture})`,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
            opacity: 0.8,
          }}
        />
        {/* Logo */}
        <div className="relative shrink-0 w-full" style={{ zIndex: 2 }}>
          <div className="size-full">
            <div className="content-stretch flex flex-col items-start p-8 max-md:p-4 relative w-full">
              <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
                <div className="relative shrink-0 size-11">
                  <FinalSealLogoBackgroundImage additionalClassNames="size-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Text */}
        <div className="relative shrink-0 w-full" style={{ zIndex: 2 }}>
          <div className="size-full">
            <div className="content-stretch flex flex-col gap-4 items-start pb-4 pt-11 px-8 max-md:px-4 relative w-full">
              <div className="content-stretch flex flex-col gap-1 items-start relative shrink-0 w-full">
                <p className="font-['Figtree',sans-serif] font-medium leading-normal relative shrink-0 text-[#374151] text-[64px] w-full max-md:text-5xl">
                  michelle liu
                </p>
                <p className="font-['Figtree',sans-serif] font-normal leading-7 not-italic relative shrink-0 text-[#6b7280] text-xl w-full max-md:text-lg">
                  <span className="font-['Figtree',sans-serif] text-[#9ca3af]">
                    Designing useful products to spark moments of{" "}
                  </span>
                  <span className="font-['Figtree',sans-serif] text-[#9ca3af]">delight</span>
                  <span className="font-['Figtree',sans-serif] text-[#9ca3af]">{` & `}</span>
                  <span className="font-['Figtree',sans-serif] gradient-text-animated">human connection. ⟡˙⋆</span>
                  <span className="font-['Figtree',sans-serif] text-[#9ca3af]">
                    <br aria-hidden="true" />
                    {`Previously at `}
                  </span>
                  <span
                    className="font-['Figtree',sans-serif] text-[#374151]"
                    style={{ fontVariationSettings: "'wdth' 100" }}
                  >
                    
                  </span>
                  <span className="font-['Figtree',sans-serif] text-[#374151]"></span>
                  <span className="font-['Figtree',sans-serif] text-[#9ca3af]">{`, `}</span>
                  <span className="font-['Figtree',sans-serif] text-[#374151]">Roblox</span>
                  <span className="font-['Figtree',sans-serif] text-[#9ca3af]">{`, & `}</span>
                  <span className="font-['Figtree',sans-serif] text-[#374151]">NASA</span>
                  <span className="font-['Figtree',sans-serif] text-[#9ca3af]">.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="content-stretch flex flex-col items-center pb-4 pt-0 px-0 relative shrink-0 w-full">
        <div className="relative shrink-0 w-full">
          <div className="size-full">
            <div className="content-stretch flex flex-col gap-3 items-start pb-0 pt-4 px-8 max-md:px-4 relative w-full">
              <div className="content-stretch flex gap-3 items-start relative shrink-0">
                <TagBackgroundImageAndText text="WORK" active />
                <TagBackgroundImageAndText text="ART" />
                <TagBackgroundImageAndText text="ABOUT" />
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid - Desktop (2 columns) */}
        <div className="hidden md:grid gap-4 grid-cols-2 px-8 py-4 max-md:px-4 relative shrink-0 w-full">
          {projects.map((project, index) => (
            <div key={project.id} className="w-full">
              <ProjectCard 
                project={project} 
                onClick={() => setSelectedProject(project)} 
                featured={index < 4} // First 4 cards use featured style on desktop
              />
            </div>
          ))}
        </div>

        {/* Projects Grid - Mobile (1 column) */}
        <div className="md:hidden flex flex-col gap-8 px-8 max-md:px-4 py-4 relative shrink-0 w-full">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onClick={() => setSelectedProject(project)} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative shrink-0 w-full">
        <div className="flex flex-col items-center size-full">
          <div className="content-stretch flex flex-col gap-16 items-center px-8 max-md:px-4 py-16 max-md:pb-16 max-md:pt-4 relative w-full">
            <div className="content-stretch flex flex-col gap-5 items-start relative shrink-0 w-full">
              <div className="bg-[#e5e7eb] h-px shrink-0 w-full" />
              
              {/* Desktop Grid (4 columns) */}
              <div className="hidden md:grid gap-5 grid-cols-[repeat(4,_minmax(0px,_1fr))] grid-rows-[repeat(1,_fit-content(100%))] relative shrink-0 w-full">
                {/* Column 1: Logo */}
                <div className="[grid-area:1_/_1] content-stretch flex flex-col gap-1.5 items-start relative shrink-0">
                  <div className="content-stretch flex gap-2 items-center justify-center relative shrink-0">
                    <div className="relative shrink-0 size-7">
                      <img
                        alt="Michelle Liu Logo"
                        className="object-contain size-full"
                        src={imgFinalSealLogo1}
                      />
                    </div>
                    <p className="font-['Figtree',sans-serif] font-medium leading-normal relative shrink-0 text-[#374151] text-[32px] w-[212px]">
                      michelle liu
                    </p>
                  </div>
                  <p className="font-['Figtree',sans-serif] font-normal leading-7 relative shrink-0 text-[#9ca3af] text-base text-nowrap">
                    <span>{`Built with Next.js & `}</span>
                    <a
                      className="[text-underline-position:from-font] cursor-pointer decoration-solid underline hover:opacity-70 transition-opacity"
                      href="https://www.rockysmatcha.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      rocky's matcha
                    </a>
                    <span>{` lattes.`}</span>
                  </p>
                </div>
                
                {/* Column 3: Nav Links */}
                <div className="[grid-area:1_/_3] content-stretch flex flex-col gap-4 items-start relative shrink-0">
                  <LinksBackgroundImageAndText text="WORK" />
                  <LinksBackgroundImageAndText text="ART" />
                  <LinksBackgroundImageAndText text="ABOUT" />
                </div>
                
                {/* Column 4: Contact + Social */}
                <div className="[grid-area:1_/_4] content-stretch flex flex-col gap-11 items-start relative shrink-0">
                  <div className="content-stretch flex flex-col font-['Figtree',sans-serif] font-normal items-start relative shrink-0 text-gray-400 w-full">
                    <p className="leading-6 min-w-full relative shrink-0 text-base w-[min-content]">Let's work together!</p>
                    <p className="leading-6 relative shrink-0 text-base text-nowrap">
                      <a href="mailto:michelletheresaliu@gmail.com" className="hover:text-blue-500 text-gray-500 transition-colors duration-200">
                        <span>{`michelletheresaliu@gmail.com `}</span>
                        <span className="font-['Figtree',sans-serif] font-bold">↗</span>
                      </a>
                    </p>
                  </div>
                  <div className="content-stretch flex flex-col gap-5 items-start relative shrink-0 w-[326px]">
                    <div className="content-stretch flex gap-11 items-start relative shrink-0">
                      <a href="https://www.instagram.com/https.croissant/?hl=en" target="_blank" rel="noopener noreferrer" className="social-link">
                        <SocialLinksBackgroundImage>
                          <path d={svgPaths.p2c5f2300} fill="var(--fill-0, #6B7280)" id="Vector" />
                        </SocialLinksBackgroundImage>
                      </a>
                      <a href="https://x.com/michelletliu" target="_blank" rel="noopener noreferrer" className="social-link">
                        <div className="content-stretch flex items-center justify-center p-2.5 relative shrink-0 size-6">
                          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                            <div
                              className="[grid-area:1_/_1] h-[17.219px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_-0.89px] mask-size-[19px_19px] ml-0 mt-[4.69%] relative w-[19px]"
                              style={{ maskImage: `url('${imgGroup}')` }}
                            >
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 18">
                                <g id="Group">
                                  <path d={svgPaths.p16308a80} fill="var(--fill-0, #6B7280)" id="Vector" />
                                </g>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </a>
                      <a href="https://www.linkedin.com/in/michelletliu" target="_blank" rel="noopener noreferrer" className="social-link social-link-linkedin">
                        <div className="content-stretch flex items-center justify-center p-2.5 relative shrink-0 size-6">
                          <SocialLinksBackgroundImage>
                            <path d={svgPaths.p1e086000} fill="var(--fill-0, #6B7280)" id="Vector" stroke="var(--stroke-0, #6B7280)" />
                          </SocialLinksBackgroundImage>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mobile Layout (Vertical Stack) */}
              <div className="md:hidden content-stretch flex flex-col gap-10 items-start relative shrink-0 w-full">
                {/* Logo Section */}
                <div className="content-stretch flex flex-col gap-1.5 items-start relative shrink-0">
                  <div className="content-stretch flex gap-2 items-center justify-center relative shrink-0">
                    <div className="relative shrink-0 size-7">
                      <img
                        alt="Michelle Liu Logo"
                        className="object-contain size-full"
                        src={imgFinalSealLogo1}
                      />
                    </div>
                    <p className="font-['Figtree',sans-serif] font-medium leading-normal relative shrink-0 text-[#374151] text-[32px] w-[212px]">
                      michelle liu
                    </p>
                  </div>
                  <p className="font-['Figtree',sans-serif] font-normal leading-7 relative shrink-0 text-[#9ca3af] text-base text-nowrap">
                    <span>{`Built with Next.js & `}</span>
                    <a
                      className="[text-underline-position:from-font] cursor-pointer decoration-solid underline hover:opacity-70 transition-opacity"
                      href="https://www.rockysmatcha.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      rocky's matcha
                    </a>
                    <span>{` lattes.`}</span>
                  </p>
                </div>
                
                {/* Contact + Social + Nav */}
                <div className="content-stretch flex flex-col gap-10 items-start relative shrink-0">
                  <div className="content-stretch flex flex-col gap-11 items-start relative shrink-0">
                    <div className="content-stretch flex flex-col font-['Figtree',sans-serif] font-normal items-start relative shrink-0 text-[#9ca3af] w-[326px]">
                      <p className="leading-6 relative shrink-0 text-base w-full">Let's work together!</p>
                      <p className="leading-6 relative shrink-0 text-base w-full">
                        <a href="mailto:michelletheresaliu@gmail.com" className="hover:text-blue-500 text-gray-500 transition-colors duration-200">
                          <span>{`michelletheresaliu@gmail.com `}</span>
                          <span className="font-['Figtree',sans-serif] font-bold">↗</span>
                        </a>
                      </p>
                    </div>
                    <div className="content-stretch flex flex-col gap-5 items-start relative shrink-0 w-[326px]">
                      <div className="content-stretch flex gap-11 items-start relative shrink-0">
                        <a href="https://www.instagram.com/https.croissant/?hl=en" target="_blank" rel="noopener noreferrer" className="social-link">
                          <SocialLinksBackgroundImage>
                            <path d={svgPaths.p2c5f2300} fill="var(--fill-0, #6B7280)" id="Vector" />
                          </SocialLinksBackgroundImage>
                        </a>
                        <a href="https://x.com/michelletliu" target="_blank" rel="noopener noreferrer" className="social-link">
                          <div className="content-stretch flex items-center justify-center p-2.5 relative shrink-0 size-6">
                            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                              <div
                                className="[grid-area:1_/_1] h-[17.219px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_-0.89px] mask-size-[19px_19px] ml-0 mt-[4.69%] relative w-[19px]"
                                style={{ maskImage: `url('${imgGroup}')` }}
                              >
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 18">
                                  <g id="Group">
                                    <path d={svgPaths.p16308a80} fill="var(--fill-0, #6B7280)" id="Vector" />
                                  </g>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </a>
                        <a href="https://www.linkedin.com/in/michelletliu" target="_blank" rel="noopener noreferrer" className="social-link social-link-linkedin">
                          <div className="content-stretch flex items-center justify-center p-2.5 relative shrink-0 size-6">
                            <SocialLinksBackgroundImage>
                              <path d={svgPaths.p1e086000} fill="var(--fill-0, #6B7280)" id="Vector" stroke="var(--stroke-0, #6B7280)" />
                            </SocialLinksBackgroundImage>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-4 items-start relative shrink-0 w-[338px]">
                    <LinksBackgroundImageAndText text="WORK" />
                    <LinksBackgroundImageAndText text="ART" />
                    <LinksBackgroundImageAndText text="ABOUT" />
                  </div>
                </div>
              </div>
            </div>
            <TextScramble 
              text="CHANGELOG: 12-16-25"
              className="font-['Figtree',sans-serif] font-normal leading-5 relative shrink-0 text-[#9ca3af] text-sm text-nowrap"
            />
          </div>
        </div>
      </div>

      {/* Project Modal */}
      {selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </div>
  );
}
