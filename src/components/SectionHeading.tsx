type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

/**
 * Consistent section heading used throughout About page (Experience, Community,
 * Philosophy, Shelf, Lore) and potentially other pages.
 */
export default function SectionHeading({
  title,
  subtitle,
  className = "",
}: SectionHeadingProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <h2 className="font-['Michelle',sans-serif] font-medium text-zinc-600 text-3xl leading-normal shrink-0">
        {title}
      </h2>
      {subtitle && (
        <p className="font-['Michelle',sans-serif] tracking-wide font-normal text-zinc-400 text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}
