import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useNavigate } from '@/lib/navigation';
import ShimmerImage from '../shared/ShimmerImage';
import ShimmerVideo from '../shared/ShimmerVideo';
import { ArrowUpRight } from '../icons/ArrowUpRight';
import type { ToolCategory } from '../shared/InfoButton';
import { buttonClassName } from '../shared/Button';
import { HorizontalLine } from '../shared/HorizontalLine';
import Footer from '../layout/Footer';
import { Chevron } from '../icons/Chevron';

const MUX_ENV_KEY = 'e4cc19a78gcf0tbtfmu4m7ruf';
const xLogoPath = "M10.6862 7.6055L17.3844 0H15.8002L9.97941 6.60311L5.36277 0H0.178833L7.19548 9.9737L0.178833 17.9454H1.76308L7.90171 10.9761L12.7696 17.9454H17.9536L10.6858 7.6055H10.6862ZM8.7057 10.0639L7.99222 9.06869L2.33673 1.16544H4.60063L9.33802 7.5516L10.0515 8.54678L15.8011 16.8348H13.5372L8.7057 10.0643V10.0639Z";

const DESIGN_MEETUP_MEDIA_ASPECT = 'aspect-[3248/2160]';

export type ExperimentSiteProject = {
  id: string;
  title: string;
  year: string;
  description: React.ReactNode;
  imageSrc: string;
  videoSrc?: string;
  xLink?: string;
  tryItOutHref?: string;
  toolCategories?: ToolCategory[];
};

export function ToolsSection({ categories, large = false, noLine = false }: { categories: ToolCategory[]; large?: boolean; noLine?: boolean }) {
  if (!categories || categories.length === 0) return null;

  const grids = (
    <>
      <div className={clsx(
        "font-['Michelle',sans-serif] font-normal relative shrink-0 w-full hidden md:grid",
        large ? "flex gap-5 text-base grid-cols-4" : "gap-3 grid-cols-4 text-base"
      )}>
        {categories.map((category, idx) => (
          <div key={idx} className={clsx(
            "content-stretch flex flex-col items-start justify-start relative shrink-0",
            large ? "flex-[1_0_0] min-h-px min-w-px gap-3 leading-normal" : "gap-2"
          )}>
            <p className={clsx(
              "relative shrink-0 text-[#a1a1aa] font-normal",
              large ? "text-base" : "leading-normal text-sm"
            )}>
              {category.label}
            </p>
            <div className={clsx(
              "content-stretch flex flex-col items-start relative shrink-0",
              large ? "text-zinc-700 leading-normal" : "text-[#71717a]"
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
    </>
  );

  if (noLine) return grids;

  return (
    <div className={clsx("flex w-full flex-col gap-2", large && "md:gap-7")}>
      <HorizontalLine />
      {grids}
    </div>
  );
}

export function ViewOnXButton({ href, className }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClassName({
        variant: "primary",
        size: "sm",
        className: clsx("whitespace-nowrap", className),
      })}
    >
      <span className="font-['Michelle',sans-serif] font-medium leading-normal text-sm text-white whitespace-nowrap">
        View on
      </span>
      <svg className="block w-[12px] h-[12px] fill-white" viewBox="0 0 19 18">
        <path d={xLogoPath} />
      </svg>
      <span className="text-white inline-flex items-center">
        <ArrowUpRight size="12px" />
      </span>
    </a>
  );
}

export function VisitSiteButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClassName({
        variant: "primary",
        size: "sm",
        className: "whitespace-nowrap inline-flex items-center gap-1",
      })}
    >
      {label}
      <ArrowUpRight />
    </a>
  );
}

function Breadcrumb({ projectName, onWorkClick, isScrolled = false, isPastHero = false }: {
  projectName: string;
  onWorkClick?: () => void;
  isScrolled?: boolean;
  isPastHero?: boolean;
}) {
  return (
    <div className={clsx(
      "flex items-center transition-all duration-300 ease-out",
      isPastHero ? "opacity-0 pointer-events-none" : "opacity-100"
    )}>
      <button
        onClick={onWorkClick}
        className={clsx(
          "flex items-center justify-center py-0.5 rounded-md transition-all duration-300 ease-out hover:bg-[#f4f4f5]",
          isScrolled ? "opacity-0 pointer-events-none w-0 px-0 overflow-hidden" : "opacity-100 px-1.5 ml-2"
        )}
      >
        <span className="font-['Michelle:Medium',sans-serif] font-medium text-sm leading-normal text-[#52525b] whitespace-nowrap">
          Work
        </span>
      </button>

      <Chevron direction="right" className="size-4 shrink-0 text-zinc-500" />

      <div className="flex items-center justify-center px-1 py-0.5">
        <span className="font-['Michelle:Medium',sans-serif] font-medium text-sm leading-normal text-[#27272a]">
          {projectName}
        </span>
      </div>
    </div>
  );
}

function SiteMedia({ project, aspectClassName }: { project: ExperimentSiteProject; aspectClassName: string }) {
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVideoReady(true), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={clsx("relative w-full overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-100 shrink-0", aspectClassName)}>
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
          muxEnvKey={MUX_ENV_KEY}
        />
      ) : null}
    </div>
  );
}

export type ExperimentSiteEmbedProps = {
  project: ExperimentSiteProject;
  siteHref: string;
  siteLabel?: string;
  isFullscreen?: boolean;
  isScrolled?: boolean;
  isPastHero?: boolean;
  onCollapse?: () => void;
  /** Desktop header trailing actions. Default: Visit Site + optional View on X. */
  headerActions?: React.ReactNode;
  /** Actions under the description below md. Default: Visit Site + optional View on X. */
  compactActions?: React.ReactNode;
  /** Replaces the default logo + breadcrumb fullscreen header. Pass `null` to hide. */
  fullscreenHeader?: React.ReactNode | null;
};

export function ExperimentSiteEmbed({
  project,
  siteHref,
  siteLabel = 'Visit Site',
  isFullscreen = false,
  isScrolled = false,
  isPastHero = false,
  onCollapse,
  headerActions,
  compactActions,
  fullscreenHeader,
}: ExperimentSiteEmbedProps) {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (onCollapse) {
      onCollapse();
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleWorkClick = () => {
    navigate('/');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const defaultHeaderActions = (
    <>
      <VisitSiteButton href={siteHref} label={siteLabel} />
      {project.xLink ? <ViewOnXButton href={project.xLink} /> : null}
    </>
  );

  const defaultCompactActions = (
    <>
      {project.xLink ? <ViewOnXButton href={project.xLink} /> : null}
      <VisitSiteButton href={siteHref} label={siteLabel} />
    </>
  );

  const resolvedHeaderActions = headerActions ?? defaultHeaderActions;
  const resolvedCompactActions = compactActions ?? defaultCompactActions;

  const defaultFullscreenHeader = (
    <div
      className={clsx(
        "flex items-center w-full px-6 md:px-16 md:sticky md:top-0 z-30 transition-all duration-300 ease-out gap-1.5",
        isScrolled ? "py-4" : "py-8"
      )}
    >
      <button
        onClick={handleLogoClick}
        className={clsx(
          "overflow-clip relative shrink-0 cursor-pointer hover:opacity-80 transition-all duration-300 ease-out p-0 border-0 bg-transparent",
          isScrolled ? "size-7" : "size-8 md:size-[44px]"
        )}
        aria-label="Go back"
      >
        <img src="/logo.png" alt="Michelle Liu Logo" className="size-full object-contain" loading="eager" fetchPriority="high" decoding="async" />
      </button>

      <Breadcrumb
        projectName={project.title}
        onWorkClick={handleWorkClick}
        isScrolled={isScrolled}
        isPastHero={isPastHero}
      />
    </div>
  );

  const resolvedFullscreenHeader = fullscreenHeader === undefined ? defaultFullscreenHeader : fullscreenHeader;

  return (
    <>
    <div className={clsx(
      "font-['Michelle',sans-serif] w-full box-border flex flex-col text-[#18181b]",
      isFullscreen ? 'min-h-screen' : 'min-h-full px-6 pt-6 pb-8 md:px-[8%] md:py-32 xl:px-[175px]'
    )}>
      {isFullscreen && resolvedFullscreenHeader}
      <div className={clsx(
        "flex flex-col gap-3 md:gap-7 w-full",
        isFullscreen && 'max-w-4xl self-center pt-12 md:pt-16 pb-24 md:pb-32 px-6 md:px-16'
      )}>
        <header className="flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col min-w-0 md:gap-2">
              <div className="flex flex-wrap items-baseline gap-x-[6px] gap-y-1">
                <h1 className={clsx("font-normal", isFullscreen ? "text-xl" : "text-xl md:text-2xl")}>{project.title}</h1>
                <span className={clsx("text-[#a1a1aa] font-normal", isFullscreen ? "text-xl" : "text-xl md:text-2xl")}>•</span>
                <span className={clsx("text-[#a1a1aa] font-normal", isFullscreen ? "text-xl" : "text-xl md:text-2xl")}>{project.year}</span>
              </div>
              <p className="text-base leading-normal text-[#71717a] md:text-zinc-700">
                {project.description}
              </p>
            </div>
            <div className="hidden md:flex flex-wrap gap-2 shrink-0 items-center">
              {resolvedHeaderActions}
            </div>
          </div>
          <div className="flex md:hidden flex-wrap gap-0.5 mt-2">
            {resolvedCompactActions}
          </div>
        </header>
        {project.toolCategories && project.toolCategories.length > 0 ? (
          <ToolsSection categories={project.toolCategories} large />
        ) : null}
        <SiteMedia
          project={project}
          aspectClassName={clsx(
            project.id === 'design-meetup' ? DESIGN_MEETUP_MEDIA_ASPECT : 'aspect-video',
            'mt-2',
          )}
        />
      </div>
    </div>
    {isFullscreen && <Footer />}
    </>
  );
}

export type ExperimentSiteMobileEmbedProps = {
  project: ExperimentSiteProject;
  siteHref: string;
  siteLabel?: string;
  /** Actions below media. Default: Visit Site + optional View on X. */
  footerActions?: React.ReactNode;
};

export function ExperimentSiteMobileEmbed({
  project,
  siteHref,
  siteLabel = 'Visit Site',
  footerActions,
}: ExperimentSiteMobileEmbedProps) {
  const defaultFooterActions = (
    <>
      <VisitSiteButton href={siteHref} label={siteLabel} />
      {project.xLink ? (
        <ViewOnXButton href={project.xLink} className="relative self-start" />
      ) : null}
    </>
  );

  return (
    <div className="site-embed-mobile content-stretch flex flex-col gap-4 px-6 py-5 relative shrink-0 w-full">
      <div className="flex flex-col min-w-0 gap-0.5">
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
        <p className="font-['Michelle',sans-serif] font-normal leading-normal relative text-[#71717a] text-sm">
          {project.description}
        </p>
      </div>

      {project.toolCategories && project.toolCategories.length > 0 && (
        <div className="flex w-full flex-col gap-4">
          <HorizontalLine />
          <ToolsSection categories={project.toolCategories} noLine />
        </div>
      )}

      {project.imageSrc && (
        <SiteMedia
          project={project}
          aspectClassName={project.id === 'design-meetup' ? DESIGN_MEETUP_MEDIA_ASPECT : 'aspect-[1097/616]'}
        />
      )}

      <div className="flex flex-wrap gap-2 items-center justify-end py-1">
        {footerActions ?? defaultFooterActions}
      </div>
    </div>
  );
}
