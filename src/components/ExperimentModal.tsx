import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from '@/lib/navigation';
import clsx from 'clsx';
import { useScrollLock } from '../utils/useScrollLock';
import ShimmerImage from './ShimmerImage';
import ShimmerVideo from './ShimmerVideo';
import { ArrowUpRight } from './ArrowUpRight';
import type { ToolCategory } from './InfoButton';

// Kick off chunk fetches immediately when this module loads (not when modal opens)
const polaroidPagePromise = import('./polaroid/PolaroidPage');
const libraryPagePromise = import('./library/LibraryPage');
const screentimePagePromise = import('./screentime/ScreentimePage');
const sketchbookPagePromise = import('./sketchbook/SketchbookPage');

const PolaroidPage = lazy(() => polaroidPagePromise);
const LibraryPage = lazy(() => libraryPagePromise);
const ScreentimePage = lazy(() => screentimePagePromise);
const SketchbookPage = lazy(() => sketchbookPagePromise);

// Expand icon SVG - same as used in main project modals (Expand.svg)
function ExpandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.75 10.5C4.16421 10.5 4.5 10.1642 4.5 9.75V5.56066L9.96967 11.0303C10.2626 11.3232 10.7374 11.3232 11.0303 11.0303C11.3232 10.7374 11.3232 10.2626 11.0303 9.96967L5.56066 4.5H9.75C10.1642 4.5 10.5 4.16421 10.5 3.75C10.5 3.33579 10.1642 3 9.75 3H3.75C3.33579 3 3 3.33579 3 3.75V9.75C3 10.1642 3.33579 10.5 3.75 10.5Z" fill="currentColor"/>
      <path d="M20.25 13.5C19.8358 13.5 19.5 13.8358 19.5 14.25V18.4393L14.0303 12.9697C13.7374 12.6768 13.2626 12.6768 12.9697 12.9697C12.6768 13.2626 12.6768 13.7374 12.9697 14.0303L18.4393 19.5H14.25C13.8358 19.5 13.5 19.8358 13.5 20.25C13.5 20.6642 13.8358 21 14.25 21H20.25C20.6642 21 21 20.6642 21 20.25V14.25C21 13.8358 20.6642 13.5 20.25 13.5Z" fill="currentColor"/>
    </svg>
  );
}

// Info icon SVG
function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.4512 24.9023C10.734 24.9023 9.12272 24.5768 7.61719 23.9258C6.11165 23.2829 4.78923 22.3918 3.6499 21.2524C2.51058 20.1131 1.6154 18.7907 0.964355 17.2852C0.321452 15.7796 0 14.1683 0 12.4512C0 10.734 0.321452 9.12272 0.964355 7.61719C1.6154 6.11165 2.51058 4.78923 3.6499 3.6499C4.78923 2.50244 6.11165 1.60726 7.61719 0.964355C9.12272 0.321452 10.734 0 12.4512 0C14.1683 0 15.7796 0.321452 17.2852 0.964355C18.7907 1.60726 20.1131 2.50244 21.2524 3.6499C22.3918 4.78923 23.2829 6.11165 23.9258 7.61719C24.5768 9.12272 24.9023 10.734 24.9023 12.4512C24.9023 14.1683 24.5768 15.7796 23.9258 17.2852C23.2829 18.7907 22.3918 20.1131 21.2524 21.2524C20.1131 22.3918 18.7907 23.2829 17.2852 23.9258C15.7796 24.5768 14.1683 24.9023 12.4512 24.9023ZM12.4512 22.8271C13.8835 22.8271 15.2262 22.5586 16.4795 22.0215C17.7327 21.4844 18.8354 20.7397 19.7876 19.7876C20.7397 18.8354 21.4844 17.7327 22.0215 16.4795C22.5586 15.2262 22.8271 13.8835 22.8271 12.4512C22.8271 11.0189 22.5586 9.67611 22.0215 8.42285C21.4844 7.16146 20.7397 6.05876 19.7876 5.11475C18.8354 4.1626 17.7327 3.41797 16.4795 2.88086C15.2262 2.34375 13.8835 2.0752 12.4512 2.0752C11.0189 2.0752 9.67611 2.34375 8.42285 2.88086C7.1696 3.41797 6.06689 4.1626 5.11475 5.11475C4.1626 6.05876 3.41797 7.16146 2.88086 8.42285C2.34375 9.67611 2.0752 11.0189 2.0752 12.4512C2.0752 13.8835 2.34375 15.2262 2.88086 16.4795C3.41797 17.7327 4.1626 18.8354 5.11475 19.7876C6.06689 20.7397 7.1696 21.4844 8.42285 22.0215C9.67611 22.5586 11.0189 22.8271 12.4512 22.8271ZM10.3149 19.2749C10.0627 19.2749 9.85107 19.1935 9.68018 19.0308C9.50928 18.868 9.42383 18.6646 9.42383 18.4204C9.42383 18.1763 9.50928 17.9728 9.68018 17.8101C9.85107 17.6473 10.0627 17.5659 10.3149 17.5659H11.8286V11.9629H10.5225C10.2702 11.9629 10.0586 11.8815 9.8877 11.7188C9.7168 11.556 9.63135 11.3525 9.63135 11.1084C9.63135 10.8643 9.7168 10.6608 9.8877 10.498C10.0586 10.3353 10.2702 10.2539 10.5225 10.2539H12.8174C13.1266 10.2539 13.3626 10.3556 13.5254 10.5591C13.6963 10.7625 13.7817 11.0107 13.7817 11.3037V17.5659H14.5874C14.8396 17.5659 15.0513 17.6473 15.2222 17.8101C15.3931 17.9728 15.4785 18.1763 15.4785 18.4204C15.4785 18.6646 15.3931 18.868 15.2222 19.0308C15.0513 19.1935 14.8396 19.2749 14.5874 19.2749H10.3149ZM12.4512 8.42285C12.0117 8.42285 11.6357 8.27637 11.3232 7.98339C11.0189 7.68229 10.8667 7.31445 10.8667 6.87988C10.8667 6.4209 11.0189 6.04492 11.3232 5.75195C11.6357 5.45898 12.0117 5.3125 12.4512 5.3125C12.8906 5.3125 13.2625 5.45898 13.5669 5.75195C13.8794 6.04492 14.0356 6.4209 14.0356 6.87988C14.0356 7.31445 13.8794 7.68229 13.5669 7.98339C13.2625 8.27637 12.8906 8.42285 12.4512 8.42285Z" fill="currentColor"/>
    </svg>
  );
}

// Loading spinner
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[400px]">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
    </div>
  );
}

// X logo path for View on X button
const xLogoPath = "M10.6862 7.6055L17.3844 0H15.8002L9.97941 6.60311L5.36277 0H0.178833L7.19548 9.9737L0.178833 17.9454H1.76308L7.90171 10.9761L12.7696 17.9454H17.9536L10.6858 7.6055H10.6862ZM8.7057 10.0639L7.99222 9.06869L2.33673 1.16544H4.60063L9.33802 7.5516L10.0515 8.54678L15.8011 16.8348H13.5372L8.7057 10.0643V10.0639Z";

// Horizontal divider line
function PopupLine() {
  return (
    <div className="h-px relative shrink-0 w-full">
      <div className="absolute bg-zinc-100 inset-0" />
    </div>
  );
}

// Tools Section component
function ToolsSection({ categories }: { categories: ToolCategory[] }) {
  if (!categories || categories.length === 0) return null;
  
  return (
    <>
      <PopupLine />
      <div className="font-['Michelle',sans-serif] font-normal gap-3 grid-cols-4 relative shrink-0 text-[15px] w-full mt-2 hidden md:grid">
        {categories.map((category, idx) => (
          <div key={idx} className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0">
            <p className="leading-5 text-sm relative shrink-0 text-[#9ca3af]">
              {category.label}
            </p>
            <div className="content-stretch flex flex-col items-start leading-[0] relative shrink-0 text-gray-700">
              {category.tools.map((tool, toolIdx) => (
                <div key={toolIdx} className="flex flex-col justify-center relative shrink-0">
                  <p className="leading-[21px] whitespace-nowrap">{tool}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="font-['Michelle',sans-serif] font-normal flex flex-col gap-1.5 relative shrink-0 text-sm w-full mt-2 md:hidden">
        {categories.map((category, idx) => (
          <div key={idx} className="flex items-baseline gap-6">
            <p className="leading-5 shrink-0 text-[#9ca3af] w-[72px]">
              {category.label}
            </p>
            <p className="leading-5 text-gray-700 tracking-[-0.31px]">
              {category.tools.join(', ')}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

export type ExperimentProject = {
  id: string;
  title: string;
  year: string;
  description: string;
  imageSrc: string;
  videoSrc?: string;
  xLink?: string;
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
      />
    </button>
  );
}

type ExperimentModalProps = {
  projectId: 'polaroid' | 'library' | 'screentime' | 'sketchbook';
  project: ExperimentProject;
  onClose: () => void;
  onExpandToFullscreen?: (bookSlug?: string) => void;
  onCollapseFromFullscreen?: () => void;
  onBookSlugChange?: (bookSlug?: string, options?: { replace?: boolean }) => void;
  bookSlug?: string;
  initialFullscreen?: boolean;
};

function ButtonTooltip({ children, label }: { children: React.ReactNode; label: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsEnding(false);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 800);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (isVisible) {
      setIsEnding(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsEnding(false);
      }, 125);
    }
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className="tooltip absolute left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-gray-800 text-white text-[13px] font-medium rounded-xl whitespace-nowrap pointer-events-none z-[9999]"
          data-ending-style={isEnding ? "" : undefined}
          style={{ top: 'calc(100% + 8px)', ['--transform-origin' as string]: 'center top' }}
        >
          {label}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%-6px)] w-2.5 h-2.5 bg-gray-800 rotate-45 rounded-tl-sm" />
        </div>
      )}
    </div>
  );
}

export default function ExperimentModal({ projectId, project, onClose, onExpandToFullscreen, onCollapseFromFullscreen, onBookSlugChange, bookSlug, initialFullscreen = false }: ExperimentModalProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const isFullscreen = initialFullscreen;

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
  const [contentScale, setContentScale] = useState(1);
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

  // Show scrollbar only when actively scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollContainer = container.querySelector('.modal-scroll-container');
    if (!scrollContainer) return;
    
    let scrollTimeout: ReturnType<typeof setTimeout>;
    
    const handleScroll = () => {
      scrollContainer.classList.add('is-scrolling');
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        scrollContainer.classList.remove('is-scrolling');
      }, 1000);
    };
    
    scrollContainer.addEventListener('scroll', handleScroll);
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

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
      default:
        return null;
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
            : "rounded-[26px] w-[calc(100%*10/12)] max-md:w-full h-[90vh]",
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
        {!isFullscreen && (
          <div className="absolute top-0 left-0 z-[60] pointer-events-none pl-6 pt-6">
            <div className="pointer-events-auto">
              <ButtonTooltip label="Expand">
                <button
                  onClick={handleExpand}
                  className="cursor-pointer transition-colors duration-200 hover:bg-gray-200/50 text-[#4b5563] rounded-xl to p-1.5"
                  aria-label="Expand to full page"
                >
                  <ExpandIcon />
                </button>
              </ButtonTooltip>
            </div>
          </div>
        )}

        {/* Info button fixed top right - only in popup mode (fullscreen uses embedded page's InfoButton) */}
        {!isFullscreen && (
          <div className={clsx(
            "absolute top-0 right-0 z-[60] pointer-events-none pr-7 pt-6"
          )}>
            <div className="pointer-events-auto relative" data-info-button-container>
              <ButtonTooltip label="Process">
                <button
                  onClick={() => setShowInfoModal(!showInfoModal)}
                  className={clsx(
                    "cursor-pointer transition-colors duration-200 text-[#9ca3af] rounded-full p-2 -m-1",
                    showInfoModal ? "bg-gray-200/50" : "hover:bg-gray-200/50"
                  )}
                  aria-label="Project info"
                  data-info-button
                >
                  <InfoIcon />
                </button>
              </ButtonTooltip>
              
              {/* Dropdown popover below button */}
              {showInfoModal && (
                <div className="absolute top-full right-0 mt-2 z-[70]">
                  <InfoPopover project={project} onClose={() => setShowInfoModal(false)} isFullscreen={false} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Embedded experiment content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-hidden transition-all duration-500 ease-out">
          <Suspense fallback={<LoadingSpinner />}>
            <div 
              className={clsx(
                "w-full h-full experiment-modal-embed modal-scroll-container relative transition-all duration-500 ease-out overflow-auto",
                isFullscreen && "fullscreen"
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
                className="h-full transition-all duration-500 ease-out"
                style={{ 
                  transformOrigin: 'top left',
                  transform: !isFullscreen && contentScale < 1 ? `scale(${contentScale})` : undefined,
                  width: !isFullscreen && contentScale < 1 ? `${100 / contentScale}%` : undefined,
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
    <div 
      ref={popoverRef}
      className={clsx(
        "bg-white flex flex-col shadow-xl border border-gray-100 overflow-hidden transition-all duration-200 ease-out animate-[popoverIn_150ms_ease-out]",
        isMobile ? "rounded-2xl w-full max-h-[85vh] overflow-auto" 
          : isFullscreen ? "rounded-3xl w-[50vw] max-w-[700px]" 
          : "rounded-2xl w-[420px] max-h-[70vh] overflow-auto"
      )}
    >
      {/* Content area with padding */}
      <div className={clsx(
        "content-stretch flex flex-col items-start relative shrink-0 w-full",
        isFullscreen ? "gap-4 px-8 pt-6 pb-8" : "gap-3 px-5 pt-4 pb-5"
      )}>
        {/* Title row with View on X link */}
        <div className="w-full flex flex-col gap-1">
          <div className="flex items-center justify-between w-full">
            {/* Title */}
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
              <p className="font-['Michelle',sans-serif] font-normal leading-normal relative shrink-0 text-lg text-black">
                {project.title}
              </p>
              <p className="font-['Michelle',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[#9ca3af] text-base">
                •
              </p>
              <p className="font-['Michelle',sans-serif] font-normal leading-normal relative shrink-0 text-[#9ca3af] text-lg">
                {project.year}
              </p>
            </div>

            {/* View on X button */}
            {project.xLink && (
              <a
                href={project.xLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex bg-blue-500 border border-blue-400 border-solid gap-1 items-center justify-center px-3 py-1 relative rounded-full shrink-0 cursor-pointer hover:bg-blue-400 hover:border-blue-300 transition-colors duration-200 ease-out"
              >
                <span className="font-['Manrope',sans-serif] font-semibold leading-normal relative shrink-0 text-sm text-white whitespace-nowrap">
                  View on
                </span>
                <svg 
                  className="block w-[12px] h-[12px] fill-white" 
                  viewBox="0 0 19 18"
                >
                  <path d={xLogoPath} />
                </svg>
                <span className="text-white text-sm">
                  <ArrowUpRight />
                </span>
              </a>
            )}
          </div>

          {/* Description - hidden in popup mode, shown in fullscreen */}
          {isFullscreen && (
            <div className="content-stretch flex gap-2 items-start relative w-full">
              <p className="font-['Michelle',sans-serif] font-normal leading-5 relative text-[#6b7280] text-base">
                {project.description}
              </p>
            </div>
          )}
        </div>

        {/* Tools Section */}
        {project.toolCategories && project.toolCategories.length > 0 && (
          <ToolsSectionCompact categories={project.toolCategories} isFullscreen={isFullscreen} />
        )}

        {/* Video/Image content area */}
        <div className={clsx(
          "relative border border-gray-100 border-solid w-full aspect-[1097/616] overflow-hidden bg-gray-100 shrink-0",
          isFullscreen ? "rounded-[16px] mt-3" : "rounded-[12px] mt-1"
        )}>
          <ShimmerImage
            alt=""
            className="absolute object-cover size-full"
            wrapperClassName="absolute inset-0"
            rounded={isFullscreen ? "rounded-[16px]" : "rounded-[12px]"}
            src={project.imageSrc}
          />
          {project.videoSrc && videoReady && (
            <ShimmerVideo
              key={project.id}
              src={project.videoSrc}
              className={clsx("absolute object-cover size-full", isFullscreen ? "rounded-[16px]" : "rounded-[12px]")}
              wrapperClassName="absolute inset-0"
              rounded={isFullscreen ? "rounded-[16px]" : "rounded-[12px]"}
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
  );
}

// Compact tools section for popover
function ToolsSectionCompact({ categories, isFullscreen = false }: { categories: ToolCategory[]; isFullscreen?: boolean }) {
  if (!categories || categories.length === 0) return null;
  
  return (
    <>
      <PopupLine />
      <div className={clsx(
        "font-['Michelle',sans-serif] font-normal grid grid-cols-4 relative shrink-0 w-full",
        isFullscreen ? "gap-3 text-[15px] mt-2" : "gap-2 text-sm mt-1"
      )}>
        {categories.map((category, idx) => (
          <div key={idx} className="content-stretch flex flex-col gap-1 items-start justify-start relative shrink-0">
            <p className={clsx("relative shrink-0 text-[#9ca3af]", isFullscreen ? "leading-5 text-sm" : "leading-4 text-sm")}>
              {category.label}
            </p>
            <div className={clsx(
              "content-stretch flex flex-col items-start leading-[0] relative shrink-0 text-gray-700",
              isFullscreen ? "gap-1" : "gap-0.5"
            )}>
              {category.tools.map((tool, toolIdx) => (
                <div key={toolIdx} className="flex flex-col justify-center relative shrink-0">
                  <p className={clsx("whitespace-nowrap", isFullscreen ? "leading-[21px]" : "leading-[18px]")}>{tool}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
