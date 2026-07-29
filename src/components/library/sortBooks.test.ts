import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Book } from "./types.ts";
import { booksForShelf } from "./sortBooks.ts";

const book = (
  id: string,
  year: string,
  dateRead?: string,
  isFavorite = false,
): Book => ({
  id,
  title: id,
  author: "Author",
  coverImage: "",
  rating: 0,
  year,
  dateRead,
  isFavorite,
});

describe("booksForShelf", () => {
  const books = [
    book("older", "2026", "2026-01-02", true),
    book("undated", "2026", undefined, true),
    book("newest", "2026", "2026-07-23", true),
    book("other-year", "2025", "2025-12-31", true),
  ];

  it("sorts a year shelf by date read, newest first, with undated books last", () => {
    assert.deepEqual(
      booksForShelf(books, "2026").map(({ id }) => id),
      ["newest", "older", "undated"],
    );
  });

  it("does not reorder the favorites or all shelves", () => {
    assert.deepEqual(
      booksForShelf(books, "favorites").map(({ id }) => id),
      ["older", "undated", "newest", "other-year"],
    );
    assert.deepEqual(
      booksForShelf(books, "all").map(({ id }) => id),
      ["older", "undated", "newest", "other-year"],
    );
  });

  it("preserves existing order when dates match", () => {
    const tied = [
      book("first", "2026", "2026-07-23"),
      book("second", "2026", "2026-07-23"),
    ];

    assert.deepEqual(
      booksForShelf(tied, "2026").map(({ id }) => id),
      ["first", "second"],
    );
  });
});
