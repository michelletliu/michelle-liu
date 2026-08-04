import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createShareId,
  type SharedGalleryMeta,
} from "@/components/gallery/sharedGallery";
import { getShareMeta } from "@/lib/gallery/shareBlob";

export const runtime = "nodejs";

type StartBody = {
  mode?: "create" | "update";
  shareId?: string;
};

function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function POST(req: NextRequest) {
  if (!blobConfigured()) {
    return NextResponse.json(
      { error: "Gallery sharing is not configured (missing BLOB_READ_WRITE_TOKEN)." },
      { status: 503 },
    );
  }

  let body: StartBody;
  try {
    body = (await req.json()) as StartBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const mode = body.mode === "update" ? "update" : "create";

  if (mode === "update") {
    const shareId = typeof body.shareId === "string" ? body.shareId.trim() : "";
    if (!shareId || shareId.length > 32 || !/^[A-Za-z0-9_-]+$/.test(shareId)) {
      return NextResponse.json({ error: "Invalid share id." }, { status: 400 });
    }
    const existing = await getShareMeta(shareId);
    if (!existing) {
      return NextResponse.json(
        { error: "That gallery link no longer exists. Create a new link instead." },
        { status: 404 },
      );
    }
    return NextResponse.json({
      shareId,
      mode: "update" as const,
      previous: {
        name: existing.name,
        createdAt: existing.createdAt,
      } satisfies Pick<SharedGalleryMeta, "name" | "createdAt">,
    });
  }

  const shareId = createShareId((n) => randomBytes(n));
  return NextResponse.json({ shareId, mode: "create" as const });
}
