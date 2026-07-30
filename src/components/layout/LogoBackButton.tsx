import imgLogo from "../../assets/logo.png";

type LogoBackButtonProps = {
  onClick: () => void;
  isEntering?: boolean;
  className?: string;
};

/**
 * Fixed-position logo button used across experiment pages (Screentime, Polaroid, Library, Sketchbook)
 * to navigate back to home or collapse fullscreen mode.
 */
export default function LogoBackButton({
  onClick,
  isEntering = false,
  className = "",
}: LogoBackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed top-8 left-6 md:left-16 z-40 cursor-pointer transition-all duration-300 ease-out hover:opacity-80 ${
        isEntering ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      } ${className}`}
      aria-label="Go back to home"
    >
      <img
        src={imgLogo}
        alt="Michelle Liu Logo"
        className="w-8 h-8 md:w-[44px] md:h-[44px] object-contain"
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
    </button>
  );
}
