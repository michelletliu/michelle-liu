import { NextResponse, type NextRequest } from 'next/server';
import { fetchFilmPhotosFromNotion } from '@/lib/notion-film';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : undefined;

  try {
    const photos = await fetchFilmPhotosFromNotion(limit);
    return NextResponse.json({
      photos,
      total: photos.length,
      hasMore: !!limit,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    const missingEnv =
      message.includes('NOTION_TOKEN') || message.includes('NOTION_FILM_DATABASE_ID');
    return NextResponse.json(
      { error: message, photos: [] as const, total: 0, hasMore: false },
      { status: missingEnv ? 503 : 502 },
    );
  }
}
