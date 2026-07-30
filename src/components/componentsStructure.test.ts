import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

test("shadcn/Figma ui kit residue is removed", () => {
  assert.equal(existsSync(new URL("./ui", import.meta.url)), false);
});

test("shared primitives live under icons/layout/shared folders", () => {
  assert.ok(existsSync(new URL("./icons/Chevron.tsx", import.meta.url)));
  assert.ok(existsSync(new URL("./layout/Footer.tsx", import.meta.url)));
  assert.ok(existsSync(new URL("./shared/FieldInput.tsx", import.meta.url)));
  assert.ok(existsSync(new URL("./home/HomePageClient.tsx", import.meta.url)));
  assert.ok(
    existsSync(new URL("./icons/figma/svg-2tsxp86msm.ts", import.meta.url)),
  );
});
