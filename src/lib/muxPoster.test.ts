import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { experimentCardImageSrc, muxPosterUrl } from "./muxPoster.ts";

const PINNED_POSTER_IDS = ["gallery", "design-meetup", "sundays"] as const;

describe("muxPosterUrl", () => {
  it("pins gallery, design-meetup, and sundays posters to the first frame", () => {
    for (const projectId of PINNED_POSTER_IDS) {
      assert.equal(
        muxPosterUrl("abc123", { projectId, width: 1920 }),
        "https://image.mux.com/abc123/thumbnail.png?width=1920&time=0",
      );
    }
  });

  it("leaves other projects on the Mux default frame", () => {
    assert.equal(
      muxPosterUrl("abc123", { projectId: "film", width: 1920 }),
      "https://image.mux.com/abc123/thumbnail.png?width=1920",
    );
  });

  it("omits the query string when no width or time applies", () => {
    assert.equal(
      muxPosterUrl("abc123"),
      "https://image.mux.com/abc123/thumbnail.png",
    );
  });

  it("still pins the first frame without a width", () => {
    for (const projectId of PINNED_POSTER_IDS) {
      assert.equal(
        muxPosterUrl("abc123", { projectId }),
        "https://image.mux.com/abc123/thumbnail.png?time=0",
      );
    }
  });
});

describe("experimentCardImageSrc", () => {
  it("keeps the pinned Mux poster when Sanity supplies a fallback thumbnail", () => {
    for (const projectId of PINNED_POSTER_IDS) {
      assert.equal(
        experimentCardImageSrc(
          "https://image.mux.com/abc123/thumbnail.png?width=1920&time=0",
          "https://cdn.sanity.io/settled-screenshot.jpg",
          projectId,
        ),
        "https://image.mux.com/abc123/thumbnail.png?width=1920&time=0",
      );
    }
  });

  it("uses the fallback thumbnail for projects on the default Mux frame", () => {
    assert.equal(
      experimentCardImageSrc(
        "https://image.mux.com/abc123/thumbnail.png?width=1920",
        "https://cdn.sanity.io/settled-screenshot.jpg",
        "film",
      ),
      "https://cdn.sanity.io/settled-screenshot.jpg",
    );
  });
});
