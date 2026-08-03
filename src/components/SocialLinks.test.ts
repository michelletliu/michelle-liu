import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const socialLinks = readFileSync(
  new URL("./SocialLinks.tsx", import.meta.url),
  "utf8",
);

test("footer social icons include GitHub and follow LinkedIn → X → Instagram → Luma → GitHub", () => {
  assert.match(
    socialLinks,
    /href: "https:\/\/github\.com\/michelletliu"/,
  );
  assert.match(
    socialLinks,
    /label: "LinkedIn"[\s\S]*?label: "X"[\s\S]*?label: "Instagram"[\s\S]*?label: "Luma"[\s\S]*?label: "GitHub"/,
  );
});