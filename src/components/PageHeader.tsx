import React from "react";
import { useNavigate } from "@/lib/navigation";
import clsx from "clsx";
import { motion } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";
import imgFinalSealLogo1 from "../assets/logo.png";
import grainTexture from "../assets/Rectangle Grain 1.png";

type PageHeaderProps = {
  /** Which page is active - affects description content */
  variant: "work" | "art" | "about";
  /** Whether the hero animation has already played */
  heroAnimationPlayed?: boolean;
  /** Custom children to render in the description area */
  children?: React.ReactNode;
  /** Optional additional element (like the "b. 2004" for Art page) */
  nameAddon?: React.ReactNode;
};

function FinalSealLogoBackgroundImage({ additionalClassNames = "" }: { additionalClassNames?: string }) {
  return (
    <img
      alt="Michelle Liu Logo"
      className={clsx("object-contain pointer-events-none", additionalClassNames)}
      src={imgFinalSealLogo1}
    />
  );
}

/**
 * Blueprint / "work-in-progress" rendering of the seal — a gridded chip with
 * pin/crop marks. Revealed on logo hover as a hidden doorway into the design
 * system. Uses `currentColor`, so color is set via a text-* utility.
 */
function BlueprintSeal({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      className={clsx("pointer-events-none", className)}
      aria-hidden="true"
    >
      {/* Seal body */}
      <rect x="13" y="13" width="18" height="18" rx="2.5" />
      {/* Inner 3×3 grid — echoes the seal's character cells */}
      <line x1="19" y1="13" x2="19" y2="31" />
      <line x1="25" y1="13" x2="25" y2="31" />
      <line x1="13" y1="19" x2="31" y2="19" />
      <line x1="13" y1="25" x2="31" y2="25" />
      {/* Pin / crop marks — three per side */}
      <line x1="17" y1="9" x2="17" y2="13" />
      <line x1="22" y1="9" x2="22" y2="13" />
      <line x1="27" y1="9" x2="27" y2="13" />
      <line x1="17" y1="31" x2="17" y2="35" />
      <line x1="22" y1="31" x2="22" y2="35" />
      <line x1="27" y1="31" x2="27" y2="35" />
      <line x1="9" y1="17" x2="13" y2="17" />
      <line x1="9" y1="22" x2="13" y2="22" />
      <line x1="9" y1="27" x2="13" y2="27" />
      <line x1="31" y1="17" x2="35" y2="17" />
      <line x1="31" y1="22" x2="35" y2="22" />
      <line x1="31" y1="27" x2="35" y2="27" />
    </svg>
  );
}

export default function PageHeader({
  variant,
  children,
  nameAddon,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div
      className="content-stretch flex flex-col items-start relative shrink-0 w-full header-gradient"
      style={{ zIndex: 41 }}
    >
      {/* Grain texture overlay - sits on top of gradient but below content */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${grainTexture})`,
          backgroundRepeat: "repeat",
          backgroundSize: "auto",
          opacity: 0.8,
        }}
      />

      {/* Logo */}
      <div className="relative shrink-0 w-full" style={{ zIndex: 2 }}>
        <div className="size-full">
          <div className="content-stretch flex flex-col items-start px-16 pt-8 pb-8 max-md:px-6 max-md:pt-8 max-md:pb-4 relative w-full">
            <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
              {/* Logo doubles as a hidden doorway to the design system: on hover
                  the seal cross-fades into its gray blueprint form. */}
              <motion.button
                onClick={() => navigate("/design-system")}
                className="group relative shrink-0 size-8 md:size-11 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Open the design system"
              >
                <FinalSealLogoBackgroundImage additionalClassNames="absolute inset-0 size-full transition-opacity duration-300 ease-out group-hover:opacity-0" />
                <BlueprintSeal className="absolute inset-0 size-full text-zinc-400 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Text */}
      <div className="relative shrink-0 w-full" style={{ zIndex: 2 }}>
        <div className="size-full">
          <div className="content-stretch flex flex-col gap-4 items-start pb-6 pt-14 px-16 max-md:px-6 max-md:pt-20 max-md:pb-2 relative w-full max-md:h-[210px] md:h-[176px]">
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
              <ScrollReveal variant="fade" rootMargin="0px" disabled>
                {nameAddon ? (
                  <div className="flex gap-3 items-baseline w-full">
                    <p className="font-['Michelle',sans-serif] tracking-[0.0125em] font-medium leading-normal text-[#3f3f46] text-4xl max-md:text-4xl">
                      michelle liu
                    </p>
                    {nameAddon}
                  </div>
                ) : (
                  <p className="font-['Michelle',sans-serif] tracking-[0.0125em] font-medium leading-normal relative shrink-0 text-[#3f3f46] text-4xl w-full max-md:text-4xl">
                    michelle liu
                  </p>
                )}
              </ScrollReveal>
              {children && (
                <div
                  key={variant}
                  className="font-['Michelle',sans-serif] font-normal tracking-wide leading-6 max-md:leading-5.5 text-[#a1a1aa] text-lg max-md:text-base w-full max-md:max-w-86 whitespace-pre-wrap mt-1 max-md:mt-1"
                  style={{
                    animation: "projectCardEnter 360ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
                  }}
                >
                  {children}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
