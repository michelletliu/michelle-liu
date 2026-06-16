"use client";

import Link from "next/link";

/**
 * App-wide logo button rendered at the root layout so it persists across
 * route changes (e.g. /polaroid → / no longer flashes the logo out and back
 * in on mobile, since the same DOM element stays mounted).
 *
 * Sits at z-30, below page-level logo buttons (z-40+) that own per-page
 * exit animations, and below modals (z-50+) so it's correctly hidden when
 * a project/experiment modal is open. Page-level logos still receive
 * clicks; this one provides visual continuity once they unmount.
 */
export default function PersistentLogo() {
  return (
    <Link
      href="/"
      aria-label="Go to home"
      onClick={() => {
        if (typeof window === "undefined") return;
        if (window.location.pathname === "/") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      className="fixed top-8 left-6 md:left-16 z-30 cursor-pointer transition-opacity duration-200 hover:opacity-80"
    >
      <img
        src="/logo.png"
        alt="Michelle Liu Logo"
        className="size-8 md:size-[44px] object-contain select-none"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        draggable={false}
      />
    </Link>
  );
}
