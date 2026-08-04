import { NextRequest, NextResponse } from "next/server";
import {
  isGalleryPaintingId,
  isValidShareId,
  sanitizeCreatorName,
  sanitizeGalleryName,
  type SharedGalleryHang,
  type SharedGalleryMeta,
} from "@/components/gallery/sharedGallery";
import {
  getShareMeta,
  hangUrlBelongsToShare,
  putShareMeta,
} from "@/lib/gallery/shareBlob";
import {
  editTokenFromRequest,
  verifyShareEditToken,
} from "@/lib/gallery/shareEditAuth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ shareId: string }> };

type FinalizeBody = {
  name?: string;
  creator?: string;
  hangs?: Array<{
    paintingId?: string;
    imageUrl?: string;
    inspirationTitle?: string;
  }>;
  /** ISO createdAt from start/update when creating fresh; ignored if meta exists. */
  createdAt?: string;
};

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const finalizeHits = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function allowFinalize(ip: string): boolean {
  const now = Date.now();
  const prev = (finalizeHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (prev.length >= RATE_LIMIT) {
    finalizeHits.set(ip, prev);
    return false;
  }
  prev.push(now);
  finalizeHits.set(ip, prev);
  return true;
}

function absoluteShareUrl(req: NextRequest, shareId: string): string {
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? null;
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}/gallery/s/${shareId}`;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/gallery/s/${shareId}`;
  }
  return `/gallery/s/${shareId}`;
}

export async function POST(req: NextRequest, context: RouteContext) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Gallery sharing is not configured." },
      { status: 503 },
    );
  }

  const { shareId } = await context.params;
  if (!isValidShareId(shareId)) {
    return NextResponse.json({ error: "Invalid share id." }, { status: 400 });
  }

  let authorized = false;
  try {
    authorized = await verifyShareEditToken(
      shareId,
      editTokenFromRequest(req),
    );
  } catch (err) {
    console.error("[gallery/share/finalize] edit-secret lookup failed", err);
    return NextResponse.json(
      { error: "Could not verify gallery permissions. Try again." },
      { status: 502 },
    );
  }
  if (!authorized) {
    return NextResponse.json(
      { error: "Not allowed to save this gallery." },
      { status: 403 },
    );
  }

  if (!allowFinalize(clientIp(req))) {
    return NextResponse.json(
      { error: "Too many saves from this network. Try again later." },
      { status: 429 },
    );
  }

  let body: FinalizeBody;
  try {
    body = (await req.json()) as FinalizeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = sanitizeGalleryName(typeof body.name === "string" ? body.name : "");
  if (!name) {
    return NextResponse.json(
      { error: "Gallery name is required (1–80 characters)." },
      { status: 400 },
    );
  }

  const creator = sanitizeCreatorName(
    typeof body.creator === "string" ? body.creator : "",
  );
  if (!creator) {
    return NextResponse.json(
      { error: "Your name is required (1–80 characters)." },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.hangs) || body.hangs.length === 0) {
    return NextResponse.json(
      { error: "At least one artwork is required." },
      { status: 400 },
    );
  }
  if (body.hangs.length > 12) {
    return NextResponse.json({ error: "Too many hangs." }, { status: 400 });
  }

  const hangs: SharedGalleryHang[] = [];
  const seen = new Set<string>();
  for (const hang of body.hangs) {
    const paintingId =
      typeof hang.paintingId === "string" ? hang.paintingId.trim() : "";
    const imageUrl = typeof hang.imageUrl === "string" ? hang.imageUrl.trim() : "";
    if (!isGalleryPaintingId(paintingId) || seen.has(paintingId)) {
      return NextResponse.json({ error: "Invalid hang list." }, { status: 400 });
    }
    if (!imageUrl || !hangUrlBelongsToShare(imageUrl, shareId, paintingId)) {
      return NextResponse.json(
        { error: "Hang image URL does not belong to this gallery." },
        { status: 400 },
      );
    }
    seen.add(paintingId);
    const inspirationTitle =
      typeof hang.inspirationTitle === "string" && hang.inspirationTitle.trim()
        ? hang.inspirationTitle.trim().slice(0, 200)
        : undefined;
    hangs.push({
      paintingId,
      imageUrl,
      ...(inspirationTitle ? { inspirationTitle } : {}),
    });
  }

  const existing = await getShareMeta(shareId);
  const now = new Date().toISOString();
  const createdAt =
    existing?.createdAt ??
    (typeof body.createdAt === "string" && body.createdAt
      ? body.createdAt
      : now);

  const meta: SharedGalleryMeta = {
    version: 1,
    shareId,
    name,
    creator,
    createdAt,
    updatedAt: now,
    hangs,
  };

  try {
    await putShareMeta(meta, { overwrite: Boolean(existing) });
  } catch (err) {
    // First finalize of a new share: overwrite false. Retries need overwrite.
    try {
      await putShareMeta(meta, { overwrite: true });
    } catch (retryErr) {
      console.error("[gallery/share/finalize] meta write failed", retryErr ?? err);
      return NextResponse.json(
        { error: "Failed to save gallery." },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({
    shareId,
    url: absoluteShareUrl(req, shareId),
    name: meta.name,
    creator: meta.creator,
  });
}
