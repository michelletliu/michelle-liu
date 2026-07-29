// Design-system data module for /system.
// Hand-curated from a full audit of the codebase. Every value here appears
// somewhere in the site. Tags: "canonical" = part of the core system,
// "one-off" = appears once / legacy, "experiment" = specific to an experiment.

export type Tag = "canonical" | "one-off" | "experiment";

export type ColorToken = {
  name: string;
  value: string; // css color used to render the swatch
  className?: string; // tailwind class or token name
  usage: string;
  tag: Tag;
};

export type ColorGroup = {
  id: string;
  label: string;
  note?: string;
  colors: ColorToken[];
  /** Brand tabs for case-study palettes (e.g. Adobe, NASA, Roblox). */
  tabs?: {
    id: string;
    label: string;
    colors: ColorToken[];
    /** When false, omit shared CMS defaults (pink-50/500) for this brand. */
    includeDefaults?: boolean;
  }[];
};

export type TypeToken = {
  name: string;
  className: string;
  px: string;
  sample?: string;
  usage: string;
  tag: Tag;
  role: "body" | "heading";
};

export type ScaleToken = {
  name: string;
  value: string;
  usage: string;
  tag: Tag;
};

export type ShadowToken = {
  name: string;
  value: string; // real box-shadow
  className?: string;
  usage: string;
  tag: Tag;
};

export type RadiusToken = {
  name: string;
  value: number; // px used to render sample
  className?: string;
  compensated?: string; // squircle-compensated value from index.css
  usage: string;
  tag: Tag;
};

export type MotionToken = {
  name: string;
  duration: string;
  easing: string;
  keyframe: "fade" | "slideUp" | "slideDown" | "scale" | "shimmer" | "pulse" | "film-dot-pulse" | "blink" | "spin";
  usage: string;
  tag: Tag;
};

// ---------------------------------------------------------------------------
// COLORS
// ---------------------------------------------------------------------------

export const colorGroups: ColorGroup[] = [
{
    id: "primary",
    label: "Primary",
    note: "The site's neutral backbone (Tailwind zinc-*).",
    colors: [
      { name: "zinc-900", value: "#18181b", className: "text-zinc-900", usage: "Headings, icons, --primary / --foreground tokens", tag: "canonical" },
      { name: "zinc-800", value: "#27272a", className: "text-zinc-800", usage: "Modal tabs, testimonial body, film timeline", tag: "canonical" },
      { name: "zinc-700", value: "#3f3f46", className: "text-zinc-700", usage: "Hero name, section headings, footer", tag: "canonical" },
      { name: "zinc-600", value: "#52525b", className: "text-zinc-600", usage: "Active nav, body copy, metadata, film info", tag: "canonical" },
      { name: "zinc-500", value: "#71717a", className: "text-zinc-500", usage: "Secondary body, tool lists, --muted-foreground", tag: "canonical" },
      { name: "zinc-400", value: "#a1a1aa", className: "text-zinc-400", usage: "Muted labels, captions, placeholders, footer", tag: "canonical" },
      { name: "zinc-300", value: "#d4d4d8", className: "text-zinc-300", usage: "Focus borders, quote underline, muted icons", tag: "canonical" },
      { name: "zinc-200", value: "#e4e4e7", className: "bg-zinc-200", usage: "Shimmer, card borders, spinners, film marks", tag: "canonical" },
      { name: "zinc-100", value: "#f4f4f5", className: "bg-zinc-100", usage: "Pill borders, hover fills, dividers", tag: "canonical" },
      { name: "zinc-50", value: "#fafafa", className: "bg-zinc-50", usage: "Button bg, section bg", tag: "canonical" },
      { name: "white", value: "#ffffff", className: "bg-white", usage: "Page & card surfaces", tag: "canonical" },
    ],
  },
{
    id: "accent",
    label: "Accent",
    note: "Blue-500 is the single accent for links, CTAs, active states, and text selection.",
    colors: [
      { name: "blue-600", value: "#2563eb", className: "text-blue-600", usage: "Ikigai link hover, CMS title default", tag: "canonical" },
      { name: "blue-500", value: "#3b82f6", className: "bg-blue-500", usage: "Links, CTAs, active nav, selection", tag: "canonical" },
      { name: "blue-400", value: "#60a5fa", className: "bg-blue-400", usage: "CTA hover, project links, CMS numbers", tag: "canonical" },
      { name: "blue-300", value: "#93c5fd", className: "border-blue-300", usage: "CTA hover border", tag: "canonical" },
      { name: "blue-100", value: "#dbeafe", usage: "Text selection background", tag: "canonical" },
      { name: "blue-50", value: "#eff6ff", className: "bg-blue-50", usage: "Polaroid project card bg", tag: "canonical" },
    ],
  },
{
    id: "cms",
    label: "Case studies",
    note: "Project accent hues from Sanity case studies, plus CMS pink defaults.",
    colors: [
      { name: "pink-500", value: "#ec4899", className: "text-pink-500", usage: "CMS default — TOC, headers, stats accent", tag: "canonical" },
      { name: "pink-50", value: "#fdf2f8", className: "bg-pink-50", usage: "CMS section header bar default", tag: "canonical" },
    ],
    tabs: [
      {
        id: "adobe",
        label: "Adobe",
        colors: [
          { name: "Adobe pink", value: "#F63768", usage: "Highlight & Express headline", tag: "one-off" },
          { name: "Adobe pink deep", value: "#DE3C82", usage: "Section title & highlight", tag: "one-off" },
          { name: "Adobe pink soft", value: "#F777B0", usage: "Section title number / title", tag: "one-off" },
          { name: "Adobe blush", value: "#FF8EAB", usage: "Express — card highlight", tag: "one-off" },
          { name: "Adobe orange", value: "#FD9A00", usage: "Express — card headline", tag: "one-off" },
          { name: "Adobe orange soft", value: "#FFB748", usage: "Express — card highlight", tag: "one-off" },
          { name: "Adobe sky", value: "#32A7F9", usage: "Express — card headline", tag: "one-off" },
          { name: "Adobe sky soft", value: "#88CEFF", usage: "Express — card highlight", tag: "one-off" },
          { name: "Adobe cyan", value: "#34A9F3", usage: "Two-column / feature highlight", tag: "one-off" },
        ],
      },
      {
        id: "nasa",
        label: "NASA",
        colors: [
          { name: "NASA periwinkle", value: "#828EE4", usage: "Section title number", tag: "one-off" },
          { name: "NASA indigo", value: "#5365DE", usage: "Section title & card headline", tag: "one-off" },
        ],
      },
      {
        id: "roblox",
        label: "Roblox",
        includeDefaults: false,
        colors: [
          { name: "Roblox blue", value: "#335FFF", usage: "Highlight", tag: "one-off" },
          { name: "Roblox blue mid", value: "#7FA2FF", usage: "Section title number", tag: "one-off" },
          { name: "Roblox blue deep", value: "#2E5EDE", usage: "Section title & highlight", tag: "one-off" },
          { name: "Roblox teal soft", value: "#6FD8D2", usage: "Section title number", tag: "one-off" },
          { name: "Roblox teal", value: "#38C4BC", usage: "Section title", tag: "one-off" },
          { name: "Roblox purple soft", value: "#B378DB", usage: "Section title number", tag: "one-off" },
          { name: "Roblox purple", value: "#842CBF", usage: "Section title", tag: "one-off" },
        ],
      },
    ],
  },
{
    id: "status",
    label: "Status",
    note: "Emerald for availability, red for errors.",
    colors: [
      { name: "emerald-500", value: "#10b981", usage: "Availability dot, submit button", tag: "canonical" },
      { name: "emerald-600", value: "#059669", usage: "Changelog link hover", tag: "one-off" },
      { name: "emerald-50", value: "#ecfdf5", usage: "Contact badge expanded bg", tag: "one-off" },
      { name: "green-200", value: "#bbf7d0", usage: "Availability pulse ring", tag: "one-off" },
      { name: "red-500", value: "#ef4444", usage: "Modal error state", tag: "canonical" },
      { name: "red-400", value: "#f87171", usage: "Form error text / border", tag: "canonical" },
    ],
  }

];

// ---------------------------------------------------------------------------
// TYPOGRAPHY
// ---------------------------------------------------------------------------

export const fontFamilies: {
  name: string;
  stack: string;
  usage: string;
  tag: Tag;
  fontFamily?: string;
}[] = [
  {
    name: "Figtree",
    stack: "'Figtree', sans-serif",
    fontFamily: "'Michelle', sans-serif",
    usage: "",
    tag: "canonical",
  },
  { name: "SF Pro", stack: "'SF Pro', -apple-system, sans-serif", usage: "", tag: "experiment" },
  { name: "Courier New", stack: "'Courier New', monospace", usage: "", tag: "experiment" },
  { name: "SF Mono", stack: "ui-monospace, 'SF Mono', Menlo, monospace", usage: "", tag: "experiment" },
];

export const typeScale: TypeToken[] = [
  { name: "text-xs", className: "text-xs", px: "12px", usage: "Footer clock, film loading, skip-to-designs link, Polaroid stamp / share chrome", tag: "canonical", role: "body" },
  { name: "text-sm", className: "text-sm", px: "14px", usage: "Captions, filters, errors, tooltips, contact badge, Polaroid / Screentime labels", tag: "canonical", role: "body" },
  { name: "text-base", className: "text-base", px: "16px", usage: "Default body (--font-size), metadata / tool grids, Screentime CTAs", tag: "canonical", role: "body" },
  { name: "text-lg", className: "text-lg", px: "18px", usage: "Hero subtitle, section subtitles, nav tab labels, Polaroid / Screentime headings", tag: "canonical", role: "body" },
  { name: "text-xl", className: "text-xl", px: "20px", usage: "Section / community titles, Polaroid dialog titles", tag: "canonical", role: "heading" },
  { name: "text-2xl", className: "text-2xl", px: "24px", usage: "Quote cards, mission headers", tag: "canonical", role: "heading" },
  { name: "text-3xl", className: "text-3xl", px: "30px", usage: "Section headings, library title, footer CTA", tag: "canonical", role: "heading" },
  { name: "text-4xl", className: "text-4xl", px: "36px", usage: "Project hero, large display sizes (base size for Display name)", tag: "canonical", role: "heading" },
  {
    name: "Display name",
    className: "font-['Michelle',sans-serif] text-4xl font-medium leading-normal tracking-[0.0125em] text-[#3f3f46]",
    px: "36px",
    sample: "Text",
    usage: "Home hero name, Design System title",
    tag: "canonical",
    role: "heading",
  },
  { name: "text-5xl", className: "text-5xl", px: "48px", usage: "Stats, emoji blocks, 404 display code", tag: "canonical", role: "heading" },
];

export const fontWeights: ScaleToken[] = [
  { name: "font-normal", value: "400", usage: "Body default (--font-weight-normal), stats numerals", tag: "canonical" },
  { name: "font-medium", value: "500", usage: "Headings, labels, nav (--font-weight-medium)", tag: "canonical" },
  { name: "font-semibold", value: "600", usage: "CTAs, filters, ikigai link, footer email arrow reveal", tag: "canonical" },
];

export const tracking: ScaleToken[] = [
  { name: "tracking-micro", value: "0.005em", usage: "Core micro-tracking (nav, cards, about, tool grid values)", tag: "canonical" },
  { name: "tracking-fine", value: "0.01em", usage: "Media cards, library filter, social link labels", tag: "canonical" },
  { name: "tracking-display", value: "0.0125em", usage: "Display name (home hero name, Design System title)", tag: "canonical" },
  { name: "tracking-wide", value: "0.025em", usage: "Section subtitles, sidebar nav", tag: "canonical" },
  { name: "tracking-wider", value: "0.05em", usage: "Footer clock", tag: "one-off" },
  { name: "tracking-[0.15em]", value: "0.15em", usage: "Polaroid stamp text", tag: "experiment" },
  { name: "tracking-[0.75px]", value: "0.75px", usage: "Screentime GENERATE / UPLOAD CTAs", tag: "experiment" },
];

export const lineHeights: ScaleToken[] = [
  { name: "leading-none", value: "1", usage: "404 display", tag: "canonical" },
  { name: "leading-tight", value: "1.25", usage: "Card descriptions, lore dates", tag: "canonical" },
  { name: "leading-5", value: "calc(var(--spacing) * 5)", usage: "Metadata, nav, captions", tag: "canonical" },
  { name: "leading-snug", value: "1.375", usage: "Film captions, stats", tag: "canonical" },
  { name: "leading-[1.4]", value: "1.4", usage: "Project card text", tag: "canonical" },
  { name: "leading-normal", value: "1.5", usage: "Default headings / buttons", tag: "canonical" },
  { name: "leading-6", value: "calc(var(--spacing) * 6)", usage: "Subtitles, footer CTA", tag: "canonical" },
  { name: "leading-relaxed", value: "1.625", usage: "About prose, book review", tag: "canonical" },
  { name: "leading-7", value: "calc(var(--spacing) * 7)", usage: "Quotes, display lines", tag: "canonical" },
];

// ---------------------------------------------------------------------------
// SHADOWS
// ---------------------------------------------------------------------------

export const shadows: ShadowToken[] = [
  {
    name: "shadow-soft",
    className: ".shadow-soft",
    value: "0 2px 8px rgba(0, 0, 0, 0.06)",
    usage: "Hairline lift — locks, pills, segmented thumbs, image rest state",
    tag: "canonical",
  },
  {
    name: "shadow-default",
    className: ".shadow-default",
    value: "0px 4px 16px 0px rgba(212, 212, 216, 0.65)",
    usage: "Zinc-tinted cards; pair with .shadow-default-hover on interactive cards",
    tag: "canonical",
  },
  {
    name: "shadow-default-hover",
    className: ".shadow-default-hover",
    value: "0px 4px 16px 0px rgba(161, 161, 170, 0.4)",
    usage: "Hover companion for .shadow-default cards",
    tag: "canonical",
  },
  {
    name: "shadow-media",
    className: ".shadow-media",
    value: "0 4px 12px rgba(0, 0, 0, 0.1)",
    usage: "Photos, book covers, device frames, Polaroids, community mats",
    tag: "canonical",
  },
  {
    name: "shadow-elevated",
    className: ".shadow-elevated",
    value: "0 8px 24px rgba(0, 0, 0, 0.12)",
    usage: "Modals, dropdowns, popovers, lightbox, deep floats",
    tag: "canonical",
  },
  {
    name: "shadow-glass",
    className: ".shadow-glass",
    value:
      "0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.9), inset 0 -1px 1px rgba(0, 0, 0, 0.02)",
    usage: "Frosted nav pill + liquid-glass controls",
    tag: "canonical",
  },
];

// ---------------------------------------------------------------------------
// RADII
// ---------------------------------------------------------------------------

export const radii: RadiusToken[] = [
  { name: "rounded-sm", className: "rounded-sm", value: 2, usage: "Community photos, book covers, film frames, Polaroid frame (mobile)", tag: "canonical" },
  { name: "rounded-md", className: "rounded-md", value: 6, usage: "Dropdown items, book covers, Polaroid frame & share export", tag: "canonical" },
  { name: "rounded-lg", className: "rounded-lg", value: 8, compensated: "14px (tooltip)", usage: "Tooltips, dropdowns, quote photos", tag: "canonical" },
  { name: "rounded-xl", className: "rounded-xl", value: 12, compensated: "20px", usage: "Gallery items, project cards", tag: "canonical" },
  { name: "rounded-2xl", className: "rounded-2xl", value: 16, compensated: "27px", usage: "Lore cards, book modal, video", tag: "canonical" },
  { name: "rounded-3xl", className: "rounded-3xl", value: 24, compensated: "41px", usage: "Info modal, media quote cards", tag: "canonical" },
  { name: "rounded-[26px]", value: 26, compensated: "44px", usage: "★ Signature project & modal radius", tag: "canonical" },
  { name: "rounded-full", className: "rounded-full", value: 999, usage: "Pills, avatars, CTAs, nav (stays round)", tag: "canonical" },
];

// ---------------------------------------------------------------------------
// SPACING
// ---------------------------------------------------------------------------

export const spacingScale: ScaleToken[] = [
  { name: "gap-1", value: "4px", usage: "Nav tabs, tight rows", tag: "canonical" },
  { name: "gap-2", value: "8px", usage: "Inline label + value", tag: "canonical" },
  { name: "gap-3", value: "12px", usage: "Card internals", tag: "canonical" },
  { name: "gap-4", value: "16px", usage: "Grid gaps", tag: "canonical" },
  { name: "gap-6", value: "24px", usage: "Section internals", tag: "canonical" },
  { name: "gap-8", value: "32px", usage: "Between blocks", tag: "canonical" },
  { name: "gap-12", value: "48px", usage: "Project sections", tag: "canonical" },
  { name: "gap-16", value: "64px", usage: "Major sections", tag: "canonical" },
  { name: "gap-20", value: "80px", usage: "About page sections", tag: "canonical" },
];

export const gutters: ScaleToken[] = [
  { name: "px-16 / max-md:px-6", value: "64px → 24px", usage: "★ Primary page gutter", tag: "canonical" },
  { name: "px-8", value: "32px", usage: "Secondary mobile gutter", tag: "canonical" },
  { name: "px-[175px] / md:px-[8%]", value: "175px / 8%", usage: "Wide project gallery gutters", tag: "one-off" },
  { name: "w-[calc(100%*10/12)]", value: "10 of 12 cols", usage: "Project modal width", tag: "canonical" },
  { name: "w-[calc(100%*6/12)]", value: "6 of 12 cols", usage: "Info modal width", tag: "one-off" },
  { name: "w-[337px] / [402px]", value: "337 / 402px", usage: "Screentime phone widths", tag: "experiment" },
];

// ---------------------------------------------------------------------------
// BORDERS
// ---------------------------------------------------------------------------

export const borders: ScaleToken[] = [
  { name: "border", value: "1px solid", usage: "Cards, images, modals", tag: "canonical" },
  { name: "border-2", value: "2px", usage: "Loading spinners", tag: "canonical" },
  { name: "border-zinc-50", value: "#fafafa", usage: "Image hairline overlays", tag: "canonical" },
  { name: "border-zinc-100", value: "#f4f4f5", usage: "Cards, dropdowns, community frames, project card frames", tag: "canonical" },
  { name: "border-white/50", value: "rgba(255,255,255,0.5)", usage: "Glass nav pill border", tag: "canonical" },
  { name: "border-transparent", value: "transparent", usage: "Default / inactive pills & inputs", tag: "canonical" },
  { name: "Focus outline", value: "2px solid #d4d4d8, offset 2px", usage: "Global :focus-visible", tag: "canonical" },
  { name: "Focus ring", value: "ring-2 ring-zinc-400 offset-2", usage: "Cards & interactive tiles", tag: "canonical" },
];

// ---------------------------------------------------------------------------
// MATERIALS / EFFECTS
// ---------------------------------------------------------------------------

export type MaterialToken = {
  name: string;
  detail: string;
  usage: string;
  tag: Tag;
};

export const materials: MaterialToken[] = [
  { name: "Header gradient", detail: "Multi-stop lavender→white, animated 8s (.header-gradient)", usage: "Page headers", tag: "canonical" },
  { name: "Grain overlay", detail: "PNG texture at opacity 0.8 over header gradient", usage: "Page header texture", tag: "canonical" },
  { name: "Glass nav pill", detail: "bg-zinc-200/60 + backdrop-blur-md + shadow-glass", usage: "Active nav tab", tag: "canonical" },
  { name: "Backdrop blur", detail: "backdrop-blur-sm / -md", usage: "Nav pill, project TOC overlay", tag: "canonical" },
  { name: "Liquid glass", detail: "backdrop-filter: blur(16px) saturate(180%) + shadow-glass", usage: "Art carousel arrows", tag: "experiment" },
  { name: "Shimmer", detail: "Gradient #f4f4f5→#e4e4e7→#fafafa, 2s ease-in-out loop", usage: "Image / skeleton loading", tag: "canonical" },
  { name: "Text selection", detail: "color #3b82f6 on #dbeafe background", usage: "Global ::selection", tag: "canonical" },
  { name: "Green pulse ring", detail: "#bbf7d0 ring, pulse-ring 2.3s infinite", usage: "Availability dot", tag: "canonical" },
  { name: "Quote underline", detail: "#d4d4d8 2px line, 0.6s reveal", usage: "Media quote cards", tag: "canonical" },
  { name: "Edge fades", detail: "Multi-stop white/#fafafa gradients (up to 11 stops)", usage: "Film & Art carousels, top scroll fade", tag: "canonical" },
  { name: "Modal scrim", detail: "bg-zinc-900/20", usage: "All modal overlays", tag: "canonical" },
  { name: "Blur-reveal text", detail: "filter blur(4px)→blur(0), 0.26s", usage: "Film captions focus-pull", tag: "experiment" },
  { name: "Canvas particles", detail: "Sampled-RGB dust, gravity 0.0012, drag 0.9986", usage: "Fading shatter effect", tag: "experiment" },
  { name: "Hover scale", detail: "scale-[0.99] cards, scale-[1.005] link cards", usage: "Interactive lift", tag: "canonical" },
];

// ---------------------------------------------------------------------------
// MOTION
// ---------------------------------------------------------------------------

export const motion: MotionToken[] = [
  { name: "fadeIn", duration: "200ms", easing: "ease-out", keyframe: "fade", usage: "Lightbox overlays", tag: "canonical" },
  { name: "scaleIn", duration: "300ms", easing: "ease-out", keyframe: "scale", usage: "Lightbox content", tag: "canonical" },
  { name: "fadeSlideUp", duration: "300ms", easing: "ease-out", keyframe: "slideUp", usage: "Lightbox captions", tag: "canonical" },
  { name: "fadeSlideDown", duration: "300ms", easing: "ease-out", keyframe: "slideDown", usage: "Close buttons", tag: "canonical" },
  { name: "modalScaleIn", duration: "280ms", easing: "cubic-bezier(0.16,1,0.3,1)", keyframe: "scale", usage: "Centered modals", tag: "canonical" },
  { name: "modalSlideIn", duration: "250ms", easing: "cubic-bezier(0.16,1,0.3,1)", keyframe: "slideDown", usage: "Dropdown modals", tag: "canonical" },
  { name: "shelfItemFadeUp", duration: "400ms", easing: "ease-out", keyframe: "slideUp", usage: "Shelf items", tag: "canonical" },
  { name: "projectCardEnter", duration: "450ms", easing: "cubic-bezier(0.25,0.46,0.45,0.94)", keyframe: "slideUp", usage: "Project cards, hero", tag: "canonical" },
  { name: "scroll-reveal", duration: "500ms", easing: "ease-out", keyframe: "slideUp", usage: "On-scroll section reveal", tag: "canonical" },
  { name: "shimmer", duration: "2s", easing: "ease-in-out ∞", keyframe: "shimmer", usage: "Loading skeletons", tag: "canonical" },
  { name: "pulse-ring", duration: "2.3s", easing: "ease-out ∞", keyframe: "pulse", usage: "Availability dot", tag: "canonical" },
  { name: "gradient-bg", duration: "8s", easing: "ease ∞", keyframe: "shimmer", usage: "Header gradient drift", tag: "canonical" },
  { name: "blink", duration: "1.2s", easing: "ease-in-out ∞", keyframe: "blink", usage: "Footer clock colon", tag: "one-off" },
  { name: "animate-spin", duration: "1s", easing: "linear ∞", keyframe: "spin", usage: "Loading spinners", tag: "canonical" },
  { name: "film-dot-pulse", duration: "1.4s", easing: "ease-in-out ∞", keyframe: "film-dot-pulse", usage: "Film loading ellipsis", tag: "experiment" },
];

export const durationScale: ScaleToken[] = [
  { name: "duration-150", value: "150ms", usage: "Micro-interactions (glass button)", tag: "canonical" },
  { name: "duration-200", value: "200ms", usage: "★ Default hover / color transitions", tag: "canonical" },
  { name: "duration-300", value: "300ms", usage: "Cards, modals, nav slide", tag: "canonical" },
  { name: "duration-500", value: "500ms", usage: "Experiment modal expand, book cover", tag: "canonical" },
];

// ---------------------------------------------------------------------------
// TABLE OF CONTENTS
// ---------------------------------------------------------------------------

/** Overview first; Materials last. Borders sits under Iconography. */
export const tocSections: { id: string; label: string }[] = [
  { id: "intro", label: "Overview" },
  { id: "color", label: "Color" },
  { id: "components", label: "Components" },
  { id: "icons", label: "Iconography" },
  { id: "borders", label: "Borders" },
  { id: "motion", label: "Motion" },
  { id: "shadows", label: "Shadows" },
  { id: "spacing", label: "Spacing" },
  { id: "typography", label: "Typography" },
  { id: "materials", label: "Materials" },
];

/** If every item shares one provenance tag, return it; otherwise undefined. */
export function uniformTag<T extends { tag: Tag }>(items: readonly T[]): Tag | undefined {
  if (items.length === 0) return undefined;
  const first = items[0].tag;
  return items.every((item) => item.tag === first) ? first : undefined;
}

/** Slugify a heading string into a URL-safe token. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const DESIGN_SYSTEM_BASE_PATH = "/design-system";

/** Path segment for a section DOM id. Overview (`intro`) → null. */
export function sectionPathSlug(sectionId: string): string | null {
  const section = tocSections.find((s) => s.id === sectionId);
  if (!section || section.id === "intro") return null;
  return slugify(section.label);
}

/** DOM id for a path slug, or null if unknown / Overview-like. */
export function sectionIdFromPathSlug(slug: string): string | null {
  if (!slug) return null;
  const section = tocSections.find(
    (s) => s.id !== "intro" && slugify(s.label) === slug,
  );
  return section?.id ?? null;
}

/** Full pathname for a section DOM id. Unknown / Overview → bare base. */
export function pathForSectionId(sectionId: string): string {
  const slug = sectionPathSlug(sectionId);
  return slug ? `${DESIGN_SYSTEM_BASE_PATH}/${slug}` : DESIGN_SYSTEM_BASE_PATH;
}

/** DOM id (and nav id) for a SubLabel — prefixed so it never clashes with a section id. */
export function subSlug(label: string): string {
  return `sub-${slugify(label)}`;
}

/**
 * Subheadings (the SubLabel text) for each section, in document order.
 * Drives the expandable sub-nav in the left sidebar. Keep labels in exact sync
 * with the <SubLabel> children rendered inside each section.
 */
export const tocSubsections: Record<string, string[]> = {
  borders: ["Radius", "Focus states", "Styles"],
  color: colorGroups.map((g) => g.label),
  components: [
    "Buttons",
    "Cards",
    "Dividers",
    "Inputs",
    "Loaders",
    "Navigation",
    "Pills",
  ],
  icons: ["Size", "Filled", "Stroke", "Social"],
  motion: ["Animations", "Duration scale"],
  spacing: ["Gap scale", "Layout widths"],
  typography: ["Families", "Properties"],
};
