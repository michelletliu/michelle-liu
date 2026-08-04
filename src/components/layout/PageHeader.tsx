import React from "react";
import { ScrollReveal } from "../shared/ScrollReveal";
import DesignSystemLogoLink from "./DesignSystemLogoLink";
import grainTexture from "../../assets/Rectangle Grain 1.png";

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

export default function PageHeader({
  variant,
  children,
  nameAddon,
}: PageHeaderProps) {
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
              {/* Logo doorway: mount + hover prefetch /design-system and warm heavy sections. */}
              <DesignSystemLogoLink />
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
                  className="font-['Michelle',sans-serif] font-normal tracking-wide leading-normal text-[#a1a1aa] text-lg max-md:text-base w-full max-md:max-w-86 whitespace-pre-wrap mt-1 max-md:mt-1"
                  style={{
                    animation:
                      "projectCardEnter 360ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
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
