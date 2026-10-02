import assert from "node:assert/strict";
import test from "node:test";
import {
  GEMINI_IMAGE_MODEL,
  GEMINI_IMAGE_SIZE,
  geminiBlocked,
  geminiGenerateBody,
  geminiHttpError,
  geminiImageBase64,
  geminiNeedsPoll,
} from "./galleryImage.ts";

test("generate body asks for a 2K hang and includes one style reference", () => {
  const body = geminiGenerateBody({
    prompt: "a quiet harbor",
    aspectRatio: "3:4",
    reference: { mimeType: "image/jpeg", data: "abc" },
  });

  assert.equal(body.model, GEMINI_IMAGE_MODEL);
  const format = body.response_format as {
    aspect_ratio: string;
    image_size: string;
    mime_type: string;
  };
  assert.equal(format.aspect_ratio, "3:4");
  assert.equal(format.image_size, GEMINI_IMAGE_SIZE);
  assert.equal(format.mime_type, "image/jpeg");

  const input = body.input as Array<Record<string, string>>;
  assert.equal(input[0]?.text, "a quiet harbor");
  assert.deepEqual(input[1], {
    type: "image",
    mime_type: "image/jpeg",
    data: "abc",
  });
});

test("text-only generate body has no image part", () => {
  const body = geminiGenerateBody({
    prompt: "a quiet harbor",
    aspectRatio: "3:2",
  });
  const input = body.input as unknown[];
  assert.equal(input.length, 1);
});

test("image bytes come from the last model output, not a thought image", () => {
  const data = geminiImageBase64({
    status: "completed",
    steps: [
      { type: "thought", content: [{ type: "image", data: "thought" }] },
      {
        type: "model_output",
        content: [
          { type: "text", text: "done" },
          { type: "image", data: "first" },
          { type: "image", data: "final" },
        ],
      },
    ],
  });
  assert.equal(data, "final");
});

test("in-progress interactions are polled and completed ones are not", () => {
  assert.equal(geminiNeedsPoll({ status: "in_progress", id: "v1_x" }), true);
  assert.equal(geminiNeedsPoll({ status: "queued", id: "v1_x" }), true);
  assert.equal(geminiNeedsPoll({ status: "completed", id: "v1_x" }), false);
  assert.equal(geminiNeedsPoll({ status: "failed", id: "v1_x" }), false);
});

test("safety refusals and auth failures map to the gallery error copy", () => {
  assert.equal(geminiBlocked({ status: "IMAGE_SAFETY" }), true);
  assert.deepEqual(
    geminiHttpError(400, {
      steps: [{ type: "model_output", content: [{ type: "text", text: "ok" }] }],
      error: { status: "INVALID_ARGUMENT", message: "blocked by safety filter" },
    }),
    { error: "Prompt was blocked by content policy", status: 400 },
  );
  assert.deepEqual(geminiHttpError(401, { error: { status: "UNAUTHENTICATED", message: "bad key" } }), {
    error: "Generation is not configured",
    status: 502,
  });
  assert.deepEqual(geminiHttpError(429, { error: { status: "RESOURCE_EXHAUSTED", message: "slow down" } }), {
    error: "Too many generations right now. Try again in a moment.",
    status: 429,
  });
});
