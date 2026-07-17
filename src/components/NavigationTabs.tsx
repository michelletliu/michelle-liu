import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ScrollReveal } from "./ScrollReveal";
import { preloadArtPage, preloadAboutPage, preloadWorkPage } from "../sanity/preload";
import { warmWorkPage } from "./doorwayWarm";

type NavigationTab = "work" | "art" | "about";

type NavigationTabsProps = {
  activeTab: NavigationTab;
  heroAnimationPlayed?: boolean;
};

type TagBackgroundImageAndTextProps = {
  text: string;
  href: string;
  active?: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  onPrefetch?: () => void;
  /** Render an SSR-visible static pill behind the text until the floating
   *  indicator has measured itself. Prevents a flash of unstyled active
   *  tab on first load. */
  showStaticPill?: boolean;
};

type NavigationTabItem = {
  id: NavigationTab;
  text: string;
  href: string;
};

const NAVIGATION_TABS: NavigationTabItem[] = [
  { id: "work", text: "Work", href: "/" },
  { id: "art", text: "Art", href: "/art" },
  { id: "about", text: "About", href: "/about" },
];

const TagBackgroundImageAndText = forwardRef<HTMLAnchorElement, TagBackgroundImageAndTextProps>(
  function TagBackgroundImageAndText(
    { text, href, active = false, onClick, onPrefetch, showStaticPill = false },
    ref,
  ) {
    return (
      <Link
        ref={ref}
        href={href}
        scroll={false}
        prefetch={false}
        onClick={onClick}
        onMouseEnter={onPrefetch}
        onFocus={onPrefetch}
        onTouchStart={onPrefetch}
        className={clsx(
          "content-stretch group z-10 flex items-center justify-center px-3.5 pt-[5px] pb-[4px] relative rounded-full shrink-0 cursor-pointer border border-transparent",
        )}
      >
        {showStaticPill && (
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 rounded-full border border-white/50 bg-zinc-200/60 shadow-glass md:backdrop-blur-md"
          />
        )}
        <p
          className={clsx(
            "font-['Michelle',sans-serif] font-medium leading-normal tracking-[0.005em] relative z-10 shrink-0 text-lg text-nowrap transition-colors duration-200 ease-out",
            active ? "text-[#52525b]" : "text-[#a1a1aa] group-hover:text-[#52525b]"
          )}
        >
          {text}
        </p>
      </Link>
    );
  },
);

/**
 * Navigation tabs component - Work / Art / About
 * Used across all main pages for consistent navigation
 */
export default function NavigationTabs({ activeTab }: NavigationTabsProps) {
  const router = useRouter();
  const prefetchedRef = useRef<Set<string>>(new Set());

  const prefetchTab = useCallback(
    (href: string) => {
      // In dev, prefetches trigger expensive webpack route compiles and can
      // block the route the user actually clicks. Production serves built
      // chunks, so intent-based warming remains useful there.
      if (process.env.NODE_ENV === "development") return;

      // Sanity data + page modules can be warmed repeatedly (no-ops when
      // cached). Route RSC prefetch is deduped so we don't hammer the router.
      // Module imports are what make tab switches feel instant — router.prefetch
      // alone still leaves a cold client chunk on first click.
      if (href === "/art") {
        void preloadArtPage();
        void import("./art/ArtPage");
      } else if (href === "/about") {
        void preloadAboutPage();
        void import("./about/AboutPage");
        // Warm below-fold About chunks so first paint isn't waiting on them.
        void import("./about/CommunityCard");
        void import("./about/ShelfSection");
        void import("./about/LoreCard");
        void import("./about/MediaCard");
      } else if (href === "/") {
        warmWorkPage();
        void preloadWorkPage();
      }

      // Prefetch RSC + route layout chunk every time we warm — Next may drop
      // an earlier partial prefetch, and Art → Work needs app/(home)/layout.js.
      router.prefetch(href);

      if (prefetchedRef.current.has(href)) return;
      prefetchedRef.current.add(href);
    },
    [router],
  );

  const [displayedActiveTab, setDisplayedActiveTab] = useState(activeTab);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<NavigationTab, HTMLAnchorElement | null>>({
    work: null,
    art: null,
    about: null,
  });
  const indicatorReadyRef = useRef(false);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    height: 0,
    top: 0,
    opacity: 0,
  });
  const [indicatorReady, setIndicatorReady] = useState(false);

  // Sync when the route's active tab prop changes (e.g. back/forward).
  useLayoutEffect(() => {
    setDisplayedActiveTab(activeTab);
  }, [activeTab]);

  const updateIndicator = useCallback(() => {
    const container = containerRef.current;
    const activeButton = tabRefs.current[displayedActiveTab];

    if (!container || !activeButton) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeButton.getBoundingClientRect();
    const nextStyle = {
      left: activeRect.left - containerRect.left,
      width: activeRect.width,
      height: activeRect.height,
      top: activeRect.top - containerRect.top,
      opacity: 1,
    };

    setIndicatorStyle((currentStyle) => {
      if (
        currentStyle.left === nextStyle.left &&
        currentStyle.width === nextStyle.width &&
        currentStyle.height === nextStyle.height &&
        currentStyle.top === nextStyle.top &&
        currentStyle.opacity === nextStyle.opacity
      ) {
        return currentStyle;
      }

      return nextStyle;
    });

    if (!indicatorReadyRef.current) {
      requestAnimationFrame(() => {
        indicatorReadyRef.current = true;
        setIndicatorReady(true);
      });
    }
  }, [displayedActiveTab]);

  useLayoutEffect(() => {
    updateIndicator();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateIndicator);

    if (containerRef.current) observer.observe(containerRef.current);
    NAVIGATION_TABS.forEach((tab) => {
      const element = tabRefs.current[tab.id];
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [updateIndicator]);

  const handleTabClick = (event: MouseEvent<HTMLAnchorElement>, tab: NavigationTabItem) => {
    if (tab.id === displayedActiveTab) {
      event.preventDefault();
      return;
    }

    // Optimistic pill slide on this still-mounted instance. Navigation is
    // handled by the Link itself (immediate) — a delayed router.push used to
    // wait for the 300ms CSS transition, but that left the optimistic active
    // state stuck when soft navigation from the timeout never completed.
    setDisplayedActiveTab(tab.id);
  };

  return (
    <div className="content-stretch flex flex-col items-center pb-4 max-md:pb-1.75 pt-0 px-0 relative shrink-0 w-full">
      <ScrollReveal variant="fade" delay={280} rootMargin="0px" className="relative shrink-0 w-full" disabled>
        <div className="size-full">
          <div className="content-stretch flex flex-col gap-3 items-start pb-0 pt-4 px-16 max-md:px-6 relative w-full">
            <div ref={containerRef} className="content-stretch flex gap-1 items-start relative shrink-0">
              <div
                aria-hidden="true"
                className={clsx(
                  "pointer-events-none absolute left-0 top-0 z-0 rounded-full border border-white/50 bg-zinc-200/60 shadow-glass md:backdrop-blur-md motion-reduce:transition-none",
                  indicatorReady && "transition-[transform,width,opacity] duration-300 ease-out",
                )}
                style={{
                  opacity: indicatorStyle.opacity,
                  transform: `translate3d(${indicatorStyle.left}px, ${indicatorStyle.top}px, 0)`,
                  width: indicatorStyle.width,
                  height: indicatorStyle.height,
                }}
              />

              {NAVIGATION_TABS.map((tab) => (
                <TagBackgroundImageAndText
                  key={tab.id}
                  ref={(element) => {
                    tabRefs.current[tab.id] = element;
                  }}
                  text={tab.text}
                  href={tab.href}
                  active={displayedActiveTab === tab.id}
                  onClick={(event) => handleTabClick(event, tab)}
                  onPrefetch={() => prefetchTab(tab.href)}
                  showStaticPill={displayedActiveTab === tab.id && !indicatorReady}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Divider line */}
      <div className="px-16 max-md:px-6 w-full pt-3">
        <div className="bg-zinc-100 h-px shrink-0 w-full" />
      </div>
    </div>
  );
}
