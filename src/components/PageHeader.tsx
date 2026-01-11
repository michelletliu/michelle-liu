import React from "react";
import { useNavigate } from "react-router-dom";
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
      className="content-stretch flex flex-col items-start relative shrink-0 w-full header-gradient"
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
                <motion.div 
                  className="relative shrink-0 size-11"
                  initial={heroAnimationPlayed ? false : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <FinalSealLogoBackgroundImage additionalClassNames="size-full" />
                </motion.div>
              ) : (
                <motion.button
                  onClick={() => navigate("/")}
                  className="relative shrink-0 size-11 cursor-pointer"
                  initial={heroAnimationPlayed ? false : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FinalSealLogoBackgroundImage additionalClassNames="size-full" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Text */}
      <div className="relative shrink-0 w-full" style={{ zIndex: 2 }}>
        <div className="size-full">
          <div className="content-stretch flex flex-col gap-4 items-start pb-6 pt-14 px-16 max-md:px-8 max-md:pt-20 max-md:pb-2 relative w-full max-md:h-[210px]">
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
              <ScrollReveal variant="fade" rootMargin="0px" disabled={heroAnimationPlayed}>
                {nameAddon ? (
                  <div className="flex gap-3 items-baseline w-full">
                    <p className="font-['Figtree',sans-serif] font-medium leading-normal text-[#374151] text-4xl max-md:text-4xl">
                      michelle liu
                    </p>
                    {nameAddon}
                  </div>
                ) : (
                  <p className="font-['Figtree',sans-serif] font-medium leading-normal relative shrink-0 text-[#374151] text-4xl w-full max-md:text-4xl">
                    michelle liu
                  </p>
                )}
              </ScrollReveal>
              {children && (
                <motion.div
                  className="font-['Figtree',sans-serif] font-normal tracking-wide leading-6 max-md:leading-5.5 text-[#9ca3af] text-lg max-md:text-base w-full max-md:max-w-86 whitespace-pre-wrap mt-1 max-md:mt-1"
                  initial={{ opacity: 0, y: 4, filter: "blur(0px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.15, delay: 0, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {children}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
