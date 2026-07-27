import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { fetchMetObjects } from "./metClient.ts";

/**
 * Ids are chosen high and unique per test so they never collide with the
 * module-level record cache, which persists across tests by design.
 */
let nextId = 900_000;
function freshIds(count: number): number[] {
  return Array.from({ length: count }, () => nextId++);
}

/**
 * Stubs `/objects/{id}`, resolving each request after `delayFor(id)` ms so the
 * completion order can be forced to differ from the request order.
 */
function stubMet(delayFor: (id: number) => number) {
  mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);
    const objectID = Number(url.slice(url.lastIndexOf("/") + 1));
    await new Promise((resolve) => setTimeout(resolve, delayFor(objectID)));
    return new Response(
      JSON.stringify({
        objectID,
        title: `Object ${objectID}`,
        isPublicDomain: true,
        primaryImageSmall: `https://images.metmuseum.org/${objectID}.jpg`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  });
}

test("hydration preserves Met's relevance order regardless of completion order", async (t) => {
  // The Met ranks its own results and the grid shows them in that order, so a
  // pool that appended records as their promises settled would silently
  // scramble relevance — the top hit could land anywhere on the page.
  const ids = freshIds(12);
  // Earlier ids resolve last, so completion order is the exact reverse.
  stubMet((id) => (ids.length - ids.indexOf(id)) * 5);
  t.after(() => mock.restoreAll());

  const artworks = await fetchMetObjects(ids);

  assert.deepEqual(
    artworks.map((a) => a.objectID),
    ids,
  );
});

test("one failed record drops out without disturbing the order of the rest", async (t) => {
  const ids = freshIds(6);
  const doomed = ids[2]!;

  mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = String(input);
    const objectID = Number(url.slice(url.lastIndexOf("/") + 1));
    if (objectID === doomed) return new Response("", { status: 404 });
    return new Response(
      JSON.stringify({ objectID, title: `Object ${objectID}`, isPublicDomain: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  });
  t.after(() => mock.restoreAll());

  const artworks = await fetchMetObjects(ids);

  assert.deepEqual(
    artworks.map((a) => a.objectID),
    ids.filter((id) => id !== doomed),
  );
});

test("a repeated id is served from cache rather than re-fetched", async (t) => {
  const ids = freshIds(4);
  stubMet(() => 0);
  const fetchMock = globalThis.fetch as unknown as { mock: { calls: unknown[] } };
  t.after(() => mock.restoreAll());

  await fetchMetObjects(ids);
  const afterFirst = fetchMock.mock.calls.length;
  await fetchMetObjects(ids);

  assert.equal(afterFirst, ids.length);
  assert.equal(fetchMock.mock.calls.length, afterFirst);
});
