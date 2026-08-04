import clsx from "clsx";

type HorizontalLineProps = {
  className?: string;
};

/**
 * 1px horizontal rule — zinc-100 hairline, no vertical padding/margin.
 * Spacing belongs on adjacent content, not on the line.
 */
export function HorizontalLine({ className }: HorizontalLineProps) {
  return (
    <div
      role="separator"
      className={clsx("horizontal-line shrink-0", className)}
    />
  );
}
