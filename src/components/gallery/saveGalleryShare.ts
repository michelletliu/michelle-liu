import type { SharedGalleryHang } from "./sharedGallery";

export type SaveGalleryHangInput = {
  paintingId: string;
  /** data: URL or https Blob URL from the live session */
  imageUrl: string;
  inspirationTitle?: string;
};

export type SaveGalleryShareInput = {
  name: string;
  mode: "create" | "update";
  existingShareId?: string;
  hangs: SaveGalleryHangInput[];
};

export type SaveGalleryShareResult = {
  shareId: string;
  url: string;
  name: string;
};

async function imageUrlToPngFile(
  imageUrl: string,
  paintingId: string,
): Promise<File> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Could not read image for ${paintingId}.`);
  }
  const blob = await res.blob();
  // Reve returns PNG data URLs; shared Blob URLs are also PNG.
  const type = blob.type || "image/png";
  if (type !== "image/png" && !imageUrl.startsWith("data:image/png")) {
    // Still try if magic looks fine server-side; prefer failing early when obvious.
    if (!type.includes("png") && type !== "application/octet-stream") {
      throw new Error("Only PNG artworks can be saved.");
    }
  }
  return new File([blob], `${paintingId}.png`, { type: "image/png" });
}

/**
 * Start → sequential hang uploads → finalize.
 * Does not POST a whole room of base64 in one request.
 */
export async function saveGalleryShare(
  input: SaveGalleryShareInput,
): Promise<SaveGalleryShareResult> {
  if (input.hangs.length === 0) {
    throw new Error("Generate at least one artwork to save.");
  }

  const startRes = await fetch("/api/gallery/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      input.mode === "update"
        ? { mode: "update", shareId: input.existingShareId }
        : { mode: "create" },
    ),
  });
  const startData = (await startRes.json()) as {
    shareId?: string;
    error?: string;
    previous?: { createdAt?: string };
  };
  if (!startRes.ok || !startData.shareId) {
    throw new Error(startData.error || "Could not start save.");
  }

  const shareId = startData.shareId;
  const uploaded: SharedGalleryHang[] = [];

  for (const hang of input.hangs) {
    const file = await imageUrlToPngFile(hang.imageUrl, hang.paintingId);
    const form = new FormData();
    form.set("file", file);
    form.set("paintingId", hang.paintingId);
    if (hang.inspirationTitle) {
      form.set("inspirationTitle", hang.inspirationTitle);
    }

    const hangRes = await fetch(`/api/gallery/share/${shareId}/hang`, {
      method: "POST",
      body: form,
    });
    const hangData = (await hangRes.json()) as {
      paintingId?: string;
      imageUrl?: string;
      inspirationTitle?: string;
      error?: string;
    };
    if (!hangRes.ok || !hangData.imageUrl || !hangData.paintingId) {
      throw new Error(hangData.error || `Failed to upload ${hang.paintingId}.`);
    }
    uploaded.push({
      paintingId: hangData.paintingId,
      imageUrl: hangData.imageUrl,
      ...(hangData.inspirationTitle
        ? { inspirationTitle: hangData.inspirationTitle }
        : hang.inspirationTitle
          ? { inspirationTitle: hang.inspirationTitle }
          : {}),
    });
  }

  const finalizeRes = await fetch(`/api/gallery/share/${shareId}/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      hangs: uploaded,
      createdAt: startData.previous?.createdAt,
    }),
  });
  const finalizeData = (await finalizeRes.json()) as {
    shareId?: string;
    url?: string;
    name?: string;
    error?: string;
  };
  if (!finalizeRes.ok || !finalizeData.shareId || !finalizeData.url) {
    throw new Error(finalizeData.error || "Failed to finish saving.");
  }

  return {
    shareId: finalizeData.shareId,
    url: finalizeData.url,
    name: finalizeData.name || input.name,
  };
}
