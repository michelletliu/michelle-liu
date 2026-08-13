import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { muxPosterUrl } from "./muxPoster.ts";

describe("muxPosterUrl", () => {
  for (const projectId of ["gallery", "design-meetup", "sundays"]) {
    it(`pins the ${projectId} poster to the first frame`, () => {
      assert.equal(
        muxPosterUrl("abc123", { projectId, width: 1920 }),
        "https://image.mux.com/abc123/thumbnail.png?width=1920&time=0",
      );
    });
  }

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
    assert.equal(
      muxPosterUrl("abc123", { projectId: "gallery" }),
      "https://image.mux.com/abc123/thumbnail.png?time=0",
    );
    assert.equal(
      muxPosterUrl("abc123", { projectId: "design-meetup" }),
      "https://image.mux.com/abc123/thumbnail.png?time=0",
    );
    assert.equal(
      muxPosterUrl("abc123", { projectId: "sundays" }),
      "https://image.mux.com/abc123/thumbnail.png?time=0",
    );
  });
});
