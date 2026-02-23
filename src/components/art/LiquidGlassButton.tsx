import { useRef, useEffect, useId, useState, type ReactNode, type ButtonHTMLAttributes } from "react";

function smoothStep(a: number, b: number, t: number) {
  t = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function len(x: number, y: number) {
  return Math.sqrt(x * x + y * y);
}

function generateDisplacementMap(
  canvas: HTMLCanvasElement,
  size: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;

  const w = size;
  const h = size;
  const data = new Uint8ClampedArray(w * h * 4);
  const rawValues: number[] = [];
  let maxScale = 0;

  for (let i = 0; i < data.length; i += 4) {
    const px = (i / 4) % w;
    const py = Math.floor(i / 4 / w);
    const ux = px / w;
    const uy = py / h;

    const ix = ux - 0.5;
    const iy = uy - 0.5;

    // Circular SDF
    const distanceToEdge = len(ix, iy) - 0.38;
    const displacement = smoothStep(0.8, 0, distanceToEdge - 0.12);
    const scaled = smoothStep(0, 1, displacement);

    const outX = ix * scaled + 0.5;
    const outY = iy * scaled + 0.5;

    const dx = outX * w - px;
    const dy = outY * h - py;
    maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
    rawValues.push(dx, dy);
  }

  maxScale *= 0.5;

  let index = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = rawValues[index++] / maxScale + 0.5;
    const g = rawValues[index++] / maxScale + 0.5;
    data[i] = r * 255;
    data[i + 1] = g * 255;
    data[i + 2] = 0;
    data[i + 3] = 255;
  }

  ctx.putImageData(new ImageData(data, w, h), 0, 0);
  return maxScale;
}

interface LiquidGlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: number;
}

export default function LiquidGlassButton({
  children,
  size = 36,
  style,
  ...props
}: LiquidGlassButtonProps) {
  const filterId = useId().replace(/:/g, "_");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const scaleRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    canvas.style.display = "none";
    canvasRef.current = canvas;

    const maxScale = generateDisplacementMap(canvas, size);
    scaleRef.current = maxScale;

    if (svgRef.current) {
      const feImage = svgRef.current.querySelector("feImage");
      const feDisp = svgRef.current.querySelector("feDisplacementMap");
      if (feImage) {
        feImage.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "href",
          canvas.toDataURL()
        );
      }
      if (feDisp) {
        const displacementScale = maxScale * (isMobile ? 1.38 : 1);
        feDisp.setAttribute("scale", displacementScale.toString());
      }
    }

    return () => {
      canvas.remove();
    };
  }, [size, filterId, isMobile]);

  return (
    <>
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        width="0"
        height="0"
        style={{ position: "absolute", pointerEvents: "none" }}
      >
        <defs>
          <filter
            id={`lg${filterId}`}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
            x="0"
            y="0"
            width={size}
            height={size}
          >
            <feImage
              width={size}
              height={size}
            />
            <feDisplacementMap
              in="SourceGraphic"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <button
        {...props}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: "none",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          isolation: "isolate",
          boxShadow: isMobile
            ? "0 6px 28px rgba(0, 0, 0, 0.22)"
            : "0 4px 22px rgba(0, 0, 0, 0.15)",
          backgroundColor: "transparent",
          backdropFilter: isMobile ? `url(#lg${filterId}) blur(1.1px)` : `url(#lg${filterId})`,
          WebkitBackdropFilter: isMobile
            ? `url(#lg${filterId}) blur(1.1px)`
            : `url(#lg${filterId})`,
          ...style,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            boxShadow: isMobile
              ? "inset 0 0 22px -4px rgba(255, 255, 255, 0.56)"
              : "inset 0 0 20px -5px rgba(255, 255, 255, 0.45)",
            backgroundColor: isMobile ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.06)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <span
          style={{
            position: "relative",
            zIndex: 2,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </span>
      </button>
    </>
  );
}
