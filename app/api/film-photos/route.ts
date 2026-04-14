import { NextResponse } from 'next/server';
import { fetchFilmPhotosFromNotion } from '@/lib/notion-film';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const photos = await fetchFilmPhotosFromNotion();
    return NextResponse.json({ photos });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    const missingEnv =
      message.includes('NOTION_TOKEN') || message.includes('NOTION_FILM_DATABASE_ID');
    return NextResponse.json(
      { error: message, photos: [] as const },
      { status: missingEnv ? 503 : 502 },
    );
  }
}
