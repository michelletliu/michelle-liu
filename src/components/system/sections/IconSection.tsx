"use client";

import type { ReactNode } from "react";
import { ArrowUpRight } from "../../icons/ArrowUpRight";
import { LinkIcon } from "../../icons/LinkIcon";
import { TouchIcon } from "../../icons/TouchIcon";
import { Chevron } from "../../icons/Chevron";
import { Close } from "../../icons/Close";
import { Code } from "../../icons/Code";
import { Arrow } from "../../icons/Arrow";
import { Expand } from "../../icons/Expand";
import { Info } from "../../icons/Info";
import { XLogo } from "../../icons/XLogo";
import { iconSize, iconSizes, ICON_STROKE_WIDTH, type IconSizeName } from "../../shared/iconSizes";
import {
  PlusIcon,
  SendIcon,
  SmileyIcon,
  GridIcon,
  CircleIcon,
  SquircleIcon,
} from "../../library/icons";
import { SocialLinksBackgroundImage } from "../../SocialLinks";
import svgPaths from "../../icons/figma/svg-2tsxp86msm";
import LumaLogo from "../../../assets/LumaLogo.svg";
import heartFillIcon from "../../../assets/HeartFill.svg";
import academicCapIcon from "../../../assets/academic-cap.svg";
import mapPinIcon from "../../../assets/map-pin.svg";
import coffeeFillIcon from "../../../assets/coffee-fill.svg";
import { Section, SubLabel, Grid } from "../primitives";

const ICON_SIZE_RAMP: IconSizeName[] = [
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
];

const APPLE_LOGO_PATH =
  "M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z";

const GITHUB_LOGO_PATH =
  "M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z";

/** Renders a filled SVG asset as currentColor via CSS mask (keeps fill icons filled). */
function FilledAssetIcon({ src, className = "size-5" }: { src: string; className?: string }) {
  return (
    <span
      className={`inline-block bg-current ${className}`}
      style={{
        maskImage: `url(${src})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }}
      aria-hidden
    />
  );
}

function EyeIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5.25C4.5 5.25 1.5 12 1.5 12C1.5 12 4.5 18.75 12 18.75C19.5 18.75 22.5 12 22.5 12C22.5 12 19.5 5.25 12 5.25Z"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75Z"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14.12 14.12C13.5646 14.6755 12.7998 14.9855 12 14.9855C11.2002 14.9855 10.4354 14.6755 9.88 14.12C9.32457 13.5646 9.0145 12.7998 9.0145 12C9.0145 11.2002 9.32457 10.4354 9.88 9.88"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path d="M4.5 4.5L19.5 19.5" stroke="currentColor" strokeWidth={ICON_STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path
        d="M9.75 5.5C10.485 5.34 11.235 5.25 12 5.25C19.5 5.25 22.5 12 22.5 12C22.02 12.945 21.42 13.815 20.73 14.61"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M17.94 17.94C16.23 19.17 14.16 19.875 12 19.875C4.5 19.875 1.5 13.125 1.5 13.125C2.505 11.205 3.975 9.54 5.775 8.355"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="11"
        cy="11"
        r="7"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M20 20L16.5 16.5"
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="size-5" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="2.75" fill="currentColor" />
      <line x1="8" y1="1" x2="8" y2="2.75" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="8" y1="13.25" x2="8" y2="15" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="15" y1="8" x2="13.25" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="2.75" y1="8" x2="1" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="12.95" y1="3.05" x2="11.75" y2="4.25" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="4.25" y1="11.75" x2="3.05" y2="12.95" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="12.95" y1="12.95" x2="11.75" y2="11.75" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="4.25" y1="4.25" x2="3.05" y2="3.05" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="size-5" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M14 9.27A6.5 6.5 0 1 1 6.73 2 5.5 5.5 0 0 0 14 9.27Z" />
    </svg>
  );
}

/** Lucide check used by shadcn checkbox / menus. */
function CheckIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={ICON_STROKE_WIDTH} aria-hidden>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="size-5" viewBox="0 0 19 28" fill="none" aria-hidden>
      <path
        d="M3.13274 27.3175C2.1117 27.3175 1.33199 27.039 0.793626 26.4821C0.264542 25.9251 0 25.099 0 24.0037V14.4106C0 13.3153 0.264542 12.4938 0.793626 11.9462C1.33199 11.3892 2.1117 11.1108 3.13274 11.1108H15.8725C16.8936 11.1108 17.6686 11.3892 18.1977 11.9462C18.7361 12.4938 19.0053 13.3153 19.0053 14.4106V24.0037C19.0053 25.099 18.7361 25.9251 18.1977 26.4821C17.6686 27.039 16.8936 27.3175 15.8725 27.3175H3.13274ZM2.43657 12.1829V7.78311C2.43657 6.03806 2.77073 4.59004 3.43905 3.43905C4.11665 2.28806 4.99381 1.42946 6.07054 0.863242C7.14728 0.287747 8.28899 0 9.49567 0C10.7116 0 11.858 0.287747 12.9347 0.863242C14.0114 1.42946 14.884 2.28806 15.5523 3.43905C16.2299 4.59004 16.5687 6.03806 16.5687 7.78311V12.1829H14.3688V7.47679C14.3688 6.30724 14.1414 5.32333 13.6866 4.52506C13.241 3.72679 12.647 3.12345 11.9044 2.71504C11.1711 2.30662 10.3682 2.10241 9.49567 2.10241C8.63243 2.10241 7.82952 2.30662 7.08694 2.71504C6.35365 3.12345 5.76423 3.72679 5.31869 4.52506C4.87314 5.32333 4.65037 6.30724 4.65037 7.47679V12.1829H2.43657Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Film play control — FilmPage. */
function FilmPlayIcon() {
  return (
    <svg className="size-4" viewBox="0 0 88 99" fill="none" aria-hidden>
      <path
        d="M0 89.8828V8.55469C0 5.625 0.722656 3.47656 2.16797 2.10938C3.61328 0.703125 5.33203 0 7.32422 0C9.08203 0 10.8789 0.507812 12.7148 1.52344L80.9766 41.4258C83.3984 42.832 85.0781 44.1016 86.0156 45.2344C86.9922 46.3281 87.4805 47.6562 87.4805 49.2188C87.4805 50.7422 86.9922 52.0703 86.0156 53.2031C85.0781 54.3359 83.3984 55.6055 80.9766 57.0117L12.7148 96.9141C10.8789 97.9297 9.08203 98.4375 7.32422 98.4375C5.33203 98.4375 3.61328 97.7344 2.16797 96.3281C0.722656 94.9219 0 92.7734 0 89.8828Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Film pause control — FilmPage. */
function FilmPauseIcon() {
  return (
    <svg className="size-4" viewBox="0 0 72 97" fill="none" aria-hidden>
      <path
        d="M7.79297 96.9141C5.21484 96.9141 3.26172 96.25 1.93359 94.9219C0.644531 93.5938 0 91.6406 0 89.0625V7.79297C0 5.21484 0.644531 3.28125 1.93359 1.99219C3.26172 0.664062 5.21484 0 7.79297 0H21.1523C23.6914 0 25.625 0.625 26.9531 1.875C28.2812 3.125 28.9453 5.09766 28.9453 7.79297V89.0625C28.9453 91.6406 28.2812 93.5938 26.9531 94.9219C25.625 96.25 23.6914 96.9141 21.1523 96.9141H7.79297ZM50.3906 96.9141C47.8125 96.9141 45.8594 96.25 44.5312 94.9219C43.2031 93.5938 42.5391 91.6406 42.5391 89.0625V7.79297C42.5391 5.21484 43.2031 3.28125 44.5312 1.99219C45.8594 0.664062 47.8125 0 50.3906 0H63.6914C66.2695 0 68.2031 0.625 69.4922 1.875C70.8203 3.125 71.4844 5.09766 71.4844 7.79297V89.0625C71.4844 91.6406 70.8203 93.5938 69.4922 94.9219C68.2031 96.25 66.2695 96.9141 63.6914 96.9141H50.3906Z"
        fill="currentColor"
      />
    </svg>
  );
}

type IconSpecimen = {
  name: string;
  sample: ReactNode;
};

/** PascalCase component names → sentence-case labels (e.g. ArrowUpRight → Arrow up right). */
const BRAND_ICON_LABELS = new Set(["GitHub", "LinkedIn"]);

function iconDisplayName(name: string): string {
  if (BRAND_ICON_LABELS.has(name) || /[\s/]/.test(name)) return name;
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word.toLowerCase(),
    )
    .join(" ");
}

function IconCard({ name, sample }: IconSpecimen) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex h-[120px] min-h-[120px] items-center justify-center overflow-hidden rounded-xl bg-zinc-50 text-zinc-500 md:h-24 md:min-h-24">
        {sample}
      </div>
      <div className="pl-1 text-base leading-snug text-zinc-400 text-pretty">{iconDisplayName(name)}</div>
    </div>
  );
}

/** Standard specimen canvas. Compact filled paths receive optical compensation below. */
const MD = iconSize("md");
const FILLED_COMPACT_SIZE = 24;

/** Filled icons — solid glyphs, A–Z by display label. */
const filledIcons: IconSpecimen[] = [
  {
    name: "Academic cap",
    sample: <FilledAssetIcon src={academicCapIcon} className="size-6" />,
  },
  {
    name: "Apple",
    sample: (
      <svg className="size-5" viewBox="0 0 814 1000" fill="currentColor" aria-hidden>
        <path d={APPLE_LOGO_PATH} />
      </svg>
    ),
  },
  {
    name: "Circle",
    sample: <CircleIcon size={FILLED_COMPACT_SIZE} />,
  },
  {
    name: "Coffee",
    sample: <FilledAssetIcon src={coffeeFillIcon} className="size-5" />,
  },
  {
    name: "Favorites star",
    sample: (
      <span className="flex size-5 items-center justify-center text-xl leading-none text-current">
        ★
      </span>
    ),
  },
  {
    name: "Grid",
    sample: <GridIcon size={MD} filled />,
  },
  {
    name: "Heart fill",
    sample: <FilledAssetIcon src={heartFillIcon} />,
  },
  {
    name: "Lock",
    sample: <LockIcon />,
  },
  {
    name: "Map pin",
    sample: <FilledAssetIcon src={mapPinIcon} className="size-6" />,
  },
  {
    name: "Moon",
    sample: <MoonIcon />,
  },
  {
    name: "Pause",
    sample: <FilmPauseIcon />,
  },
  {
    name: "Play",
    sample: <FilmPlayIcon />,
  },
  {
    name: "Squircle",
    sample: <SquircleIcon size={FILLED_COMPACT_SIZE} />,
  },
  {
    name: "Sun",
    sample: <SunIcon />,
  },
];

/** Social marks — LinkedIn, X, Instagram, Luma, GitHub. */
const socialIcons: IconSpecimen[] = [
  {
    name: "LinkedIn",
    sample: (
      <SocialLinksBackgroundImage>
        <path d={svgPaths.p1e086000} fill="currentColor" stroke="currentColor" />
      </SocialLinksBackgroundImage>
    ),
  },
  {
    name: "X",
    sample: (
      <XLogo className="h-4 w-[19px]" />
    ),
  },
  {
    name: "Instagram",
    sample: (
      <SocialLinksBackgroundImage>
        <path d={svgPaths.p2c5f2300} fill="currentColor" />
      </SocialLinksBackgroundImage>
    ),
  },
  {
    name: "Luma",
    sample: (
      <img
        src={LumaLogo}
        alt=""
        className="size-6"
        style={{
          filter:
            "brightness(0) saturate(100%) invert(48%) sepia(6%) saturate(500%) hue-rotate(182deg) brightness(94%) contrast(88%)",
        }}
      />
    ),
  },
  {
    name: "GitHub",
    sample: (
      <svg className="size-5" viewBox="0 0 98 96" fill="currentColor" aria-hidden>
        <path fillRule="evenodd" clipRule="evenodd" d={GITHUB_LOGO_PATH} />
      </svg>
    ),
  },
];
/** Stroke icons — A–Z by display label; all specimens at md size. */
const uiIcons: IconSpecimen[] = [
  {
    name: "Arrow",
    sample: <Arrow size={MD} />,
  },
  {
    name: "ArrowUpRight",
    sample: <ArrowUpRight size={MD} />,
  },
  {
    name: "Check",
    sample: <CheckIcon />,
  },
  {
    name: "Chevron",
    sample: <Chevron size={MD} />,
  },
  {
    name: "Close",
    sample: <Close size={MD} />,
  },
  {
    name: "Code",
    sample: <Code size={MD} />,
  },
  {
    name: "Expand",
    sample: <Expand size={MD} />,
  },
  {
    name: "Eye",
    sample: <EyeIcon />,
  },
  {
    name: "Eye off",
    sample: <EyeOffIcon />,
  },
  {
    name: "Grid",
    sample: <GridIcon size={iconSizes.md} />,
  },
  {
    name: "Info",
    sample: <Info size={MD} />,
  },
  {
    name: "Link",
    sample: <LinkIcon size={MD} />,
  },
  {
    name: "Plus",
    sample: <PlusIcon className="size-5" />,
  },
  {
    name: "Search",
    sample: <SearchIcon />,
  },
  {
    name: "Send",
    sample: <SendIcon className="size-5" />,
  },
  {
    name: "Smiley",
    sample: <SmileyIcon className="size-5" />,
  },
  {
    name: "Touch",
    sample: <TouchIcon size={MD} />,
  },
];

export default function IconSection() {
  return (
    <Section id="icons" title="Iconography">
      <SubLabel>Size</SubLabel>
      <div className="mb-10 grid h-[200px] grid-cols-5 items-center gap-x-8 rounded-xl bg-zinc-50 px-6">
        {ICON_SIZE_RAMP.map((name) => {
          const px = iconSizes[name];
          return (
            <div key={name} className="flex translate-y-1 flex-col">
              <div className="flex h-8 items-end justify-center pt-4">
                <div
                  aria-hidden
                  className="shrink-0 rounded-[2px] bg-blue-100 ring-1 ring-inset ring-blue-400"
                  style={{ width: px, height: px }}
                />
              </div>
              <div className="mt-3 flex flex-col items-center gap-0.5 text-center">
                <code className="font-mono text-sm text-zinc-700">{name}</code>
                <code className="font-mono text-xs tabular-nums text-zinc-400">
                  {px}px
                </code>
              </div>
            </div>
          );
        })}
      </div>

      <SubLabel>Filled</SubLabel>
      <Grid min="160px">
        {filledIcons.map((icon) => (
          <IconCard key={icon.name} {...icon} />
        ))}
      </Grid>

      <SubLabel>Stroke</SubLabel>
      <Grid min="160px">
        {uiIcons.map((icon) => (
          <IconCard key={icon.name} {...icon} />
        ))}
      </Grid>

      <SubLabel>Social</SubLabel>
      <Grid min="160px">
        {socialIcons.map((icon) => (
          <IconCard key={icon.name} {...icon} />
        ))}
      </Grid>
    </Section>
  );
}
