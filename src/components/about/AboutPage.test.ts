import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./AboutPage.tsx", import.meta.url), "utf8");

test("pins Instagram first, then Studio Michelle Liu with startup clients", () => {
  const instagramIdx = source.indexOf('e.company === "Instagram"');
  const studioIdx = source.indexOf('company: "Studio Michelle Liu"');
  const othersIdx = source.indexOf('e.company !== "Instagram"');
  assert.ok(instagramIdx > -1 && studioIdx > instagramIdx && othersIdx > studioIdx);
  assert.match(source, /Clients include\{" "\}/);
  assert.match(source, /href=\{s\.link\}[\s\S]*?className="text-zinc-500/);
  assert.match(source, /logoSrc: studioLogo,/);
  assert.doesNotMatch(source, /Independent Designer/);
  assert.doesNotMatch(source, /StartupLogosRow/);
});

test("shows archived communities behind an Archive toggle, without a mobile jump list", () => {
  assert.doesNotMatch(source, /variant="communities"/);
  assert.doesNotMatch(source, /className="lg:hidden w-full min-w-0/);
  assert.match(source, /archiveOpen=\{archiveOpen\}/);
  assert.match(source, /onArchiveToggle=\{handleArchiveToggle\}/);
  assert.match(source, /aria-controls="community-archive-content"/);
  assert.match(source, /archivedCommunityCards\.map/);
  assert.match(source, /setActiveCategory\("community"\)/);
  assert.match(source, /resolveAboutCategory\(/);
  assert.match(source, /archiveNavHoldUntilRef/);
  assert.match(source, /block: "start"/);
});
