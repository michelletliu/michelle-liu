import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ShimmerImage from './ShimmerImage';
import ShimmerVideo from './ShimmerVideo';
import { ArrowUpRight } from '../icons/ArrowUpRight';
import { Info } from '../icons/Info';
import { XLogo } from '../icons/XLogo';
import { buttonClassName } from './Button';
import { HorizontalLine } from './HorizontalLine';
import { useScrollLock } from '../../utils/useScrollLock';
import { ghostIconButtonClass } from './ghostIconButton';

// Tool category type for the tools section
export type ToolCategory = {
  label: string;
  tools: string[];
};

export type ProjectInfo = {
  id: string;
  title: string;
  year: string;
  description: React.ReactNode;
  imageSrc: string;
  videoSrc?: string;
  xLink?: string;
  tryItOutHref: string;
  toolCategories?: ToolCategory[];
};

// Tools Section — line is nested so parent flex gap doesn't read as py on the rule
function ToolsSection({ categories }: { categories: ToolCategory[] }) {
  if (!categories || categories.length === 0) return null;
  
  return (
    <div className="flex w-full flex-col gap-4 max-md:mt-1">
      <HorizontalLine />
      <div className="font-['Michelle',sans-serif] font-normal gap-3 grid-cols-4 relative shrink-0 text-base w-full hidden md:grid">
        {categories.map((category, idx) => (
          <div key={idx} className="content-stretch flex flex-col gap-2 items-start justify-start relative shrink-0">
            <p className="leading-normal text-sm relative shrink-0 text-[#a1a1aa]">
              {category.label}
            </p>
            <div className="content-stretch flex flex-col items-start relative shrink-0 text-[#71717a]">
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
            <p className="leading-normal text-[#71717a] tracking-[0.005em]">
              {category.tools.join(', ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

type InfoButtonProps = {
  project: ProjectInfo;
};

export default function InfoButton({ project }: InfoButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // Preload HLS manifest + thumbnail so the video is warm when modal opens
  useEffect(() => {
    if (!project.videoSrc) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'fetch';
    link.crossOrigin = 'anonymous';
    link.href = project.videoSrc;
    document.head.appendChild(link);

    if (project.imageSrc) {
      const imgLink = document.createElement('link');
      imgLink.rel = 'preload';
      imgLink.as = 'image';
      imgLink.href = project.imageSrc;
      document.head.appendChild(imgLink);
      return () => {
        document.head.removeChild(link);
        document.head.removeChild(imgLink);
      };
    }
    return () => {
      document.head.removeChild(link);
    };
  }, [project.videoSrc, project.imageSrc]);

  // Lock body scroll when modal is open (flicker-free implementation)
  useScrollLock(showModal);

  // Handle modal open animation
  useEffect(() => {
    if (showModal) {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
      const timer = setTimeout(() => {
        setVideoReady(true);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setVideoReady(false);
    }
  }, [showModal]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!showModal) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const handleOpen = () => {
    setShowModal(true);
    setIsClosing(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
    }, 300);
  };

  return (
    <>
      {/* Info Button - fixed top right. Wrapper height mirrors the logo's box
          (32px mobile / 44px desktop) so the glyph centers with the seal, and
          the negative margin cancels the 10px the 40px hit area adds around the
          20px glyph so the glyph itself sits on the gutter. */}
      <div className="fixed top-8 right-8 z-50 flex h-8 items-center md:right-16 md:h-11">
        <button
          onClick={handleOpen}
          className={ghostIconButtonClass("md", "-mr-2.5 text-zinc-400")}
          aria-label="Project info"
        >
          <Info size="20px" />
        </button>
      </div>

      {/* Modal - portal to escape transformed containers on /full pages */}
      {showModal && createPortal(
        <div data-info-modal className="fixed inset-0 z-[100] flex items-center justify-center px-8">
          {/* Overlay */}
          <div 
            className={`absolute inset-0 bg-zinc-900/20 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
            onClick={handleClose} 
          />
          
          {/* Modal Content */}
          <div 
            className={`relative bg-white rounded-3xl flex flex-col w-[calc(100%*6/12)] max-md:w-[95%] transition-all duration-300 ease-out ${
              isVisible 
                ? 'opacity-100 translate-y-0' 
                : isClosing 
                  ? 'opacity-0 translate-y-4' 
                  : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Content area with padding */}
            {/* Content area with padding */}
            <div className="content-stretch flex flex-col max-md:gap-3 gap-4 items-start px-8 max-md:px-6 pt-6 pb-8 max-md:py-5 relative shrink-0 w-full">
              {/* Header: title+description grouped in one div on the left,
                  View on X button (desktop only) as a sibling div top-aligned to the right */}
              <div className="w-full flex items-start justify-between gap-3">
                {/* Left column: title row and description stacked */}
                <div className="flex flex-col min-w-0 gap-1">
                  {/* Title row */}
                  <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                    <p className="font-['Michelle',sans-serif] font-normal leading-normal relative shrink-0 text-base text-zinc-900">
                      {project.title}
                    </p>
                    <p className="font-['Michelle',sans-serif] font-medium leading-snug relative shrink-0 text-[#a1a1aa] text-base">
                      •
                    </p>
                    <p className="font-['Michelle',sans-serif] font-normal leading-normal relative shrink-0 text-[#a1a1aa] text-base">
                      {project.year}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="font-['Michelle',sans-serif] font-normal leading-normal relative text-[#71717a] max-md:text-sm md:text-base">
                    {project.description}
                  </p>
                </div>

                {/* View on X button - desktop only, top-aligned with title row */}
                {project.xLink && (
                  <a
                    href={project.xLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClassName({
                      variant: "primary",
                      size: "sm",
                      className: "hidden md:flex relative whitespace-nowrap",
                    })}
                  >
                    <span className="leading-normal relative shrink-0 whitespace-nowrap">
                      View on
                    </span>
                    <XLogo size="12px" className="text-white" />
                    <span className="inline-flex items-center text-white">
                      <ArrowUpRight size="12px" />
                    </span>
                  </a>
                )}
              </div>

              {/* Tools Section */}
              {project.toolCategories && project.toolCategories.length > 0 && (
                <ToolsSection categories={project.toolCategories} />
              )}

              {/* Video/Image content area */}
              {project.imageSrc && (
              <div className="relative rounded-2xl border border-zinc-100 border-solid w-full aspect-[1097/616] overflow-hidden bg-zinc-100 shrink-0 mt-3">
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
              )}

              {/* View on X button - below media (mobile only), right-aligned */}
              {project.xLink && (
                <a
                  href={project.xLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClassName({
                    variant: "primary",
                    size: "sm",
                    className: "relative mt-2 self-end whitespace-nowrap md:hidden",
                  })}
                >
                  <span className="leading-normal relative shrink-0 whitespace-nowrap">
                    View on
                  </span>
                  <XLogo size="12px" className="text-white" />
                  <span className="inline-flex items-center text-white">
                    <ArrowUpRight size="12px" />
                  </span>
                </a>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
