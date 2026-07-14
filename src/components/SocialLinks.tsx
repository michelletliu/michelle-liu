import React from "react";

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
