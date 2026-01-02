import React from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
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

export default function PageHeader({
  variant,
  heroAnimationPlayed = false,
  children,
  nameAddon,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const isHomePage = variant === "work";

  return (
    <div
      className={clsx(
        "content-stretch flex flex-col items-start relative shrink-0 w-full",
        variant === "work" && "header-gradient"
      )}
      style={
        variant !== "work"
          ? {
              backgroundImage:
                "linear-gradient(16deg, rgba(255, 255, 255, 1) 60%, rgba(243, 218, 255, 1) 81%, rgba(192, 221, 254, 1) 98%, rgba(154, 226, 244, 1) 100%)",
            }
          : undefined
      }
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
          <div className="content-stretch flex flex-col items-start px-16 pt-8 pb-8 max-md:px-8 max-md:pt-8 max-md:pb-4 relative w-full">
            <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
              {isHomePage ? (
                <div className="relative shrink-0 size-11">
                  <FinalSealLogoBackgroundImage additionalClassNames="size-full" />
                </div>
              ) : (
                <button
                  onClick={() => navigate("/")}
                  className="relative shrink-0 size-11 cursor-pointer"
                >
                  <FinalSealLogoBackgroundImage additionalClassNames="size-full" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Text */}
      <div className="relative shrink-0 w-full" style={{ zIndex: 2 }}>
        <div className="size-full">
          <div className="content-stretch flex flex-col gap-4 items-start pb-6 pt-14 px-16 max-md:px-8 relative w-full">
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
              <ScrollReveal variant="fade" rootMargin="0px" disabled={heroAnimationPlayed}>
                {nameAddon ? (
                  <div className="flex gap-4 items-baseline w-full max-md:flex-col max-md:gap-0 max-md:items-start">
                    <p className="font-['Figtree',sans-serif] font-medium leading-normal text-[#374151] text-5xl max-md:text-4xl">
                      michelle liu
                    </p>
                    {nameAddon}
                  </div>
                ) : (
                  <p className="font-['Figtree',sans-serif] font-medium leading-normal relative shrink-0 text-[#374151] text-5xl w-full max-md:text-4xl">
                    michelle liu
                  </p>
                )}
              </ScrollReveal>
              {children && (
                <ScrollReveal variant="fade" delay={150} rootMargin="0px">
                  {children}
                </ScrollReveal>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
