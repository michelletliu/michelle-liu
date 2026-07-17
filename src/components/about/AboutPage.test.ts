import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./AboutPage.tsx", import.meta.url), "utf8");

test("renders the freelance designer date inline and left aligned", () => {
  assert.match(
    source,
    /<div className="flex flex-col items-start gap-8 mb-4 md:mb-2">[\s\S]*<p className="[^"]*text-base md:text-lg[^"]*">\s*Freelance Designer<span className="text-zinc-400 font-normal">, 2023 - Present<\/span>\s*<\/p>/,
  );
  assert.doesNotMatch(source, />\s*Freelance<span/);
  assert.doesNotMatch(source, /Design Contracts/);
});

test("waits for every startup logo before revealing experiences", () => {
  assert.match(source, /onRevealComplete\?: \(\) => void/);
  assert.match(
    source,
    /startDelay \+ Math\.max\(0, startups\.length - 1\) \* 40 \+ 400/,
  );
  assert.match(
    source,
    /<StartupLogosRow[\s\S]*onRevealComplete=\{handleStartupsRevealComplete\}/,
  );
  assert.match(source, /disabled=\{!experiencesCanReveal\}/);
});
