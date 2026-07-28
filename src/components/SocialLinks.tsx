import React from "react";
import svgPaths from "../imports/svg-2tsxp86msm";
import LumaLogo from "../assets/LumaLogo.svg";
import { imgGroup } from "../imports/svg-poktt";
import Tooltip from "./Tooltip";

/**
 * SVG wrapper for social link icons (Instagram, X, LinkedIn, Luma, GitHub).
 * Used in Footer and HomePageClient.
 */
export function SocialLinksBackgroundImage({
  children,
}: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-6">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Social Links">{children}</g>
      </svg>
    </div>
  );
}

type LinksBackgroundImageAndTextProps = {
  text: string;
  href?: string;
};

/**
 * Styled text link used in the footer's nav column and social rows.
 * Optionally wraps in an anchor when `href` is provided.
 */
export function LinksBackgroundImageAndText({
  text,
  href,
}: LinksBackgroundImageAndTextProps) {
  const content = (
    <p
      className={`font-['Michelle',sans-serif] leading-5 relative shrink-0 text-[#a1a1aa] text-base text-nowrap tracking-[0.01em] ${
        href ? "hover:text-blue-500 transition-colors duration-200" : ""
      }`}
    >
      {text}
    </p>
  );

  if (href) {
    return (
      <a
        href={href}
        className="content-stretch flex items-center justify-center px-0.5 py-0 relative rounded-full shrink-0"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="content-stretch flex items-center justify-center px-0.5 py-0 relative rounded-full shrink-0">
      {content}
    </div>
  );
}

const GITHUB_LOGO_PATH =
  "M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z";

const SOCIAL_ICONS = [
  {
    label: "GitHub",
    href: "https://github.com/michelletliu",
    className: "social-link",
    icon: (
      <div className="content-stretch flex items-center justify-center relative shrink-0 size-6">
        <svg
          className="block size-5"
          viewBox="0 0 98 96"
          fill="var(--fill-0, #d4d4d8)"
          aria-hidden
        >
          <path fillRule="evenodd" clipRule="evenodd" d={GITHUB_LOGO_PATH} />
        </svg>
      </div>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/studio.mliu",
    className: "social-link",
    icon: (
      <SocialLinksBackgroundImage>
        <path d={svgPaths.p2c5f2300} fill="var(--fill-0, #d4d4d8)" id="Vector" />
      </SocialLinksBackgroundImage>
    ),
  },
  {
    label: "X",
    href: "https://x.com/michelletliu",
    className: "social-link",
    icon: (
      <div className="content-stretch flex items-center justify-center relative shrink-0 size-6">
        <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
          <div
            className="[grid-area:1_/_1] h-[17.219px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_-0.89px] mask-size-[19px_19px] ml-0 mt-[4.69%] relative w-[19px]"
            style={{ maskImage: `url('${imgGroup}')` }}
          >
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 18">
              <g id="Group">
                <path d={svgPaths.p16308a80} fill="var(--fill-0, #d4d4d8)" id="Vector" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/michelletliu",
    className: "social-link social-link-linkedin",
    icon: (
      <div className="content-stretch flex items-center justify-center relative shrink-0 size-6">
        <SocialLinksBackgroundImage>
          <path d={svgPaths.p1e086000} fill="var(--fill-0, #d4d4d8)" id="Vector" stroke="var(--stroke-0, #d4d4d8)" />
        </SocialLinksBackgroundImage>
      </div>
    ),
  },
  {
    label: "Luma",
    href: "https://lu.ma/user/michelletliu",
    className: "social-link",
    icon: (
      <div className="content-stretch flex items-center justify-center relative shrink-0 size-6">
        <img
          src={LumaLogo}
          alt=""
          aria-hidden
          className="size-6 transition-opacity"
          style={{
            filter:
              "brightness(0) saturate(100%) invert(85%) sepia(5%) saturate(300%) hue-rotate(180deg) brightness(95%)",
          }}
        />
      </div>
    ),
  },
] as const;

/**
 * Footer social icon row with hover tooltips (GitHub, Instagram, X, LinkedIn, Luma).
 * Uses the site Tooltip (400ms delay / warmup) — same pattern as Expand / Polaroid.
 */
export function SocialIconLinks() {
  return (
    <div className="content-stretch flex gap-6 items-start relative shrink-0">
      {SOCIAL_ICONS.map(({ label, href, className, icon }) => (
        <Tooltip key={label} label={label} position="top">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            aria-label={label}
          >
            {icon}
          </a>
        </Tooltip>
      ))}
    </div>
  );
}
