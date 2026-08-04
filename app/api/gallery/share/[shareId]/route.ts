import { NextRequest, NextResponse } from "next/server";
import {
  isGalleryPaintingId,
  isValidShareId,
} from "@/components/gallery/sharedGallery";
import { getShareMeta } from "@/lib/gallery/shareBlob";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ shareId: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Gallery sharing is not configured." },
      { status: 503 },
    );
  }

  const { shareId } = await context.params;
  if (!isValidShareId(shareId)) {
    return NextResponse.json({ error: "Gallery not found." }, { status: 404 });
  }

  const meta = await getShareMeta(shareId);
  if (!meta) {
    return NextResponse.json({ error: "Gallery not found." }, { status: 404 });
  }

  const hangs = meta.hangs.filter((hang) => isGalleryPaintingId(hang.paintingId));
  return NextResponse.json({
    ...meta,
    hangs,
  });
}
