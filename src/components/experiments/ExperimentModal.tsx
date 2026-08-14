import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from '@/lib/navigation';
import clsx from 'clsx';
import { useScrollLock } from '../../utils/useScrollLock';
import ShimmerImage from '../shared/ShimmerImage';
import ShimmerVideo from '../shared/ShimmerVideo';
import { ArrowUpRight } from '../icons/ArrowUpRight';
import { Expand } from '../icons/Expand';
import { Info } from '../icons/Info';
import type { ToolCategory } from '../shared/InfoButton';
import { buttonClassName } from '../shared/Button';
import { HorizontalLine } from '../shared/HorizontalLine';
import { TryItOutButton } from '../shared/TryItOutButton';
import Tooltip from '../shared/Tooltip';
import { ghostIconButtonClass } from '../shared/ghostIconButton';
import { FloatingPanel } from '../shared/FloatingPanel';
import LoadingSpinner from "../shared/LoadingSpinner";
import {
  ExperimentSiteEmbed,
  ExperimentSiteMobileEmbed,
  SiteIconLink,
  SiteTextLink,
  ToolsSection,
  ViewOnXButton,
} from './ExperimentSiteEmbed';

// Lazy per experiment — don't download all five pages when this modal chunk loads.
const PolaroidPage = lazy(() => import('../polaroid/PolaroidPage'));
const LibraryPage = lazy(() => import('../library/LibraryPage'));
const ScreentimePage = lazy(() => import('../screentime/ScreentimePage'));
const SketchbookPage = lazy(() => import('../sketchbook/SketchbookPage'));
const FilmPage = lazy(() => import('../film/FilmPage'));

// Loading — DS film-dot ellipsis (shared LoadingSpinner)
function ExperimentLoading() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[400px]">
      <LoadingSpinner size="md" label="Loading" />
    </div>
  );
}

const DESIGN_MEETUP_HREF = 'https://designmeetup.info';
const SUNDAYS_HREF = 'https://sundays.rsvp';

function isSiteEmbedProject(projectId: string) {
  return projectId === 'sundays' || projectId === 'design-meetup';
}

export type ExperimentProject = {
  id: string;
  title: string;
  year: string;
  description: React.ReactNode;
  imageSrc: string;
  videoSrc?: string;
  xLink?: string;
  tryItOutHref?: string;
  backgroundColor?: string;
  toolCategories?: ToolCategory[];
};

// Get background color CSS value from project (now stored as hex in Sanity)
function getBackgroundColor(project: ExperimentProject): string {
  return project.backgroundColor || '#ffffff';
}

// Logo component for fullscreen mode
function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
      aria-label="Collapse to modal"
    >
      <img
        src="/logo.png"
        alt="Michelle Liu Logo"
        className="w-8 h-8 md:w-[44px] md:h-[44px] object-contain"
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
    </button>
  );
}

type ExperimentModalProps = {
  projectId: string;
  project: ExperimentProject;
  onClose: () => void;
  onExpandToFullscreen?: (bookSlug?: string) => void;
  onCollapseFromFullscreen?: () => void;
  onBookSlugChange?: (bookSlug?: string, options?: { replace?: boolean }) => void;
  bookSlug?: string;
  initialFullscreen?: boolean;
};

function GenericExperimentEmbed({ project }: { project: ExperimentProject }) {
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVideoReady(true), 350);
    return () => clearTimeout(t);
  }, []);

  const hasMedia = Boolean(
    (project.imageSrc && project.imageSrc.trim()) || project.videoSrc,
  );
  const tryItOutHref = project.tryItOutHref?.trim();
  const isExternalTryItOut = Boolean(
    tryItOutHref && /^https?:\/\//.test(tryItOutHref),
  );

  return (
    <div className="font-['Michelle',sans-serif] min-h-full w-full box-border flex flex-col gap-6 px-6 py-16 md:px-16 md:py-20 text-[#18181b]">
      <header className="flex flex-col gap-2 max-w-2xl">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h1 className="text-2xl md:text-3xl font-normal">{project.title}</h1>
          <span className="text-[#a1a1aa] text-xl">•</span>
          <span className="text-[#a1a1aa] text-xl">{project.year}</span>
        </div>
        <p className="text-base leading-relaxed text-[#71717a]">
          {project.description}
        </p>
        {tryItOutHref && isExternalTryItOut ? (
          <a
            href={tryItOutHref}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClassName({
              variant: "primary",
              size: "md",
              className: "w-fit mt-1 inline-flex items-center gap-1",
            })}
          >
            Visit Site
            <ArrowUpRight />
          </a>
        ) : tryItOutHref ? (
          <TryItOutButton href={tryItOutHref} className="w-fit mt-1" />
        ) : null}
      </header>
      {hasMedia ? (
        <div className="relative w-full max-w-4xl aspect-video overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-100 shrink-0">
          {project.imageSrc?.trim() ? (
            <ShimmerImage
              alt=""
              className="absolute object-cover size-full"
              wrapperClassName="absolute inset-0"
              rounded="rounded-2xl"
              src={project.imageSrc}
            />
          ) : null}
          {project.videoSrc && videoReady ? (
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
          ) : null}
        </div>
      ) : null}
      {project.toolCategories && project.toolCategories.length > 0 ? (
        <ToolsSection categories={project.toolCategories} />
      ) : null}
    </div>
  );
}

function SundaysEmbed({ project, isFullscreen = false, isScrolled = false, isPastHero = false, onCollapse }: { project: ExperimentProject; isFullscreen?: boolean; isScrolled?: boolean; isPastHero?: boolean; onCollapse?: () => void }) {
  return (
    <ExperimentSiteEmbed
      project={project}
      siteHref={SUNDAYS_HREF}
      siteLabel="sundays.rsvp"
      isFullscreen={isFullscreen}
      isScrolled={isScrolled}
      isPastHero={isPastHero}
      onCollapse={onCollapse}
      headerActions={
        <>
          <SiteIconLink href={SUNDAYS_HREF} label="sundays.rsvp" />
          {project.xLink ? <ViewOnXButton href={project.xLink} /> : null}
        </>
      }
      compactActions={
        <>
          {project.xLink ? <ViewOnXButton href={project.xLink} /> : null}
          <SiteTextLink href={SUNDAYS_HREF} label="sundays.rsvp" />
        </>
      }
    />
  );
}

function SundaysMobileEmbed({ project }: { project: ExperimentProject }) {
  return (
    <ExperimentSiteMobileEmbed
      project={project}
      siteHref={SUNDAYS_HREF}
      siteLabel="sundays.rsvp"
      footerActions={
        <>
          <SiteTextLink href={SUNDAYS_HREF} label="sundays.rsvp" />
          {project.xLink ? (
            <ViewOnXButton href={project.xLink} className="relative self-start" />
          ) : null}
        </>
      }
    />
  );
}

function DesignMeetupEmbed({ project, isFullscreen = false, isScrolled = false, isPastHero = false, onCollapse }: { project: ExperimentProject; isFullscreen?: boolean; isScrolled?: boolean; isPastHero?: boolean; onCollapse?: () => void }) {
  return (
    <ExperimentSiteEmbed
      project={project}
      siteHref={DESIGN_MEETUP_HREF}
      siteLabel="designmeetup.info"
      isFullscreen={isFullscreen}
      isScrolled={isScrolled}
      isPastHero={isPastHero}
      onCollapse={onCollapse}
      headerActions={
        <>
          <SiteIconLink href={DESIGN_MEETUP_HREF} label="designmeetup.info" />
          {project.xLink ? <ViewOnXButton href={project.xLink} /> : null}
        </>
      }
      compactActions={
        <>
          {project.xLink ? <ViewOnXButton href={project.xLink} /> : null}
          <SiteTextLink href={DESIGN_MEETUP_HREF} label="designmeetup.info" />
        </>
      }
    />
  );
}

function DesignMeetupMobileEmbed({ project }: { project: ExperimentProject }) {
  return (
    <ExperimentSiteMobileEmbed
      project={project}
      siteHref={DESIGN_MEETUP_HREF}
      siteLabel="designmeetup.info"
      footerActions={
        <>
          <SiteTextLink href={DESIGN_MEETUP_HREF} label="designmeetup.info" />
          {project.xLink ? (
            <ViewOnXButton href={project.xLink} className="relative self-start" />
          ) : null}
        </>
      }
    />
  );
}


export default function ExperimentModal({ projectId, project, onClose, onExpandToFullscreen, onCollapseFromFullscreen, onBookSlugChange, bookSlug, initialFullscreen = false }: ExperimentModalProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isFullscreen = initialFullscreen;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-redirect to fullscreen on mobile for library
  useEffect(() => {
    if (projectId === 'library' && !initialFullscreen) {
      const checkMobile = () => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          navigate(`/project/${projectId}/full`, { replace: true });
        }
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, [projectId, initialFullscreen, navigate]);

  // Site embeds should never go fullscreen on mobile — redirect back to popup
  useEffect(() => {
    if (isSiteEmbedProject(projectId) && initialFullscreen) {
      const checkMobile = () => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          navigate(`/project/${projectId}`, { replace: true });
        }
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, [projectId, initialFullscreen, navigate]);
  const [contentScale, setContentScale] = useState(1);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useScrollLock();

  // Trigger enter animation on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  // Calculate scale factor to prevent horizontal overflow in modal mode
  useEffect(() => {
    if (isFullscreen) {
      setContentScale(1);
      return;
    }

    const calculateScale = () => {
      const container = scrollContainerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;

      // Get the container width (modal width minus scrollbar)
      const containerWidth = container.clientWidth;
      // The content's natural width - use scrollWidth to get full content width
      const contentWidth = content.scrollWidth;
      
      if (contentWidth > containerWidth) {
        // Scale down to fit, with a minimum scale of 0.5
        const scale = Math.max(0.5, containerWidth / contentWidth);
        setContentScale(scale);
      } else {
        setContentScale(1);
      }
    };

    // Calculate on mount and resize
    const timer = setTimeout(calculateScale, 100);
    window.addEventListener('resize', calculateScale);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateScale);
    };
  }, [isFullscreen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showInfoModal) {
          setShowInfoModal(false);
        } else {
          handleClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showInfoModal]);

  // Show scrollbar only when actively scrolling, and track scroll for fullscreen logo shrink (matches /apple/full pattern)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollContainer = container.querySelector('.modal-scroll-container') as HTMLElement | null;
    if (!scrollContainer) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      scrollContainer.classList.add('is-scrolling');
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        scrollContainer.classList.remove('is-scrolling');
      }, 1000);
      const top = scrollContainer.scrollTop;
      setIsScrolled(top > 20);
      setIsPastHero(top > 200);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [projectId, isFullscreen]);

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleExpand = () => {
    if (onExpandToFullscreen) {
      onExpandToFullscreen();
    } else {
      navigate(`/project/${projectId}/full`, { replace: true });
    }
  };

  const handleCollapse = () => {
    if (onCollapseFromFullscreen) {
      onCollapseFromFullscreen();
    } else {
      navigate(`/project/${projectId}`, { replace: true });
    }
  };

  // Render the appropriate experiment component
  const renderExperiment = () => {
    switch (projectId) {
      case 'polaroid':
        return <PolaroidPage />;
      case 'library':
        return (
          <LibraryPage
            bookSlug={bookSlug}
            isFullscreen={isFullscreen}
            onCollapse={handleCollapse}
            onOpenBookInFullscreen={onExpandToFullscreen}
            onBookSlugChange={onBookSlugChange}
          />
        );
      case 'screentime':
        return <ScreentimePage />;
      case 'sketchbook':
        return <SketchbookPage />;
      case 'film':
        return <FilmPage onCollapse={handleCollapse} isFullscreen={isFullscreen} />;
      case 'sundays':
        if (isMobile && !isFullscreen) {
          return <SundaysMobileEmbed project={project} />;
        }
        return <SundaysEmbed project={project} isFullscreen={isFullscreen} isScrolled={isScrolled} isPastHero={isPastHero} onCollapse={handleCollapse} />;
      case 'design-meetup':
        if (isMobile && !isFullscreen) {
          return <DesignMeetupMobileEmbed project={project} />;
        }
        return <DesignMeetupEmbed project={project} isFullscreen={isFullscreen} isScrolled={isScrolled} isPastHero={isPastHero} onCollapse={handleCollapse} />;
      default:
        return <GenericExperimentEmbed project={project} />;
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
          "absolute inset-0 bg-zinc-900/20 transition-opacity duration-500",
          isVisible && !isFullscreen ? 'opacity-100' : 'opacity-0',
          isFullscreen && 'pointer-events-none'
        )} 
        onClick={!isFullscreen ? handleClose : undefined} 
      />
      
      {/* Modal */}
      <div 
        className={clsx(
          "relative flex flex-col overflow-hidden transition-all duration-500 ease-out",
          isFullscreen 
            ? "w-full h-full rounded-none"
            : clsx(
              "rounded-[26px] w-[calc(100%*10/12)] max-md:w-full",
              isMobile && isSiteEmbedProject(projectId) ? "max-h-[90vh]" : "h-[90vh]"
            ),
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : isClosing 
              ? 'opacity-0 translate-y-4' 
              : 'opacity-0 translate-y-8'
        )}
        style={{ backgroundColor: getBackgroundColor(project) }}
      >
        {/* Top white gradient overlay - desktop only, hidden when fullscreen (fullscreen pages manage their own gradient) */}
        {!isFullscreen && (
          <div className="hidden md:block absolute top-0 left-0 right-0 h-32 pointer-events-none z-20" style={{
            background: 'linear-gradient(180deg, hsla(0,0%,100%,.5) 0%, hsla(0,0%,100%,.369) 19%, hsla(0,0%,100%,.271) 34%, hsla(0,0%,100%,.191) 47%, hsla(0,0%,100%,.139) 56.5%, hsla(0,0%,100%,.097) 65%, hsla(0,0%,100%,.063) 73%, hsla(0,0%,100%,.038) 80.2%, hsla(0,0%,100%,.021) 86.1%, hsla(0,0%,100%,.011) 91%, hsla(0,0%,100%,.004) 95.2%, hsla(0,0%,100%,.001) 98.2%, transparent 100%)'
          }} />
        )}

        {/* Header - expand button only in popup mode (fullscreen uses embedded page's logo) */}
        {/* Hidden on mobile for sundays (no fullscreen on mobile) */}
        {!isFullscreen && (
          <div className={clsx(
            "absolute top-0 left-0 z-[60] pointer-events-none pl-6 pt-6",
            isSiteEmbedProject(projectId) && 'max-md:hidden'
          )}>
            <div className="pointer-events-auto">
              <Tooltip label="Expand" position="bottom" portal>
                <button
                  onClick={handleExpand}
                  className="cursor-pointer transition-colors duration-200 hover:bg-zinc-100 text-[#a1a1aa] rounded-sm p-1"
                  aria-label="Expand to full page"
                >
                  <Expand size="18px" />
                </button>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Info button fixed top right - only in popup mode, hidden for site embeds (content already visible) */}
        {!isFullscreen && !isSiteEmbedProject(projectId) && (
          <div className={clsx(
            "absolute top-0 right-0 z-[60] pointer-events-none pr-7 pt-6"
          )}>
            <div className="pointer-events-auto relative inline-flex" data-info-button-container>
              {/* Negative margin cancels the 10px the 40px hit area adds around
                  the 20px glyph, so the glyph lines up with the expand icon. */}
              <Tooltip label="Info" position="bottom" disabled={showInfoModal} className="-mr-2.5" portal>
                <button
                  onClick={() => setShowInfoModal(!showInfoModal)}
                  className={ghostIconButtonClass(
                    "md",
                    clsx(
                      "text-zinc-400",
                      showInfoModal && "bg-zinc-900/5",
                    ),
                  )}
                  aria-label="Project info"
                  data-info-button
                >
                  <Info size="20px" />
                </button>
              </Tooltip>

              {/* Dropdown popover — same 6px offset as Tooltip */}
              {showInfoModal && (
                <div className="absolute top-full right-0 z-[70] mt-1.5">
                  <InfoPopover project={project} onClose={() => setShowInfoModal(false)} isFullscreen={false} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Embedded experiment content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-hidden transition-all duration-500 ease-out">
          <Suspense fallback={<ExperimentLoading />}>
            <div 
              className={clsx(
                "w-full h-full experiment-modal-embed modal-scroll-container relative transition-all duration-500 ease-out overflow-auto",
                isFullscreen && "fullscreen",
                !isFullscreen && projectId === 'film' && "overflow-x-hidden",
                !isFullscreen && isSiteEmbedProject(projectId) && "max-md:overflow-hidden"
              )}
              style={{ 
                '--scrollbar-track-color': getBackgroundColor(project),
                backgroundColor: getBackgroundColor(project)
              } as React.CSSProperties}
            >
              {/* Modal mode: Info button - positioned outside the scaled content */}
              {/* Content wrapper with scaling and smooth transitions */}
              <div 
                ref={contentRef}
                className={clsx(
                  "transition-all duration-500 ease-out",
                  (!isFullscreen && projectId === 'film') ? 'min-h-full' : 'h-full'
                )}
                style={{ 
                  transformOrigin: 'top left',
                  transform: !isFullscreen && contentScale < 1 && !(isMobile && isSiteEmbedProject(projectId)) ? `scale(${contentScale})` : undefined,
                  width: !isFullscreen && contentScale < 1 && !(isMobile && isSiteEmbedProject(projectId)) ? `${100 / contentScale}%` : undefined,
                }}
              >
                {renderExperiment()}
              </div>
            </div>
          </Suspense>
        </div>
      </div>

    </div>
  );
}

// Info popover component - dropdown style on desktop, modal style on mobile
function InfoPopover({ project, onClose, isMobile = false, isFullscreen = false }: { project: ExperimentProject; onClose: () => void; isMobile?: boolean; isFullscreen?: boolean }) {
  const [videoReady, setVideoReady] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoReady(true);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  // Close on click outside (desktop only), but not when clicking the info button itself
  useEffect(() => {
    if (isMobile) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Don't close if clicking the info button (let toggle handle it)
      const infoButton = document.querySelector('[data-info-button]');
      if (infoButton && infoButton.contains(target)) {
        return;
      }
      // Close if clicking outside the popover
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        onClose();
      }
    };
    
    // Delay adding listener to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isMobile]);

  return (
    <FloatingPanel
      ref={popoverRef}
      variant={isMobile ? "sheet" : isFullscreen ? "roomy" : "popover"}
      bodyClassName="items-start"
    >
        {/* Left: title + description stacked.
            Right: View on X — centered with title in popup; top-aligned when description shows. */}
        <div className={clsx(
          "flex justify-between w-full",
          isFullscreen ? "items-start" : "items-center"
        )}>
          {/* Left column: title and description stacked vertically */}
          <div className="flex flex-col min-w-0 gap-0">
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
              <p className="font-['Michelle',sans-serif] font-normal leading-normal relative shrink-0 text-base text-zinc-900">
                {project.title}
              </p>
              <p className="font-['Michelle',sans-serif] font-normal leading-snug relative shrink-0 text-[#a1a1aa] text-base">
                •
              </p>
              <p className="font-['Michelle',sans-serif] font-normal leading-normal relative shrink-0 text-[#a1a1aa] text-base">
                {project.year}
              </p>
            </div>

            {/* Description - hidden in popup mode, shown in fullscreen */}
            {isFullscreen && (
              <p className="font-['Michelle',sans-serif] font-normal leading-normal relative text-[#71717a] text-base">
                {project.description}
              </p>
            )}
          </div>

          {project.xLink ? (
            <ViewOnXButton href={project.xLink} className="relative" />
          ) : null}
        </div>

        {/* Tools Section */}
        {project.toolCategories && project.toolCategories.length > 0 && (
          <ToolsSectionCompact categories={project.toolCategories} isFullscreen={isFullscreen} />
        )}

        {/* Video/Image content area */}
        <div className={clsx(
          "relative border border-zinc-100 border-solid w-full aspect-[1097/616] overflow-hidden bg-zinc-100 shrink-0",
          isFullscreen ? "rounded-2xl mt-3" : "rounded-xl mt-1"
        )}>
          <ShimmerImage
            alt=""
            className="absolute object-cover size-full"
            wrapperClassName="absolute inset-0"
            rounded={isFullscreen ? "rounded-2xl" : "rounded-xl"}
            src={project.imageSrc}
          />
          {project.videoSrc && videoReady && (
            <ShimmerVideo
              key={project.id}
              src={project.videoSrc}
              className={clsx("absolute object-cover size-full", isFullscreen ? "rounded-2xl" : "rounded-xl")}
              wrapperClassName="absolute inset-0"
              rounded={isFullscreen ? "rounded-2xl" : "rounded-xl"}
              autoPlay
              muted
              loop
              controls={false}
              muxEnvKey="e4cc19a78gcf0tbtfmu4m7ruf"
            />
          )}
        </div>
    </FloatingPanel>
  );
}

// Compact tools section for popover
function ToolsSectionCompact({ categories, isFullscreen = false }: { categories: ToolCategory[]; isFullscreen?: boolean }) {
  if (!categories || categories.length === 0) return null;
  
  return (
    <div className={clsx("flex w-full flex-col", isFullscreen ? "gap-2" : "gap-3")}>
      <HorizontalLine />
      <div className={clsx(
        "font-['Michelle',sans-serif] font-normal grid grid-cols-4 relative shrink-0 w-full",
        isFullscreen ? "gap-3 text-base" : "gap-2 text-sm"
      )}>
        {categories.map((category, idx) => (
          <div key={idx} className="content-stretch flex flex-col gap-1 items-start justify-start relative shrink-0">
            <p className={clsx("relative shrink-0 text-[#a1a1aa]", isFullscreen ? "leading-normal text-sm" : "leading-tight text-sm")}>
              {category.label}
            </p>
            <div className={clsx(
              "content-stretch flex flex-col items-start relative shrink-0 text-[#71717a]",
              isFullscreen ? "gap-1" : "gap-0.5"
            )}>
              {category.tools.map((tool, toolIdx) => (
                <div key={toolIdx} className="flex flex-col justify-center relative shrink-0">
                  <p className={clsx("whitespace-nowrap", "leading-normal")}>{tool}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
