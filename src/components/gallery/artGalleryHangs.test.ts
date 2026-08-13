import assert from "node:assert/strict";
import test from "node:test";
import {
  apertureForPhysicalProportion,
  buildArtGalleryHangs,
  parsePhysicalSizeInches,
  physicalLongEdgeInches,
  type ArtGalleryHangSource,
} from "./artGalleryHangs.ts";

test("parsePhysicalSizeInches reads inch × inch Sanity strings", () => {
  assert.deepEqual(parsePhysicalSizeInches('30" x 40"'), {
    width: 30,
    height: 40,
  });
  assert.deepEqual(parsePhysicalSizeInches('10" x 8"'), {
    width: 10,
    height: 8,
  });
  assert.deepEqual(parsePhysicalSizeInches("24 × 18"), {
    width: 24,
    height: 18,
  });
  assert.deepEqual(parsePhysicalSizeInches('20"x16"'), {
    width: 20,
    height: 16,
  });
  assert.equal(parsePhysicalSizeInches("life-size"), null);
  assert.equal(parsePhysicalSizeInches(""), null);
  assert.equal(parsePhysicalSizeInches(undefined), null);
});

test("physical long edge prefers the larger dimension", () => {
  assert.equal(physicalLongEdgeInches({ width: 10, height: 8 }), 10);
  assert.equal(physicalLongEdgeInches({ width: 30, height: 40 }), 40);
});

test("aperture scales with physical long edge and keeps aspect", () => {
  const aspect = 0.75;
  const discovery = apertureForPhysicalProportion(aspect, 10, 24, 1);
  const shore = apertureForPhysicalProportion(aspect, 40, 24, 1);

  assert.ok(Math.abs(discovery.width / discovery.height - aspect) < 1e-9);
  assert.ok(Math.abs(shore.width / shore.height - aspect) < 1e-9);
  // Long-edge ratio ≈ 40/10 = 4, clamped into room bounds (~3× visible).
  const discoveryLong = Math.max(discovery.width, discovery.height);
  const shoreLong = Math.max(shore.width, shore.height);
  assert.ok(shoreLong / discoveryLong > 2.5);
  assert.ok(shoreLong / discoveryLong <= 40 / 10 + 0.01);
  assert.ok(discoveryLong >= 0.65);
  assert.ok(shoreLong <= 2.15);
});

test("buildArtGalleryHangs makes Discovery much smaller than The Shore", () => {
  const sources: ArtGalleryHangSource[] = [
    {
      id: "discovery",
      imageUrl: "/d.jpg",
      aspectRatio: 0.76,
      size: '10" x 8"',
      title: "Discovery",
    },
    {
      id: "named",
      imageUrl: "/n.jpg",
      aspectRatio: 0.75,
      size: '24" x 18"',
      title: "Named",
    },
    {
      id: "shore",
      imageUrl: "/s.jpg",
      aspectRatio: 0.74,
      size: '30" x 40"',
      title: "The Shore",
    },
  ];

  const hangs = buildArtGalleryHangs(sources);
  const discovery = hangs.find((h) => h.id === "discovery")!;
  const shore = hangs.find((h) => h.id === "shore")!;
  const named = hangs.find((h) => h.id === "named")!;

  const dLong = Math.max(discovery.size!.width, discovery.size!.height);
  const nLong = Math.max(named.size!.width, named.size!.height);
  const sLong = Math.max(shore.size!.width, shore.size!.height);

  assert.ok(dLong < nLong);
  assert.ok(nLong < sLong);
  assert.ok(sLong / dLong > 2.5);
});
