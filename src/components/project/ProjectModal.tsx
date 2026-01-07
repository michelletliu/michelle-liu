import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { PortableText } from "@portabletext/react";
import { client, urlFor } from "../../sanity/client";
import { PROJECT_BY_COMPANY_QUERY } from "../../sanity/queries";
import { getCachedData } from "../../sanity/preload";
import type { Project, ContentSection } from "../../sanity/types";
import Footer from "../Footer";
import VideoPlayer from "../VideoPlayer";
import ViewAllProjectsButton from "./ViewAllProjectsButton";
import ProjectCardSection from "./ProjectCardSection";
import SideQuestSection from "./SideQuestSection";
import { ScrollReveal } from "../ScrollReveal";
import lockIcon from "../../assets/lock.svg";
import expandIcon from "../../assets/Expand.svg";
import quoteGraphic from "../../assets/quote gray 200.png";

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

// Password input component with local state
function PasswordInput({ expectedPassword, onUnlock }: { expectedPassword: string; onUnlock?: () => void }) {
  const [passwordValue, setPasswordValue] = useState("");
  const [error, setError] = useState(false);

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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-[313px]">
      <div className={clsx(
        "bg-white border border-solid content-stretch flex items-center justify-between pl-4 pr-3 py-2 relative rounded-full shrink-0 w-full transition-colors duration-200",
        error ? "border-[#f87171]" : "border-[#e5e7eb]"
      )}>
        <input
          type="password"
          placeholder="Enter"
          value={passwordValue}
          onChange={handleInputChange}
          className="leading-5 relative shrink-0 text-black text-base bg-transparent border-none outline-none flex-1 placeholder:text-[#9ca3af]"
        />
        <button
          type="submit"
          className="relative shrink-0 size-[14px] rotate-[-90deg] hover:opacity-70 transition-opacity"
        >
          <ArrowRightIcon />
        </button>
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
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Check if project was previously unlocked in this session
  const [isUnlocked, setIsUnlocked] = useState(() => isProjectUnlocked(projectId));
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const heroRef = React.useRef<HTMLDivElement>(null);
  
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

  // Lock body scroll when modal is open (popup mode only)
  useEffect(() => {
    if (!isFullscreen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFullscreen]);

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

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      setIsScrolled(scrollTop > 20);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  // Observe when hero section leaves the viewport (for hiding breadcrumb)
  useEffect(() => {
    const heroElement = heroRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!heroElement || !scrollContainer || !isFullscreen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Check if hero has scrolled OUT OF VIEW (above the viewport)
          // entry.boundingClientRect.bottom < 0 means the hero is above the viewport
          // We also check !entry.isIntersecting to ensure it's truly out of view
          const heroTop = entry.boundingClientRect.top;
          const rootTop = entry.rootBounds?.top ?? 0;
          
          // Hero is past when its bottom is above the visible area (scrolled up and out)
          const isPast = !entry.isIntersecting && heroTop < rootTop;
          setIsPastHero(isPast);
        });
      },
      {
        root: scrollContainer,
        threshold: 0,
        rootMargin: "0px 0px 0px 0px",
      }
    );

    observer.observe(heroElement);
    return () => observer.disconnect();
  }, [isFullscreen, project]);

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
    if (isFullscreen && onCollapseFromFullscreen) {
      onCollapseFromFullscreen();
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
    
    // If in modal mode, expand to fullscreen
    // The fullscreen page will naturally start from the top
    if (!isFullscreen && onExpandToFullscreen) {
      onExpandToFullscreen();
    } else {
      // Already in fullscreen - scroll to top
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
      // Also scroll window to top for fullscreen mode
      window.scrollTo({ top: 0, behavior: 'instant' });
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
            : "rounded-[26px] w-[calc(100%*10/12)] max-md:w-full max-h-[90vh]",
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
            /* Modal header with back and close buttons */
            <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-7 pt-6 pb-3 z-10">
              {/* Back/Expand button */}
              <button
                onClick={handleExpandToFullscreen}
                className="content-stretch flex items-center justify-center relative shrink-0 size-6 cursor-pointer rounded-sm hover:bg-gray-200 transition-colors duration-200 ease-out text-[#4b5563]"
              >
                <div className="relative shrink-0 size-[18px]">
                  <BackArrowIcon />
                </div>
              </button>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="content-stretch flex items-center justify-center relative shrink-0 size-6 cursor-pointer rounded-full hover:bg-gray-200 transition-colors duration-200 ease-out text-[#4b5563]"
              >
                <div className="overflow-clip relative shrink-0 size-2.5">
                  <CloseIcon />
                </div>
              </button>
            </div>
          )}

          {/* Scrollable content */}
          <div ref={scrollContainerRef} className={clsx(
            "overflow-y-auto flex-1",
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
              {/* Project Hero Header */}
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
                            <p className="font-semibold relative shrink-0 text-[#9ca3af]">
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
                
                // When locked, also stop at protectedSection
                if (!isUnlocked) {
                  const protectedIndex = sections.findIndex(s => s._type === "protectedSection");
                  if (protectedIndex !== -1) {
                    sections = sections.slice(0, protectedIndex + 1);
                  }
                }
                
                // Filter by visibility
                sections = sections.filter(shouldShowSection);
                
                return sections.map((section) => 
                  // Testimonials have interactive expand/collapse - skip ScrollReveal
                  // to prevent animation from replaying when clicking "Read more"
                  section._type === "testimonialSection" ? (
                    <ContentBlock key={section._key} section={section} isFullscreen={isFullscreen} isUnlocked={isUnlocked} onUnlock={handleUnlock} />
                  ) : (
                    <ScrollReveal key={section._key}>
                      <ContentBlock section={section} isFullscreen={isFullscreen} isUnlocked={isUnlocked} onUnlock={handleUnlock} />
                    </ScrollReveal>
                  )
                );
              })()}

              {/* Also Check Out Section */}
              {project.relatedProjects && project.relatedProjects.length > 0 && (
                <div className="content-stretch flex flex-col gap-8 items-start justify-center px-8 md:px-[8%] xl:px-[175px] py-16 relative shrink-0 w-full">
                  <div className="content-stretch flex flex-col gap-8 items-start relative shrink-0 w-full">
                    {/* Section Title */}
                    <ScrollReveal variant="fade">
                      <p className="font-normal leading-7 relative shrink-0 text-[#6b7280] text-xl w-full whitespace-pre-wrap">
                        Also check out...
                      </p>
                    </ScrollReveal>

                    {/* Projects Grid */}
                    <div className="content-stretch flex gap-4 items-center relative shrink-0 w-full max-md:flex-col">
                      {project.relatedProjects.map((related) => (
                        <ScrollReveal key={related._id} className="flex-[1_0_0] min-h-px min-w-px max-md:w-full">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleProjectClick(related.company);
                            }}
                            className="content-stretch flex flex-col gap-3 items-start relative shrink-0 cursor-pointer group text-left w-full z-10"
                          >
                            {related.heroImage && (
                              <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[26px] shrink-0 w-full transition-transform duration-300 group-hover:scale-[0.99]">
                                <div className="aspect-[678/367.625] relative rounded-[26px] shrink-0 w-full">
                                  <img
                                    className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[26px] size-full"
                                    alt=""
                                    src={urlFor(related.heroImage).width(800).height(434).url()}
                                  />
                                </div>
                              </div>
                            )}
                            <div className="content-stretch flex flex-col font-medium items-start leading-[1.4] px-[13px] py-0 relative shrink-0 text-base whitespace-pre-wrap w-full">
                              <p className="relative shrink-0 text-[#111827] w-full">
                                <span>{related.title} </span>
                                <span className="text-[#9ca3af]">• {related.year}</span>
                              </p>
                              <p className="relative shrink-0 text-[#9ca3af] w-full font-normal project-card-text opacity-0 translate-y-1 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0">
                                {related.shortDescription}
                              </p>
                            </div>
                          </button>
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>

                  {/* View All Button */}
                  <ScrollReveal variant="fade" delay={200} className="w-full">
                    <ViewAllProjectsButton onClick={onViewAllProjects} />
                  </ScrollReveal>
                </div>
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
      className="content-stretch flex flex-col items-start justify-center px-8 md:px-[8%] xl:px-[175px] py-16 relative shrink-0 w-full scroll-mt-8"
    >
      <div className="content-stretch flex flex-col gap-[100px] max-md:gap-16 items-start relative shrink-0 w-full">
        {/* Header Section */}
        <div className="content-stretch flex flex-col gap-5 items-start relative shrink-0 w-full">
          <p className="leading-5 relative shrink-0 text-[#9ca3af] text-base">
            {sectionLabel}
          </p>
          <p className="leading-7 min-w-full relative shrink-0 text-2xl text-black whitespace-pre-wrap">
            {sectionTitle}
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
                <div className="leading-[26px] text-[#1f2937] text-xl whitespace-pre-wrap">
                  <p>{quote}</p>
                </div>
              )}

              {/* Full Quote - shown when expanded */}
              {isExpanded && (
                <div className="leading-[26px] text-[#1f2937] text-xl whitespace-pre-wrap">
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
function ContentBlock({ section, isFullscreen = false, isUnlocked = false, onUnlock }: { section: ContentSection; isFullscreen?: boolean; isUnlocked?: boolean; onUnlock?: () => void }) {
  const renderContent = () => {
    switch (section._type) {
      case "missionSection":
      // Check if there's description content and image
      const hasDescription = section.missionDescription && section.missionDescription.length > 0;
      const hasImage = !!section.missionImage;
      
      // Helper to render title with highlighted text
      const renderTitle = (title: string, highlightedText?: string, highlightColor?: string) => {
        if (!highlightedText) {
          return title;
        }
        // Case-insensitive search
        const lowerTitle = title.toLowerCase();
        const lowerHighlight = highlightedText.toLowerCase();
        const index = lowerTitle.indexOf(lowerHighlight);
        
        if (index === -1) {
          return title;
        }
        
        // Use the original case from the title
        const before = title.substring(0, index);
        const match = title.substring(index, index + highlightedText.length);
        const after = title.substring(index + highlightedText.length);
        const color = highlightColor || '#3b82f6';
        
        return (
          <>
            {before}
            <span style={{ color }}>{match}</span>
            {after}
          </>
        );
      };
      
      // Centered layout when image is provided
      if (hasImage) {
        return (
          <div className="flex flex-col items-center px-8 md:px-[8%] xl:px-[175px] py-16 relative shrink-0 w-full">
            {/* Label + Title */}
            <div className="flex flex-col gap-5 items-center text-center w-[410px] max-md:w-full">
              <p className="leading-5 text-[#9ca3af] text-base">
                {section.sectionLabel || "The Mission"}
              </p>
              <p className="leading-7 text-2xl text-black whitespace-pre-wrap text-pretty">
                {renderTitle(section.missionTitle, section.highlightedText, section.highlightColor)}
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
                <div className="leading-normal text-[#4b5563] text-base whitespace-pre-wrap prose prose-p:my-4 first:prose-p:mt-0 last:prose-p:mb-0">
                  <PortableText value={section.missionDescription} />
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
        <div className={clsx(
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
            <p className="leading-5 relative shrink-0 text-[#9ca3af] text-base">
              {section.sectionLabel || "The Mission"}
            </p>
            <p className="leading-7 w-full relative shrink-0 text-2xl text-black whitespace-pre-wrap text-pretty">
              {renderTitle(section.missionTitle, section.highlightedText, section.highlightColor)}
            </p>
          </div>

          {/* Right: Description - only shown when there is description content */}
          {hasDescription && (
            <div className="leading-normal relative text-[#4b5563] text-base whitespace-pre-wrap col-start-3 max-md:col-start-auto max-md:w-full prose prose-p:my-4 first:prose-p:mt-0 last:prose-p:mb-0">
              <PortableText value={section.missionDescription} />
            </div>
          )}
        </div>
      );

    case "protectedSection":
      // Don't show the protected section UI when content is unlocked
      if (isUnlocked) return null;
      
      const hasPassword = !!(section.showPasswordProtection && section.password);
      return (
        <div className="content-stretch flex flex-col items-start px-8 md:px-[8%] xl:px-[175px] py-16 relative shrink-0 w-full">
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
                    {(section.title || (hasPassword ? "This case study is password-protected." : "Confidential")).replace(/\n/g, ' ')}
                  </p>
                  <p className="leading-6 relative shrink-0 text-[#9ca3af] text-lg">
                    {hasPassword ? "Curious? Feel free to " : (section.message || "Interested? Please ")}
                    {section.contactEmail ? (
                      <>
                        <a
                          href={`mailto:${section.contactEmail}`}
                          className="underline decoration-solid hover:text-blue-500 transition-colors"
                        >
                          email me
                        </a>
                        !
                      </>
                    ) : (
                      "email me!"
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

    case "gallerySection":
      const colsClass =
        section.layout === "2-col"
          ? "grid-cols-2"
          : section.layout === "3-col"
          ? "grid-cols-3"
          : "grid-cols-4";
      return (
        <div className="content-stretch flex flex-col gap-4 px-8 md:px-[8%] xl:px-[175px] py-16 relative shrink-0 w-full">
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
            <p className="font-normal pt-4 leading-5 relative shrink-0 text-[#9ca3af] text-base text-center w-full">
              {section.title}
            </p>
          )}
        </div>
      );

    case "textSection":
      if (section.layout === "two-col") {
        return (
          <div className="content-stretch grid grid-cols-[2fr_1fr_2fr] items-start px-8 md:px-[8%] xl:px-[175px] py-16 relative shrink-0 w-full max-md:flex max-md:flex-col max-md:gap-8">
            <div className="content-stretch flex flex-col gap-5 items-start relative col-start-1">
              {section.label && (
                <p className="leading-5 relative shrink-0 text-[#9ca3af] text-base">
                  {section.label}
                </p>
              )}
              {section.heading && (
                <p className="leading-7 min-w-full relative shrink-0 text-2xl text-black whitespace-pre-wrap">
                  {section.heading}
                </p>
              )}
            </div>
            <div className="leading-5 relative text-[#4b5563] text-base whitespace-pre-wrap col-start-3 max-md:col-start-auto max-md:w-full prose prose-p:my-4 first:prose-p:mt-0 last:prose-p:mb-0">
              {section.body && <PortableText value={section.body} />}
            </div>
          </div>
        );
      }
      return (
        <div className="content-stretch flex flex-col gap-4 items-start px-8 md:px-[8%] xl:px-[175px] py-16 relative shrink-0 w-full">
          {section.label && (
            <p className="leading-5 relative shrink-0 text-[#9ca3af] text-base">
              {section.label}
            </p>
          )}
          {section.heading && (
            <p className="leading-7 relative shrink-0 text-2xl text-black">
              {section.heading}
            </p>
          )}
          {section.body && (
            <div className="leading-5 relative text-[#4b5563] text-base whitespace-pre-wrap prose prose-p:my-4 first:prose-p:mt-0 last:prose-p:mb-0">
              <PortableText value={section.body} />
            </div>
          )}
        </div>
      );

    case "imageSection":
      // Support both Sanity images and external URLs
      const imageSrc = section.externalImageUrl 
        ? section.externalImageUrl 
        : section.image 
          ? urlFor(section.image).width(1200).url()
          : null;
      
      if (!imageSrc) return null;
      
      return (
        <div className="content-stretch flex flex-col items-start px-8 md:px-[8%] xl:px-[175px] py-16 relative shrink-0 w-full">
          <div
            className={`overflow-hidden w-full ${
              section.rounded !== false ? "rounded-[26px]" : ""
            }`}
          >
            <img
              className="w-full object-cover"
              alt={section.alt || ""}
              src={imageSrc}
            />
          </div>
          {section.caption && (
            <p className="mt-3 text-center w-full text-[#6b7280]">{section.caption}</p>
          )}
        </div>
      );

    case "videoSection":
      return (
        <div className="content-stretch flex flex-col items-center px-8 md:px-[8%] xl:px-[175px] py-16 relative shrink-0 w-full">
          {section.videoType === "mux" && section.muxPlaybackId && (
            <div className="aspect-video w-full overflow-hidden rounded-[26px] bg-black">
              <VideoPlayer
                src={`https://stream.mux.com/${section.muxPlaybackId}.m3u8`}
                className="w-full h-full"
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
      );

      case "testimonialSection":
        // Testimonial has interactive expand/collapse - don't double-wrap with ScrollReveal
        // to prevent animation from replaying when clicking "Read more"
        return (
          <TestimonialBlock
            sectionLabel={section.sectionLabel}
            sectionTitle={section.sectionTitle}
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
            subtitle={section.subtitle}
            image={section.image}
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

