"use client";

import { usePathname, useRouter } from "next/navigation";
import BlueprintLogo from "./BlueprintLogo";
import { markBlueprintDoorwayNav } from "./blueprintDoorwayNav";
import { warmDesignSystem } from "./doorwayWarm";

/**
 * Red seal doorway → /design-system.
 * Warms on focus or press so an idle pointer over the seal cannot make the
 * large design-system bundle compete with normal page startup.
 */
export default function DesignSystemLogoLink() {
  const router = useRouter();
  const pathname = usePathname() || "/";

  const prefetchDoorway = () => {
    if (process.env.NODE_ENV === "development") return;
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
      onFocus={prefetchDoorway}
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
