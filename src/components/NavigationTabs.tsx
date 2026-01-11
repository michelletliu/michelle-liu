import { useNavigate } from "react-router-dom";
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
};

function TagBackgroundImageAndText({ text, active = false, onClick }: TagBackgroundImageAndTextProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "content-stretch flex items-center justify-center px-3.5 pt-[5px] pb-[4px] relative rounded-full shrink-0 cursor-pointer transition-all duration-100 ease-out border border-transparent",
        !active && "hover:bg-gray-200/40 hover:pt-[3px] hover:pb-[2px] hover:my-[2px]",
        active && "bg-gray-200/60 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_1px_rgba(0,0,0,0.02)] !border-white/50"
      )}
    >
      <p
        className={clsx(
          "font-['Figtree',sans-serif] font-medium leading-normal tracking-[0.005em] relative shrink-0 text-[1.07em] text-nowrap",
          active ? "text-[#4b5563]" : "text-[#9ca3af]"
        )}
      >
        {text}
      </p>
    </button>
  );
}

/**
 * Navigation tabs component - Work / Art / About
 * Used across all main pages for consistent navigation
 */
export default function NavigationTabs({ activeTab, heroAnimationPlayed = false }: NavigationTabsProps) {
  const navigate = useNavigate();

  return (
    <div className="content-stretch flex flex-col items-center pb-4 pt-0 px-0 relative shrink-0 w-full">
      <ScrollReveal variant="fade" delay={280} rootMargin="0px" className="relative shrink-0 w-full" disabled={heroAnimationPlayed}>
        <div className="size-full">
          <div className="content-stretch flex flex-col gap-3 items-start pb-0 pt-4 px-16 max-md:px-8 relative w-full">
            <div className="content-stretch flex gap-1 items-start relative shrink-0">
              <TagBackgroundImageAndText 
                text="Work" 
                active={activeTab === "work"}
                onClick={() => navigate("/")} 
              />
              <TagBackgroundImageAndText 
                text="Art" 
                active={activeTab === "art"}
                onClick={() => navigate("/art")} 
              />
              <TagBackgroundImageAndText 
                text="About" 
                active={activeTab === "about"}
                onClick={() => navigate("/about")} 
              />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Divider line */}
      <div className="px-16 max-md:px-8 w-full pt-3">
        <div className="bg-zinc-100 h-px shrink-0 w-full" />
      </div>
    </div>
  );
}
