import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from '@/lib/navigation';
import clsx from 'clsx';
import { useScrollLock } from '../../utils/useScrollLock';
import ShimmerImage from '../shared/ShimmerImage';
import ShimmerVideo from '../shared/ShimmerVideo';
import { ArrowUpRight } from '../icons/ArrowUpRight';
import { LinkIcon } from '../icons/LinkIcon';
import { ICON_STROKE_WIDTH } from '../shared/iconSizes';
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
  ToolsSection,
  ViewOnXButton,
} from './ExperimentSiteEmbed';

// Lazy per experiment — don't download all five pages when this modal chunk loads.
const PolaroidPage = lazy(() => import('../polaroid/PolaroidPage'));
const LibraryPage = lazy(() => import('../library/LibraryPage'));
const ScreentimePage = lazy(() => import('../screentime/ScreentimePage'));
const SketchbookPage = lazy(() => import('../sketchbook/SketchbookPage'));
const FilmPage = lazy(() => import('../film/FilmPage'));

// Expand icon SVG - matches src/assets/Expand.svg (used by main project modals)
function ExpandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 4H4V10" stroke="currentColor" strokeWidth={ICON_STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
      <path d="M4 4L10 10" stroke="currentColor" strokeWidth={ICON_STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
      <path d="M14 20H20V14" stroke="currentColor" strokeWidth={ICON_STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
      <path d="M20 20L14 14" stroke="currentColor" strokeWidth={ICON_STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
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

// Loading — DS film-dot ellipsis (shared LoadingSpinner)
function ExperimentLoading() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[400px]">
      <LoadingSpinner size="md" label="Loading" />
    </div>
  );
}

// X logo path for View on X button
const xLogoPath = "M10.6862 7.6055L17.3844 0H15.8002L9.97941 6.60311L5.36277 0H0.178833L7.19548 9.9737L0.178833 17.9454H1.76308L7.90171 10.9761L12.7696 17.9454H17.9536L10.6858 7.6055H10.6862ZM8.7057 10.0639L7.99222 9.06869L2.33673 1.16544H4.60063L9.33802 7.5516L10.0515 8.54678L15.8011 16.8348H13.5372L8.7057 10.0643V10.0639Z";

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

function SundaysRsvpIconLink() {
  return (
    <Tooltip label="sundays.rsvp" position="bottom">
      <a
        href={SUNDAYS_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center justify-center p-1 rounded-full shrink-0 cursor-pointer text-zinc-400 hover:text-blue-500 transition-colors duration-200 ease-out"
      >
        <svg className="w-[18px] h-[18px] fill-current text-zinc-400 group-hover:text-blue-500 transition-colors duration-200" viewBox="0 0 311 312" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path className="text-zinc-400" fill="currentColor" d="M157.178 95.3252C166.553 96.9853 174.365 99.4267 180.615 102.649C186.865 105.774 192.285 109.681 196.875 114.368C208.789 126.185 216.699 139.222 220.605 153.479C224.512 167.64 224.463 181.8 220.459 195.96C216.553 210.12 208.74 223.06 197.021 234.778L146.924 285.022C135.303 296.644 122.412 304.407 108.252 308.313C94.0918 312.317 79.8828 312.366 65.625 308.46C51.4648 304.554 38.4277 296.644 26.5137 284.729C14.6973 272.913 6.83594 259.925 2.92969 245.765C-0.976562 231.507 -0.976562 217.298 2.92969 203.138C6.93359 188.978 14.7461 176.038 26.3672 164.319L69.4336 121.399C68.6523 126.185 68.5059 131.214 68.9941 136.487C69.5801 141.663 70.8984 146.546 72.9492 151.136L44.2383 179.847C35.7422 188.343 30.0781 197.718 27.2461 207.972C24.4141 218.226 24.4141 228.528 27.2461 238.88C30.0781 249.134 35.7422 258.558 44.2383 267.151C52.7344 275.647 62.1094 281.263 72.3633 283.997C82.7148 286.829 93.0176 286.829 103.271 283.997C113.525 281.165 122.9 275.501 131.396 267.005L179.297 219.251C187.793 210.755 193.408 201.38 196.143 191.126C198.975 180.872 198.975 170.618 196.143 160.364C193.311 150.013 187.646 140.54 179.15 131.946C174.365 127.161 168.652 123.353 162.012 120.52C155.469 117.688 147.363 115.882 137.695 115.101L157.178 95.3252ZM153.516 216.028C144.141 214.368 136.328 211.976 130.078 208.851C123.828 205.628 118.408 201.673 113.818 196.985C101.904 185.169 93.9941 172.181 90.0879 158.02C86.1816 143.763 86.1816 129.554 90.0879 115.394C94.0918 101.233 101.953 88.2939 113.672 76.5752L163.623 26.4775C175.342 14.7588 188.281 6.94625 202.441 3.04C216.602 -0.963903 230.762 -1.01273 244.922 2.89352C259.18 6.79977 272.266 14.7099 284.18 26.624C295.996 38.4404 303.857 51.4775 307.764 65.7353C311.67 79.8955 311.621 94.0556 307.617 108.216C303.711 122.376 295.947 135.315 284.326 147.034L241.26 189.954C242.041 185.169 242.139 180.188 241.553 175.013C241.064 169.837 239.795 164.905 237.744 160.218L266.455 131.507C274.951 123.011 280.615 113.636 283.447 103.382C286.279 93.1279 286.279 82.8252 283.447 72.4736C280.615 62.2197 274.951 52.8447 266.455 44.3486C257.959 35.7549 248.584 30.0908 238.33 27.2588C228.076 24.4268 217.773 24.4268 207.422 27.2588C197.168 30.0908 187.793 35.7549 179.297 44.251L131.396 92.1025C122.9 100.599 117.236 109.974 114.404 120.228C111.572 130.482 111.572 140.784 114.404 151.136C117.236 161.39 122.9 170.813 131.396 179.407C136.182 184.192 141.943 188.001 148.682 190.833C155.42 193.665 160.547 195.374 164.062 195.96L153.516 216.028Z" />
        </svg>
      </a>
    </Tooltip>
  );
}

function SundaysRsvpTextLink() {
  return (
    <a
      href={SUNDAYS_HREF}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex gap-1 items-center justify-center px-3 py-1 rounded-full shrink-0 cursor-pointer transition-colors duration-200 ease-out"
    >
      <span className="font-['Michelle',sans-serif] font-medium leading-normal text-sm text-zinc-500 group-hover:text-blue-500 whitespace-nowrap">
        sundays.rsvp
      </span>
      <span className="text-zinc-500 group-hover:text-blue-500 inline-flex items-center">
        <ArrowUpRight size="12px" />
      </span>
    </a>
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
          <SundaysRsvpIconLink />
          {project.xLink ? <ViewOnXButton href={project.xLink} /> : null}
        </>
      }
      compactActions={
        <>
          {project.xLink ? <ViewOnXButton href={project.xLink} /> : null}
          <SundaysRsvpTextLink />
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
          <SundaysRsvpTextLink />
          {project.xLink ? (
            <ViewOnXButton href={project.xLink} className="relative self-start" />
          ) : null}
        </>
      }
    />
  );
}

function DesignMeetupSiteIconLink() {
  return (
    <Tooltip label="designmeetup.info" position="bottom">
      <a
        href={DESIGN_MEETUP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center justify-center p-1 rounded-full shrink-0 cursor-pointer text-zinc-400 hover:text-blue-500 transition-colors duration-200 ease-out"
        aria-label="designmeetup.info"
      >
        <LinkIcon size="18px" className="text-zinc-400 group-hover:text-blue-500 transition-colors duration-200" />
      </a>
    </Tooltip>
  );
}

function DesignMeetupSiteTextLink() {
  return (
    <a
      href={DESIGN_MEETUP_HREF}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex gap-1 items-center justify-center px-3 py-1 rounded-full shrink-0 cursor-pointer transition-colors duration-200 ease-out"
    >
      <span className="font-['Michelle',sans-serif] font-medium leading-normal text-sm text-zinc-500 group-hover:text-blue-500 whitespace-nowrap">
        designmeetup.info
      </span>
      <span className="text-zinc-500 group-hover:text-blue-500 inline-flex items-center">
        <ArrowUpRight size="12px" />
      </span>
    </a>
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
          <DesignMeetupSiteIconLink />
          {project.xLink ? <ViewOnXButton href={project.xLink} /> : null}
        </>
      }
      compactActions={
        <>
          {project.xLink ? <ViewOnXButton href={project.xLink} /> : null}
          <DesignMeetupSiteTextLink />
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
          <DesignMeetupSiteTextLink />
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
                  <ExpandIcon />
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
                  <InfoIcon />
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

          {/* View on X button */}
          {project.xLink && (
            <a
              href={project.xLink}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClassName({
                variant: "primary",
                size: "sm",
                className: "relative whitespace-nowrap",
              })}
            >
              <span className="font-['Michelle',sans-serif] font-medium leading-normal relative shrink-0 text-sm text-white whitespace-nowrap">
                View on
              </span>
              <svg
                className="block w-[12px] h-[12px] fill-white"
                viewBox="0 0 19 18"
              >
                <path d={xLogoPath} />
              </svg>
              <span className="text-white text-sm inline-flex items-center">
                <ArrowUpRight size="12px" />
              </span>
            </a>
          )}
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
