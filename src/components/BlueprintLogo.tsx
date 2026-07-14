import clsx from "clsx";
import imgFinalSealLogo from "../assets/logo.png";

type BlueprintLogoProps = {
  /** hover: red seal by default, blueprint on group-hover. always: zinc blueprint (design system). */
  mode?: "hover" | "always";
  className?: string;
};

/**
 * Seal logo with an animated zinc-400 blueprint frame (crop marks) around it.
 * The seal matches the red logo's box size; the frame paints outside via
 * overflow + negative inset so layout doesn't shift.
 */
export default function BlueprintLogo({
  mode = "hover",
  className,
}: BlueprintLogoProps) {
  const always = mode === "always";

  return (
    <span
      className={clsx(
        "blueprint-logo relative block size-full overflow-visible",
        always && "blueprint-logo--always",
        className
      )}
      aria-hidden="true"
    >
      {/* Red seal — fades out on hover when in hover mode */}
      {!always && (
        <img
          alt=""
          src={imgFinalSealLogo}
          className="absolute inset-0 size-full object-contain pointer-events-none transition-opacity duration-300 ease-out group-hover:opacity-0"
        />
      )}

      {/* Zinc-400 monochrome seal (mask of the same glyph) */}
      <span
        className={clsx(
          "absolute inset-0 bg-zinc-400 transition-opacity duration-300 ease-out pointer-events-none",
          always ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
        style={{
          WebkitMaskImage: `url(${imgFinalSealLogo})`,
          maskImage: `url(${imgFinalSealLogo})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />

      {/* Blueprint frame — sized larger than the seal with negative inset */}
      <svg
        className={clsx(
          "blueprint-frame pointer-events-none absolute -inset-2 text-zinc-400",
          always
            ? "opacity-100"
            : "opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
        )}
        viewBox="0 0 100 100"
        fill="none"
        overflow="visible"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer frame square with corner extensions (registration / crop marks) */}
        <g
          className="blueprint-frame-strokes"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="square"
          vectorEffect="non-scaling-stroke"
        >
          {/* Horizontal rails */}
          <line className="blueprint-frame-line" x1="-8" y1="8" x2="108" y2="8" />
          <line className="blueprint-frame-line" x1="-8" y1="92" x2="108" y2="92" />
          {/* Vertical rails */}
          <line className="blueprint-frame-line" x1="8" y1="-8" x2="8" y2="108" />
          <line className="blueprint-frame-line" x1="92" y1="-8" x2="92" y2="108" />
        </g>
      </svg>
    </span>
  );
}
