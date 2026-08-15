import assert from "node:assert/strict";
import test from "node:test";
import {
  BARE_ARTISTIC_GUIDANCE,
  GALLERY_INFO_TEXT,
  MET_ATTRIBUTION,
  MET_SAFETY_NOTE,
  REFERENCE_FRAME_TAG,
  STYLE_COUNTER_GUIDANCE,
  artistQueryTokens,
  artworkEligibility,
  artworkStyleCues,
  matchesArtist,
  composeInspiredPrompt,
  isGenerationEligible,
  mediumDescriptor,
  normalizeMetObject,
  openAccessImageUrl,
  strokeIdiom,
  styleAnchor,
  type MetArtwork,
} from "./metArtworks.ts";

const RAW_SUNFLOWERS = {
  objectID: 436524,
  isPublicDomain: true,
  primaryImage:
    "https://images.metmuseum.org/CRDImages/ep/original/DP-41223-001.jpg",
  primaryImageSmall:
    "https://images.metmuseum.org/CRDImages/ep/web-large/DP-41223-001.jpg",
  title: "Sunflowers",
  artistDisplayName: "Vincent van Gogh",
  objectDate: "1887",
  medium: "Oil on canvas",
  department: "European Paintings",
  classification: "Paintings",
  culture: "",
  period: "",
  objectName: "Painting",
  objectURL: "https://www.metmuseum.org/art/collection/search/436524",
  rightsAndReproduction: "",
};

function artwork(overrides: Partial<MetArtwork> = {}): MetArtwork {
  return { ...normalizeMetObject(RAW_SUNFLOWERS)!, ...overrides };
}

test("normalizeMetObject maps the documented Met fields", () => {
  const a = normalizeMetObject(RAW_SUNFLOWERS);
  assert.ok(a);
  assert.equal(a.objectID, 436524);
  assert.equal(a.title, "Sunflowers");
  assert.equal(a.artistDisplayName, "Vincent van Gogh");
  assert.equal(a.objectDate, "1887");
  assert.equal(a.medium, "Oil on canvas");
  assert.equal(a.department, "European Paintings");
  assert.equal(a.classification, "Paintings");
  assert.equal(a.objectName, "Painting");
  assert.equal(
    a.objectURL,
    "https://www.metmuseum.org/art/collection/search/436524",
  );
  assert.equal(a.isPublicDomain, true);
});

test("normalizeMetObject turns Met's empty strings into null", () => {
  const a = normalizeMetObject(RAW_SUNFLOWERS)!;
  assert.equal(a.culture, null);
  assert.equal(a.period, null);
  assert.equal(a.rightsAndReproduction, null);

  const blank = normalizeMetObject({
    ...RAW_SUNFLOWERS,
    artistDisplayName: "   ",
    medium: "",
  })!;
  assert.equal(blank.artistDisplayName, null);
  assert.equal(blank.medium, null);
});

test("normalizeMetObject falls back to Untitled and defaults isPublicDomain to false", () => {
  const a = normalizeMetObject({ objectID: 1 })!;
  assert.equal(a.title, "Untitled");
  assert.equal(a.isPublicDomain, false);
  assert.equal(a.primaryImage, null);

  // A truthy non-boolean must not be read as public domain.
  assert.equal(
    normalizeMetObject({ objectID: 1, isPublicDomain: "true" })!.isPublicDomain,
    false,
  );
});

test("normalizeMetObject rejects records without a numeric objectID", () => {
  assert.equal(normalizeMetObject(null), null);
  assert.equal(normalizeMetObject("nope"), null);
  assert.equal(normalizeMetObject({}), null);
  assert.equal(normalizeMetObject({ objectID: "436524" }), null);
});

test("normalizeMetObject drops non-Met and non-https URLs", () => {
  const a = normalizeMetObject({
    ...RAW_SUNFLOWERS,
    primaryImage: "http://images.metmuseum.org/insecure.jpg",
    primaryImageSmall: "https://evil.example.com/pixel.jpg",
    objectURL: "javascript:alert(1)",
  })!;
  assert.equal(a.primaryImage, null);
  assert.equal(a.primaryImageSmall, null);
  assert.equal(a.objectURL, null);
});

test("openAccessImageUrl prefers the web-sized derivative", () => {
  assert.equal(
    openAccessImageUrl(artwork()),
    RAW_SUNFLOWERS.primaryImageSmall,
  );
  assert.equal(
    openAccessImageUrl(artwork({ primaryImageSmall: null })),
    RAW_SUNFLOWERS.primaryImage,
  );
  assert.equal(
    openAccessImageUrl(artwork({ primaryImageSmall: null, primaryImage: null })),
    null,
  );
});

test("public domain artwork with an Open Access image is eligible", () => {
  assert.deepEqual(artworkEligibility(artwork()), { eligible: true });
  assert.equal(isGenerationEligible(artwork()), true);
});

test("non-public-domain artwork is blocked with a reason", () => {
  const result = artworkEligibility(artwork({ isPublicDomain: false }));
  assert.equal(result.eligible, false);
  assert.equal(result.eligible === false && result.reason, "not-public-domain");
  assert.ok(result.eligible === false && result.message.length > 0);
});

test("public domain artwork with no Open Access image is blocked", () => {
  const result = artworkEligibility(
    artwork({ primaryImage: null, primaryImageSmall: null }),
  );
  assert.equal(result.eligible, false);
  assert.equal(
    result.eligible === false && result.reason,
    "no-open-access-image",
  );
});

test("rights and reproduction text blocks anything not clearly Open Access", () => {
  const stillCopyrighted = artwork({
    isPublicDomain: false,
    rightsAndReproduction: "© 2018 Estate of Pablo Picasso / ARS, New York",
  });
  const result = artworkEligibility(stillCopyrighted);
  assert.equal(result.eligible, false);
  assert.equal(result.eligible === false && result.reason, "rights-restricted");

  // Rights credit plus a missing image reports the credit, not "no image".
  const withCredit = artworkEligibility(
    artwork({
      primaryImage: null,
      primaryImageSmall: null,
      rightsAndReproduction: "Some credit line",
    }),
  );
  assert.equal(
    withCredit.eligible === false && withCredit.reason,
    "rights-restricted",
  );
});

test("a clearly Open Access record stays eligible even with a credit line", () => {
  const result = artworkEligibility(
    artwork({ rightsAndReproduction: "Courtesy of a donor" }),
  );
  assert.deepEqual(result, { eligible: true });
});

test("artist matching requires every query token, not just one", () => {
  const tokens = artistQueryTokens("van gogh");
  assert.equal(matchesArtist(artwork(), tokens), true);
  // Met's own artist index answers "van gogh" with these two, which is what
  // made an artist search look broken.
  assert.equal(
    matchesArtist(artwork({ artistDisplayName: "Joos van Wassenhove" }), tokens),
    false,
  );
  assert.equal(
    matchesArtist(artwork({ artistDisplayName: "Salomon van Ruysdael" }), tokens),
    false,
  );
});

test("artist matching ignores diacritics in both directions", () => {
  // Typed without the accent; stored with it.
  const cezanne = artwork({ artistDisplayName: "Paul Cézanne" });
  assert.equal(matchesArtist(cezanne, artistQueryTokens("cezanne")), true);
  assert.equal(matchesArtist(cezanne, artistQueryTokens("Cézanne")), true);
});

test("artist matching falls back to culture for unattributed works", () => {
  const woodblock = artwork({ artistDisplayName: null, culture: "Japan" });
  assert.equal(matchesArtist(woodblock, artistQueryTokens("japan")), true);
  assert.equal(matchesArtist(woodblock, artistQueryTokens("")), false);
});

test("medium becomes a physical surface description, not a paraphrase", () => {
  // "Oil on canvas" must describe impasto and canvas tooth — the abstract
  // paraphrase it replaced ("mark-making in the spirit of oil on canvas") is
  // what produced smooth digital illustration.
  const oil = mediumDescriptor(artwork());
  assert.match(oil, /impasto/i, oil);
  assert.match(oil, /brush/i, oil);
  assert.match(oil, /canvas/i, oil);

  assert.match(
    mediumDescriptor(artwork({ medium: "Woodblock print; ink and color on paper" })),
    /woodblock/i,
  );
  assert.match(
    mediumDescriptor(artwork({ medium: "Watercolor on ivory" })),
    /wash/i,
  );
});

test("an unrecognised medium still yields a hand-made surface description", () => {
  const unknown = mediumDescriptor(artwork({ medium: "Jade, gilt bronze" }));
  assert.match(unknown, /brush|pigment|texture/i, unknown);

  const missing = mediumDescriptor(artwork({ medium: null }));
  assert.ok(missing.length > 0);
  assert.ok(!missing.includes("null"));
});

test("style cues describe era colour handling rather than quoting the date", () => {
  const joined = artworkStyleCues(artwork()).join(" ");
  // 1887 sits in the broken-colour band; the raw year is not a visual cue.
  assert.match(joined, /broken colour/i, joined);
  assert.ok(!joined.includes("1887"), joined);
  // The artist name is intentionally never a style cue.
  assert.ok(!joined.includes("van Gogh"), joined);

  const early = artworkStyleCues(artwork({ objectDate: "ca. 1350" })).join(" ");
  assert.match(early, /gilded/i, early);
});

test("style cues skip fields Met left empty", () => {
  const cues = artworkStyleCues(
    artwork({ medium: null, objectDate: null, period: null, culture: null }),
  );
  assert.ok(cues.length >= 1);
  assert.ok(!cues.join(" ").includes("null"));
});

test("stroke descriptors vary by the artwork's movement, not one generic string", () => {
  // A single hardcoded impasto string for every painting produced generic
  // palette-knife oil whatever the source. These must actually differ.
  const postImpressionist = strokeIdiom(artwork({ objectDate: "1888" }));
  const impressionist = strokeIdiom(artwork({ objectDate: "1872" }));
  const ukiyoe = strokeIdiom(
    artwork({ medium: "Woodblock print; ink and color on paper", culture: "Japan" }),
  );

  assert.ok(postImpressionist && impressionist && ukiyoe);
  assert.notEqual(postImpressionist, impressionist);
  assert.notEqual(postImpressionist, ukiyoe);

  // Each must name its own idiom's defining marks.
  assert.match(postImpressionist, /short rhythmic strokes/i);
  assert.match(postImpressionist, /contour/i);
  assert.match(impressionist, /comma-shaped dabs/i);
  assert.match(ukiyoe, /keylines/i);
  assert.match(ukiyoe, /no cast shadows/i);
  // A woodblock print must not be described with brushwork language.
  assert.ok(!/impasto/i.test(ukiyoe), ukiyoe);
});

test("the style anchor names the movement, artist and year when Met has them", () => {
  assert.equal(
    styleAnchor(artwork()),
    "A Post-Impressionist painting by Vincent van Gogh, 1887",
  );

  // Missing metadata degrades rather than emitting "null" or a stray comma.
  const anonymous = styleAnchor(
    artwork({ artistDisplayName: null, objectDate: null }),
  );
  assert.equal(anonymous, "A painting");
});

test("composed prompt anchors on the artist and their movement", () => {
  const { prompt } = composeInspiredPrompt("a butterfly", artwork(), {
    referenceImage: true,
  });
  assert.ok(prompt.startsWith("A Post-Impressionist painting by Vincent van Gogh"), prompt);
  assert.match(prompt, /short rhythmic strokes/i);
});

test("composed prompt requires the subject to stay legible", () => {
  // Guards the regression where hard style weighting erased the subject: the
  // requested butterfly came back as an abstract mass of paint.
  const { prompt } = composeInspiredPrompt("a butterfly", artwork(), {
    referenceImage: true,
  });
  assert.match(prompt, /clearly recognisable/i);
  assert.match(prompt, /whole subject complete and uncropped/i);
  assert.match(prompt, /clear space around it on every side/i);

  // Both wordings that previously cost the subject are gone. "close-up" is here
  // because naming the unwanted composition is what produced it: warning
  // against a close-up returned a butterfly cropped off three sides.
  // "inside the frame" invited a black keyline pad around the paint.
  assert.ok(!/edge to edge/i.test(prompt), prompt);
  assert.ok(!/close-up/i.test(prompt), prompt);
  assert.ok(!/inside the frame/i.test(prompt), prompt);
});

test("composed prompt forbids baked-in borders and letterboxes", () => {
  const { prompt } = composeInspiredPrompt("a butterfly", artwork());
  assert.match(prompt, /no black border/i);
  assert.match(prompt, /letterbox/i);
  assert.match(prompt, /meets every edge of the canvas/i);
});

test("inspired prompts ask for museum-wall taste", () => {
  const { prompt } = composeInspiredPrompt("a butterfly", artwork(), {
    referenceImage: true,
  });
  assert.match(prompt, /museum-wall quality/i);
  assert.match(prompt, /tasteful/i);
});

test("composed prompt leads with style and states the subject second", () => {
  const { prompt, inspiredByObjectID } = composeInspiredPrompt(
    "a modern city street at night",
    artwork(),
  );
  // Style must precede the subject: when the subject led, the model treated the
  // trailing style language as optional decoration.
  assert.ok(
    prompt.indexOf("impasto") < prompt.indexOf("a modern city street at night"),
    prompt,
  );
  assert.match(prompt, /inspired by/i);
  assert.ok(prompt.includes("a modern city street at night"));
  assert.equal(inspiredByObjectID, 436524);
});

test("composed prompt carries counter-guidance against digital-illustration output", () => {
  const { prompt } = composeInspiredPrompt("a butterfly", artwork());
  assert.ok(prompt.includes(STYLE_COUNTER_GUIDANCE), prompt);
  assert.match(prompt, /not photorealistic/i);
  assert.match(prompt, /not a digital illustration/i);
});

test("artwork context is never silently dropped from the composed prompt", () => {
  // Regression guard for the whole chain: if the artwork stops reaching the
  // composer, or the composer stops using it, the prompt collapses back to a
  // generic bare subject and style influence disappears from the output.
  const subject = "a butterfly painting";
  const bare = composeInspiredPrompt(subject, null);
  const inspired = composeInspiredPrompt(subject, artwork());

  assert.ok(bare.prompt.includes(subject));
  assert.equal(bare.inspiredByObjectID, null);
  assert.notEqual(inspired.prompt, bare.prompt);
  assert.ok(inspired.prompt.length > subject.length * 5, inspired.prompt);
  assert.ok(inspired.prompt.includes(mediumDescriptor(artwork())));
  assert.equal(inspired.inspiredByObjectID, 436524);
});

test("a reference image is bound by name in the prompt", () => {
  // Regression guard for the bug that made style transfer fail outright: with
  // no named reference, the model reads the image as content to compose from
  // rather than technique to follow, and the source painting's own subject
  // leaks into the result while its brushwork does not.
  const withImage = composeInspiredPrompt("a butterfly", artwork(), {
    referenceImage: true,
  });
  assert.equal(withImage.usesReferenceImage, true);
  assert.ok(
    withImage.prompt.includes(REFERENCE_FRAME_TAG),
    `prompt must bind the reference with ${REFERENCE_FRAME_TAG}: ${withImage.prompt}`,
  );

  const withoutImage = composeInspiredPrompt("a butterfly", artwork());
  assert.equal(withoutImage.usesReferenceImage, false);
  // No reference is sent, so a label would point at nothing.
  assert.ok(!withoutImage.prompt.includes(REFERENCE_FRAME_TAG));
});

test("the frame tag only ever appears in sentences about technique", () => {
  const { prompt } = composeInspiredPrompt("a butterfly", artwork(), {
    referenceImage: true,
  });

  const tagged = prompt
    .split(/(?<=\.)\s+/)
    .filter((sentence) => sentence.includes(REFERENCE_FRAME_TAG));

  assert.ok(tagged.length > 0, prompt);
  for (const sentence of tagged) {
    assert.match(
      sentence,
      /technique|palette|stroke|surface|light|colours|hues/i,
      `tagged sentence must be about technique: ${sentence}`,
    );
  }

  // Exactly one reference image is ever sent.
  assert.ok(!prompt.includes("second reference"), prompt);
});

test("the reference image, not the prompt text, is the palette authority", () => {
  const vanGogh = artwork({
    artistDisplayName: "Vincent van Gogh",
    objectDate: "1888",
    medium: "Oil on canvas",
  });

  // Naming colours in the movement descriptors made the model paint those
  // colours instead of the reference's: against Oleanders, "high-chroma
  // complementary pairing" returned teal and orange rather than the painting's
  // yellow-green and pink. Movement text describes handling; the image
  // describes colour.
  const idiom = strokeIdiom(vanGogh) ?? "";
  assert.doesNotMatch(idiom, /complementary|high-chroma|hue/i, idiom);

  const { prompt } = composeInspiredPrompt("a butterfly", vanGogh, {
    referenceImage: true,
  });
  const deference = prompt
    .split(/(?<=\.)\s+/)
    .find((sentence) => /sample the colours/i.test(sentence));

  assert.ok(deference, `prompt must defer on colour: ${prompt}`);
  assert.ok(deference.includes(REFERENCE_FRAME_TAG), deference);
});

test("the subject-exclusion clause sits beside a tagged reference", () => {
  const { prompt } = composeInspiredPrompt("a butterfly", artwork(), {
    referenceImage: true,
  });
  const exclusion = prompt
    .split(/(?<=\.)\s+/)
    .find((sentence) => /must not appear/i.test(sentence));

  assert.ok(exclusion, `prompt must exclude the source subject: ${prompt}`);
  assert.ok(
    exclusion.includes(REFERENCE_FRAME_TAG),
    `the exclusion must scope to the tagged reference: ${exclusion}`,
  );
  assert.match(exclusion, /subject, objects and composition/i);
});

test("composed prompt never asks the model to copy or reproduce the artwork", () => {
  const banned = [
    "copy",
    "reproduce",
    "reproduction",
    "replicate",
    "replica",
    "recreate",
    "duplicate",
    "in the exact style of",
    "in the style of",
    "exact style",
    "imitate",
    "forgery",
    "pastiche",
  ];

  // Both branches: the reference-image prompt is the riskier one, since it ships
  // the source painting to the model alongside the text.
  const prompts = [
    composeInspiredPrompt("a modern city street at night", artwork()).prompt,
    composeInspiredPrompt("a modern city street at night", artwork(), {
      referenceImage: true,
    }).prompt,
  ];

  for (const prompt of prompts) {
    for (const phrase of banned) {
      assert.ok(
        !prompt.toLowerCase().includes(phrase),
        `prompt should not contain "${phrase}": ${prompt}`,
      );
    }
  }
});

test("composed prompt collapses whitespace and wraps bare subjects in artistic guidance", () => {
  const { prompt, inspiredByObjectID } = composeInspiredPrompt(
    "  a   quiet   harbor  ",
    null,
  );
  assert.match(prompt, /\ba quiet harbor\b/);
  assert.ok(!prompt.includes("a   quiet"));
  assert.match(prompt, /museum-quality hand-made/i);
  assert.match(prompt, /not a digital illustration/i);
  assert.equal(inspiredByObjectID, null);
});

test("bare prompts reject glossy digital defaults", () => {
  const { prompt } = composeInspiredPrompt("a butterfly", null);
  assert.match(prompt, /visible hand of the artist/i);
  assert.match(prompt, /no cgi sheen/i);
  assert.ok(prompt.includes(BARE_ARTISTIC_GUIDANCE));
  assert.ok(prompt.includes(STYLE_COUNTER_GUIDANCE));
});

test("the required attribution and safety strings are exact", () => {
  assert.equal(
    MET_ATTRIBUTION,
    "Source artwork data and image from The Metropolitan Museum of Art Open Access collection.",
  );
  assert.equal(
    MET_SAFETY_NOTE,
    "Generated images are not affiliated with or endorsed by The Met.",
  );
});

test("the info panel copy is the two notices, verbatim", () => {
  assert.equal(
    GALLERY_INFO_TEXT,
    "Source artwork data and image from The Metropolitan Museum of Art Open Access collection. " +
      "Generated images are not affiliated with or endorsed by The Met.",
  );
});
