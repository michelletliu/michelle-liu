import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const socialLinks = readFileSync(
  new URL("./SocialLinks.tsx", import.meta.url),
  "utf8",
);

test("footer social icons include GitHub profile link", () => {
  assert.match(socialLinks, /label: "GitHub"/);
  assert.match(
    socialLinks,
    /href: "https:\/\/github\.com\/michelletliu"/,
  );
});
