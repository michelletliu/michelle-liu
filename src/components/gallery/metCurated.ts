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
  436528, // Van Gogh, Irises — oil on canvas, 1890
  337496, // Leonardo da Vinci, The Head of the Virgin in Three-Quarter View — chalk, 1510–13
  459016, // Botticelli, The Annunciation — tempera and gold on wood, ca. 1490
  435809, // Pieter Bruegel the Elder, The Harvesters — oil on oak, 1565
  336228, // Albrecht Dürer, Melencolia I — engraving, 1514
  437397, // Rembrandt, Self-Portrait — oil on canvas, 1660
  437881, // Vermeer, Young Woman with a Water Pitcher — oil on canvas, ca. 1662
  337499, // J. M. W. Turner, The Lake of Zug — watercolour and gouache, 1843
  435868, // Cézanne, The Card Players — oil on canvas, 1890–92
  436132, // Degas, The Dance Lesson — pastel and black chalk, ca. 1879
  11125, // Winslow Homer, Inside the Bar — watercolour, 1883
  37031, // Hiroshige, Ōtsu, from Fifty-Three Stations of the Tōkaidō — woodblock, 1841–44
];
