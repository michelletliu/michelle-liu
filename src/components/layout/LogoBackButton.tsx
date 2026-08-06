"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import imgLogo from "../../assets/logo.png";
import { warmWorkPage } from "../shared/doorwayWarm";
import { navigateHomeWithScrollReturn } from "../shared/homeScrollReturn";

type LogoBackButtonProps = {
  /**
   * Destination for the seal click. Defaults to home.
   * Soft Next navigation is intentionally avoided: heavy pages (gallery WebGL)
   * block the main thread on unmount, so the click feels broken.
   */
  href?: string;
  isEntering?: boolean;
  className?: string;
};

/**
 * Fixed-position red seal used on immersive experiment pages (gallery, etc.).
 * Hard-assigns so leaving a WebGL / heavy client tree is immediate — same
 * idea as the design-system doorway-back path that uses location.assign.
 */
export default function LogoBackButton({
  href = "/",
  isEntering = false,
  className = "",
}: LogoBackButtonProps) {
  const router = useRouter();

  const warmHome = () => {
    if (href !== "/") return;
    warmWorkPage();
    if (process.env.NODE_ENV === "development") return;
    router.prefetch(href);
  };

  // Prefetch as soon as the seal mounts so the first click isn't cold.
  useEffect(() => {
    warmHome();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- warm once per href
  }, [href, router]);

  // Capture-phase listener mirrors DesignSystemLogoLink: always see the click
  // even if a busy canvas / pointer handler is fighting React's bubble phase.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const a = target?.closest?.("a[data-logo-back]");
      if (!a) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      if (getComputedStyle(a).pointerEvents === "none") return;

      e.preventDefault();
      e.stopPropagation();
      warmHome();
      const next = a.getAttribute("href") || href;
      // Home gets the back route when this session came from there, so the
      // browser restores the Work scroll as part of the navigation.
      if (next === "/" || next.startsWith("/?")) {
        navigateHomeWithScrollReturn(next);
        return;
      }
      // Hard assign: router.push waits for gallery Three.js dispose +
      // forceContextLoss on the main thread before painting home.
      window.location.assign(next);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listener only needs href
  }, [href, router]);

  return (
    <a
      href={href}
      data-logo-back=""
      onFocus={warmHome}
      onPointerDown={warmHome}
      // z-50: above site body::before white top gradient (z-40 in globals.css)
      className={`fixed top-8 left-6 md:left-16 z-50 cursor-pointer transition-all duration-300 ease-out hover:opacity-80 ${
        isEntering ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      } ${className}`}
      aria-label="Go back to home"
    >
      <img
        src={imgLogo}
        alt="Michelle Liu Logo"
        className="w-8 h-8 md:w-[44px] md:h-[44px] object-contain"
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
    </a>
  );
}
