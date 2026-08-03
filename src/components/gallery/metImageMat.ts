/**
 * Some Met Open Access JPEGs ship with a baked-in black digital mat / letterbox
 * (not a CSS border). Cropping those edges on display keeps the painting filling
 * the tile or frame instead of showing a thick black surround.
 *
 * Fractions are measured from `primaryImageSmall` against near-black edge rows
 * and columns; fame is no guide — Irises is clean, Manet's garden scene is not.
 */
export const MET_BLACK_MAT_TRIM: Readonly<Record<number, number>> = {
  // Edouard Manet, The Monet Family in Their Garden at Argenteuil — ~4.5–7%
  436965: 0.075,
  // Vincent van Gogh, Wheat Field with Cypresses — ~2–3.5%
  436535: 0.055,
  // Vincent van Gogh, La Berceuse — ~1.5–2%
  437984: 0.04,
};

/** Uniform scale that trims `trim` from each edge inside an overflow-hidden box. */
export function metImageTrimScale(objectID: number): number {
  const trim = MET_BLACK_MAT_TRIM[objectID] ?? 0;
  if (trim <= 0) return 1;
  return 1 / (1 - 2 * trim);
}

/** Inline style for an `<img>` that should hide a known Met black mat. */
export function metImageTrimStyle(
  objectID: number,
): { transform: string } | undefined {
  const scale = metImageTrimScale(objectID);
  if (scale <= 1) return undefined;
  return { transform: `scale(${scale})` };
}
