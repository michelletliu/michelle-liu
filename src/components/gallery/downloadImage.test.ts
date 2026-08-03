import assert from "node:assert/strict";
import test from "node:test";
import {
  extensionForMimeType,
  generatedImageFilename,
  mimeTypeFromUrl,
  sanitizeFilenameLabel,
  slugifyForFilename,
} from "./downloadImage.ts";

test("mimeTypeFromUrl reads the type out of a data URL only", () => {
  assert.equal(
    mimeTypeFromUrl("data:image/png;base64,iVBORw0KGgo="),
    "image/png",
  );
  assert.equal(mimeTypeFromUrl("data:image/webp,abc"), "image/webp");
  assert.equal(mimeTypeFromUrl("https://example.com/a.png"), null);
  assert.equal(mimeTypeFromUrl("blob:https://example.com/uuid"), null);
});

test("extensionForMimeType maps known types and falls back to png", () => {
  assert.equal(extensionForMimeType("image/png"), "png");
  assert.equal(extensionForMimeType("image/jpeg"), "jpg");
  assert.equal(extensionForMimeType("IMAGE/WEBP"), "webp");
  assert.equal(extensionForMimeType("application/octet-stream"), "png");
  assert.equal(extensionForMimeType(null), "png");
});

test("sanitizeFilenameLabel strips illegal characters but keeps readable spacing", () => {
  assert.equal(
    sanitizeFilenameLabel('Sun/flowers: "a study" \\ <1887>'),
    "Sunflowers a study 1887",
  );
  assert.equal(
    sanitizeFilenameLabel("  collapsed   whitespace  "),
    "collapsed whitespace",
  );
  assert.equal(sanitizeFilenameLabel("L'Arlésienne"), "L'Arlesienne");
  assert.equal(sanitizeFilenameLabel("***"), "");
  assert.equal(sanitizeFilenameLabel(":::"), "");
});

test("sanitizeFilenameLabel caps length without trailing whitespace", () => {
  const label = sanitizeFilenameLabel(
    "La Berceuse Woman Rocking a Cradle Augustine Alix Pellicot Roulin Extra Words",
    40,
  );
  assert.ok(label.length <= 40, label);
  assert.ok(!label.endsWith(" "), label);
});

test("slugifyForFilename strips characters that are illegal in filenames", () => {
  assert.equal(
    slugifyForFilename('Sun/flowers: "a study" \\ <1887>'),
    "sun-flowers-a-study-1887",
  );
  assert.equal(slugifyForFilename("  collapsed   whitespace  "), "collapsed-whitespace");
  assert.equal(slugifyForFilename("L'Arlésienne"), "l-arlesienne");
  assert.equal(slugifyForFilename("***"), "");
});

test("slugifyForFilename caps length without leaving a trailing separator", () => {
  const slug = slugifyForFilename(
    "La Berceuse Woman Rocking a Cradle Augustine Alix Pellicot Roulin",
  );
  assert.ok(slug.length <= 40, slug);
  assert.ok(!slug.endsWith("-"), slug);

  assert.equal(slugifyForFilename("abcdefghij klmnop", 11), "abcdefghij");
});

test("generatedImageFilename uses Inspired by + title when inspiration exists", () => {
  const name = generatedImageFilename({
    inspirationTitle: "The Lake of Zug",
    imageUrl: "data:image/png;base64,iVBORw0KGgo=",
  });
  assert.equal(name, "Inspired by The Lake of Zug.png");
});

test("generatedImageFilename never leaks an internal painting id", () => {
  // `back-1` and friends identify a canvas in code and mean nothing in a
  // downloads folder.
  const name = generatedImageFilename({
    inspirationTitle: "Sunflowers",
    imageUrl: "data:image/png;base64,iVBORw0KGgo=",
  });
  assert.ok(!/\b(back|front|left|right)-\d/.test(name), name);
});

test("generatedImageFilename falls back to Artwork with no inspiration", () => {
  const name = generatedImageFilename({
    inspirationTitle: null,
    imageUrl: "data:image/png;base64,iVBORw0KGgo=",
  });
  assert.equal(name, "Artwork.png");
});

test("generatedImageFilename derives the extension from the image, not a guess", () => {
  const jpeg = generatedImageFilename({
    imageUrl: "data:image/jpeg;base64,/9j/4AAQ",
  });
  assert.ok(jpeg.endsWith(".jpg"), jpeg);

  // A remote URL declares no MIME type, so the default applies.
  const remote = generatedImageFilename({
    imageUrl: "https://cdn.example.com/image",
  });
  assert.ok(remote.endsWith(".png"), remote);
});

test("generatedImageFilename falls back when the title sanitizes to empty", () => {
  const name = generatedImageFilename({
    inspirationTitle: ":::???***",
    imageUrl: "data:image/png;base64,iVBORw0KGgo=",
  });
  assert.equal(name, "Artwork.png");
});
