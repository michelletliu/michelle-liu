import clsx from "clsx";

type LoadingSpinnerProps = {
  /** Text shown below the spinner */
  label?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * Consistent loading spinner used across pages (About, Art, Library, etc.)
 * Visuals live in `globals.css` under `.loading-spinner`.
 */
export default function LoadingSpinner({
  label,
  size = "sm",
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={clsx("loading-spinner", size, className)}>
      <div className="loading-spinner-ring" />
      {label && <span className="loading-spinner-label">{label}</span>}
    </div>
  );
}
