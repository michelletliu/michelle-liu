import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useNavigate } from "@/lib/navigation";
import clsx from "clsx";
import { ScrollReveal } from "./ScrollReveal";

type NavigationTab = "work" | "art" | "about";

type NavigationTabsProps = {
  activeTab: NavigationTab;
  heroAnimationPlayed?: boolean;
};

type TagBackgroundImageAndTextProps = {
  text: string;
  active?: boolean;
  onClick?: () => void;
  onPrefetch?: () => void;
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

const TagBackgroundImageAndText = forwardRef<HTMLButtonElement, TagBackgroundImageAndTextProps>(
  function TagBackgroundImageAndText({ text, active = false, onClick, onPrefetch }, ref) {
    return (
      <button
        ref={ref}
        onClick={onClick}
        onMouseEnter={onPrefetch}
        onFocus={onPrefetch}
        onTouchStart={onPrefetch}
        className={clsx(
          "content-stretch group z-10 flex items-center justify-center px-3.5 pt-[5px] pb-[4px] relative rounded-full shrink-0 cursor-pointer border border-transparent",
        )}
      >
        <p
          className={clsx(
            "font-['Michelle',sans-serif] font-medium leading-normal tracking-[0.005em] relative z-10 shrink-0 text-[1.07em] text-nowrap transition-colors duration-200 ease-out",
            active ? "text-[#4b5563]" : "text-[#9ca3af] group-hover:text-[#4b5563]"
          )}
        >
          {text}
        </p>
      </button>
    );
  },
);

/**
 * Navigation tabs component - Work / Art / About
 * Used across all main pages for consistent navigation
 */
export default function NavigationTabs({ activeTab }: NavigationTabsProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const prefetchedRef = useRef<Set<string>>(new Set());

  const prefetchTab = useCallback(
    (href: string) => {
      if (prefetchedRef.current.has(href)) return;
      prefetchedRef.current.add(href);
      router.prefetch(href);
    },
    [router],
  );

  // Warm up the other two tab routes shortly after mount so the first click is instant
  useEffect(() => {
    const timeout = setTimeout(() => {
      NAVIGATION_TABS.forEach((tab) => {
        if (tab.id !== activeTab) prefetchTab(tab.href);
      });
    }, 800);
    return () => clearTimeout(timeout);
  }, [activeTab, prefetchTab]);

  const [displayedActiveTab, setDisplayedActiveTab] = useState(activeTab);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<NavigationTab, HTMLButtonElement | null>>({
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

  useLayoutEffect(() => {
    sessionStorage.removeItem("navigationPreviousTab");
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

  const handleTabClick = (tab: NavigationTabItem) => {
    if (tab.id === displayedActiveTab) return;

    // Optimistically move the indicator so the click feels instant,
    // even if the new route takes a moment to render.
    setDisplayedActiveTab(tab.id);
    navigate(tab.href);
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
                  "absolute left-0 top-0 z-0 rounded-full border border-white/50 bg-gray-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(0,0,0,0.02)] md:backdrop-blur-md motion-reduce:transition-none",
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
                  active={displayedActiveTab === tab.id}
                  onClick={() => handleTabClick(tab)}
                  onPrefetch={() => prefetchTab(tab.href)}
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
