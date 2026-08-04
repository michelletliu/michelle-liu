/**
 * The inspiration strip's opening hand.
 *
 * Search only helps someone who already has an artist in mind. Everyone else
 * met an empty grid, so the strip now opens on a fixed set of works chosen to
 * be recognisable at thumbnail size and to spread widely across medium and
 * period — the two things `metArtworks` derives its style cues from, so a
 * varied set is also a set that generates visibly different pictures.
 *
 * Stored as bare object ids because that is the only key The Met publishes that
 * does not change. Every id below was checked against `/objects/{id}` for
 * `isPublicDomain: true` and a live `primaryImageSmall`, one at a time: fame is
 * no guide to availability here, and Monet — whose Met holdings are entirely
 * outside Open Access — is the standing reminder of that.
 *
 * The route hydrating these filters out anything that has since stopped being
 * Open Access, so a work being pulled costs one tile rather than the strip.
 */
export const CURATED_MET_OBJECT_IDS: readonly number[] = [
  39799, // Hokusai, Under the Wave off Kanagawa (The Great Wave) — woodblock, ca. 1830–32
  436535, // Van Gogh, Wheat Field with Cypresses — oil on canvas, 1889
  337499, // J. M. W. Turner, The Lake of Zug — watercolour and gouache, 1843
  436528, // Van Gogh, Irises — oil on canvas, 1890
  437654, // Seurat, Circus Sideshow (Parade de cirque) — oil on canvas, 1887–88
  436532, // Van Gogh, Self-Portrait with a Straw Hat — oil on canvas, 1887
  436140, // Degas, Dancers, Pink and Green — oil on canvas, ca. 1890
  437980, // Van Gogh, Cypresses — oil on canvas, 1889
  12127, // John Singer Sargent, Madame X — oil on canvas, 1883–84
  437658, // Seurat, Study for "A Sunday on La Grande Jatte" — oil on canvas, 1884
  436132, // Degas, The Dance Lesson — pastel and black chalk, ca. 1879
  436529, // Van Gogh, L'Arlésienne (Madame Ginoux) — oil on canvas, 1888–89
  459016, // Botticelli, The Annunciation — tempera and gold on wood, ca. 1490
  435809, // Pieter Bruegel the Elder, The Harvesters — oil on oak, 1565
  336228, // Albrecht Dürer, Melencolia I — engraving, 1514
  437397, // Rembrandt, Self-Portrait — oil on canvas, 1660
  437881, // Vermeer, Young Woman with a Water Pitcher — oil on canvas, ca. 1662
  337496, // Leonardo da Vinci, The Head of the Virgin in Three-Quarter View — chalk, 1510–13
  435868, // Cézanne, The Card Players — oil on canvas, 1890–92
  12116, // John Singer Sargent, In the Generalife — watercolour, 1912
  436156, // Degas, The Rehearsal Onstage — pastel over brush, ca. 1874
  11125, // Winslow Homer, Inside the Bar — watercolour, 1883
  37031, // Hiroshige, Ōtsu, from Fifty-Three Stations of the Tōkaidō — woodblock, 1841–44
  // Last: wraps to Hokusai’s left when the panel carousel opens on index 0.
  436965, // Manet, The Monet Family in Their Garden at Argenteuil — oil on canvas, 1874
];

/**
 * Busts HTTP caches when the opening hand changes. The curated route ignores
 * the query; clients append it so a day-old response cannot outlive a reorder.
 */
export const CURATED_MET_FINGERPRINT = CURATED_MET_OBJECT_IDS.join("-");

/**
 * Natural pixel size of each curated work's `primaryImageSmall`.
 *
 * The panel carousel sizes tiles from image aspect before `onLoad` can measure
 * them. Without these, peek cards open on the slot's maxWidth/height ratio and
 * Motion morphs them when the JPEG arrives — Monet Family at −1 shrinks from
 * 100px tall to ~81px and reads as a white frame collapsing. Search results
 * still measure on load; only this fixed hand is known ahead of time.
 */
export const CURATED_MET_IMAGE_SIZES: Readonly<
  Record<number, { width: number; height: number }>
> = {
  39799: { width: 600, height: 410 }, // Hokusai, The Great Wave
  436535: { width: 599, height: 477 }, // Van Gogh, Wheat Field
  337499: { width: 599, height: 390 }, // Turner, Lake of Zug
  436528: { width: 599, height: 475 }, // Van Gogh, Irises
  437654: { width: 600, height: 401 }, // Seurat, Circus Sideshow
  436532: { width: 502, height: 625 }, // Van Gogh, Straw Hat
  436140: { width: 567, height: 625 }, // Degas, Dancers, Pink and Green
  437980: { width: 495, height: 624 }, // Van Gogh, Cypresses
  12127: { width: 365, height: 625 }, // Sargent, Madame X
  437658: { width: 599, height: 407 }, // Seurat, Grande Jatte study
  436132: { width: 551, height: 625 }, // Degas, The Dance Lesson
  436529: { width: 496, height: 624 }, // Van Gogh, L'Arlésienne
  459016: { width: 600, height: 394 }, // Botticelli, The Annunciation
  435809: { width: 600, height: 442 }, // Bruegel, The Harvesters
  336228: { width: 494, height: 625 }, // Dürer, Melencolia I
  437397: { width: 515, height: 625 }, // Rembrandt, Self-Portrait
  437881: { width: 555, height: 624 }, // Vermeer, Water Pitcher
  337496: { width: 486, height: 625 }, // Leonardo, Head of the Virgin
  435868: { width: 599, height: 477 }, // Cézanne, The Card Players
  12116: { width: 599, height: 499 }, // Sargent, In the Generalife
  436156: { width: 599, height: 443 }, // Degas, The Rehearsal Onstage
  11125: { width: 599, height: 320 }, // Homer, Inside the Bar
  37031: { width: 599, height: 394 }, // Hiroshige, Ōtsu
  436965: { width: 599, height: 377 }, // Manet, Monet Family
};

/** Known `primaryImageSmall` size for a curated object, if we ship one. */
export function curatedImageSize(
  objectID: number,
): { width: number; height: number } | undefined {
  return CURATED_MET_IMAGE_SIZES[objectID];
}

/**
 * The five object ids the panel carousel shows when it opens on index 0
 * (offsets −2…+2). Index 0 is centre; the last curated id wraps to its left.
 */
export function curatedFirstOpenObjectIds(
  ids: readonly number[] = CURATED_MET_OBJECT_IDS,
): number[] {
  const n = ids.length;
  if (n === 0) return [];
  return [-2, -1, 0, 1, 2].map((distance) => {
    const index = ((distance % n) + n) % n;
    return ids[index]!;
  });
}
