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
 */
export default function LoadingSpinner({
  label,
  size = "sm",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-10 h-10 border-3",
  };

  return (
    <div className={clsx("flex items-center gap-3", className)}>
      <div
        className={clsx(
          "border-gray-200 border-t-gray-400 rounded-full animate-spin",
          sizeClasses[size]
        )}
      />
      {label && <span className="text-gray-400 text-sm">{label}</span>}
    </div>
  );
}
