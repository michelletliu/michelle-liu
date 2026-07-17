import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./AboutPage.tsx", import.meta.url), "utf8");

test("renders the freelance date inline at the freelance font size", () => {
  assert.match(
    source,
    /<p className="[^"]*text-base md:text-lg[^"]*">\s*Freelance<span className="text-zinc-400 font-normal">, 2023 - Present<\/span>\s*<\/p>/,
  );
  assert.doesNotMatch(source, /Design Contracts/);
});
