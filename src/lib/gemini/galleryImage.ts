/**
 * Gemini Interactions API helpers for gallery hangs.
 * Nano Banana 2 (`gemini-3.1-flash-image`): 3:4 / 3:2 at 2K, text-to-image
 * and a single style-reference image on the same call.
 */

export const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image";
export const GEMINI_INTERACTIONS_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";
export const GEMINI_API_REVISION = "2026-05-20";
export const GEMINI_IMAGE_SIZE = "2K";

export type GalleryAspect = "3:4" | "3:2";

export type GeminiInlineImage = {
  mimeType: string;
  /** Base64 image bytes, no data-URL prefix. */
  data: string;
};

export type GeminiClientError = {
  error: string;
  status: number;
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function geminiHeaders(apiKey: string): Record<string, string> {
  return {
    "x-goog-api-key": apiKey,
    "Content-Type": "application/json",
    "Api-Revision": GEMINI_API_REVISION,
  };
}

export function geminiGenerateBody(input: {
  prompt: string;
  aspectRatio: GalleryAspect;
  reference?: GeminiInlineImage | null;
}): JsonRecord {
  const parts: JsonRecord[] = [{ type: "text", text: input.prompt }];
  if (input.reference) {
    parts.push({
      type: "image",
      mime_type: input.reference.mimeType,
      data: input.reference.data,
    });
  }
  return {
    model: GEMINI_IMAGE_MODEL,
    input: parts,
    response_format: {
      type: "image",
      mime_type: "image/jpeg",
      aspect_ratio: input.aspectRatio,
      image_size: GEMINI_IMAGE_SIZE,
    },
  };
}

export function geminiInteractionId(body: unknown): string | null {
  if (!isRecord(body) || typeof body.id !== "string" || !body.id) return null;
  return body.id;
}

export function geminiInteractionStatus(body: unknown): string | null {
  if (!isRecord(body) || typeof body.status !== "string") return null;
  return body.status;
}

function imageDataInContent(content: unknown): string[] {
  if (!Array.isArray(content)) return [];
  const found: string[] = [];
  for (const block of content) {
    if (!isRecord(block)) continue;
    if (block.type === "image" && typeof block.data === "string" && block.data) {
      found.push(block.data);
    }
  }
  return found;
}

/**
 * Last model-output image. Thought images can precede the final frame; the
 * last `model_output` image is the one to hang.
 */
export function geminiImageBase64(body: unknown): string | null {
  if (!isRecord(body)) return null;

  const fromModel: string[] = [];
  const any: string[] = [];
  const steps = Array.isArray(body.steps) ? body.steps : [];
  for (const step of steps) {
    if (!isRecord(step)) continue;
    const images = imageDataInContent(step.content);
    any.push(...images);
    if (step.type === "model_output") fromModel.push(...images);
  }
  if (fromModel.length > 0) return fromModel[fromModel.length - 1]!;
  if (any.length > 0) return any[any.length - 1]!;

  const direct = body.output_image ?? body.outputImage;
  if (isRecord(direct) && typeof direct.data === "string" && direct.data) {
    return direct.data;
  }
  return null;
}

function googleError(body: unknown): { status: string; message: string } {
  if (!isRecord(body)) return { status: "", message: "" };
  const error = body.error;
  if (!isRecord(error)) return { status: "", message: "" };
  return {
    status: typeof error.status === "string" ? error.status.toUpperCase() : "",
    message: typeof error.message === "string" ? error.message : "",
  };
}

function walkText(value: unknown, visit: (text: string, key: string) => void, key = ""): void {
  if (typeof value === "string") {
    if (key !== "data" && key !== "signature") visit(value, key);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) walkText(item, visit, key);
    return;
  }
  if (!isRecord(value)) return;
  for (const [childKey, child] of Object.entries(value)) {
    if (childKey === "data" || childKey === "signature") continue;
    walkText(child, visit, childKey);
  }
}

const POLICY_KEYS = new Set([
  "status",
  "finish_reason",
  "finishReason",
  "block_reason",
  "blockReason",
  "reason",
  "code",
]);

/** True when Gemini refused the prompt or the reference image. */
export function geminiBlocked(body: unknown): boolean {
  let blocked = false;
  walkText(body, (text, key) => {
    const normalized = text.trim().toUpperCase().replace(/[\s-]+/g, "_");
    if (
      POLICY_KEYS.has(key) &&
      (normalized === "SAFETY" ||
        normalized === "IMAGE_SAFETY" ||
        normalized === "PROHIBITED_CONTENT" ||
        normalized === "BLOCKLIST" ||
        normalized === "IMAGE_PROHIBITED_CONTENT")
    ) {
      blocked = true;
    }
    if (
      (key === "message" || key === "text") &&
      /content policy|blocked|safety filter|prohibited/i.test(text)
    ) {
      blocked = true;
    }
  });
  return blocked;
}

export function geminiHttpError(httpStatus: number, body: unknown): GeminiClientError {
  if (geminiBlocked(body)) {
    return { error: "Prompt was blocked by content policy", status: 400 };
  }

  const { status, message } = googleError(body);
  const lower = message.toLowerCase();

  if (
    httpStatus === 401 ||
    httpStatus === 403 ||
    status === "UNAUTHENTICATED" ||
    status === "PERMISSION_DENIED"
  ) {
    return { error: "Generation is not configured", status: 502 };
  }
  if (
    lower.includes("billing") ||
    lower.includes("prepay") ||
    lower.includes("credit") ||
    (lower.includes("quota") && lower.includes("0"))
  ) {
    return { error: "Generation is temporarily unavailable", status: 502 };
  }
  if (httpStatus === 429 || status === "RESOURCE_EXHAUSTED") {
    return { error: "Too many generations right now. Try again in a moment.", status: 429 };
  }
  if (httpStatus === 400 || status === "INVALID_ARGUMENT") {
    return { error: "Could not generate that image", status: 400 };
  }
  return {
    error: "Generation failed",
    status: httpStatus >= 400 ? httpStatus : 502,
  };
}

const TERMINAL = new Set([
  "completed",
  "failed",
  "cancelled",
  "incomplete",
  "budget_exceeded",
]);

export function geminiNeedsPoll(body: unknown): boolean {
  const status = geminiInteractionStatus(body);
  if (!status) return false;
  return !TERMINAL.has(status);
}
