import {
  EDIT_TOKEN_HEADER,
  type SharedGalleryHang,
} from "./sharedGallery";

export type SaveGalleryHangInput = {
  paintingId: string;
  /** data: URL or https Blob URL from the live session */
  imageUrl: string;
  inspirationTitle?: string;
};

export type SaveGalleryShareInput =
  | {
      mode: "create";
      name: string;
      hangs: SaveGalleryHangInput[];
    }
  | {
      mode: "update";
      name: string;
      hangs: SaveGalleryHangInput[];
      existingShareId: string;
      existingEditToken: string;
    };

export type SaveGalleryShareResult = {
  shareId: string;
  editToken: string;
  url: string;
  name: string;
};

async function readShareApiJson<T extends object>(
  res: Response,
  fallbackError: string,
): Promise<T> {
  let data: T & { error?: string };
  try {
    data = (await res.json()) as T & { error?: string };
  } catch {
    throw new Error(fallbackError);
  }
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" && data.error
        ? data.error
        : fallbackError,
    );
  }
  return data;
}

/**
 * Hang uploads still require PNG (Blob path + magic check). Live generates
 * may be WebP data URLs for faster transfer — re-encode those (and any other
 * bitmap) via canvas so save stays compatible without slowing generation.
 */
async function imageUrlToPngFile(
  imageUrl: string,
  paintingId: string,
): Promise<File> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Could not read image for ${paintingId}.`);
  }
  const blob = await res.blob();
  const type = blob.type || "";
  const alreadyPng =
    type === "image/png" || imageUrl.startsWith("data:image/png");
  if (alreadyPng) {
    return new File([blob], `${paintingId}.png`, { type: "image/png" });
  }

  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not encode artwork for save.");
    ctx.drawImage(bitmap, 0, 0);
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (next) => (next ? resolve(next) : reject(new Error("PNG encode failed"))),
        "image/png",
      );
    });
    return new File([pngBlob], `${paintingId}.png`, { type: "image/png" });
  } finally {
    bitmap.close();
  }
}

/**
 * Start → sequential hang uploads → finalize.
 * Uploads stay sequential so one failure stops before finalize, and hang
 * routes stay easy to rate-limit. Does not POST a whole room of base64.
 */
export async function saveGalleryShare(
  input: SaveGalleryShareInput,
): Promise<SaveGalleryShareResult> {
  if (input.hangs.length === 0) {
    throw new Error("Generate at least one artwork to save.");
  }

  const startHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (input.mode === "update") {
    startHeaders[EDIT_TOKEN_HEADER] = input.existingEditToken;
  }

  const startRes = await fetch("/api/gallery/share", {
    method: "POST",
    headers: startHeaders,
    body: JSON.stringify(
      input.mode === "update"
        ? {
            mode: "update",
            shareId: input.existingShareId,
          }
        : { mode: "create", name: input.name },
    ),
  });
  const startData = await readShareApiJson<{
    shareId?: string;
    editToken?: string;
    previous?: { createdAt?: string };
  }>(startRes, "Could not start save.");
  if (!startData.shareId || !startData.editToken) {
    throw new Error("Could not start save.");
  }

  const shareId = startData.shareId;
  const editToken = startData.editToken;
  const editHeaders = { [EDIT_TOKEN_HEADER]: editToken };
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
      headers: editHeaders,
      body: form,
    });
    const hangData = await readShareApiJson<{
      paintingId?: string;
      imageUrl?: string;
      inspirationTitle?: string;
    }>(hangRes, `Failed to upload ${hang.paintingId}.`);
    if (!hangData.imageUrl || !hangData.paintingId) {
      throw new Error(`Failed to upload ${hang.paintingId}.`);
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
    headers: {
      "Content-Type": "application/json",
      ...editHeaders,
    },
    body: JSON.stringify({
      name: input.name,
      hangs: uploaded,
      createdAt: startData.previous?.createdAt,
    }),
  });
  const finalizeData = await readShareApiJson<{
    shareId?: string;
    url?: string;
    name?: string;
  }>(finalizeRes, "Failed to finish saving.");
  if (!finalizeData.shareId || !finalizeData.url) {
    throw new Error("Failed to finish saving.");
  }

  return {
    shareId: finalizeData.shareId,
    editToken,
    url: finalizeData.url,
    name: finalizeData.name || input.name,
  };
}
