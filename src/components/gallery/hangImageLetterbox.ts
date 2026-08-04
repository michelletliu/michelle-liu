/**
 * Fractions of the source image to crop away on each side (0–0.5).
 * Used to hide thin black keylines / letterbox pads that image models
 * sometimes bake into the PNG/WebP before it reaches the wall hang.
 */
export type LetterboxTrim = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export const NO_LETTERBOX_TRIM: LetterboxTrim = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

/** Mean luminance below this (0–255) counts as a dark letterbox band. */
const DARK_LUMA = 36;
/**
 * Cap so a mostly-black painting is not eaten alive. Measured keylines on
 * Reve hangs have been ~1–4% of a side; 8% leaves headroom without risking
 * a crop into the subject.
 */
const MAX_TRIM_FRACTION = 0.08;
/** Max luma range across samples in a letterbox row/col (near-solid black). */
const UNIFORM_RANGE = 32;
/**
 * Just inside the candidate trim, mean luma must rise this much above the
 * letterbox band itself. Absolute floors fail when paint starts dark (umbra,
 * night sky, deep brown ground) — the butterfly hang's bottom keyline sat on
 * dark pigment and was wrongly kept.
 */
const CONTENT_LIFT = 18;

function luma(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function sampleStats(
  width: number,
  height: number,
  rgba: ArrayLike<number>,
  fixed: { axis: "row"; index: number } | { axis: "col"; index: number },
): { mean: number; min: number; max: number } {
  const count = fixed.axis === "row" ? width : height;
  let sum = 0;
  let min = 255;
  let max = 0;
  for (let i = 0; i < count; i++) {
    const x = fixed.axis === "row" ? i : fixed.index;
    const y = fixed.axis === "row" ? fixed.index : i;
    const o = (y * width + x) * 4;
    const L = luma(rgba[o]!, rgba[o + 1]!, rgba[o + 2]!);
    sum += L;
    if (L < min) min = L;
    if (L > max) max = L;
  }
  return { mean: sum / count, min, max };
}

function isDarkLetterboxLine(
  stats: { mean: number; min: number; max: number },
): boolean {
  return stats.mean <= DARK_LUMA && stats.max - stats.min <= UNIFORM_RANGE;
}

function measureSide(
  width: number,
  height: number,
  rgba: ArrayLike<number>,
  side: "top" | "bottom" | "left" | "right",
): number {
  const vertical = side === "top" || side === "bottom";
  const span = vertical ? height : width;
  const maxPx = Math.floor(span * MAX_TRIM_FRACTION);
  if (maxPx < 1) return 0;

  let trimmed = 0;
  let bandSum = 0;
  for (let i = 0; i < maxPx; i++) {
    const index =
      side === "top" || side === "left" ? i : span - 1 - i;
    const fixed =
      vertical
        ? ({ axis: "row", index } as const)
        : ({ axis: "col", index } as const);
    const stats = sampleStats(width, height, rgba, fixed);
    if (!isDarkLetterboxLine(stats)) break;
    trimmed = i + 1;
    bandSum += stats.mean;
  }
  if (trimmed === 0) return 0;

  const probeIndex =
    side === "top" || side === "left" ? trimmed : span - 1 - trimmed;
  if (probeIndex < 0 || probeIndex >= span) return 0;
  const probe = sampleStats(
    width,
    height,
    rgba,
    vertical
      ? { axis: "row", index: probeIndex }
      : { axis: "col", index: probeIndex },
  );
  const bandMean = bandSum / trimmed;
  // Relative to the pad — not an absolute "must look lit" floor.
  if (probe.mean < bandMean + CONTENT_LIFT) return 0;

  return trimmed / span;
}

/**
 * Detect near-solid black letterbox / keyline pads on a decoded RGBA buffer.
 * Returns 0 on every side when nothing qualifies.
 */
export function detectDarkLetterboxTrim(
  width: number,
  height: number,
  rgba: ArrayLike<number>,
): LetterboxTrim {
  if (width < 8 || height < 8 || rgba.length < width * height * 4) {
    return NO_LETTERBOX_TRIM;
  }

  return {
    top: measureSide(width, height, rgba, "top"),
    bottom: measureSide(width, height, rgba, "bottom"),
    left: measureSide(width, height, rgba, "left"),
    right: measureSide(width, height, rgba, "right"),
  };
}

/**
 * Read RGBA from a decoded texture image. Returns null when the canvas is
 * tainted (cross-origin without CORS) — callers keep the full frame.
 */
export function readImageRgba(
  image: CanvasImageSource & { width: number; height: number },
): { width: number; height: number; data: Uint8ClampedArray } | null {
  const width = image.width;
  const height = image.height;
  if (!width || !height) return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0);
    const { data } = ctx.getImageData(0, 0, width, height);
    return { width, height, data };
  } catch {
    return null;
  }
}
