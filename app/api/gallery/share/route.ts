import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createEditToken,
  createShareId,
  type SharedGalleryMeta,
} from "@/components/gallery/sharedGallery";
import { getShareMeta } from "@/lib/gallery/shareBlob";
import {
  hashEditToken,
  putShareEditSecret,
  verifyShareEditToken,
} from "@/lib/gallery/shareEditAuth";

export const runtime = "nodejs";

type StartBody = {
  mode?: "create" | "update";
  shareId?: string;
  editToken?: string;
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
    const editToken =
      typeof body.editToken === "string" ? body.editToken.trim() : "";
    if (!editToken) {
      return NextResponse.json(
        { error: "Edit token required to update this gallery." },
        { status: 401 },
      );
    }
    const existing = await getShareMeta(shareId);
    if (!existing) {
      return NextResponse.json(
        { error: "That gallery link no longer exists. Create a new link instead." },
        { status: 404 },
      );
    }
    const authorized = await verifyShareEditToken(shareId, editToken);
    if (!authorized) {
      return NextResponse.json(
        { error: "Not allowed to update this gallery. Create a new link instead." },
        { status: 403 },
      );
    }
    return NextResponse.json({
      shareId,
      editToken,
      mode: "update" as const,
      previous: {
        name: existing.name,
        createdAt: existing.createdAt,
      } satisfies Pick<SharedGalleryMeta, "name" | "createdAt">,
    });
  }

  const shareId = createShareId((n) => randomBytes(n));
  const editToken = createEditToken((n) => randomBytes(n));
  try {
    await putShareEditSecret(shareId, hashEditToken(editToken));
  } catch (err) {
    console.error("[gallery/share] failed to store edit secret", err);
    return NextResponse.json(
      { error: "Could not start save." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    shareId,
    editToken,
    mode: "create" as const,
  });
}
