import assert from "node:assert/strict";
import test from "node:test";
import {
  COMMUNITY_ARCHIVE_ID,
  communitySidebarLeaves,
  orderCommunitiesForDisplay,
  splitCommunityNav,
} from "./communityNav.ts";

const sundays = { id: "sundays", sidebarName: "sundays in la" };
const figma = { id: "figma", sidebarName: "Figma @ UCLA" };
const productSpace = {
  id: "ps",
  sidebarName: "Product Space",
  isArchived: true,
};
const nexus = { id: "nexus", sidebarName: "Nexus" };

test("splitCommunityNav keeps active names first and archived last", () => {
  const { active, archived } = splitCommunityNav([
    sundays,
    figma,
    productSpace,
    nexus,
  ]);
  assert.deepEqual(
    active.map((item) => item.id),
    ["sundays", "figma", "nexus"],
  );
  assert.deepEqual(
    archived.map((item) => item.id),
    ["ps"],
  );
});

test("splitCommunityNav ignores items without a sidebar name", () => {
  const { active, archived } = splitCommunityNav([
    { id: "hidden" },
    { id: "archived-hidden", isArchived: true },
    sundays,
    productSpace,
  ]);
  assert.deepEqual(
    active.map((item) => item.id),
    ["sundays"],
  );
  assert.deepEqual(
    archived.map((item) => item.id),
    ["ps"],
  );
});

test("orderCommunitiesForDisplay moves archived cards after active ones", () => {
  const ordered = orderCommunitiesForDisplay([
    sundays,
    productSpace,
    nexus,
  ]);
  assert.deepEqual(
    ordered.map((item) => item.id),
    ["sundays", "nexus", "ps"],
  );
});

test("communitySidebarLeaves nests archived names under Archive", () => {
  const leaves = communitySidebarLeaves({
    active: [sundays, figma, nexus],
    archived: [productSpace],
    archiveOpen: false,
  });
  assert.equal(leaves[leaves.length - 1]?.id, COMMUNITY_ARCHIVE_ID);
  assert.equal(leaves[leaves.length - 1]?.nested?.expanded, false);
  assert.deepEqual(
    leaves[leaves.length - 1]?.nested?.children.map((child) => child.label),
    ["Product Space"],
  );
});

test("communitySidebarLeaves omits Archive when nothing is archived", () => {
  const leaves = communitySidebarLeaves({
    active: [sundays, nexus],
    archived: [],
    archiveOpen: true,
  });
  assert.equal(
    leaves.some((leaf) => leaf.id === COMMUNITY_ARCHIVE_ID),
    false,
  );
});
