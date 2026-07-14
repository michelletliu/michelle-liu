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
  keyframe: "fade" | "slideUp" | "slideDown" | "scale" | "shimmer" | "pulse" | "blink" | "spin";
  usage: string;
  tag: Tag;
};

export type ExperimentIsland = {
  id: string;
  name: string;
  tagline: string;
  bg: string;
  fonts: string[];
  colors: { value: string; label: string }[];
  radii: string[];
  shadows: string[];
  effects: string[];
};

// ---------------------------------------------------------------------------
// COLORS
// ---------------------------------------------------------------------------

export const colorGroups: ColorGroup[] = [
  {
    id: "zinc",
    label: "Zinc",
    note: "The site's neutral backbone (Tailwind zinc-*). Muted zinc-400 (#a1a1aa) is the single most-used color.",
    colors: [
      { name: "zinc-900", value: "#18181b", className: "text-zinc-900", usage: "Project titles, emphasis body", tag: "canonical" },
      { name: "zinc-800", value: "#27272a", className: "text-zinc-800", usage: "Modal tab labels, testimonial body, film timeline active", tag: "canonical" },
      { name: "zinc-700", value: "#3f3f46", className: "text-zinc-700", usage: "Hero name, section headings, footer", tag: "canonical" },
      { name: "zinc-600", value: "#52525b", className: "text-zinc-600", usage: "Active nav, body copy, metadata, film info, library spinner", tag: "canonical" },
      { name: "zinc-500", value: "#71717a", className: "text-zinc-500", usage: "Secondary body, tool lists, film loading hint", tag: "canonical" },
      { name: "zinc-400", value: "#a1a1aa", className: "text-zinc-400", usage: "Muted labels, captions, placeholders (most common)", tag: "canonical" },
      { name: "zinc-300", value: "#d4d4d8", className: "text-zinc-300", usage: "Focus borders, quote underline, inactive badges", tag: "canonical" },
      { name: "zinc-200", value: "#e4e4e7", className: "bg-zinc-200", usage: "Shimmer base, card borders, spinners, film idle marks", tag: "canonical" },
      { name: "zinc-100", value: "#f4f4f5", className: "bg-zinc-100", usage: "Pill borders, hover fills, dividers, modal hero bands", tag: "canonical" },
      { name: "zinc-50", value: "#fafafa", className: "bg-zinc-50", usage: "Button bg, section bg", tag: "canonical" },
      { name: "white", value: "#ffffff", className: "bg-white", usage: "Page & card surfaces", tag: "canonical" },
      { name: "black", value: "#000000", className: "text-black", usage: "Primary headings, overlays base", tag: "canonical" },
    ],
  },
  {
    id: "accent",
    label: "Blue",
    note: "Blue-500 (#3b82f6) is the single accent for links, CTAs, active states, and text selection.",
    colors: [
      { name: "blue-600", value: "#2563eb", className: "text-blue-600", usage: "Ikigai link hover", tag: "canonical" },
      { name: "blue-500", value: "#3b82f6", className: "bg-blue-500", usage: "Links, CTAs, active nav, selection", tag: "canonical" },
      { name: "blue-400", value: "#60a5fa", className: "bg-blue-400", usage: "CTA hover fill / border, project links", tag: "canonical" },
      { name: "blue-300", value: "#93c5fd", className: "border-blue-300", usage: "CTA hover border", tag: "canonical" },
      { name: "blue-100", value: "#dbeafe", usage: "Text selection background", tag: "canonical" },
    ],
  },
  {
    id: "status",
    label: "Status & feedback",
    note: "Emerald for availability, red for errors, green for the pulse ring.",
    colors: [
      { name: "emerald-500", value: "#10b981", usage: "Availability dot, submit button", tag: "canonical" },
      { name: "emerald-600", value: "#059669", usage: "Changelog link hover", tag: "one-off" },
      { name: "emerald-50", value: "#ecfdf5", usage: "Contact badge expanded bg", tag: "one-off" },
      { name: "green-200", value: "#bbf7d0", usage: "Availability pulse ring", tag: "one-off" },
      { name: "red-500", value: "#ef4444", usage: "Modal error state", tag: "canonical" },
      { name: "red-400", value: "#f87171", usage: "Form error text / border", tag: "canonical" },
    ],
  },
  {
    id: "custom",
    label: "Custom & CMS-driven hues",
    note: "One-off colors, mostly defaults for CMS-editable fields and brand gradients.",
    colors: [
      { name: "Footer tagline", value: "#b5bcc5", usage: "Footer tagline text", tag: "one-off" },
      { name: "Icon muted", value: "#c4c9d0", usage: "Footer social icons, community links", tag: "one-off" },
      { name: "Scramble glyph", value: "#c4c4c4", usage: "TextScramble interim characters", tag: "one-off" },
      { name: "CMS number", value: "#7fa2ff", usage: "Stat card number default", tag: "one-off" },
      { name: "CMS title", value: "#2e5ede", usage: "Highlight card title default", tag: "one-off" },
      { name: "CMS header bg", value: "#fdf2f8", usage: "Section header default (pink-50)", tag: "one-off" },
      { name: "CMS accent", value: "#ec4899", usage: "Stat / header accent (pink-500)", tag: "one-off" },
      { name: "Sky-50", value: "#f0f9ff", usage: "Polaroid project card bg", tag: "one-off" },
      { name: "Shadow tint", value: "#eaeaea", usage: "Gallery / device mockup shadows", tag: "one-off" },
      { name: "Lore lavender", value: "#e3dff4", usage: "Lore card image fallback", tag: "one-off" },
      { name: "--primary (legacy)", value: "#030213", usage: "shadcn token in globals.css only", tag: "one-off" },
      { name: "--muted-foreground", value: "#717182", usage: "shadcn token in globals.css", tag: "one-off" },
    ],
  },
  {
    id: "gradients-color",
    label: "Gradient stops",
    note: "Multi-stop gradients for the animated header, gradient text, and social icon.",
    colors: [
      { name: "Header · lavender", value: "#D5E0FF", usage: "header-gradient stop", tag: "canonical" },
      { name: "Header · blue", value: "#E2EAFF", usage: "header-gradient stop", tag: "canonical" },
      { name: "Header · violet", value: "#F5E2FF", usage: "header-gradient stop", tag: "canonical" },
      { name: "Header · pink", value: "#FDE9FA", usage: "header-gradient stop", tag: "canonical" },
      { name: "Header · blush", value: "#FFF5FC", usage: "header-gradient stop", tag: "canonical" },
      { name: "Text · pink", value: "#FFD2F2", usage: "gradient-text-animated stop", tag: "one-off" },
      { name: "Text · violet", value: "#ECCBFF", usage: "gradient-text-animated stop", tag: "one-off" },
      { name: "Text · sky", value: "#AADBFD", usage: "gradient-text-animated stop", tag: "one-off" },
      { name: "Social · magenta", value: "#D79FE8", usage: "Animated social icon", tag: "one-off" },
      { name: "Social · blue", value: "#4DACEA", usage: "Animated social icon", tag: "one-off" },
      { name: "Social · cyan", value: "#13B2EB", usage: "Animated social icon", tag: "one-off" },
    ],
  },
];

// ---------------------------------------------------------------------------
// TYPOGRAPHY
// ---------------------------------------------------------------------------

export const fontFamilies: { name: string; stack: string; usage: string; tag: Tag }[] = [
  { name: "Michelle", stack: "'Michelle', sans-serif", usage: "Primary site font (Figtree variable, self-hosted, weights 300–900)", tag: "canonical" },
  { name: "SF Pro", stack: "'SF Pro', -apple-system, sans-serif", usage: "Library UI, add-book modal, 404, Polaroid", tag: "experiment" },
  { name: "Courier New", stack: "'Courier New', monospace", usage: "Polaroid date + caption imprint", tag: "experiment" },
  { name: "SF Mono", stack: "ui-monospace, 'SF Mono', Menlo, monospace", usage: "Entire Screentime page (forced monospace)", tag: "experiment" },
];

export const typeScale: TypeToken[] = [
  { name: "text-xs", className: "text-xs", px: "12px", usage: "Footer clock, film loading, skip-to-designs link", tag: "canonical", role: "body" },
  { name: "text-sm", className: "text-sm", px: "14px", usage: "Captions, filters, errors, tooltips, contact badge", tag: "canonical", role: "body" },
  { name: "text-base", className: "text-base", px: "16px", usage: "Default body (--font-size), metadata / tool grids", tag: "canonical", role: "body" },
  { name: "text-lg", className: "text-lg", px: "18px", usage: "Hero subtitle, section subtitles, nav tab labels", tag: "canonical", role: "body" },
  { name: "text-xl", className: "text-xl", px: "20px", usage: "Section / community titles", tag: "canonical", role: "heading" },
  { name: "text-2xl", className: "text-2xl", px: "24px", usage: "Quote cards, mission headers", tag: "canonical", role: "heading" },
  { name: "text-3xl", className: "text-3xl", px: "30px", usage: "Section headings, library title, footer CTA", tag: "canonical", role: "heading" },
  { name: "text-4xl", className: "text-4xl", px: "36px", usage: "Hero name, project hero", tag: "canonical", role: "heading" },
  { name: "text-5xl", className: "text-5xl", px: "48px", usage: "Stats, emoji blocks", tag: "canonical", role: "heading" },
  { name: "text-7xl", className: "text-7xl", px: "72px", usage: "404 display code (mobile)", tag: "one-off", role: "heading" },
  { name: "text-9xl", className: "text-9xl", px: "128px", usage: "404 display code (desktop)", tag: "one-off", role: "heading" },
];

// Every core-site size now snaps to the standard scale above. Only experiments
// keep pixel-exact sizes on purpose (device-accurate / Figma-exported chrome).
export const arbitraryTypeSizes: ScaleToken[] = [
  { name: "text-[17px] / [22px]", value: "17–22px", usage: "Polaroid / Screentime headings", tag: "experiment" },
  { name: "Figma sub-px", value: "10.959–16.949px", usage: "Polaroid share export sizes", tag: "experiment" },
];

export const fontWeights: ScaleToken[] = [
  { name: "font-light", value: "300", usage: "Stats numerals", tag: "one-off" },
  { name: "font-normal", value: "400", usage: "Body default (--font-weight-normal)", tag: "canonical" },
  { name: "font-medium", value: "500", usage: "Headings, labels, nav (--font-weight-medium)", tag: "canonical" },
  { name: "font-semibold", value: "600", usage: "CTAs, filters, ikigai link", tag: "canonical" },
  { name: "font-bold", value: "700", usage: "Footer email arrow reveal", tag: "one-off" },
];

export const tracking: ScaleToken[] = [
  { name: "tracking-[0.005em]", value: "0.005em", usage: "Core micro-tracking (nav, cards, about)", tag: "canonical" },
  { name: "tracking-[0.01em]", value: "0.01em", usage: "Media cards, library filter", tag: "canonical" },
  { name: "tracking-[0.0125em]", value: "0.0125em", usage: "Hero name", tag: "canonical" },
  { name: "tracking-[0.16px]", value: "0.16px", usage: "Social link labels", tag: "one-off" },
  { name: "tracking-[-0.31px]", value: "-0.31px", usage: "Tool grid values", tag: "canonical" },
  { name: "tracking-wide", value: "0.025em", usage: "Section subtitles, sidebar nav", tag: "canonical" },
  { name: "tracking-wider", value: "0.05em", usage: "Footer clock", tag: "one-off" },
  { name: "tracking-[0.15em]", value: "0.15em", usage: "Polaroid stamp text", tag: "experiment" },
  { name: "tracking-[0.75px]", value: "0.75px", usage: "Screentime GENERATE / UPLOAD CTAs", tag: "experiment" },
];

export const lineHeights: ScaleToken[] = [
  { name: "leading-none", value: "1", usage: "404 display", tag: "one-off" },
  { name: "leading-tight", value: "1.25", usage: "Card descriptions, lore dates", tag: "canonical" },
  { name: "leading-snug", value: "1.375", usage: "Film captions, stats", tag: "canonical" },
  { name: "leading-normal", value: "1.5", usage: "Default headings / buttons", tag: "canonical" },
  { name: "leading-relaxed", value: "1.625", usage: "About prose, book review", tag: "canonical" },
  { name: "leading-[1.4]", value: "1.4", usage: "Project card text", tag: "canonical" },
  { name: "leading-5 / 6 / 7", value: "20 / 24 / 28px", usage: "Metadata, subtitle, quotes", tag: "canonical" },
];

// ---------------------------------------------------------------------------
// SHADOWS
// ---------------------------------------------------------------------------

export const shadows: ShadowToken[] = [
  { name: "shadow-default", className: ".shadow-default", value: "0px 4px 16px 0px rgba(212, 212, 216,0.65)", usage: "Media cards, project link cards", tag: "canonical" },
  { name: "shadow-default-hover", className: ".shadow-default-hover", value: "0px 4px 16px 0px rgba(161, 161, 170,0.40)", usage: "Hover state on default-shadow cards", tag: "canonical" },
  { name: "Glass nav pill", value: "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.9), inset 0 -1px 1px rgba(0,0,0,0.02)", usage: "Navigation active tab pill", tag: "canonical" },
  { name: "Image · rest", value: "0 3px 8px rgba(0,0,0,0.05)", usage: "ShimmerImage default", tag: "canonical" },
  { name: "Image · hover", value: "0 3px 8px rgba(0,0,0,0.1)", usage: "ShimmerImage / MediaCard hover", tag: "canonical" },
  { name: "Book cover", value: "0px 4px 12px 0px rgba(0,0,0,0.1)", usage: "Library book covers", tag: "canonical" },
  { name: "Community photo", value: "0px 4px 8px 0px rgba(0,0,0,0.15)", usage: "Community photo frames", tag: "canonical" },
  { name: "Lightbox photo", value: "0px 8px 24px 0px rgba(0,0,0,0.15)", usage: "Community lightbox frame", tag: "canonical" },
  { name: "Book detail modal", value: "0px 4px 36px 0px rgba(0,0,0,0.15)", usage: "Library book detail modal", tag: "one-off" },
  { name: "Device mockup", value: "0px 2px 8px 0px #eaeaea", usage: "Gallery / device mockups", tag: "canonical" },
  { name: "Lock icon", value: "0px 1px 3px 0px rgba(0,0,0,0.08), 0px 1px 2px -1px rgba(0,0,0,0.08)", usage: "Protected content lock", tag: "one-off" },
  { name: "Polaroid frame", value: "0px 2.5px 16px 0px rgba(0,0,0,0.08)", usage: "Polaroid main frame", tag: "experiment" },
  { name: "Screentime paper", value: "0px 10px 60px rgba(0,0,0,0.03)", usage: "Screentime upload modal", tag: "experiment" },
  { name: "Liquid glass", value: "0 4px 20px rgba(0,0,0,0.12), inset 0 0.5px 0 rgba(255,255,255,0.7)", usage: "Art carousel glass buttons", tag: "experiment" },
  { name: "Painting (Fading)", value: "0 12px 40px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)", usage: "Fading painting card", tag: "experiment" },
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
  { name: "rounded-[16px]", value: 16, compensated: "27px", usage: "Video / image embeds", tag: "canonical" },
  { name: "rounded-[24px]", value: 24, compensated: "41px", usage: "Device mockup columns", tag: "canonical" },
  { name: "rounded-[26px]", value: 26, compensated: "44px", usage: "★ Signature project & modal radius", tag: "canonical" },
  { name: "rounded-[28px]", value: 28, compensated: "48px", usage: "Large surfaces", tag: "one-off" },
  { name: "rounded-full", className: "rounded-full", value: 999, usage: "Pills, avatars, CTAs, nav (stays round)", tag: "canonical" },
];

export const oddRadii: ScaleToken[] = [
  { name: "rounded-[7px]", value: "7px", usage: "Screentime daily-tab segment", tag: "experiment" },
  { name: "rounded-[11px] / [12px]", value: "11–12px", usage: "Screentime app icons (iOS-accurate)", tag: "experiment" },
  { name: "rounded-[100px]", value: "100px", usage: "Screentime home indicator, segmented control", tag: "experiment" },
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
  { name: "px-16 / max-md:px-6", value: "64px → 24px", usage: "★ Primary page gutter (desktop → mobile)", tag: "canonical" },
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
  { name: "border", value: "1px solid", usage: "Cards, images, modals (hairline)", tag: "canonical" },
  { name: "border-[1.5px]", value: "1.5px", usage: "Add-book input ring", tag: "one-off" },
  { name: "border-2", value: "2px", usage: "Loading spinners", tag: "canonical" },
  { name: "border-zinc-50", value: "#fafafa", usage: "Image hairline overlays", tag: "canonical" },
  { name: "border-zinc-100", value: "#f4f4f5", usage: "Cards, dropdowns, community frames, project card frames", tag: "canonical" },
  { name: "border-white/50", value: "rgba(255,255,255,0.5)", usage: "Glass nav pill border", tag: "canonical" },
  { name: "border-transparent", value: "transparent", usage: "Default / inactive pills & inputs", tag: "canonical" },
  { name: "focus outline", value: "2px solid #d4d4d8, offset 2px", usage: "Global :focus-visible", tag: "canonical" },
  { name: "focus ring", value: "ring-2 ring-zinc-400 offset-2", usage: "Cards & interactive tiles", tag: "canonical" },
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
  { name: "Glass nav pill", detail: "bg-zinc-200/60 + backdrop-blur-md + triple inset shadow", usage: "Active nav tab", tag: "canonical" },
  { name: "Backdrop blur", detail: "backdrop-blur-sm / -md", usage: "Nav pill, project TOC overlay", tag: "canonical" },
  { name: "Liquid glass", detail: "backdrop-filter: blur(16px) saturate(180%) + inset glow", usage: "Art carousel arrows", tag: "experiment" },
  { name: "Shimmer", detail: "Gradient #f4f4f5→#e4e4e7→#fafafa, 2s ease-in-out loop", usage: "Image / skeleton loading", tag: "canonical" },
  { name: "Gradient text", detail: "violet/pink/blue/zinc stops, animated 6s", usage: "Intro accent text", tag: "one-off" },
  { name: "Text selection", detail: "color #3b82f6 on #dbeafe background", usage: "Global ::selection", tag: "canonical" },
  { name: "Green pulse ring", detail: "#bbf7d0 ring, pulse-ring 2.3s infinite", usage: "Availability dot", tag: "canonical" },
  { name: "Quote underline", detail: "#d4d4d8 2px line, 0.6s reveal", usage: "Media quote cards", tag: "canonical" },
  { name: "Edge fades", detail: "Multi-stop white/#fafafa gradients (up to 11 stops)", usage: "Film & Art carousels, top scroll fade", tag: "canonical" },
  { name: "Modal scrim", detail: "bg-black/20", usage: "All modal overlays", tag: "canonical" },
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
  { name: "fadeUpRight", duration: "400ms", easing: "cubic-bezier(0.16,1,0.3,1)", keyframe: "slideUp", usage: "Shelf items", tag: "canonical" },
  { name: "projectCardEnter", duration: "450ms", easing: "cubic-bezier(0.25,0.46,0.45,0.94)", keyframe: "slideUp", usage: "Project cards, hero", tag: "canonical" },
  { name: "scroll-reveal", duration: "500ms", easing: "ease-out", keyframe: "slideUp", usage: "On-scroll section reveal", tag: "canonical" },
  { name: "shimmer", duration: "2s", easing: "ease-in-out ∞", keyframe: "shimmer", usage: "Loading skeletons", tag: "canonical" },
  { name: "pulse-ring", duration: "2.3s", easing: "ease-out ∞", keyframe: "pulse", usage: "Availability dot", tag: "canonical" },
  { name: "gradient-bg", duration: "8s", easing: "ease ∞", keyframe: "shimmer", usage: "Header gradient drift", tag: "canonical" },
  { name: "blink", duration: "1.2s", easing: "ease-in-out ∞", keyframe: "blink", usage: "Footer clock colon", tag: "one-off" },
  { name: "animate-spin", duration: "1s", easing: "linear ∞", keyframe: "spin", usage: "Loading spinners", tag: "canonical" },
  { name: "film-dot-pulse", duration: "1.4s", easing: "ease-in-out ∞", keyframe: "pulse", usage: "Film loading ellipsis", tag: "experiment" },
];

export const durationScale: ScaleToken[] = [
  { name: "duration-150", value: "150ms", usage: "Micro-interactions (glass button)", tag: "canonical" },
  { name: "duration-200", value: "200ms", usage: "★ Default hover / color transitions", tag: "canonical" },
  { name: "duration-300", value: "300ms", usage: "Cards, modals, nav slide", tag: "canonical" },
  { name: "duration-500", value: "500ms", usage: "Experiment modal expand, book cover", tag: "canonical" },
];

// ---------------------------------------------------------------------------
// EXPERIMENTS
// ---------------------------------------------------------------------------

export const experiments: ExperimentIsland[] = [
  {
    id: "polaroid",
    name: "Polaroid",
    tagline: "iOS-native precision — SF Pro UI, Courier imprint, tinted physical frame, Figma sub-pixel radii.",
    bg: "#f0f9ff",
    fonts: ["SF Pro", "Courier New"],
    colors: [
      { value: "#0088FF", label: "iOS blue" },
      { value: "#FF383C", label: "red" },
      { value: "#FF8D28", label: "orange" },
      { value: "#FFCC00", label: "yellow" },
      { value: "#34C759", label: "green" },
      { value: "#00C3D0", label: "cyan" },
      { value: "#6155F5", label: "purple" },
    ],
    radii: ["2.5px", "5.5px", "4.383px", "1000px"],
    shadows: ["0px 2.5px 16px rgba(0,0,0,0.08)"],
    effects: ["Color-tinted frame", "3D share preview (rotateY -8°)", "blur-[0.25px] paper edge", "hover:rotate-2"],
  },
  {
    id: "screentime",
    name: "Screentime",
    tagline: "iOS device chrome meets thermal receipt — forced monospace everywhere, dashed dividers.",
    bg: "#f4f4f5",
    fonts: ["SF Mono (forced)"],
    colors: [
      { value: "#18181b", label: "zinc-900 CTA" },
      { value: "#08f", label: "iOS blue" },
      { value: "#f4f4f5", label: "bg" },
      { value: "#333333", label: "action label" },
    ],
    radii: ["7px", "11px", "12px", "100px", "rounded-3xl"],
    shadows: ["0px 2px 20px rgba(0,0,0,0.06)", "0px 10px 60px rgba(0,0,0,0.03)"],
    effects: ["iOS status bar + home indicator", "Dashed SVG receipt rules", "Segmented control slide", "Phone-width layout"],
  },
  {
    id: "sketchbook",
    name: "Sketchbook",
    tagline: "Minimal white gallery — soft drop-shadow sketches, RGB-interpolated page ticks, carousel depth.",
    bg: "#ffffff",
    fonts: ["Michelle (site sans)"],
    colors: [
      { value: "#27272a", label: "active tick" },
      { value: "#d4d4d8", label: "idle tick" },
      { value: "#a1a1aa", label: "hover tick" },
    ],
    radii: ["rounded-lg", "2.5px ticks", "rounded-full"],
    shadows: ["drop-shadow-sm"],
    effects: ["15vw edge vignette", "Carousel depth (0.5 opacity / 0.85 scale)", "RGB lerp page ticks", "Rubber-band drag"],
  },
  {
    id: "film",
    name: "Film Diary",
    tagline: "Analog photo timeline — #fafafa darkroom paper, hashmark timeline, spring-scroll, blur-reveal captions.",
    bg: "#fafafa",
    fonts: ["Michelle (site sans)"],
    colors: [
      { value: "#27272a", label: "active mark" },
      { value: "#e4e4e7", label: "idle mark" },
      { value: "#fafafa", label: "paper" },
    ],
    radii: ["3px", "rounded-sm", "rounded-full"],
    shadows: ["(none — edge gradients instead)"],
    effects: ["11-stop edge dissolve", "Spring scroll snap", "Photo 72px→480px spring", "blur(4px)→0 captions"],
  },
  {
    id: "fading",
    name: "Fading",
    tagline: "Canvas-driven destruction — paintings grow, then shatter into sampled-color dust. Almost zero CSS tokens.",
    bg: "#ffffff",
    fonts: ["(none — canvas)"],
    colors: [
      { value: "#ffffff", label: "ground" },
      { value: "#000000", label: "shadow" },
    ],
    radii: ["12px"],
    shadows: ["0 12px 40px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)"],
    effects: ["Full-screen canvas particles", "Sampled-RGB dust", "gravity 0.0012 / drag 0.9986", "grow 6s → shatter 3.8s"],
  },
  {
    id: "art",
    name: "Art",
    tagline: "Portfolio masonry — glassmorphism carousel controls, shimmer loaders, wide-tracking nav.",
    bg: "#ffffff",
    fonts: ["Michelle", "site sans"],
    colors: [
      { value: "#3b82f6", label: "active nav" },
      { value: "#a1a1aa", label: "muted" },
      { value: "rgba(255,255,255,0.45)", label: "glass fill" },
    ],
    radii: ["rounded-2xl", "rounded-xl", "rounded-full"],
    shadows: ["0 4px 20px rgba(0,0,0,0.12) + inset glow"],
    effects: ["backdrop blur(16px) saturate(180%)", "Shimmer loaders", "Infinite scroll loop", "Accordion sidebar"],
  },
  {
    id: "experiment-modal",
    name: "Experiment Modal",
    tagline: "Site-chrome shell — Michelle metadata, per-experiment background bleed, frosted top gradient.",
    bg: "#ffffff",
    fonts: ["Michelle"],
    colors: [
      { value: "#18181b", label: "body" },
      { value: "#a1a1aa", label: "labels" },
      { value: "#3b82f6", label: "CTA" },
    ],
    radii: ["26px", "16px", "12px", "rounded-full"],
    shadows: ["shadow-xl (info popover)"],
    effects: ["hsla top frost gradient", "Per-experiment bg bleed", "translate-y slide in/out", "popoverIn 150ms"],
  },
];

// ---------------------------------------------------------------------------
// TABLE OF CONTENTS
// ---------------------------------------------------------------------------

export const tocSections: { id: string; label: string }[] = [
  { id: "intro", label: "Overview" },
  { id: "color", label: "Color" },
  { id: "typography", label: "Typography" },
  { id: "shadows", label: "Shadows" },
  { id: "radius", label: "Radii & corners" },
  { id: "spacing", label: "Spacing" },
  { id: "borders", label: "Borders & focus" },
  { id: "materials", label: "Materials & effects" },
  { id: "motion", label: "Motion" },
  { id: "components", label: "Components" },
];

/** Slugify a heading string into a URL-safe token. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  color: colorGroups.map((g) => g.label),
  typography: [
    "Font families",
    "Type scale",
    "Experiment-only sizes",
    "Weights",
    "Letter-spacing",
    "Line-height",
  ],
  radius: ["Radius scale", "Experiment radii"],
  spacing: ["Gap scale", "Layout widths"],
  borders: ["Borders", "Focus states"],
  materials: ["Signature materials", "Full inventory"],
  motion: ["Animations", "Duration scale"],
  components: ["Navigation & pills", "Buttons", "Loaders", "Cards"],
};
