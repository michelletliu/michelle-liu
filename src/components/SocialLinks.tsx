import React from "react";
import svgPaths from "../imports/svg-2tsxp86msm";
import LumaLogo from "../assets/LumaLogo.svg";
import { imgGroup } from "../imports/svg-poktt";
import Tooltip from "./Tooltip";

/**
 * SVG wrapper for social link icons (Instagram, X, LinkedIn, Luma).
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

const SOCIAL_ICONS = [
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
 * Footer social icon row with hover tooltips (Instagram, X, LinkedIn, Luma).
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
