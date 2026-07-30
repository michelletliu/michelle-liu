import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { iconSize, iconSizes } from "./iconSizes.ts";

test("icon size tokens use xs/sm/md/lg/xl names", () => {
  assert.deepEqual(Object.keys(iconSizes), ["xs", "sm", "md", "lg", "xl"]);
  assert.equal(iconSizes.xs, 12);
  assert.equal(iconSizes.sm, 16);
  assert.equal(iconSizes.md, 20);
  assert.equal(iconSizes.lg, 24);
  assert.equal(iconSizes.xl, 32);
  assert.equal(iconSize("md"), "20px");
});
