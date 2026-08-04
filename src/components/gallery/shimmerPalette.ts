/**
 * Hues for the generation shimmer, taken from the artwork that inspired it.
 *
 * Only hues. Chroma and lightness stay with the shader, which ramps them from
 * progress and already measures free of mud. That split is the whole design:
 * the failure mode everyone expects here is that an earth-toned source — half
 * The Met — yields four browns which blend to sludge, and it cannot happen if
 * the source never gets to say how saturated or how dark anything is. A silver-
 * point drawing contributes the angle of its warm sepia and the shader paints
 * that angle at its own healthy chroma, so the shimmer reads as that drawing's
 * colour while staying alive.
 */

/** Hue angles in OKLCh degrees, in the order the shader layers them. */
export type ShimmerHues = [number, number, number, number];

/**
 * Used for text-only generations, and whenever extraction cannot produce
 * something better. Soft mesh-gradient pastels — peach, lime, sky, magenta —
 * matching the white-heavy grain field rather than heavy earth tones.
 */
export const FALLBACK_HUES: ShimmerHues = [32, 95, 205, 330];

/**
 * Smallest angle allowed between two hues in the returned set.
 *
 * Without a floor, a source dominated by one hue collapses all four slots onto
 * roughly the same angle and the canvas becomes a flat single-colour wash with
 * nothing for the layering to do. Fanning them apart by this much is enough to
 * read as pigment varying across a surface, and small enough that the set is
 * still recognisably the source's colour rather than a rainbow built from it.
 */
const MIN_HUE_GAP = 20;

/**
 * Half-width of the window zeroed around each mode when hunting for the next.
 *
 * Sets what counts as "a different colour". Much narrower and the shoulder of
 * one hump reads as its own mode; much wider and neighbouring but genuinely
 * distinct families — a blue and the violet beside it — get merged.
 */
const MODE_SUPPRESSION = 30;

/** Hue histogram resolution. 36 bins is 10 degrees each. */
const HUE_BINS = 36;

/**
 * Pixels this dark or this light have no usable hue: both ends of the
 * lightness range quantise to a handful of RGB values, so their hue angle is
 * mostly rounding noise. Excluding them is also what keeps a white paper
 * ground or a black varnish from voting.
 */
const MIN_LIGHTNESS = 0.18;
const MAX_LIGHTNESS = 0.95;

/**
 * Chroma floors, tried in order until enough of the image qualifies.
 *
 * A vivid painting clears the first on most of its pixels. A near-monochrome
 * drawing clears only the last, and only on its warmest passages — which is
 * exactly the handful of pixels that carry what little hue it has.
 */
const CHROMA_FLOORS = [0.045, 0.025, 0.012, 0.004];

/** Fraction of sampled pixels that must clear a floor for it to be used. */
const MIN_QUALIFYING_FRACTION = 0.02;

/** Longest edge the image is downsampled to before reading pixels. */
export const SAMPLE_EDGE = 72;

function srgbToLinear(c: number) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** sRGB bytes to OKLCh. The inverse of what the shader does on the way out. */
export function rgbToOklch(
  r8: number,
  g8: number,
  b8: number,
): { L: number; C: number; h: number } {
  const r = srgbToLinear(r8);
  const g = srgbToLinear(g8);
  const b = srgbToLinear(b8);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return {
    L,
    C: Math.hypot(a, bb),
    h: (Math.atan2(bb, a) * 180) / Math.PI,
  };
}

const wrap360 = (deg: number) => ((deg % 360) + 360) % 360;

/** Shortest signed angle from `a` to `b`, in the range -180..180. */
export function hueDelta(a: number, b: number) {
  return ((b - a + 540) % 360) - 180;
}

const hueDistance = (a: number, b: number) => Math.abs(hueDelta(a, b));

/**
 * Fan hues apart until none are closer than `MIN_HUE_GAP`, in place.
 *
 * Relaxation rather than redistribution: each crowded pair is pushed apart by
 * half the shortfall each, repeatedly, so the set drifts open around wherever
 * the source actually put it. Four hues need 80 degrees of the circle between
 * them, so this always has room and always settles.
 *
 * Position in the array is meaningful — it decides which shader layer a hue
 * lands on — so the relaxation runs over a sorted *view* and writes back to
 * the slots it came from, rather than returning a sorted set.
 */
export function spreadHues(hues: number[], minGap = MIN_HUE_GAP): number[] {
  const out = hues.map(wrap360);
  const order = out.map((_, i) => i).sort((a, b) => out[a] - out[b]);
  for (let pass = 0; pass < 40; pass++) {
    let crowded = false;
    for (let k = 0; k < order.length; k++) {
      const i = order[k];
      const j = order[(k + 1) % order.length];
      const raw = out[j] - out[i];
      const gap = k === order.length - 1 ? raw + 360 : raw;
      if (gap >= minGap) continue;
      crowded = true;
      const push = (minGap - gap) / 2;
      out[i] = wrap360(out[i] - push);
      out[j] = wrap360(out[j] + push);
    }
    order.sort((a, b) => out[a] - out[b]);
    if (!crowded) break;
  }
  return out;
}

/**
 * The distinct hue modes of a chroma-weighted histogram, strongest first.
 *
 * Non-maximum suppression, and it is the load-bearing decision in this file.
 * Taking the top four bins is what produces four browns from a brown painting:
 * a real histogram is a few broad humps, not spikes, so the bins on either
 * side of the winner are nearly as heavy as the winner and win the next three
 * places. Scoring bins by weight-times-distance does not fix it either — that
 * was tried, and on real images a dominant hump still swept every slot.
 *
 * Zeroing a window around each pick is what forces the next one to be a
 * genuinely different colour. What comes back is the painting's distinct
 * colour families, however many it has, which for a great many paintings is
 * honestly one.
 */
export function hueModes(weights: number[], suppressDegrees = MODE_SUPPRESSION) {
  const centre = (bin: number) => (bin + 0.5) * (360 / weights.length);
  const work = [...weights];
  const found: number[] = [];
  while (found.length < 4) {
    let best = -1;
    for (let i = 0; i < work.length; i++) {
      if (work[i] > 0 && (best < 0 || work[i] > work[best])) best = i;
    }
    if (best < 0) break;
    found.push(centre(best));
    for (let i = 0; i < work.length; i++) {
      if (hueDistance(centre(i), centre(best)) <= suppressDegrees) work[i] = 0;
    }
  }
  return found;
}

/**
 * Order four hues so the shader's layering walks them the short way round.
 *
 * This matters more than it looks. The shader mixes each layer into the hue it
 * has accumulated so far, always along the shorter arc, so the order decides
 * which hues appear *between* the ones chosen. Interleaving a warm family with
 * a blue one — the obvious way to give both families a visible layer — puts a
 * 150 degree jump in every transition, and the pixels caught mid-arc come out
 * vivid green. The Great Wave rendered as turquoise this way, a colour nowhere
 * in the print.
 *
 * Walking the occupied arc from one end instead leaves a single long
 * transition rather than three, so most of the canvas stays inside hues the
 * painting actually has. The walk starts at whichever end is nearer the
 * dominant mode, which keeps the painting's main colour on the base layer.
 */
export function orderForBlending(hues: number[], dominant: number): number[] {
  const sorted = [...hues].map(wrap360).sort((a, b) => a - b);
  // The widest gap is the part of the wheel the painting does not use, so the
  // walk should run between its two edges rather than across it.
  let gapAt = 0;
  let widest = -1;
  for (let i = 0; i < sorted.length; i++) {
    const next = sorted[(i + 1) % sorted.length];
    const gap = wrap360(next - sorted[i]);
    if (gap > widest) {
      widest = gap;
      gapAt = (i + 1) % sorted.length;
    }
  }
  const walk = [...sorted.slice(gapAt), ...sorted.slice(0, gapAt)];
  const headIsCloser =
    hueDistance(walk[0], dominant) <=
    hueDistance(walk[walk.length - 1], dominant);
  return headIsCloser ? walk : walk.reverse();
}

/**
 * Fill the shader's four slots from however many modes the painting has.
 *
 * Each mode gets slots round-robin, so a painting with two colour families
 * spends two slots on each rather than four shades of the dominant one. A mode
 * that comes round again gets a slightly different angle, which is where a
 * single-mode source gets its variation: a sepia drawing fans into a bouquet
 * of warm angles rather than four copies of one hue.
 */
export function pickHues(weights: number[]): ShimmerHues | null {
  const modes = hueModes(weights);
  if (modes.length === 0) return null;

  const slots: number[] = [];
  for (let i = 0; i < 4; i++) {
    const variant = Math.floor(i / modes.length);
    // Alternating either side of the mode so its variants stay centred on the
    // colour actually measured instead of marching away from it.
    const step = Math.ceil(variant / 2) * (variant % 2 === 1 ? -1 : 1);
    slots.push(modes[i % modes.length] + step * MIN_HUE_GAP);
  }
  const ordered = orderForBlending(spreadHues(slots), modes[0]);
  return [ordered[0], ordered[1], ordered[2], ordered[3]];
}

/**
 * Build the chroma-weighted hue histogram for a block of RGBA pixels.
 *
 * Returns `null` when the image has no usable colour at all, which is a real
 * outcome — a pure greyscale scan has no hue to report and should fall back
 * rather than have one invented for it.
 */
export function huesFromPixels(pixels: Uint8ClampedArray): ShimmerHues | null {
  type Sample = { C: number; h: number };
  const samples: Sample[] = [];
  let considered = 0;

  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    considered++;
    const { L, C, h } = rgbToOklch(pixels[i], pixels[i + 1], pixels[i + 2]);
    if (L < MIN_LIGHTNESS || L > MAX_LIGHTNESS) continue;
    samples.push({ C, h });
  }
  if (considered === 0) return null;

  for (const floor of CHROMA_FLOORS) {
    const weights = new Array<number>(HUE_BINS).fill(0);
    let qualifying = 0;
    for (const { C, h } of samples) {
      if (C < floor) continue;
      qualifying++;
      const bin = Math.min(HUE_BINS - 1, Math.floor((wrap360(h) / 360) * HUE_BINS));
      weights[bin] += C;
    }
    if (qualifying / considered < MIN_QUALIFYING_FRACTION) continue;
    const hues = pickHues(weights);
    if (hues) return hues;
  }
  return null;
}

/** Exponential-ease time constant for a palette swap: ~99% inside 400ms. */
const HUE_EASE_TAU = 0.085;

/** The four hue slots as the shader holds them. Structurally a `THREE.Vector4`. */
export type HueSlots = { x: number; y: number; z: number; w: number };

/**
 * Ease the live hues toward a target, one frame's worth.
 *
 * A palette can only arrive after its generation has already started, because
 * the image has to load before it can be read, so the swap always happens
 * mid-shimmer. Cutting straight to it changes the canvas colour in a single
 * frame. Eased, it is a short crossfade, and when the image is already cached
 * it lands while the chroma ramp has barely left zero — there is almost no
 * colour on the canvas yet for the change to show in.
 *
 * Each hue travels the short way round, so amber to rose crosses orange rather
 * than sweeping the long way through green and blue.
 *
 * Eased for reduced-motion users too. This is a colour change rather than
 * movement — the same category as the progress deepening, which reduced motion
 * also leaves alone — and snapping it would be the more abrupt of the two.
 */
export function easeHues(current: HueSlots, target: ShimmerHues, delta: number) {
  const keys = ["x", "y", "z", "w"] as const;
  const t = 1 - Math.exp(-delta / HUE_EASE_TAU);
  for (let i = 0; i < keys.length; i++) {
    const from = current[keys[i]];
    current[keys[i]] = from + hueDelta(from, target[i]) * t;
  }
}

/** Cache keyed by image URL. Extraction is deterministic, so one run is enough. */
const cache = new Map<string, ShimmerHues | null>();
const inFlight = new Map<string, Promise<ShimmerHues | null>>();

/**
 * Read an artwork's hues from its Open Access image.
 *
 * The URL must be same-origin. Drawing a cross-origin image to a canvas taints
 * it and makes `getImageData` throw, and `crossOrigin="anonymous"` does not
 * help here because The Met's image CDN sends no CORS header — so the image
 * arrives by way of our own proxy route. Anything that goes wrong resolves to
 * `null`, which is the fallback palette.
 */
export function extractShimmerHues(
  url: string,
): Promise<ShimmerHues | null> {
  const cached = cache.get(url);
  if (cached !== undefined) return Promise.resolve(cached);
  const pending = inFlight.get(url);
  if (pending) return pending;

  const run = new Promise<ShimmerHues | null>((resolve) => {
    const image = new Image();
    const done = (hues: ShimmerHues | null) => {
      cache.set(url, hues);
      inFlight.delete(url);
      resolve(hues);
    };
    image.onerror = () => done(null);
    image.onload = () => {
      try {
        const scale = SAMPLE_EDGE / Math.max(image.width, image.height, 1);
        const w = Math.max(1, Math.round(image.width * scale));
        const h = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return done(null);
        ctx.drawImage(image, 0, 0, w, h);
        done(huesFromPixels(ctx.getImageData(0, 0, w, h).data));
      } catch {
        // Tainted canvas, or a decode that produced nothing readable.
        done(null);
      }
    };
    image.src = url;
  });

  inFlight.set(url, run);
  return run;
}

/**
 * Hues for an artwork known only by its id.
 *
 * The scene is handed an `objectID` at generation time and nothing else. The
 * proxy route turns that into same-origin image bytes, which is both the only
 * way the pixels can be read at all and, conveniently, a single round trip.
 *
 * Resolves to `null` on any failure, which is the fallback palette. There is
 * no error worth surfacing: a generation whose loading animation used the
 * default colours is not a generation that went wrong.
 */
export function resolveShimmerHues(
  objectID: number,
): Promise<ShimmerHues | null> {
  return extractShimmerHues(
    `/api/met/image?objectID=${encodeURIComponent(objectID)}`,
  );
}
