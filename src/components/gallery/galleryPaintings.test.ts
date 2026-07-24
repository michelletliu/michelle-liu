import assert from "node:assert/strict";
import test from "node:test";
import {
  GALLERY_PAINTINGS,
  GALLERY_ROOM,
  GALLERY_ZOOM_DEFAULT,
  GALLERY_ZOOM_MAX,
  GALLERY_ZOOM_MIN,
  HANGS_PER_WALL,
  WALL_LOOP,
  WALL_TRAVEL,
  adjacentPaintingId,
  clampGalleryZoom,
  clampProgress,
  focusedPaintingId,
  lerpRoomPose,
  paintingLayout,
  paintingsByDepth,
  paintingsByOrder,
  progressForPainting,
  roomPoseForPainting,
  type GalleryWall,
} from "./galleryPaintings.ts";
import {
  DRAG_DEADZONE_PX,
  dragPastDeadzone,
  isGalleryNoDragTarget,
} from "./galleryPointer.ts";

const WALLS: GalleryWall[] = ["left", "right", "back", "front"];

const wallOf = (id: string): GalleryWall =>
  GALLERY_PAINTINGS.find((p) => p.id === id)!.wall;

const positionOf = (id: string) =>
  paintingLayout(GALLERY_PAINTINGS.find((p) => p.id === id)!).position;

/**
 * Unit vector pointing to the right of a viewer standing at that hang's pose:
 * cross(forward, +Y) reduces to (-forwardZ, 0, forwardX).
 */
const viewerRight = (id: string) => {
  const pose = roomPoseForPainting(id);
  const fx = pose.lookX - pose.x;
  const fz = pose.lookZ - pose.z;
  const len = Math.hypot(fx, fz) || 1;
  return { x: -fz / len, z: fx / len };
};

/** The full forward walk, starting from the first hang in tour order. */
const forwardCycle = (): string[] => {
  const walk = [paintingsByOrder()[0]!.id];
  for (let i = 1; i < GALLERY_PAINTINGS.length; i++) {
    walk.push(adjacentPaintingId(walk[i - 1]!, 1));
  }
  return walk;
};

test("GALLERY_PAINTINGS hangs 3 blank canvases on each of the four walls", () => {
  assert.equal(HANGS_PER_WALL, 3);
  assert.equal(GALLERY_PAINTINGS.length, WALLS.length * HANGS_PER_WALL);
  assert.equal(GALLERY_PAINTINGS.length, 12);

  for (const wall of WALLS) {
    const onWall = GALLERY_PAINTINGS.filter((p) => p.wall === wall);
    assert.equal(onWall.length, HANGS_PER_WALL, `${wall} wall hang count`);
    assert.deepEqual(
      onWall.map((p) => p.slot).sort(),
      [0, 1, 2],
      `${wall} wall slots`,
    );
  }

  for (const p of GALLERY_PAINTINGS) {
    assert.equal(p.imageUrl, undefined);
    assert.ok(p.depth >= 0 && p.depth <= 1);
  }

  const ids = GALLERY_PAINTINGS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, "ids are unique");
});

test("order is a dense, unique 0..n-1 index", () => {
  const orders = GALLERY_PAINTINGS.map((p) => p.order).sort((a, b) => a - b);
  assert.deepEqual(
    orders,
    Array.from({ length: GALLERY_PAINTINGS.length }, (_, i) => i),
  );
});

test("side walls are portrait and end walls are landscape", () => {
  for (const p of GALLERY_PAINTINGS) {
    if (p.wall === "back" || p.wall === "front") {
      assert.equal(p.aspect, "landscape", `${p.id} aspect`);
    } else {
      assert.equal(p.aspect, "portrait", `${p.id} aspect`);
    }
  }
});

test("paintingsByDepth sorts near to far", () => {
  const sorted = paintingsByDepth();
  for (let i = 1; i < sorted.length; i++) {
    assert.ok(sorted[i]!.depth >= sorted[i - 1]!.depth);
  }
});

test("clampProgress keeps values in [0, 1]", () => {
  assert.equal(clampProgress(-0.2), 0);
  assert.equal(clampProgress(0.4), 0.4);
  assert.equal(clampProgress(1.5), 1);
});

test("focusedPaintingId picks the nearest depth to progress", () => {
  const sample = [
    {
      id: "a",
      wall: "left" as const,
      slot: 0,
      order: 0,
      depth: 0.2,
      aspect: "portrait" as const,
    },
    {
      id: "b",
      wall: "right" as const,
      slot: 0,
      order: 1,
      depth: 0.5,
      aspect: "portrait" as const,
    },
    {
      id: "c",
      wall: "back" as const,
      slot: 0,
      order: 2,
      depth: 0.9,
      aspect: "landscape" as const,
    },
  ];
  assert.equal(focusedPaintingId(0.22, sample), "a");
  assert.equal(focusedPaintingId(0.55, sample), "b");
  assert.equal(focusedPaintingId(0.95, sample), "c");
});

test("adjacentPaintingId walks tour order and cycles at the ends", () => {
  const tour = paintingsByOrder();
  const first = tour[0]!.id;
  const second = tour[1]!.id;
  const last = tour.at(-1)!.id;
  assert.equal(adjacentPaintingId(first, 1), second);
  assert.equal(adjacentPaintingId(last, 1), first);
  assert.equal(adjacentPaintingId(first, -1), last);
});

test("a full forward cycle visits every one of the 12 hangs exactly once", () => {
  const total = GALLERY_PAINTINGS.length;
  const start = paintingsByOrder()[0]!.id;

  const visited: string[] = [start];
  let current = start;
  for (let i = 1; i < total; i++) {
    current = adjacentPaintingId(current, 1);
    visited.push(current);
  }

  assert.equal(visited.length, total);
  assert.equal(new Set(visited).size, total, "no hang visited twice");
  assert.deepEqual(
    [...visited].sort(),
    GALLERY_PAINTINGS.map((p) => p.id).sort(),
    "every hang visited",
  );
  // One more step wraps back to where the walk started.
  assert.equal(adjacentPaintingId(current, 1), start);
});

test("a full reverse cycle visits every one of the 12 hangs exactly once", () => {
  const total = GALLERY_PAINTINGS.length;
  const start = paintingsByOrder()[0]!.id;

  const visited: string[] = [start];
  let current = start;
  for (let i = 1; i < total; i++) {
    current = adjacentPaintingId(current, -1);
    visited.push(current);
  }

  assert.equal(visited.length, total);
  assert.equal(new Set(visited).size, total, "no hang visited twice");
  assert.deepEqual(
    [...visited].sort(),
    GALLERY_PAINTINGS.map((p) => p.id).sort(),
    "every hang visited",
  );
  assert.equal(adjacentPaintingId(current, -1), start);
});

test("the reverse cycle is exactly the forward cycle reversed", () => {
  const total = GALLERY_PAINTINGS.length;
  const start = paintingsByOrder()[0]!.id;

  const forward: string[] = [start];
  const reverse: string[] = [start];
  for (let i = 1; i < total; i++) {
    forward.push(adjacentPaintingId(forward[i - 1]!, 1));
    reverse.push(adjacentPaintingId(reverse[i - 1]!, -1));
  }

  for (let i = 0; i < total; i++) {
    assert.equal(
      reverse[i],
      forward[(total - i) % total],
      `reverse step ${i} mirrors the forward walk`,
    );
  }
});

test("the forward cycle walks the four walls contiguously in loop order", () => {
  const walk = forwardCycle();
  const wallsInOrder = walk.map((id) => wallOf(id));

  // Each wall appears as one unbroken run of HANGS_PER_WALL hangs...
  const runs: GalleryWall[] = [];
  for (const wall of wallsInOrder) {
    if (runs.at(-1) !== wall) runs.push(wall);
  }
  assert.equal(runs.length, WALL_LOOP.length, "walls are not interleaved");
  for (const wall of WALL_LOOP) {
    assert.equal(
      wallsInOrder.filter((w) => w === wall).length,
      HANGS_PER_WALL,
    );
  }

  // ...and the runs follow WALL_LOOP, allowing for where the walk started.
  const offset = WALL_LOOP.indexOf(runs[0]!);
  assert.ok(offset >= 0);
  for (let i = 0; i < runs.length; i++) {
    assert.equal(runs[i], WALL_LOOP[(offset + i) % WALL_LOOP.length]);
  }
});

test("every forward step moves to the viewer's right, including the seam", () => {
  const walk = forwardCycle();

  for (let i = 0; i < walk.length; i++) {
    const fromId = walk[i]!;
    const toId = walk[(i + 1) % walk.length]!;
    const from = positionOf(fromId);
    const to = positionOf(toId);

    if (wallOf(fromId) !== wallOf(toId)) {
      // Wall changes happen at a shared corner, so the two hangs stay close —
      // no jump across the room at the seam.
      const gap = Math.hypot(to.x - from.x, to.z - from.z);
      assert.ok(gap < 4, `${fromId}->${toId} corner hop was ${gap.toFixed(2)}`);
      continue;
    }

    const right = viewerRight(fromId);
    const along = (to.x - from.x) * right.x + (to.z - from.z) * right.z;
    assert.ok(
      along > 0,
      `${fromId}->${toId} moved ${along.toFixed(2)} along the viewer's right`,
    );
  }
});

test("facing walls run opposite ways in world coordinates", () => {
  const alongWall = (wall: GalleryWall) =>
    GALLERY_PAINTINGS.filter((p) => p.wall === wall)
      .sort((a, b) => a.slot - b.slot)
      .map((p) => {
        const pos = positionOf(p.id);
        const v = WALL_TRAVEL[wall].axis === "z" ? pos.z : pos.x;
        // Normalise float drift, and `+ 0` folds -0 into 0 so mirrored walls
        // compare equal.
        return +v.toFixed(6) + 0;
      });

  const back = alongWall("back");
  const front = alongWall("front");
  const left = alongWall("left");
  const right = alongWall("right");

  const ascending = (v: number[]) => v.every((n, i) => i === 0 || n > v[i - 1]!);
  const descending = (v: number[]) => v.every((n, i) => i === 0 || n < v[i - 1]!);

  // Back runs +x while front runs -x: the entrance wall is viewed from the
  // other side, so its slots must mirror the back wall's in world terms.
  assert.ok(ascending(back), `back wall x order ${back}`);
  assert.ok(descending(front), `front wall x order ${front}`);
  assert.deepEqual(front, [...back].reverse(), "front mirrors back");

  // Same mirroring for the side walls — this pair is the one that regressed.
  assert.ok(descending(left), `left wall z order ${left}`);
  assert.ok(ascending(right), `right wall z order ${right}`);
  assert.deepEqual(right, [...left].reverse(), "right mirrors left");
});

test("stepping forward then back returns to the same hang from anywhere", () => {
  for (const p of GALLERY_PAINTINGS) {
    assert.equal(adjacentPaintingId(adjacentPaintingId(p.id, 1), -1), p.id);
    assert.equal(adjacentPaintingId(adjacentPaintingId(p.id, -1), 1), p.id);
  }
});

test("progressForPainting returns that painting's depth", () => {
  const p = GALLERY_PAINTINGS[0]!;
  assert.equal(progressForPainting(p.id), p.depth);
});

test("paintingLayout puts every hang on its wall facing inward", () => {
  const { width, depth, height } = GALLERY_ROOM;

  for (const p of GALLERY_PAINTINGS) {
    const layout = paintingLayout(p);
    const { position: pos, normal } = layout;

    if (p.wall === "left") {
      assert.ok(Math.abs(pos.x + width / 2) < 0.1, `${p.id} on left wall`);
      assert.deepEqual(normal, { x: 1, y: 0, z: 0 });
    } else if (p.wall === "right") {
      assert.ok(Math.abs(pos.x - width / 2) < 0.1, `${p.id} on right wall`);
      assert.deepEqual(normal, { x: -1, y: 0, z: 0 });
    } else if (p.wall === "back") {
      assert.ok(Math.abs(pos.z + depth / 2) < 0.1, `${p.id} on back wall`);
      assert.deepEqual(normal, { x: 0, y: 0, z: 1 });
    } else {
      assert.ok(Math.abs(pos.z - depth / 2) < 0.1, `${p.id} on front wall`);
      assert.deepEqual(normal, { x: 0, y: 0, z: -1 });
    }

    // Hangs sit fully inside the box, clear of floor and ceiling.
    assert.ok(pos.y - layout.height / 2 > 0.2, `${p.id} clears the floor`);
    assert.ok(pos.y + layout.height / 2 < height - 0.2, `${p.id} clears ceiling`);
  }
});

test("hangs on a wall are evenly spaced and never overlap or hit a corner", () => {
  const { width, depth } = GALLERY_ROOM;

  for (const wall of WALLS) {
    const alongZ = wall === "left" || wall === "right";
    const wallSpan = alongZ ? depth : width;

    const hangs = GALLERY_PAINTINGS.filter((p) => p.wall === wall)
      .map((p) => {
        const layout = paintingLayout(p);
        return {
          id: p.id,
          center: alongZ ? layout.position.z : layout.position.x,
          half: layout.width / 2,
        };
      })
      .sort((a, b) => a.center - b.center);

    for (let i = 1; i < hangs.length; i++) {
      const prev = hangs[i - 1]!;
      const cur = hangs[i]!;
      const gap = cur.center - cur.half - (prev.center + prev.half);
      assert.ok(gap > 0.5, `${prev.id}/${cur.id} gap ${gap.toFixed(2)}`);
    }

    // Even spacing between adjacent centers.
    const steps = hangs
      .slice(1)
      .map((h, i) => +(h.center - hangs[i]!.center).toFixed(6));
    assert.equal(new Set(steps).size, 1, `${wall} spacing is uniform`);

    const first = hangs[0]!;
    const last = hangs.at(-1)!;
    assert.ok(
      first.center - first.half > -wallSpan / 2 + 0.5,
      `${wall} clears the near corner`,
    );
    assert.ok(
      last.center + last.half < wallSpan / 2 - 0.5,
      `${wall} clears the far corner`,
    );
  }
});

test("roomPoseForPainting stands in front of each hang facing its wall", () => {
  const nearLeft = roomPoseForPainting("left-1");
  const farLeft = roomPoseForPainting("left-3");
  const right = roomPoseForPainting("right-1");
  const back = roomPoseForPainting("back-1");
  const front = roomPoseForPainting("front-1");

  // Looking left: eye is to the right of the target
  assert.ok(nearLeft.x > nearLeft.lookX);
  // Looking right: eye is to the left of the target
  assert.ok(right.x < right.lookX);
  // Looking at back wall: eye is in front (higher z) of the target
  assert.ok(back.z > back.lookZ);
  // Looking at the entrance wall: eye is deeper in the room (lower z)
  assert.ok(front.z < front.lookZ);
  // Far hangs sit deeper (lower z) than near hangs
  assert.ok(farLeft.z < nearLeft.z);
  assert.ok(nearLeft.z - farLeft.z > 2);
});

test("roomPoseForPainting keeps the eye inside the room for every hang", () => {
  const { width, depth, height } = GALLERY_ROOM;
  for (const p of GALLERY_PAINTINGS) {
    const pose = roomPoseForPainting(p.id);
    assert.ok(Math.abs(pose.x) < width / 2, `${p.id} eye x inside room`);
    assert.ok(Math.abs(pose.z) < depth / 2, `${p.id} eye z inside room`);
    assert.ok(pose.y > 0 && pose.y < height, `${p.id} eye y inside room`);
  }
});

test("lerpRoomPose interpolates each axis", () => {
  const a = {
    x: 0,
    y: 0,
    z: 0,
    lookX: 0,
    lookY: 0,
    lookZ: 0,
  };
  const b = {
    x: 50,
    y: 10,
    z: 100,
    lookX: 20,
    lookY: 4,
    lookZ: -40,
  };
  assert.deepEqual(lerpRoomPose(a, b, 0), a);
  assert.deepEqual(lerpRoomPose(a, b, 1), b);
  assert.deepEqual(lerpRoomPose(a, b, 0.5), {
    x: 25,
    y: 5,
    z: 50,
    lookX: 10,
    lookY: 2,
    lookZ: -20,
  });
});

test("clampGalleryZoom keeps zoom in range", () => {
  assert.equal(clampGalleryZoom(GALLERY_ZOOM_DEFAULT), GALLERY_ZOOM_DEFAULT);
  assert.equal(clampGalleryZoom(GALLERY_ZOOM_MIN - 1), GALLERY_ZOOM_MIN);
  assert.equal(clampGalleryZoom(GALLERY_ZOOM_MAX + 1), GALLERY_ZOOM_MAX);
});

test("isGalleryNoDragTarget ignores buttons, links, and data-gallery-no-drag", () => {
  assert.equal(isGalleryNoDragTarget(null), false);

  let seen = "";
  const hit = {
    closest(sel: string) {
      seen = sel;
      return { tag: "button" };
    },
  };
  assert.equal(isGalleryNoDragTarget(hit as unknown as EventTarget), true);
  assert.match(seen, /button/);
  assert.match(seen, /\ba\b/);
  assert.match(seen, /data-gallery-no-drag/);

  assert.equal(
    isGalleryNoDragTarget({
      closest: () => null,
    } as unknown as EventTarget),
    false,
  );
});

test("dragPastDeadzone only activates after movement threshold", () => {
  assert.equal(dragPastDeadzone(0, 0), false);
  assert.equal(dragPastDeadzone(3, 3), false);
  assert.equal(dragPastDeadzone(DRAG_DEADZONE_PX, 0), true);
  assert.equal(dragPastDeadzone(0, DRAG_DEADZONE_PX), true);
  assert.ok(DRAG_DEADZONE_PX >= 6 && DRAG_DEADZONE_PX <= 8);
});
