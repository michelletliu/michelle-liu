"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import BlueprintLogo from "../shared/BlueprintLogo";
import { markBlueprintDoorwayNav } from "../shared/blueprintDoorwayNav";
import { warmDesignSystem } from "../shared/doorwayWarm";
import { DESIGN_SYSTEM_BASE_PATH } from "../system/tokens";

/**
 * Red seal doorway → /design-system.
 * Warms on focus or press so an idle pointer over the seal cannot make the
 * large design-system bundle compete with normal page startup.
 *
 * Navigation uses a document capture listener (same as the DS → home seal):
 * Next soft-nav on the React onClick can miss while the blueprint morph
 * re-renders mid-click; preventDefault would then leave the click dead.
 */
export default function DesignSystemLogoLink() {
  const router = useRouter();
  const pathname = usePathname() || "/";

  const prefetchDoorway = () => {
    if (process.env.NODE_ENV === "development") return;
    router.prefetch(DESIGN_SYSTEM_BASE_PATH);
    warmDesignSystem();
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const a = target?.closest?.("a[data-blueprint-doorway]");
      if (!a) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      if (getComputedStyle(a).pointerEvents === "none") return;

      e.preventDefault();
      const from =
        a.getAttribute("data-blueprint-doorway-from") ||
        window.location.pathname;
      // Remember Art / About / Work so the DS seal returns here.
      markBlueprintDoorwayNav(from);
      // Kick the heavy chunk even in development (prefetch is skipped there).
      warmDesignSystem();
      window.scrollTo(0, 0);
      router.push(DESIGN_SYSTEM_BASE_PATH);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return (
    <a
      href={DESIGN_SYSTEM_BASE_PATH}
      data-blueprint-doorway=""
      data-blueprint-doorway-from={pathname}
      aria-label="Open the design system"
      onFocus={prefetchDoorway}
      onPointerDown={prefetchDoorway}
      className="group relative -m-2 inline-block shrink-0 cursor-pointer overflow-visible p-2 transition-transform duration-200 ease-out [@media(hover:hover)]:hover:scale-[1.02] active:scale-95"
    >
      <span className="relative block size-8 md:size-11">
        <BlueprintLogo mode="hover" />
      </span>
    </a>
  );
}
