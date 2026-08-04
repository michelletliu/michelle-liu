import coffeeFillIcon from "../../assets/coffee-fill.svg";

export type CoffeeProps = {
  className?: string;
  size?: string;
};

/**
 * Coffee mug + steam — from the coffee-fill glyph.
 * Prefer `size={iconSize(...)}` from `iconSizes`.
 * Footer uses `meta` (12px); design-system specimen uses `toolbar` (20px).
 */
export function Coffee({ className = "", size }: CoffeeProps) {
  const dim = size ?? "1em";
  return (
    <span
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        width: dim,
        height: dim,
        verticalAlign: "middle",
        maskImage: `url(${coffeeFillIcon})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url(${coffeeFillIcon})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }}
      aria-hidden
    />
  );
}

export function CoffeeIcon(props: CoffeeProps) {
  return <Coffee {...props} />;
}

export default Coffee;
