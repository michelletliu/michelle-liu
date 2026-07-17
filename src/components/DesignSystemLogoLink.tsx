"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import BlueprintLogo from "./BlueprintLogo";
import { markBlueprintDoorwayNav } from "./blueprintDoorwayNav";
import { warmDesignSystem } from "./doorwayWarm";

/**
 * Red seal doorway → /design-system.
 * Prefetches the route on mount and again on hover/focus; warms the SystemPage
 * chunk immediately so click paints the DS shell (not loading.tsx).
 */
export default function DesignSystemLogoLink() {
  const router = useRouter();
  const pathname = usePathname() || "/";

  useEffect(() => {
    router.prefetch("/design-system");
    // Shell first — don't wait for idle or the first click pays compile cost.
    warmDesignSystem();
  }, [router]);

  const prefetchDoorway = () => {
    router.prefetch("/design-system");
    warmDesignSystem();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Remember Art / About / Work so the DS seal returns here.
    markBlueprintDoorwayNav(pathname);
    window.scrollTo(0, 0);
    // Instant client nav — don't wait on the default Link/anchor round-trip.
    router.push("/design-system");
  };

  return (
    <a
      href="/design-system"
      aria-label="Open the design system"
      onMouseEnter={prefetchDoorway}
      onFocus={prefetchDoorway}
      onTouchStart={prefetchDoorway}
      onPointerDown={prefetchDoorway}
      onClick={handleClick}
      className="group relative -m-2 inline-block shrink-0 cursor-pointer overflow-visible p-2 transition-transform duration-200 ease-out [@media(hover:hover)]:hover:scale-[1.02] active:scale-95"
    >
      <span className="relative block size-8 md:size-11">
        <BlueprintLogo mode="hover" />
      </span>
    </a>
  );
}
