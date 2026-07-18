import assert from "node:assert/strict";
import test from "node:test";
import {
  formatShelfCoverDateLabel,
  getShelfCoverDateLabel,
  resolveShelfCoverDateRaw,
  getShelfDisplayItems,
  sortByShelfCoverDateDesc,
} from "./shelfCoverDate.ts";

test("books prefer dateRead, then dateStarted, then _createdAt", () => {
  assert.equal(
    resolveShelfCoverDateRaw({
      mediaType: "book",
      dateRead: "2024-06-14",
      dateStarted: "2024-01-01",
      _createdAt: "2023-12-01T12:00:00Z",
    }),
    "2024-06-14",
  );
  assert.equal(
    resolveShelfCoverDateRaw({
      mediaType: "book",
      dateStarted: "2024-01-02",
      _createdAt: "2023-12-01T12:00:00Z",
    }),
    "2024-01-02",
  );
  assert.equal(
    resolveShelfCoverDateRaw({
      mediaType: "book",
      _createdAt: "2023-12-01T12:00:00Z",
    }),
    "2023-12-01T12:00:00Z",
  );
});

test("music uses only _createdAt", () => {
  assert.equal(
    resolveShelfCoverDateRaw({
      mediaType: "music",
      dateRead: "2024-06-14",
      dateWatched: "2024-06-14",
      _createdAt: "2024-03-05T08:00:00Z",
    }),
    "2024-03-05T08:00:00Z",
  );
});

test("movies prefer dateWatched, then _createdAt", () => {
  assert.equal(
    resolveShelfCoverDateRaw({
      mediaType: "movie",
      dateWatched: "2024-06-19",
      _createdAt: "2024-04-09T08:00:00Z",
    }),
    "2024-06-19",
  );
  assert.equal(
    resolveShelfCoverDateRaw({
      mediaType: "movie",
      dateStarted: "2024-06-14",
      _createdAt: "2024-04-09T08:00:00Z",
    }),
    "2024-04-09T08:00:00Z",
  );
});

test("missing candidates return undefined (not empty string)", () => {
  assert.equal(resolveShelfCoverDateRaw({ mediaType: "book" }), undefined);
  assert.equal(resolveShelfCoverDateRaw({ mediaType: "music" }), undefined);
  assert.equal(getShelfCoverDateLabel({ mediaType: "movie" }), undefined);
});

test("formats as short month + day in UTC with no year", () => {
  assert.equal(formatShelfCoverDateLabel("2024-06-14"), "Jun 14");
  // Near UTC midnight in a negative-offset locale must not shift the day
  assert.equal(formatShelfCoverDateLabel("2024-06-14T00:30:00Z"), "Jun 14");
  assert.equal(formatShelfCoverDateLabel("not-a-date"), undefined);
});

test("getShelfCoverDateLabel composes resolve + format", () => {
  assert.equal(
    getShelfCoverDateLabel({
      mediaType: "book",
      dateRead: "2024-06-14",
    }),
    "Jun 14",
  );
});

test("sortByShelfCoverDateDesc orders newest to oldest", () => {
  const sorted = sortByShelfCoverDateDesc([
    { id: "old", coverDateRaw: "2023-01-01" },
    { id: "new", coverDateRaw: "2025-06-14" },
    { id: "mid", coverDateRaw: "2024-03-05T08:00:00Z" },
  ]);
  assert.deepEqual(
    sorted.map((item) => item.id),
    ["new", "mid", "old"],
  );
});

test("sortByShelfCoverDateDesc puts missing/invalid dates at the end", () => {
  const sorted = sortByShelfCoverDateDesc([
    { id: "missing" },
    { id: "new", coverDateRaw: "2025-01-01" },
    { id: "invalid", coverDateRaw: "not-a-date" },
    { id: "old", coverDateRaw: "2020-01-01" },
  ]);
  assert.deepEqual(
    sorted.map((item) => item.id),
    ["new", "old", "missing", "invalid"],
  );
});

test("sortByShelfCoverDateDesc is stable for equal dates", () => {
  const sorted = sortByShelfCoverDateDesc([
    { id: "a", coverDateRaw: "2024-06-14" },
    { id: "b", coverDateRaw: "2024-06-14" },
    { id: "c", coverDateRaw: "2024-06-14" },
  ]);
  assert.deepEqual(
    sorted.map((item) => item.id),
    ["a", "b", "c"],
  );
});

test("getShelfDisplayItems keeps featured order and sorts year views", () => {
  const items = [
    {
      id: "feat-old",
      year: "2023",
      isFeatured: true,
      coverDateRaw: "2023-01-01",
    },
    {
      id: "feat-new",
      year: "2025",
      isFeatured: true,
      coverDateRaw: "2025-06-01",
    },
    {
      id: "y2024-old",
      year: "2024",
      isFeatured: false,
      coverDateRaw: "2024-01-01",
    },
    {
      id: "y2024-new",
      year: "2024",
      isFeatured: false,
      coverDateRaw: "2024-12-01",
    },
    {
      id: "y2024-missing",
      year: "2024",
      isFeatured: false,
    },
  ];

  assert.deepEqual(
    getShelfDisplayItems(items, undefined, 1).map((item) => item.id),
    ["feat-old"],
  );
  assert.deepEqual(
    getShelfDisplayItems(items, "", 5).map((item) => item.id),
    ["feat-old", "feat-new"],
  );
  assert.deepEqual(
    getShelfDisplayItems(items, "2024", 5).map((item) => item.id),
    ["y2024-new", "y2024-old", "y2024-missing"],
  );
});
