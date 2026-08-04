import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  allocateShareSlug,
  createEditToken,
  isValidShareId,
  sanitizeGalleryName,
  type SharedGalleryMeta,
} from "@/components/gallery/sharedGallery";
import { getShareMeta } from "@/lib/gallery/shareBlob";
import {
  getShareEditSecret,
  hashEditToken,
  putShareEditSecret,
  verifyShareEditToken,
} from "@/lib/gallery/shareEditAuth";

export const runtime = "nodejs";

type StartBody = {
  mode?: "create" | "update";
  shareId?: string;
  editToken?: string;
  /** Display name — used to allocate a readable share slug on create. */
  name?: string;
};

function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function shareIdTaken(shareId: string): Promise<boolean> {
  const [meta, secret] = await Promise.all([
    getShareMeta(shareId),
    getShareEditSecret(shareId),
  ]);
  return Boolean(meta || secret);
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
    if (!isValidShareId(shareId)) {
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

  const name = sanitizeGalleryName(
    typeof body.name === "string" ? body.name : "",
  );
  if (!name) {
    return NextResponse.json(
      { error: "Gallery name is required to create a link." },
      { status: 400 },
    );
  }

  let shareId: string | null = null;
  const editToken = createEditToken((n) => randomBytes(n));
  const tokenHash = hashEditToken(editToken);
  let lastReserveError: unknown = null;

  // Allocate a free slug, then reserve it via edit secret. A rare race with
  // another create can lose the put — retry the next candidate a few times.
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = await allocateShareSlug(
      name,
      shareIdTaken,
      (n) => randomBytes(n),
    );
    try {
      await putShareEditSecret(candidate, tokenHash);
      shareId = candidate;
      break;
    } catch (err) {
      lastReserveError = err;
      const message = err instanceof Error ? err.message : "";
      // Config / auth failures will not recover on retry.
      if (
        /private access on a public store|BLOB_READ_WRITE_TOKEN|not configured|unauthorized|forbidden/i.test(
          message,
        )
      ) {
        console.error("[gallery/share] failed to store edit secret", err);
        const hint = /private access on a public store/i.test(message)
          ? "Blob store is public-only; edit secrets must use public access."
          : "Blob storage is misconfigured.";
        return NextResponse.json({ error: hint }, { status: 502 });
      }
      // Likely "already exists" from a concurrent create — try again.
      console.warn(
        `[gallery/share] slug reserve failed for ${candidate}`,
        message || err,
      );
    }
  }

  if (!shareId) {
    console.error("[gallery/share] could not reserve share slug", lastReserveError);
    return NextResponse.json(
      { error: "Could not reserve a share link. Try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    shareId,
    editToken,
    mode: "create" as const,
  });
}
