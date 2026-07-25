import assert from "node:assert/strict";
import test from "node:test";
import {
  extensionForMimeType,
  filenameTimestamp,
  generatedImageFilename,
  mimeTypeFromUrl,
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

test("filenameTimestamp is sortable and free of characters Windows rejects", () => {
  const stamp = filenameTimestamp(new Date(2026, 6, 24, 17, 5, 3));
  assert.equal(stamp, "2026-07-24T17-05-03");
  assert.ok(!/[:\\/*?"<>|]/.test(stamp));
});

test("generatedImageFilename names the file after the artwork and the time", () => {
  const name = generatedImageFilename({
    inspirationTitle: "Sunflowers",
    imageUrl: "data:image/png;base64,iVBORw0KGgo=",
    date: new Date(2026, 6, 24, 17, 5, 3),
  });
  assert.equal(name, "gallery-sunflowers-2026-07-24T17-05-03.png");
});

test("generatedImageFilename never leaks an internal painting id", () => {
  // `back-1` and friends identify a canvas in code and mean nothing in a
  // downloads folder.
  const name = generatedImageFilename({
    inspirationTitle: "Sunflowers",
    imageUrl: "data:image/png;base64,iVBORw0KGgo=",
    date: new Date(2026, 6, 24, 17, 5, 3),
  });
  assert.ok(!/\b(back|front|left|right)-\d/.test(name), name);
});

test("generatedImageFilename omits the artwork slug when nothing was selected", () => {
  const name = generatedImageFilename({
    inspirationTitle: null,
    imageUrl: "data:image/png;base64,iVBORw0KGgo=",
    date: new Date(2026, 6, 24, 17, 5, 3),
  });
  assert.equal(name, "gallery-2026-07-24T17-05-03.png");
});

test("generatedImageFilename derives the extension from the image, not a guess", () => {
  const jpeg = generatedImageFilename({
    imageUrl: "data:image/jpeg;base64,/9j/4AAQ",
    date: new Date(2026, 6, 24, 17, 5, 3),
  });
  assert.ok(jpeg.endsWith(".jpg"), jpeg);

  // A remote URL declares no MIME type, so the default applies.
  const remote = generatedImageFilename({
    imageUrl: "https://cdn.example.com/image",
    date: new Date(2026, 6, 24, 17, 5, 3),
  });
  assert.ok(remote.endsWith(".png"), remote);
});

test("generatedImageFilename survives an artwork title of only punctuation", () => {
  const name = generatedImageFilename({
    inspirationTitle: "!!!",
    imageUrl: "data:image/png;base64,iVBORw0KGgo=",
    date: new Date(2026, 6, 24, 17, 5, 3),
  });
  assert.equal(name, "gallery-2026-07-24T17-05-03.png");
  assert.ok(!name.includes("--"), name);
});
