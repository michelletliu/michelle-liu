import clsx from "clsx";

type HorizontalLineProps = {
  className?: string;
  /**
   * Full-bleed past parent `px-6` on mobile and darken one step (zinc-100 → zinc-200).
   * Used in info modals where the line should reach the panel edges.
   */
  bleed?: boolean;
};

/**
 * 1px horizontal rule — zinc-100 hairline, no vertical padding/margin.
 * Spacing belongs on adjacent content, not on the line.
 */
export function HorizontalLine({ className, bleed = false }: HorizontalLineProps) {
  return (
    <div
      role="separator"
      className={clsx(
        "h-px w-full shrink-0 bg-zinc-100",
        bleed && "max-md:-mx-6 max-md:w-[calc(100%+3rem)] max-md:bg-zinc-200",
        className,
      )}
    />
  );
}
