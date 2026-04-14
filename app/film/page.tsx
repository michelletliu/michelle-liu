import FilmPage from '@/components/film/FilmPage';
import type { FilmPhoto } from '@/components/film/film-data';
import { fetchFilmPhotosFromNotion } from '@/lib/notion-film';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let initialPhotos: FilmPhoto[] = [];
  try {
    initialPhotos = await fetchFilmPhotosFromNotion();
  } catch {
    // Client will poll `/api/film-photos` when env is configured.
  }
  return <FilmPage initialPhotos={initialPhotos} />;
}
