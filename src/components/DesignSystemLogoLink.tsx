"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import BlueprintLogo from "./BlueprintLogo";

/** Warm the design-system route + its heavy section chunks. */
function warmDesignSystem() {
  void import("./system/sections/ComponentSection");
  void import("./system/sections/IconSection");
  void import("./system/sections/MaterialSection");
  void import("./system/sections/MotionSection");
}

/**
 * Red seal doorway → /design-system.
 * Prefetches the route on mount and again on hover; warms heavy section chunks
 * so click paints the DS shell immediately.
 */
export default function DesignSystemLogoLink() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/design-system");
    // Idle-warm section chunks so they ride along after the shell RSC/JS.
    let cancelled = false;
    const run = () => {
      if (!cancelled) warmDesignSystem();
    };
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(run);
    } else {
      timeoutId = setTimeout(run, 400);
    }
    return () => {
      cancelled = true;
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [router]);

  return (
    <Link
      href="/design-system"
      prefetch
      aria-label="Open the design system"
      onMouseEnter={() => {
        router.prefetch("/design-system");
        warmDesignSystem();
      }}
      onFocus={() => {
        router.prefetch("/design-system");
        warmDesignSystem();
      }}
      onTouchStart={() => {
        router.prefetch("/design-system");
        warmDesignSystem();
      }}
      onClick={() => window.scrollTo(0, 0)}
      className="group relative -m-2 inline-block shrink-0 cursor-pointer overflow-visible p-2 transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-95"
    >
      <span className="relative block size-8 md:size-11">
        <BlueprintLogo mode="hover" />
      </span>
    </Link>
  );
}
