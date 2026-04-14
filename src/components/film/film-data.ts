/**
 * Film gallery entries come from the Notion “Sundays Film” database at runtime
 * (`/api/film-photos` and server-side `fetchFilmPhotosFromNotion`).
 * Optional local script: `node scripts/fetch-notion-film.mjs` (requires env vars).
 */

export type FilmPhoto = {
  id: string;
  src: string;
  title: string;
  month: string;
  year: number;
  aspectRatio: number;
  /** Notion "Note": select (or multi_select / rich text), when filled. */
  note?: string;
};
