import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bookSlugFromPathname, withCurrentSearch } from "./shallowPath.ts";

describe("bookSlugFromPathname", () => {
  it("reads a fullscreen library book slug", () => {
    assert.equal(
      bookSlugFromPathname(
        "/project/library/full/a-personal-matter",
        "library",
        true,
      ),
      "a-personal-matter",
    );
  });

  it("returns undefined on the fullscreen library root", () => {
    assert.equal(
      bookSlugFromPathname("/project/library/full", "library", true),
      undefined,
    );
  });

  it("decodes encoded slugs", () => {
    assert.equal(
      bookSlugFromPathname(
        "/project/library/full/we-have-always%20lived",
        "library",
        true,
      ),
      "we-have-always lived",
    );
  });

  it("ignores the fullscreen segment in popup mode", () => {
    assert.equal(
      bookSlugFromPathname("/project/library/full", "library", false),
      undefined,
    );
  });
});

describe("withCurrentSearch", () => {
  it("keeps an existing shelf query on the new path", () => {
    assert.equal(
      withCurrentSearch("/project/library/full/a-personal-matter", {
        search: "?shelf=2026",
        hash: "",
      }),
      "/project/library/full/a-personal-matter?shelf=2026",
    );
  });

  it("leaves a clean path alone when there is no query", () => {
    assert.equal(
      withCurrentSearch("/project/library/full", { search: "", hash: "" }),
      "/project/library/full",
    );
  });
});
