import assert from "node:assert/strict";
import test from "node:test";
import { INLINE_LINK_CLASS } from "./inlineLink.ts";

test("inline editorial links inherit color and use the blue interaction accent", () => {
  assert.match(INLINE_LINK_CLASS, /\btext-inherit\b/);
  assert.match(INLINE_LINK_CLASS, /\bhover:text-blue-500\b/);
  assert.match(INLINE_LINK_CLASS, /\bfocus-visible:text-blue-500\b/);
  assert.match(INLINE_LINK_CLASS, /\btransition-colors\b/);
  assert.match(INLINE_LINK_CLASS, /\bduration-200\b/);
  assert.match(INLINE_LINK_CLASS, /\bease-out\b/);
  assert.doesNotMatch(INLINE_LINK_CLASS, /\bunderline\b/);
  assert.doesNotMatch(INLINE_LINK_CLASS, /\bunderline-offset-/);
});
