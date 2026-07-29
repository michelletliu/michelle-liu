"use client";

import Link from "next/link";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import clsx from "clsx";
import { ArrowUpRight } from "../../ArrowUpRight";
import {
  FieldInput,
  FieldLeadingIcon,
  FieldShell,
  FieldTrailingIcon,
  SearchMagnifierIcon,
} from "../../FieldInput";
import { FilterDropdown } from "../../FilterDropdown";
import { FilterPills } from "../../FilterPills";
import Sidebar, { type SidebarNode } from "../../Sidebar";
import Tooltip from "../../Tooltip";
import LiquidGlassButton from "../../art/LiquidGlassButton";
import ContactBadge from "../../ContactBadge";
import { Chevron } from "../../Chevron";
import { iconSize } from "../../iconSizes";
import { ArrowRightIcon } from "../../Arrow";
import {
  CircleIcon,
  SendIcon,
  SquircleIcon,
} from "../../library/icons";
import { HorizontalLine } from "../../HorizontalLine";
import { INLINE_LINK_CLASS } from "../../inlineLink";
import { ghostIconButtonClass } from "../../ghostIconButton";
import { getHorizontalFadeVisibility } from "../inputMatrixScroll";
import { Section, SubLabel, TagChip } from "../primitives";
import type { Tag } from "../tokens";

/**
 * Ghost affordance — transparent resting surface, translucent zinc wash on hover
 * so the specimen (or page) background still shows through.
 * Pair with the control’s DS radius (rounded-full / rounded-xl / rounded-md).
 */
const GHOST_SURFACE =
  "bg-transparent transition-colors duration-200 hover:bg-zinc-900/5";

/** Canonical button class patterns for DS specimens — not a site-wide API. */
type SpecButtonVariant = "primary" | "secondary" | "tertiary" | "ghost";
type SpecButtonSize = "sm" | "md" | "lg";
type SpecButtonRadiusMode = "circular" | "rectangular";

/** Translucent hover washes — background shows through under the control. */
const HOVER_WASH_ZINC = "hover:bg-zinc-900/5";
const HOVER_WASH_ZINC_STRONG = "hover:bg-zinc-500/10";

const SPEC_BUTTON_VARIANT: Record<SpecButtonVariant, string> = {
  primary:
    "border border-blue-400 bg-blue-500 text-white hover:border-blue-300 hover:bg-blue-400",
  secondary:
    `border border-[#e4e4e7] bg-[#fafafa] text-zinc-700 ${HOVER_WASH_ZINC}`,
  tertiary: `bg-zinc-100 text-zinc-700 ${HOVER_WASH_ZINC_STRONG}`,
  ghost: `${GHOST_SURFACE} text-zinc-700`,
};

/** index.css pairs these with corner-shape: round (pills) / squircle. */
const SPEC_BUTTON_RADIUS_BY_MODE: Record<SpecButtonRadiusMode, string> = {
  circular: "rounded-full",
  rectangular: "rounded-xl",
};

const SPEC_BUTTON_SIZE_TEXT: Record<SpecButtonSize, string> = {
  sm: "gap-1 px-3 py-1 text-sm",
  md: "gap-1.5 px-4 py-1.5 text-base",
  lg: "gap-1.5 px-5 py-2.5 text-base",
};

const SPEC_BUTTON_SIZE_ICON: Record<SpecButtonSize, string> = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
};

function SpecButton({
  variant,
  size = "md",
  icon = false,
  radiusMode = "circular",
  children,
  className = "",
  type = "button",
  ...props
}: {
  variant: SpecButtonVariant;
  size?: SpecButtonSize;
  icon?: boolean;
  radiusMode?: SpecButtonRadiusMode;
  children?: ReactNode;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">) {
  const radius = SPEC_BUTTON_RADIUS_BY_MODE[radiusMode];
  const tone = SPEC_BUTTON_VARIANT[variant];
  const sizing = icon ? SPEC_BUTTON_SIZE_ICON[size] : SPEC_BUTTON_SIZE_TEXT[size];
  const typeFace =
    !icon && variant === "primary"
      ? "font-['Michelle',sans-serif] font-semibold"
      : "font-medium";

  return (
    <button
      {...props}
      type={type}
      className={`inline-flex shrink-0 items-center justify-center transition-[border-radius,background-color,border-color,color] duration-200 ease-in-out motion-reduce:transition-none ${radius} ${tone} ${sizing} ${typeFace} ${className}`}
    >
      {children}
    </button>
  );
}

const SPEC_BUTTON_VARIANTS: SpecButtonVariant[] = [
  "primary",
  "secondary",
  "tertiary",
  "ghost",
];
const SPEC_BUTTON_SIZES: SpecButtonSize[] = ["sm", "md", "lg"];

const SPEC_BUTTON_VARIANT_LABELS: Record<SpecButtonVariant, string> = {
  primary: "Primary",
  secondary: "Secondary",
  tertiary: "Tertiary",
  ghost: "Ghost",
};

type SpecButtonContent = "label" | "icon-label" | "icon";

const MATRIX_CONTENT_OPTIONS = [
  { value: "label", label: "Label" },
  { value: "icon-label", label: "Icon + label" },
  { value: "icon", label: "Icon" },
];

/**
 * Solid / Glass matrices — locked height at every breakpoint so Label /
 * Icon+label / Icon tabs don’t reflow the card (tallest is icon+label).
 */
const BUTTON_MATRIX_CARD_CLASS =
  "!h-[36rem] !min-h-[36rem] !max-h-[36rem] !items-stretch !justify-start overflow-hidden md:!h-[30rem] md:!min-h-[30rem] md:!max-h-[30rem]";

/** Playground stage is fixed-height; card can size to the settings stack. */
const BUTTON_PLAYGROUND_CARD_CLASS =
  "!items-stretch !justify-start";

function SpecButtonSample({
  variant,
  size,
  content,
  radiusMode = "circular",
}: {
  variant: SpecButtonVariant;
  size: SpecButtonSize;
  content: SpecButtonContent;
  radiusMode?: SpecButtonRadiusMode;
}) {
  if (content === "icon") {
    return (
      <SpecButton
        variant={variant}
        size={size}
        icon
        radiusMode={radiusMode}
        aria-label="Send"
      >
        <SendIcon className="-ml-0.5 w-5 pt-0.5" />
      </SpecButton>
    );
  }

  if (content === "icon-label") {
    return (
      <SpecButton
        variant={variant}
        size={size}
        radiusMode={radiusMode}
        className={size === "sm" ? "gap-1" : "gap-1.5"}
      >
        <span>Continue</span>
        {variant === "secondary" ? (
          <Chevron direction="right" size={iconSize("inline")} />
        ) : (
          <ArrowUpRight size="12px" />
        )}
      </SpecButton>
    );
  }

  return (
    <SpecButton variant={variant} size={size} radiusMode={radiusMode}>
      Label
    </SpecButton>
  );
}

const GLASS_BUTTON_STYLE = {
  backgroundColor: "rgba(255, 255, 255, 0.45)",
  backdropFilter: "blur(16px) saturate(180%)",
  WebkitBackdropFilter: "blur(16px) saturate(180%)",
} as const;

/** Ghost is defined by having no surface, so it has no glass counterpart. */
type GlassButtonVariant = Exclude<SpecButtonVariant, "ghost">;

const GLASS_BUTTON_VARIANTS: GlassButtonVariant[] = [
  "primary",
  "secondary",
  "tertiary",
];

const GLASS_BUTTON_TONE: Record<GlassButtonVariant, string> = {
  primary: "text-blue-500 hover:text-blue-600",
  secondary: "text-zinc-700 hover:text-zinc-900",
  tertiary: "text-zinc-600 hover:text-zinc-800",
};

const GLASS_ICON_SIZE: Record<SpecButtonSize, number> = {
  sm: 32,
  md: 36,
  lg: 44,
};

/** Liquid-glass surface with the same variant × size × content axes as SpecButton. */
function GlassButtonSample({
  variant,
  size,
  content,
  radiusMode = "circular",
}: {
  variant: GlassButtonVariant;
  size: SpecButtonSize;
  content: SpecButtonContent;
  radiusMode?: SpecButtonRadiusMode;
}) {
  const tone = GLASS_BUTTON_TONE[variant];
  const radius = SPEC_BUTTON_RADIUS_BY_MODE[radiusMode];

  if (content === "icon") {
    return (
      <LiquidGlassButton
        size={GLASS_ICON_SIZE[size]}
        radius={radiusMode === "circular" ? "full" : "xl"}
        className={tone}
        aria-label="Send"
      >
        <SendIcon className="-ml-0.5 w-5 pt-0.5" />
      </LiquidGlassButton>
    );
  }

  const sizing = SPEC_BUTTON_SIZE_TEXT[size];
  const typeFace =
    variant === "primary"
      ? "font-['Michelle',sans-serif] font-semibold"
      : "font-medium";

  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center justify-center border border-white/50 shadow-glass transition-[border-radius,transform] duration-200 ease-in-out motion-reduce:transition-none hover:scale-105 ${radius} ${sizing} ${typeFace} ${tone}`}
      style={GLASS_BUTTON_STYLE}
    >
      {content === "icon-label" ? (
        <>
          <span>Continue</span>
          {variant === "secondary" ? (
            <Chevron direction="right" size={iconSize("inline")} />
          ) : (
            <ArrowUpRight size="12px" />
          )}
        </>
      ) : (
        "Label"
      )}
    </button>
  );
}

function ButtonRadiusToggle({
  mode,
  onChange,
  transparent = false,
}: {
  mode: SpecButtonRadiusMode;
  onChange: (mode: SpecButtonRadiusMode) => void;
  transparent?: boolean;
}) {
  const isCircular = mode === "circular";
  const label = isCircular ? "View Squircle" : "View Rounded";

  return (
    <div className="absolute right-3 top-3 z-[3]">
      <Tooltip label={label} position="bottom">
        <button
          type="button"
          aria-pressed={!isCircular}
          aria-label={label}
          onClick={() => onChange(isCircular ? "rectangular" : "circular")}
          className={clsx(
            ghostIconButtonClass(
              "sm",
              clsx(
                "text-zinc-300",
                !transparent && "bg-white/80 backdrop-blur-sm",
              ),
            ),
            "hover:bg-zinc-100 hover:text-zinc-400",
            "active:bg-zinc-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300/60",
          )}
        >
          {isCircular ? (
            <SquircleIcon size={iconSize("toolbar")} />
          ) : (
            <CircleIcon size={iconSize("toolbar")} />
          )}
        </button>
      </Tooltip>
    </div>
  );
}

function ButtonMatrixStage<V extends SpecButtonVariant>({
  content,
  variants,
  renderCell,
  caption,
  stageClassName,
  radiusMode,
  onRadiusModeChange,
  transparentToggle = false,
}: {
  content: SpecButtonContent;
  variants: V[];
  renderCell: (
    variant: V,
    size: SpecButtonSize,
    content: SpecButtonContent,
  ) => ReactNode;
  caption: string;
  stageClassName: string;
  radiusMode: SpecButtonRadiusMode;
  onRadiusModeChange: (mode: SpecButtonRadiusMode) => void;
  transparentToggle?: boolean;
}) {
  return (
    <div
      className={`relative flex min-h-0 flex-1 items-stretch justify-center rounded-xl px-6 py-6 md:items-center ${stageClassName}`}
    >
      <ButtonRadiusToggle
        mode={radiusMode}
        onChange={onRadiusModeChange}
        transparent={transparentToggle}
      />
      <p className="sr-only">{caption}</p>

      {/* Mobile: stacked variants; 3 fixed columns so tab toggles don’t reflow height */}
      <div className="flex w-full flex-col gap-5 overflow-y-auto md:hidden">
        {variants.map((variant) => (
          <div key={variant} className="flex flex-col gap-2">
            <span className="text-sm font-normal text-zinc-400">
              {SPEC_BUTTON_VARIANT_LABELS[variant]}
            </span>
            <div className="grid w-full grid-cols-3 items-end justify-items-center gap-x-2 gap-y-3">
              {SPEC_BUTTON_SIZES.map((size) => (
                <div
                  key={size}
                  className="flex w-full flex-col items-center gap-1.5"
                >
                  <span className="text-xs font-normal text-zinc-400">
                    {size}
                  </span>
                  <div className="flex h-12 w-full items-center justify-center">
                    {renderCell(variant, size, content)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/*
        md+: fixed column widths so row/col headers stay put across
        Label / Icon+label / Icon — widest mode is Icon+label.
      */}
      <table className="mx-auto hidden w-full max-w-[36rem] table-fixed border-separate border-spacing-x-3 border-spacing-y-4 md:table lg:border-spacing-x-4">
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          <col className="w-[5.5rem]" />
          <col className="w-[9.5rem]" />
          <col className="w-[9.5rem]" />
          <col className="w-[9.5rem]" />
        </colgroup>
        <thead>
          <tr>
            <th className="pb-1 text-left text-sm font-normal text-zinc-400" />
            {SPEC_BUTTON_SIZES.map((size) => (
              <th
                key={size}
                scope="col"
                className="pb-1 text-center text-sm font-normal text-zinc-400"
              >
                {size}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => (
            <tr key={variant}>
              <th
                scope="row"
                className="text-left text-sm font-normal text-zinc-400"
              >
                {SPEC_BUTTON_VARIANT_LABELS[variant]}
              </th>
              {SPEC_BUTTON_SIZES.map((size) => (
                <td key={size} className="text-center align-middle">
                  <div className="flex h-12 items-center justify-center">
                    {renderCell(variant, size, content)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ButtonMatrixSpecimen() {
  const [content, setContent] = useState<SpecButtonContent>("label");
  const [radiusMode, setRadiusMode] =
    useState<SpecButtonRadiusMode>("circular");

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-stretch gap-5">
      <ButtonMatrixStage
        content={content}
        variants={SPEC_BUTTON_VARIANTS}
        caption="Solid button variants by size"
        stageClassName="bg-white"
        radiusMode={radiusMode}
        onRadiusModeChange={setRadiusMode}
        renderCell={(variant, size, cellContent) => (
          <SpecButtonSample
            variant={variant}
            size={size}
            content={cellContent}
            radiusMode={radiusMode}
          />
        )}
      />
      <FilterPills
        options={MATRIX_CONTENT_OPTIONS}
        value={content}
        onChange={(value) => setContent(value as SpecButtonContent)}
        className="shrink-0 justify-center flex-wrap px-6"
      />
    </div>
  );
}

function GlassMatrixSpecimen() {
  const [content, setContent] = useState<SpecButtonContent>("label");
  const [radiusMode, setRadiusMode] =
    useState<SpecButtonRadiusMode>("circular");

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-stretch gap-5">
      <ButtonMatrixStage
        content={content}
        variants={GLASS_BUTTON_VARIANTS}
        caption="Glass button variants by size"
        stageClassName="bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300"
        radiusMode={radiusMode}
        onRadiusModeChange={setRadiusMode}
        transparentToggle
        renderCell={(variant, size, cellContent) => (
          <GlassButtonSample
            variant={variant}
            size={size}
            content={cellContent}
            radiusMode={radiusMode}
          />
        )}
      />
      <FilterPills
        options={MATRIX_CONTENT_OPTIONS}
        value={content}
        onChange={(value) => setContent(value as SpecButtonContent)}
        className="shrink-0 justify-center flex-wrap px-6"
      />
    </div>
  );
}

const PLAYGROUND_VARIANT_OPTIONS = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "tertiary", label: "Tertiary" },
  { value: "ghost", label: "Ghost" },
];

const PLAYGROUND_GLASS_VARIANT_OPTIONS = PLAYGROUND_VARIANT_OPTIONS.filter(
  (option) => option.value !== "ghost",
);

const PLAYGROUND_SIZE_OPTIONS = [
  { value: "sm", label: "sm" },
  { value: "md", label: "md" },
  { value: "lg", label: "lg" },
];

const PLAYGROUND_CONTENT_OPTIONS = MATRIX_CONTENT_OPTIONS;

const PLAYGROUND_SURFACE_OPTIONS = [
  { value: "solid", label: "Solid" },
  { value: "glass", label: "Glass" },
];

function PlaygroundSettingRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid w-full grid-cols-1 items-center gap-1.5 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-3">
      <span className="text-sm text-zinc-400">{label}</span>
      <div className="flex min-w-0 justify-start">{children}</div>
    </div>
  );
}

function ButtonPlaygroundSpecimen() {
  const [variant, setVariant] = useState<SpecButtonVariant>("primary");
  const [size, setSize] = useState<SpecButtonSize>("md");
  const [content, setContent] = useState<SpecButtonContent>("label");
  const [surface, setSurface] = useState<"solid" | "glass">("solid");
  const [radiusMode, setRadiusMode] =
    useState<SpecButtonRadiusMode>("circular");

  const isGlass = surface === "glass";

  const handleSurfaceChange = (value: string) => {
    const next = value as "solid" | "glass";
    setSurface(next);
    if (next === "glass" && variant === "ghost") setVariant("tertiary");
  };

  return (
    <div className="flex h-full w-full min-h-0 flex-col items-stretch gap-6">
      {/* Fixed stage height — lg / icon+label must not grow the card */}
      <div
        className={`relative flex h-36 shrink-0 items-center justify-center rounded-xl px-6 sm:h-44 ${
          isGlass
            ? "bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300"
            : "bg-white"
        }`}
      >
        <ButtonRadiusToggle
          mode={radiusMode}
          onChange={setRadiusMode}
          transparent={isGlass}
        />
        {isGlass && variant !== "ghost" ? (
          <GlassButtonSample
            variant={variant}
            size={size}
            content={content}
            radiusMode={radiusMode}
          />
        ) : (
          <SpecButtonSample
            variant={variant}
            size={size}
            content={content}
            radiusMode={radiusMode}
          />
        )}
      </div>

      <div
        className="flex w-full shrink-0 flex-col gap-2.5 px-6"
        role="group"
        aria-label="Button playground settings"
      >
        <PlaygroundSettingRow label="Surface">
          <FilterPills
            options={PLAYGROUND_SURFACE_OPTIONS}
            value={surface}
            onChange={handleSurfaceChange}
            className="flex-wrap"
          />
        </PlaygroundSettingRow>
        <PlaygroundSettingRow label="Variant">
          <FilterPills
            options={
              isGlass
                ? PLAYGROUND_GLASS_VARIANT_OPTIONS
                : PLAYGROUND_VARIANT_OPTIONS
            }
            value={variant}
            onChange={(value) => setVariant(value as SpecButtonVariant)}
            className="flex-wrap"
          />
        </PlaygroundSettingRow>
        <PlaygroundSettingRow label="Size">
          <FilterPills
            options={PLAYGROUND_SIZE_OPTIONS}
            value={size}
            onChange={(value) => setSize(value as SpecButtonSize)}
            className="flex-wrap"
          />
        </PlaygroundSettingRow>
        <PlaygroundSettingRow label="Content">
          <FilterPills
            options={PLAYGROUND_CONTENT_OPTIONS}
            value={content}
            onChange={(value) => setContent(value as SpecButtonContent)}
            className="flex-wrap"
          />
        </PlaygroundSettingRow>
      </div>
    </div>
  );
}

function SpecimenInfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path
        d="M12 10.75V16.5M12 7.75V8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * Shared bento tile for component specimens.
 * - Soft zinc-50 rounded card behind every specimen
 * - Outer + card are always `w-full` so the bg fills the grid cell (never shrink-wrap)
 * - `min-h-64` keeps short specimens (e.g. tag badges) level with neighbors
 * - Mobile (< lg): full content-column width; lg+: variable bento spans
 * - `h-full` + grid `items-stretch` / `justify-items-stretch` → equal height + full cell width
 * - Never clips content (no overflow-hidden)
 * - Inner children stay content-sized and centered; only the bg card stretches
 */
function Specimen({
  label,
  children,
  className = "",
  span = "col-span-1 lg:col-span-4",
  labelPosition = "bottom",
}: {
  label?: string;
  children: ReactNode;
  className?: string;
  /** Tailwind col-span utilities for the parent 12-col bento grid */
  span?: string;
  /** Buttons section puts labels above the zinc-50 card */
  labelPosition?: "top" | "bottom";
}) {
  const labelEl = label ? (
    <div className="pl-1 text-base leading-snug text-zinc-400 text-pretty">{label}</div>
  ) : null;
  return (
    <div className={`flex h-full w-full min-w-0 flex-col gap-1.5 self-stretch ${span}`}>
      {labelPosition === "top" ? labelEl : null}
      <div
        className={`flex min-h-64 w-full min-w-0 flex-1 items-center justify-center gap-4 overflow-visible rounded-2xl bg-zinc-50 px-3 py-3 sm:px-6 sm:py-6 ${className}`}
      >
        {children}
      </div>
      {labelPosition === "bottom" ? labelEl : null}
    </div>
  );
}

/**
 * Mobile: single column so every zinc-50 card fills the content width
 * (page px-6 / md:px-16 padding still applies). lg+: 12-col bento packing.
 */
const SPECIMEN_GRID =
  "grid grid-cols-1 items-stretch justify-items-stretch gap-y-8 lg:grid-cols-12 lg:gap-x-5";
/** ~1/4 — icon / compact controls */
const SPAN_NARROW = "col-span-1 lg:col-span-3";
/** ~1/3 — default mid-size specimens */
const SPAN_MID = "col-span-1 lg:col-span-4";
/** ~1/2 — primary CTAs, dual controls */
const SPAN_WIDE = "col-span-1 lg:col-span-6";
/** Full row — lone specimens so the grid never leaves empty columns */
const SPAN_FULL = "col-span-1 lg:col-span-12";

const LIBRARY_OPTIONS = [
  { value: "favorites", label: "favorites", count: 8 },
  { value: "all", label: "all", count: 32 },
  { value: "2026", label: "2026", count: 11 },
  { value: "2025", label: "2025", count: 13 },
];

const FILTER_PILLS = [
  { value: "books", label: "★ Books", count: 5 },
  { value: "2026", label: "2026", count: 10 },
  { value: "2025", label: "2025", count: 13 },
];

const NAV_TABS = [
  { id: "work", label: "Work" },
  { id: "art", label: "Art" },
  { id: "about", label: "About" },
] as const;

type NavTabId = (typeof NAV_TABS)[number]["id"];

/** Sliding-pill nav tabs — same interaction as NavigationTabs, local state only. */
function NavTabsSpecimen() {
  const [active, setActive] = useState<NavTabId>("work");
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<NavTabId, HTMLButtonElement | null>>({
    work: null,
    art: null,
    about: null,
  });
  const [indicator, setIndicator] = useState({ left: 0, width: 0, height: 0, top: 0, ready: false });

  const updateIndicator = useCallback(() => {
    const container = containerRef.current;
    const tab = tabRefs.current[active];
    if (!container || !tab) return;
    const c = container.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    setIndicator({
      left: t.left - c.left,
      width: t.width,
      height: t.height,
      top: t.top - c.top,
      ready: true,
    });
  }, [active]);

  useLayoutEffect(() => {
    updateIndicator();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateIndicator);
    if (containerRef.current) observer.observe(containerRef.current);
    NAV_TABS.forEach((tab) => {
      const el = tabRefs.current[tab.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [updateIndicator]);

  return (
    <div ref={containerRef} className="relative flex flex-wrap justify-center gap-1">
      <div
        aria-hidden
        className={`pointer-events-none absolute left-0 top-0 z-0 rounded-full border border-white/50 bg-zinc-200/60 shadow-glass backdrop-blur-md motion-reduce:transition-none ${
          indicator.ready ? "transition-[transform,width] duration-300 ease-out" : ""
        }`}
        style={{
          transform: `translate3d(${indicator.left}px, ${indicator.top}px, 0)`,
          width: indicator.width,
          height: indicator.height,
          opacity: indicator.ready ? 1 : 0,
        }}
      />
      {NAV_TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            onClick={() => setActive(tab.id)}
            className="group relative z-10 cursor-pointer rounded-full border border-transparent px-3.5 pb-1 pt-[5px]"
          >
            <span
              className={`text-lg font-medium tracking-[0.005em] transition-colors duration-200 ease-out ${
                isActive ? "text-[#52525b]" : "text-[#a1a1aa] group-hover:text-[#52525b]"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Shelf-style filter pills — shared FilterPills with sliding indicator. */
function FilterPillsSpecimen() {
  const [active, setActive] = useState("books");

  return (
    <FilterPills
      options={FILTER_PILLS}
      value={active}
      onChange={setActive}
      className="justify-center"
    />
  );
}

/** Featured work-card title pill chrome — matches HomePageClient ProjectCard. */
function ProjectTitlePill({
  suffix,
  suffixClassName,
}: {
  suffix: string;
  suffixClassName: string;
}) {
  return (
    <div className="flex items-center justify-center rounded-full border border-zinc-100 bg-white px-3 pb-[4.8px] pt-[5px]">
      <p className="font-['Michelle',sans-serif] text-base font-medium leading-[1.4] tracking-[0.005em] text-zinc-900">
        Polaroid <span className={suffixClassName}>• {suffix}</span>
      </p>
    </div>
  );
}

/** Two static states of the project title pill — year at rest, Try It Out! on hover. */
function ProjectTitlePillSpecimen() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-8">
      <div className="flex flex-col items-center gap-3">
        <ProjectTitlePill suffix="2024" suffixClassName="text-zinc-400" />
        <span className="text-xs text-zinc-400">Default</span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <ProjectTitlePill suffix="Try It Out!" suffixClassName="text-blue-400" />
        <span className="text-xs text-zinc-400">Hover</span>
      </div>
    </div>
  );
}

const TAG_BADGE_TAGS: Tag[] = ["canonical", "one-off", "experiment"];

/** Provenance tag chips — decorative labels, non-interactive. */
function TagBadgesSpecimen() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {TAG_BADGE_TAGS.map((tag) => (
        <TagChip key={tag} tag={tag} />
      ))}
    </div>
  );
}

/** Live FilterDropdown with local active value. */
function FilterDropdownSpecimen({
  options,
  initialActive,
  defaultOpen = false,
}: {
  options: { value: string; label: string; count: number }[];
  initialActive: string;
  defaultOpen?: boolean;
}) {
  const [active, setActive] = useState(initialActive);
  return (
    <FilterDropdown
      options={options}
      activeValue={active}
      onChange={setActive}
      defaultOpen={defaultOpen}
    />
  );
}

// Grouped nav groups with sub-headings — mirrors the Art sidebar accordion.
const NAV_GROUPS = [
  {
    id: "fine-art",
    label: "Fine Art",
    children: [
      { id: "painting", label: "Painting", count: 15 },
      { id: "conceptual", label: "Conceptual", count: 4 },
      { id: "graphite", label: "Graphite", count: 3 },
    ],
  },
  {
    id: "sketchbook",
    label: "Sketchbook",
    children: [
      { id: "travel", label: "Travel", count: 12 },
      { id: "figure", label: "Figure", count: 9 },
    ],
  },
  {
    id: "murals",
    label: "Murals",
    children: [
      { id: "ca-poppies", label: "CA Poppies", count: 4 },
      { id: "wonder", label: "Wonder", count: 7 },
      { id: "grapevine", label: "Grapevine", count: 5 },
    ],
  },
];

/** Live instance of the shared Sidebar with expandable sub-headings. */
function SidebarSpecimen() {
  const [openGroup, setOpenGroup] = useState("fine-art");
  const [active, setActive] = useState("painting");

  const nodes: SidebarNode[] = NAV_GROUPS.map((g) => ({
    kind: "group",
    id: g.id,
    label: g.label,
    active: g.children.some((c) => c.id === active),
    expanded: openGroup === g.id,
    children: g.children,
  }));

  const handleSelect = (id: string) => {
    const group = NAV_GROUPS.find((g) => g.id === id);
    if (group) {
      setOpenGroup(id);
      setActive(group.children[0].id);
      return;
    }
    const parent = NAV_GROUPS.find((g) => g.children.some((c) => c.id === id));
    if (parent) {
      setOpenGroup(parent.id);
      setActive(id);
    }
  };

  return (
    <div className="w-full max-w-[180px]">
      <Sidebar nodes={nodes} activeId={active} onSelect={handleSelect} />
    </div>
  );
}

/** Field compositions × interaction states — mirrors Button matrix layout. */
const INPUT_MATRIX_CARD_CLASS =
  "relative min-h-0 !items-stretch !justify-start overflow-hidden";

type SpecInputComposition = "text" | "leading" | "trailing" | "muted";
type SpecInputState = "default" | "focus" | "filled" | "disabled" | "error";

const SPEC_INPUT_COMPOSITIONS: SpecInputComposition[] = [
  "text",
  "leading",
  "trailing",
  "muted",
];
const SPEC_INPUT_STATES: SpecInputState[] = [
  "default",
  "focus",
  "filled",
  "disabled",
  "error",
];

const SPEC_INPUT_COMPOSITION_LABELS: Record<SpecInputComposition, string> = {
  text: "Text",
  leading: "Leading icon",
  trailing: "Trailing icon",
  muted: "Muted",
};

const SPEC_INPUT_STATE_LABELS: Record<SpecInputState, string> = {
  default: "Default",
  focus: "Focus",
  filled: "Filled",
  disabled: "Disabled",
  error: "Error",
};

function SpecInputSample({
  composition,
  state,
}: {
  composition: SpecInputComposition;
  state: SpecInputState;
}) {
  const isDisabled = state === "disabled";
  const isError = state === "error";
  const isFocus = state === "focus";
  /** Filled + error show a value; focus is empty with active border only. */
  const showValue = state === "filled" || state === "error";

  const shellTone = composition === "muted" ? "muted" : "surface";
  const shellClass =
    composition === "leading"
      ? "max-w-[11.5rem] gap-2.5 !pl-1"
      : composition === "trailing"
        ? "max-w-[11.5rem] justify-between"
        : "max-w-[11.5rem]";

  const placeholder =
    composition === "leading"
      ? "Filter"
      : composition === "trailing"
        ? "Enter"
        : composition === "muted"
          ? "Say Hi"
          : "Book Title";

  const filledValue =
    composition === "trailing"
      ? "••••"
      : composition === "leading"
        ? "Books"
        : "Michelle";

  return (
    <FieldShell
      tone={shellTone}
      active={isFocus}
      error={isError}
      className={shellClass}
    >
      {composition === "leading" ? (
        <FieldLeadingIcon>
          <SearchMagnifierIcon />
        </FieldLeadingIcon>
      ) : null}
      <FieldInput
        type={composition === "trailing" ? "password" : "text"}
        inputMode={composition === "leading" ? "search" : undefined}
        placeholder={placeholder}
        defaultValue={showValue ? filledValue : ""}
        disabled={isDisabled}
        readOnly={showValue || isFocus}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label={`${SPEC_INPUT_COMPOSITION_LABELS[composition]} · ${SPEC_INPUT_STATE_LABELS[state]}`}
        className={
          composition === "leading"
            ? "pr-3 font-medium tracking-[0.01em] text-zinc-700"
            : composition === "muted"
              ? "px-3.5"
              : undefined
        }
      />
      {composition === "trailing" ? (
        <FieldTrailingIcon className="text-zinc-400">
          <ArrowRightIcon size="14px" />
        </FieldTrailingIcon>
      ) : null}
    </FieldShell>
  );
}

function InputMatrixSpecimen() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [fadeVisibility, setFadeVisibility] = useState({
    showLeft: false,
    showRight: true,
  });

  const updateFadeVisibility = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const next = getHorizontalFadeVisibility(scroller);
    setFadeVisibility((current) =>
      current.showLeft === next.showLeft &&
      current.showRight === next.showRight
        ? current
        : next,
    );
  }, []);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    updateFadeVisibility();
    const observer = new ResizeObserver(updateFadeVisibility);
    observer.observe(scroller);
    if (scroller.firstElementChild) {
      observer.observe(scroller.firstElementChild);
    }
    return () => observer.disconnect();
  }, [updateFadeVisibility]);

  return (
    <div className="relative flex h-full w-full min-w-0 flex-col items-stretch">
      <div className="flex min-h-0 min-w-0 flex-1 items-stretch justify-center overflow-hidden px-0 py-6 md:items-center">
        <p className="sr-only">Field compositions by interaction state</p>

        {/* Mobile: stacked compositions; states wrap */}
        <div className="flex w-full flex-col gap-5 md:hidden">
          {SPEC_INPUT_COMPOSITIONS.map((composition) => (
            <div key={composition} className="flex flex-col gap-2">
              <span className="text-sm font-normal text-zinc-400">
                {SPEC_INPUT_COMPOSITION_LABELS[composition]}
              </span>
              <div className="flex flex-wrap items-end justify-center gap-x-4 gap-y-3">
                {SPEC_INPUT_STATES.map((state) => (
                  <div
                    key={state}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span className="text-xs font-normal text-zinc-400">
                      {SPEC_INPUT_STATE_LABELS[state]}
                    </span>
                    <div className="flex min-h-12 w-[11.5rem] items-center justify-center">
                      <SpecInputSample composition={composition} state={state} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: labels are outside the horizontal scroller, so they never move. */}
        <div className="relative hidden w-full min-w-0 md:grid md:grid-cols-[7.5rem_minmax(0,1fr)] md:gap-x-3 lg:gap-x-4">
          <div className="relative z-20 grid grid-rows-[1.5rem_repeat(4,3rem)] gap-y-4 bg-zinc-50">
            <div aria-hidden />
            {SPEC_INPUT_COMPOSITIONS.map((composition) => (
              <div
                key={composition}
                className="flex h-12 items-center text-left text-sm font-normal text-zinc-400"
              >
                {SPEC_INPUT_COMPOSITION_LABELS[composition]}
              </div>
            ))}
          </div>

          <div className="relative min-w-0">
            <div
              ref={scrollerRef}
              onScroll={updateFadeVisibility}
              className="h-full min-w-0 overflow-x-auto"
            >
              <div className="grid w-max grid-cols-[repeat(5,12.5rem)] grid-rows-[1.5rem_repeat(4,3rem)] gap-x-3 gap-y-4 lg:gap-x-4">
                {SPEC_INPUT_STATES.map((state) => (
                  <div
                    key={state}
                    className="flex items-start justify-center pb-1 text-center text-sm font-normal text-zinc-400"
                  >
                    {SPEC_INPUT_STATE_LABELS[state]}
                  </div>
                ))}
                {SPEC_INPUT_COMPOSITIONS.flatMap((composition) =>
                  SPEC_INPUT_STATES.map((state) => (
                    <div
                      key={`${composition}-${state}`}
                      className="flex h-12 items-center justify-center"
                    >
                      <SpecInputSample
                        composition={composition}
                        state={state}
                      />
                    </div>
                  )),
                )}
              </div>
            </div>

            <div
              aria-hidden
              className={clsx(
                "pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-zinc-50 to-transparent transition-opacity duration-150 ease-out motion-reduce:transition-none",
                fadeVisibility.showLeft ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              aria-hidden
              className={clsx(
                "pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-zinc-50 to-transparent transition-opacity duration-150 ease-out motion-reduce:transition-none",
                fadeVisibility.showRight ? "opacity-100" : "opacity-0",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InputSpecimensSection() {
  return (
    <>
      <SubLabel>Inputs</SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen
          span={SPAN_FULL}
          className={INPUT_MATRIX_CARD_CLASS}
          labelPosition="top"
        >
          <InputMatrixSpecimen />
        </Specimen>
      </div>
    </>
  );
}

export default function ComponentSection() {
  return (
    <Section id="components" title="Components">
      <SubLabel>Buttons</SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen
          label="Solid"
          span={SPAN_FULL}
          className={BUTTON_MATRIX_CARD_CLASS}
          labelPosition="top"
        >
          <ButtonMatrixSpecimen />
        </Specimen>

        <Specimen
          label="Glass"
          span={SPAN_FULL}
          className={BUTTON_MATRIX_CARD_CLASS}
          labelPosition="top"
        >
          <GlassMatrixSpecimen />
        </Specimen>

        <Specimen
          label="Playground"
          span={SPAN_FULL}
          className={BUTTON_PLAYGROUND_CARD_CLASS}
          labelPosition="top"
        >
          <ButtonPlaygroundSpecimen />
        </Specimen>
      </div>
      <SubLabel>Cards</SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen label="Quote card" span={SPAN_WIDE}>
          <button
            type="button"
            className="flex h-24 w-48 cursor-pointer flex-col justify-center rounded-3xl border border-zinc-100 bg-white px-4 shadow-default shadow-default-hover transition-transform duration-200 hover:scale-[1.01]"
          >
            <span className="text-2xl tracking-[0.01em] text-zinc-700">“delightful.”</span>
          </button>
        </Specimen>

        <Specimen label="Book cover" span={SPAN_WIDE}>
          <button
            type="button"
            className="h-28 w-20 cursor-pointer rounded-sm bg-gradient-to-br from-zinc-300 to-zinc-400 shadow-media transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.02]"
            aria-label="Book cover"
          />
        </Specimen>
      </div>

      <SubLabel note="1px zinc-100 hairline.">
        Dividers
      </SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen label="HorizontalLine · Default" span={SPAN_WIDE}>
          <div className="flex w-full max-w-sm flex-col gap-3">
            <p className="text-sm text-zinc-500">Above</p>
            <HorizontalLine />
            <p className="text-sm text-zinc-500">Below</p>
          </div>
        </Specimen>

        <Specimen label="HorizontalLine · Bleed (mobile)" span={SPAN_WIDE}>
          <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white px-6 py-4">
            <div className="flex flex-col gap-3">
              <p className="text-sm text-zinc-500">Panel content</p>
              <HorizontalLine bleed />
              <p className="text-sm text-zinc-500">Reaches panel edge on mobile</p>
            </div>
          </div>
        </Specimen>
      </div>

      <InputSpecimensSection />

      <SubLabel>Loaders</SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen label="Spinner" span={SPAN_MID}>
          <div className="size-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-400" />
          <div className="size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-400" />
          <div className="size-10 animate-spin rounded-full border-[3px] border-zinc-200 border-t-zinc-400" />
        </Specimen>

        <Specimen label="Shimmer skeleton" span={SPAN_MID}>
          <div className="flex flex-col gap-2">
            <div className="animate-shimmer h-4 w-40 rounded-md" />
            <div className="animate-shimmer h-4 w-28 rounded-md" />
            <div className="animate-shimmer h-16 w-40 rounded-xl" />
          </div>
        </Specimen>

        <Specimen label="Loading dots" span={SPAN_MID}>
          <style>{`@keyframes film-dot-pulse{0%,80%,100%{opacity:.15}40%{opacity:1}}.film-dot{animation:film-dot-pulse 1.4s ease-in-out infinite;opacity:.15}`}</style>
          <p className="text-sm text-zinc-600">
            Loading
            <span className="film-dot" style={{ animationDelay: "0s" }}>.</span>
            <span className="film-dot" style={{ animationDelay: "0.2s" }}>.</span>
            <span className="film-dot" style={{ animationDelay: "0.4s" }}>.</span>
          </p>
        </Specimen>
      </div>

      <SubLabel>Navigation</SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen
          label="Sidebar nav"
          span={SPAN_WIDE}
          className="!items-start !justify-start"
        >
          <SidebarSpecimen />
        </Specimen>

        <Specimen label="Nav tabs" span={SPAN_WIDE}>
          <NavTabsSpecimen />
        </Specimen>

        <Specimen label="Breadcrumb" span={SPAN_WIDE}>
          <div className="flex items-center">
            <button
              type="button"
              className="ml-2 flex cursor-pointer items-center justify-center rounded-md px-1.5 py-0.5 transition-colors duration-200 hover:bg-[#f4f4f5]"
            >
              <span className="text-sm font-medium leading-normal whitespace-nowrap text-[#52525b]">
                Work
              </span>
            </button>
            <Chevron direction="right" className="size-4 shrink-0 text-zinc-500" />
            <div className="flex items-center justify-center px-1 py-0.5">
              <span className="text-sm font-medium leading-normal text-[#27272a]">
                Project
              </span>
            </div>
          </div>
        </Specimen>

        <Specimen label="Tooltip" span={SPAN_WIDE}>
          <div className="flex items-end justify-center gap-10">
            <div className="flex flex-col items-center gap-3">
              <Tooltip label="Tooltip label" position="top" forceOpen>
                <button
                  type="button"
                  className="rounded-full p-2 text-[#a1a1aa]"
                  aria-label="Always-open tooltip"
                  tabIndex={-1}
                >
                  <SpecimenInfoIcon />
                </button>
              </Tooltip>
              <span className="text-xs text-zinc-400">Always open</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Tooltip label="Tooltip label" position="top">
                <button
                  type="button"
                  className="rounded-full p-2 text-[#a1a1aa] transition-colors duration-200 hover:bg-zinc-200/50"
                  aria-label="Show tooltip on hover"
                >
                  <SpecimenInfoIcon />
                </button>
              </Tooltip>
              <span className="text-xs text-zinc-400">On hover</span>
            </div>
          </div>
        </Specimen>

        <Specimen label="Availability badge" span="col-span-1 lg:col-span-8">
          <div className="flex flex-wrap items-end justify-center gap-8">
            <div className="flex flex-col items-center gap-3">
              <ContactBadge size="md" />
              <span className="text-xs text-zinc-400">md · About</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <ContactBadge size="lg" />
              <span className="text-xs text-zinc-400">lg · Header</span>
            </div>
          </div>
        </Specimen>

        <Specimen label="Social / meta link" span="col-span-1 lg:col-span-4">
          <Link
            href="/about"
            className={`group/meta inline-flex items-center text-sm font-medium text-zinc-600 ${INLINE_LINK_CLASS}`}
          >
            Read more
            <span className="ml-1 inline-flex items-center opacity-0 transition-opacity duration-150 ease-out group-hover/meta:opacity-100">
              <ArrowUpRight size="1em" />
            </span>
          </Link>
        </Specimen>
      </div>

      <SubLabel>Pills</SubLabel>
      <div className={SPECIMEN_GRID}>
        <Specimen label="Project title pill" span={SPAN_WIDE}>
          <ProjectTitlePillSpecimen />
        </Specimen>

        <Specimen label="Tag badges" span={SPAN_WIDE}>
          <TagBadgesSpecimen />
        </Specimen>

        <Specimen label="Filter pill" span={SPAN_WIDE}>
          <FilterPillsSpecimen />
        </Specimen>

        <Specimen label="Filter dropdown" span={SPAN_WIDE}>
          <FilterDropdownSpecimen
            options={LIBRARY_OPTIONS}
            initialActive="2026"
            defaultOpen
          />
        </Specimen>
      </div>
    </Section>
  );
}
