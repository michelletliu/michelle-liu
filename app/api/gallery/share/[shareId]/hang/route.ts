import { NextRequest, NextResponse } from "next/server";
import {
  isGalleryPaintingId,
  MAX_HANG_BYTES,
} from "@/components/gallery/sharedGallery";
import { putHangPng } from "@/lib/gallery/shareBlob";
import {
  editTokenFromRequest,
  verifyShareEditToken,
} from "@/lib/gallery/shareEditAuth";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ shareId: string }> };

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];

function validShareId(shareId: string): boolean {
  return Boolean(shareId) && shareId.length <= 32 && /^[A-Za-z0-9_-]+$/.test(shareId);
}

function isPng(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  return PNG_MAGIC.every((b, i) => bytes[i] === b);
}

export async function POST(req: NextRequest, context: RouteContext) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Gallery sharing is not configured." },
      { status: 503 },
    );
  }

  const { shareId } = await context.params;
  if (!validShareId(shareId)) {
    return NextResponse.json({ error: "Invalid share id." }, { status: 400 });
  }

  const authorized = await verifyShareEditToken(
    shareId,
    editTokenFromRequest(req),
  );
  if (!authorized) {
    return NextResponse.json(
      { error: "Not allowed to upload to this gallery." },
      { status: 403 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const paintingId = String(form.get("paintingId") ?? "").trim();
  if (!isGalleryPaintingId(paintingId)) {
    return NextResponse.json({ error: "Invalid painting id." }, { status: 400 });
  }

  const inspirationRaw = form.get("inspirationTitle");
  const inspirationTitle =
    typeof inspirationRaw === "string" && inspirationRaw.trim()
      ? inspirationRaw.trim().slice(0, 200)
      : undefined;

  const entry = form.get("file");
  if (entry == null || typeof entry === "string") {
    return NextResponse.json({ error: "Missing image file." }, { status: 400 });
  }
  const file = entry as Blob;

  if (file.size <= 0 || file.size > MAX_HANG_BYTES) {
    return NextResponse.json(
      { error: "Image must be a PNG under 8MB." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isPng(buffer)) {
    return NextResponse.json(
      { error: "Image must be a PNG." },
      { status: 400 },
    );
  }

  try {
    const { url } = await putHangPng(shareId, paintingId, buffer, {
      overwrite: true,
    });
    return NextResponse.json({
      paintingId,
      imageUrl: url,
      ...(inspirationTitle ? { inspirationTitle } : {}),
    });
  } catch (err) {
    console.error("[gallery/share/hang] upload failed", err);
    return NextResponse.json(
      { error: "Failed to upload image." },
      { status: 502 },
    );
  }
}
