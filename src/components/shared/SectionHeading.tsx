import clsx from "clsx";

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

/**
 * Consistent section heading used throughout About page (Experience, Community,
 * Philosophy, Shelf, Lore) and potentially other pages.
 * Visuals live in `globals.css` under `.section-heading`.
 */
export default function SectionHeading({
  title,
  subtitle,
  className = "",
}: SectionHeadingProps) {
  return (
    <div className={clsx("section-heading", className)}>
      <h2 className="section-heading-title">{title}</h2>
      {subtitle && <p className="section-heading-subtitle">{subtitle}</p>}
    </div>
  );
}
