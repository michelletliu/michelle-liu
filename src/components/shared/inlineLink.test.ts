import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { INLINE_LINK_CLASS } from "./inlineLink.ts";

const globalsCss = readFileSync(
  new URL("../../styles/globals.css", import.meta.url),
  "utf8",
);

test("inline editorial links use the semantic inline-link class", () => {
  assert.equal(INLINE_LINK_CLASS, "inline-link");
});

test("inline editorial links inherit color and use the blue interaction accent", () => {
  assert.match(globalsCss, /\.inline-link\s*\{[^}]*color:\s*inherit/s);
  assert.match(
    globalsCss,
    /\.inline-link:hover,\s*\.inline-link:focus-visible\s*\{[^}]*color:\s*#3b82f6/s,
  );
  assert.doesNotMatch(globalsCss, /\.inline-link\s*\{[^}]*text-decoration:\s*underline/s);
});
