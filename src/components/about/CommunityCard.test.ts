import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./CommunityCard.tsx", import.meta.url), "utf8");

test("lightbox polaroid hugs the photo instead of stretching to 80vw", () => {
  assert.match(source, /wrapperClassName="w-fit"/);
  assert.match(source, /block h-auto w-auto object-contain/);
  assert.match(source, /max-h-\[55vh\] max-w-\[80vw\]/);
  assert.match(source, /max-h-\[65vh\] max-w-\[90vw\]/);
});

