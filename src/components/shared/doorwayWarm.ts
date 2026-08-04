/**
 * Eager module loads for tab / doorway navigation.
 * router.prefetch alone still leaves a cold client chunk on first click —
 * these imports pull the same modules the destinations need to paint.
 */

import { preloadWorkPage } from "../../sanity/preload";

/** Warm Work — page module, Sanity lists, and a document prefetch hint. */
export function warmWorkPage() {
  void import("../home/HomePageClient");
  // Separate client entry from HomePageClient; both are needed for `/`.
  void import("../../../app/(home)/layout");
  void preloadWorkPage();

  // Hint the browser to fetch `/` early. Route `app/(home)/layout.js` still
  // comes from router.prefetch — dynamic import of layout.tsx is a different chunk.
  if (typeof document !== "undefined" && !document.getElementById("prefetch-work-doc")) {
    const link = document.createElement("link");
    link.id = "prefetch-work-doc";
    link.rel = "prefetch";
    link.as = "document";
    link.href = "/";
    document.head.appendChild(link);
  }
}

/** Warm /design-system shell + deferred specimen chunks. */
export function warmDesignSystem() {
  void import("../system/SystemPage");
  void import("../system/sections/ComponentSection");
  void import("../system/sections/IconSection");
  void import("../system/sections/MaterialSection");
  void import("../system/sections/MotionSection");
}

/** Warm the tab the DS seal returns to (Work / Art / About). */
export function warmDoorwayReturn(href: string) {
  if (href === "/art") {
    void import("../art/ArtPage");
    return;
  }
  if (href === "/about") {
    void import("../about/AboutPage");
    void import("../about/CommunityCard");
    void import("../about/ShelfSection");
    void import("../about/LoreCard");
    void import("../about/MediaCard");
    return;
  }
  warmWorkPage();
}
