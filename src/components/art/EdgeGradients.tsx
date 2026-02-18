import clsx from "clsx";

type EdgeGradientsProps = {
  className?: string;
};

/**
 * Reusable edge gradient overlays for horizontal scroll galleries.
 * Provides smooth white fade on left and right edges.
 */
export default function EdgeGradients({ className }: EdgeGradientsProps) {
  return (
    <>
      {/* Left edge gradient fade */}
      <div 
        className={clsx(
          "absolute left-0 top-0 bottom-1 w-20 md:w-24 pointer-events-none z-[5]",
          className
        )}
        style={{ 
          background: 'linear-gradient(to right, white 0%, rgba(255,255,255,0.97) 8%, rgba(255,255,255,0.9) 16%, rgba(255,255,255,0.8) 25%, rgba(255,255,255,0.65) 34%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.2) 70%, rgba(255,255,255,0.08) 85%, transparent 100%)' 
        }}
      />
      
      {/* Right edge gradient fade */}
      <div 
        className={clsx(
          "absolute right-0 top-0 bottom-1 w-20 md:w-24 pointer-events-none z-[5]",
          className
        )}
        style={{ 
          background: 'linear-gradient(to left, white 0%, rgba(255,255,255,0.97) 8%, rgba(255,255,255,0.9) 16%, rgba(255,255,255,0.8) 25%, rgba(255,255,255,0.65) 34%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.2) 70%, rgba(255,255,255,0.08) 85%, transparent 100%)' 
        }}
      />
    </>
  );
}
