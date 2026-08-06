import assert from "node:assert/strict";
import test from "node:test";
import {
  FRAMING_BREATHING_PX,
  FRAMING_HEADROOM_SHARE,
  FRAMING_LATERAL_BIAS,
  GALLERY_PAINTINGS,
  GALLERY_ROOM,
  GALLERY_ZOOM_DEFAULT,
  GALLERY_ZOOM_MAX,
  GALLERY_ZOOM_MIN,
  HANGS_PER_WALL,
  WALL_LOOP,
  WALL_TRAVEL,
  adjacentPaintingId,
  clampFramingDrop,
  clampGalleryZoom,
  clampProgress,
  easeWithPanel,
  focusedPaintingId,
  fovForZoom,
  framedRoomPose,
  framingViewportAspect,
  lerpRoomPose,
  paintingLayout,
  paintingsByDepth,
  paintingsByOrder,
  progressForPainting,
  roomPoseForPainting,
  standOffForPainting,
  type GalleryFraming,
  type GalleryWall,
} from "./galleryPaintings.ts";
import {
  DRAG_DEADZONE_PX,
  dragPastDeadzone,
  isGalleryNoDragTarget,
} from "./galleryPointer.ts";

const WALLS: GalleryWall[] = ["left", "right", "back", "front"];

const ZOOM_LEVELS = [GALLERY_ZOOM_MIN, GALLERY_ZOOM_DEFAULT, GALLERY_ZOOM_MAX];

/**
 * Share of the viewport a framed hang covers when viewed from its own pose,
 * on the narrowest viewport the framing plans for.
 */
const NARROWEST_VIEWPORT_ASPECT = 1.3;
const frameShare = (id: string, zoom: number) => {
  const painting = GALLERY_PAINTINGS.find((p) => p.id === id)!;
  const layout = paintingLayout(painting);
  const pose = roomPoseForPainting(id, zoom);
  const distance = Math.hypot(pose.x - pose.lookX, pose.z - pose.lookZ);
  // The scene's frame lip stands proud of the canvas on every side.
  const lip = 0.12;
  const viewH = 2 * distance * Math.tan((fovForZoom(zoom) * Math.PI) / 360);
  return {
    distance,
    height: (layout.height + lip) / viewH,
    width: (layout.width + lip) / (viewH * NARROWEST_VIEWPORT_ASPECT),
  };
};

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

/**
 * The regression this guards: the end walls used to park the eye on the room's
 * centerline for a one-point view, which centers only the middle hang of a
 * wall and leaves its neighbours off by the full hang spacing. With
 * `FRAMING_LATERAL_BIAS` at zero the framed view sits square on each hang —
 * never the wall midpoint.
 */
test("the eye tracks each hang square on its center", () => {
  for (const zoom of ZOOM_LEVELS) {
    for (const p of GALLERY_PAINTINGS) {
      const pose = roomPoseForPainting(p.id, zoom);
      const art = positionOf(p.id);
      const travel = WALL_TRAVEL[p.wall];
      const expected = FRAMING_LATERAL_BIAS * travel.sign;
      const offset =
        travel.axis === "z" ? pose.z - art.z : pose.x - art.x;
      assert.ok(
        Math.abs(offset - expected) < 1e-9,
        `${p.id} eye sits ${offset.toFixed(2)} off hang (want ${expected}) along ${travel.axis} at zoom ${zoom}`,
      );

      // Aimed at the hang center (or shared lateral bias if non-zero).
      const expectX = art.x + (travel.axis === "x" ? expected : 0);
      const expectZ = art.z + (travel.axis === "z" ? expected : 0);
      assert.equal(pose.lookX, expectX, `${p.id} look x`);
      assert.equal(pose.lookZ, expectZ, `${p.id} look z`);
    }
  }
});

test("the eye faces every wall square on, with no yaw off the hang", () => {
  for (const zoom of ZOOM_LEVELS) {
    for (const p of GALLERY_PAINTINGS) {
      const pose = roomPoseForPainting(p.id, zoom);
      const { normal } = paintingLayout(p);
      const fx = pose.lookX - pose.x;
      const fz = pose.lookZ - pose.z;
      const len = Math.hypot(fx, fz);
      assert.ok(len > 0.5, `${p.id} has a view direction`);

      // Standing off along the inward normal means looking straight back down it.
      assert.ok(
        Math.abs(fx / len + normal.x) < 1e-9 &&
          Math.abs(fz / len + normal.z) < 1e-9,
        `${p.id} views its wall at an angle at zoom ${zoom}`,
      );
    }
  }
});

test("roomPoseForPainting keeps the eye inside the room for every hang", () => {
  const { width, depth, height } = GALLERY_ROOM;
  for (const zoom of ZOOM_LEVELS) {
    for (const p of GALLERY_PAINTINGS) {
      const pose = roomPoseForPainting(p.id, zoom);
      assert.ok(Math.abs(pose.x) < width / 2, `${p.id} eye x inside room`);
      assert.ok(Math.abs(pose.z) < depth / 2, `${p.id} eye z inside room`);
      assert.ok(pose.y > 0 && pose.y < height, `${p.id} eye y inside room`);
    }
  }
});

test("zoom walks the eye in far enough to fill the frame with the hang", () => {
  for (const p of GALLERY_PAINTINGS) {
    const rest = frameShare(p.id, GALLERY_ZOOM_DEFAULT);
    const close = frameShare(p.id, GALLERY_ZOOM_MAX);
    const wide = frameShare(p.id, GALLERY_ZOOM_MIN);

    assert.ok(
      close.distance < rest.distance * 0.6,
      `${p.id} only closed from ${rest.distance.toFixed(2)} to ${close.distance.toFixed(2)}`,
    );
    assert.ok(wide.distance > rest.distance, `${p.id} zooms back out`);
    assert.ok(
      close.height > 0.7,
      `${p.id} still covers only ${(close.height * 100).toFixed(0)}% of the frame`,
    );
  }
});

test("a hang and its frame stay fully in view, and the eye clear of the wall", () => {
  for (const zoom of ZOOM_LEVELS) {
    for (const p of GALLERY_PAINTINGS) {
      const share = frameShare(p.id, zoom);
      assert.ok(
        share.height <= 0.86 && share.width <= 0.86,
        `${p.id} frame is cropped at zoom ${zoom} (${(share.height * 100).toFixed(0)}% tall, ${(share.width * 100).toFixed(0)}% wide)`,
      );
      // Well beyond the scene's 0.08 near plane and the frame's own depth.
      assert.ok(
        share.distance > 1,
        `${p.id} eye is ${share.distance.toFixed(2)} from the wall at zoom ${zoom}`,
      );
    }
  }
});

test("no zoom value, however broken, puts the eye through a wall", () => {
  const { width, depth } = GALLERY_ROOM;
  for (const zoom of [-50, 0, 1e6, Number.NaN, Number.POSITIVE_INFINITY]) {
    for (const p of GALLERY_PAINTINGS) {
      const pose = roomPoseForPainting(p.id, zoom);
      const art = positionOf(p.id);
      const distance = Math.hypot(pose.x - art.x, pose.z - art.z);

      assert.ok(
        distance > 0.5,
        `${p.id} dollied to ${distance} at zoom ${zoom}`,
      );
      assert.ok(
        Math.abs(pose.x) < width / 2 && Math.abs(pose.z) < depth / 2,
        `${p.id} eye left the room at zoom ${zoom}`,
      );

      // Still square on the wall with lateral framing intact (bias may be zero).
      const travel = WALL_TRAVEL[p.wall];
      const expected = FRAMING_LATERAL_BIAS * travel.sign;
      const offset =
        travel.axis === "z" ? pose.z - art.z : pose.x - art.x;
      assert.ok(
        Math.abs(offset - expected) < 1e-9,
        `${p.id} lost its framing alignment at zoom ${zoom}`,
      );
    }
  }
});

test("standOffForPainting frames both aspects from the same lens", () => {
  for (const aspect of ["portrait", "landscape"] as const) {
    const rest = standOffForPainting(aspect, GALLERY_ZOOM_DEFAULT);
    assert.ok(rest > 3 && rest < 6, `${aspect} rest stand-off ${rest}`);
    assert.ok(
      standOffForPainting(aspect, GALLERY_ZOOM_MAX) < rest,
      `${aspect} zoom closes in`,
    );
    assert.ok(
      standOffForPainting(aspect, GALLERY_ZOOM_MIN) > rest,
      `${aspect} zoom backs off`,
    );
  }

  // Zoom is clamped before it is used, so out-of-range values are inert.
  assert.equal(
    standOffForPainting("portrait", GALLERY_ZOOM_MAX + 5),
    standOffForPainting("portrait", GALLERY_ZOOM_MAX),
  );
});

/**
 * Height a framed hang covers, as a share of a viewport of the given shape,
 * from the stand-off that shape asks for.
 */
const heightShareOn = (
  aspect: "portrait" | "landscape",
  viewportAspect: number,
  zoom = GALLERY_ZOOM_DEFAULT,
) => {
  const lip = 0.12;
  const size = aspect === "portrait" ? 1.55 : 1.32;
  const standOff = standOffForPainting(aspect, zoom, viewportAspect);
  return (
    (size + lip) /
    (2 * standOff * Math.tan((fovForZoom(zoom) * Math.PI) / 360))
  );
};

test("a wider viewport is framed against its own width, not the narrowest one", () => {
  for (const aspect of ["portrait", "landscape"] as const) {
    const planned = standOffForPainting(aspect, GALLERY_ZOOM_DEFAULT);

    // Every viewport wider than the one planned for gets an eye no further
    // back than the plan's, and a wider one gets a nearer eye still.
    let previous = planned;
    for (const viewportAspect of [1.3, 1.5, 1.78, 2.1]) {
      const at = standOffForPainting(aspect, GALLERY_ZOOM_DEFAULT, viewportAspect);
      assert.ok(
        at <= previous + 1e-9,
        `${aspect} on ${viewportAspect} stood ${at} back, further than ${previous}`,
      );
      previous = at;
    }
  }

  // A short, wide window is the case this exists for: the landscape hang the
  // width fit was holding back now covers what the height fill asks of it.
  assert.ok(
    heightShareOn("landscape", 1024 / 559) >
      heightShareOn("landscape", NARROWEST_VIEWPORT_ASPECT) * 1.1,
    "a 1024x559 window did not recover the width fit's headroom",
  );
});

test("the height fill is the ceiling on how close a wide viewport comes", () => {
  // Whatever the width fit stops asking for, the hang still covers only the
  // share of the viewport's height the room frames every hang to.
  for (const aspect of ["portrait", "landscape"] as const) {
    for (const viewportAspect of [1.3, 1.6, 2.1, 3.2, 12]) {
      const share = heightShareOn(aspect, viewportAspect);
      assert.ok(
        share <= 0.3 + 1e-9,
        `${aspect} covered ${share} of a ${viewportAspect} viewport`,
      );
    }
  }
});

test("a viewport narrower than the plan is framed as it always was", () => {
  // Phones are upright, and backing the eye off far enough to fit a landscape
  // hang across a 0.46 viewport is a different question than this one.
  for (const aspect of ["portrait", "landscape"] as const) {
    for (const viewportAspect of [390 / 844, 0.9, 1.29, 1.3]) {
      assert.equal(
        standOffForPainting(aspect, GALLERY_ZOOM_DEFAULT, viewportAspect),
        standOffForPainting(aspect, GALLERY_ZOOM_DEFAULT),
        `${aspect} on ${viewportAspect} left the planned framing`,
      );
    }
  }
});

test("framingViewportAspect falls back until both sides are measured", () => {
  assert.equal(framingViewportAspect(null), NARROWEST_VIEWPORT_ASPECT);
  for (const framing of [
    { viewportHeightPx: 559, occlusionPx: 86 },
    { viewportHeightPx: 559, occlusionPx: 86, viewportWidthPx: 0 },
    { viewportHeightPx: 559, occlusionPx: 86, viewportWidthPx: -1024 },
    { viewportHeightPx: 559, occlusionPx: 86, viewportWidthPx: Number.NaN },
    {
      viewportHeightPx: 559,
      occlusionPx: 86,
      viewportWidthPx: Number.POSITIVE_INFINITY,
    },
    { viewportHeightPx: 0, occlusionPx: 86, viewportWidthPx: 1024 },
    { viewportHeightPx: Number.NaN, occlusionPx: 86, viewportWidthPx: 1024 },
  ] satisfies GalleryFraming[]) {
    assert.equal(
      framingViewportAspect(framing),
      NARROWEST_VIEWPORT_ASPECT,
      `${JSON.stringify(framing)} was read as a real viewport`,
    );
  }

  assert.equal(
    framingViewportAspect({
      viewportHeightPx: 559,
      occlusionPx: 86,
      viewportWidthPx: 1024,
    }),
    1024 / 559,
  );
});

test("a measured width brings the framed pose in, and keeps it in the room", () => {
  const measured: GalleryFraming = {
    viewportHeightPx: 559,
    occlusionPx: 86,
    viewportWidthPx: 1024,
  };
  const unmeasured: GalleryFraming = {
    viewportHeightPx: 559,
    occlusionPx: 86,
  };

  for (const zoom of ZOOM_LEVELS) {
    for (const p of GALLERY_PAINTINGS) {
      const near = framedRoomPose(p.id, zoom, measured);
      const far = framedRoomPose(p.id, zoom, unmeasured);
      const nearOff = Math.hypot(near.x - near.lookX, near.z - near.lookZ);
      const farOff = Math.hypot(far.x - far.lookX, far.z - far.lookZ);
      assert.ok(
        nearOff <= farOff + 1e-9,
        `${p.id} at zoom ${zoom} backed off once the width was known`,
      );

      // The dolly still runs the wall normal and still stops inside the box.
      const { width, depth, height } = GALLERY_ROOM;
      assert.ok(Math.abs(near.x) < width / 2, `${p.id} eye x left the room`);
      assert.ok(Math.abs(near.z) < depth / 2, `${p.id} eye z left the room`);
      assert.ok(
        near.y > 0 && near.y < height,
        `${p.id} eye y left the room`,
      );
      assert.ok(nearOff >= 0.6 - 1e-9, `${p.id} closed onto the near plane`);
    }
  }
});

/**
 * Where the focused frame's top and bottom edges land in the viewport, in px
 * measured down from its top, for a pose that may have been dropped to clear
 * a bar along the bottom.
 */
const frameEdgesPx = (id: string, zoom: number, framing: GalleryFraming) => {
  const layout = paintingLayout(GALLERY_PAINTINGS.find((p) => p.id === id)!);
  const pose = framedRoomPose(id, zoom, framing);
  // Depth to the wall plane (look target), not the art center — a lateral
  // framing bias offsets the eye along the wall without changing stand-off.
  const distance = Math.hypot(pose.x - pose.lookX, pose.z - pose.lookZ);
  const viewH = framing.viewportHeightPx;
  const worldPerPx =
    (2 * distance * Math.tan((fovForZoom(zoom) * Math.PI) / 360)) / viewH;
  const lip = 0.12;
  const halfPx = (layout.height + lip) / 2 / worldPerPx;
  // The eye aims at `lookY`, and the canvas center stands above it by whatever
  // the offset dropped the pose. Screen y counts downward from the top.
  const centerPx = viewH / 2 - (layout.position.y - pose.lookY) / worldPerPx;
  return { top: centerPx - halfPx, bottom: centerPx + halfPx };
};

/** World units the framing offset moved the eye down by, for one pose. */
const framingDrop = (id: string, zoom: number, framing: GalleryFraming) =>
  roomPoseForPainting(id, zoom).y - framedRoomPose(id, zoom, framing).y;

/** World height of a hang's bottom frame edge — the floor for the eye. */
const frameBottomY = (id: string) => {
  const layout = paintingLayout(GALLERY_PAINTINGS.find((p) => p.id === id)!);
  const lip = 0.12;
  return layout.position.y - (layout.height + lip) / 2;
};

test("with no bar measured, the framed pose is the plain pose", () => {
  for (const zoom of ZOOM_LEVELS) {
    for (const p of GALLERY_PAINTINGS) {
      const plain = roomPoseForPainting(p.id, zoom);
      assert.deepEqual(framedRoomPose(p.id, zoom), plain);
      assert.deepEqual(
        framedRoomPose(p.id, zoom, { viewportHeightPx: 900, occlusionPx: 0 }),
        plain,
        `${p.id} moved for a bar of no height`,
      );
    }
  }
});

/**
 * The collapsed state, and the requirement that it costs nothing: folded to
 * its pen the bar is a 40px circle over the room's floor, nowhere near the
 * frame, so the framing has to go back to exactly where it was.
 */
test("a bar too short to reach the frame does not move the camera", () => {
  const pen: GalleryFraming = { viewportHeightPx: 900, occlusionPx: 72 };
  for (const p of GALLERY_PAINTINGS) {
    assert.deepEqual(
      framedRoomPose(p.id, GALLERY_ZOOM_DEFAULT, pen),
      roomPoseForPainting(p.id, GALLERY_ZOOM_DEFAULT),
      `${p.id} moved for the folded bar`,
    );
  }
});

test("an expanded bar drops the camera until the frame clears it", () => {
  // Short-and-wide through tall-and-narrow, against the bar's two open
  // heights — prompt row alone, and the results grid above it.
  const viewports = [518, 620, 760, 900, 1080];
  const bars = [200, 260, 340];

  let moved = 0;
  for (const viewportHeightPx of viewports) {
    for (const occlusionPx of bars) {
      for (const zoom of ZOOM_LEVELS) {
        for (const p of GALLERY_PAINTINGS) {
          const framing = { viewportHeightPx, occlusionPx };
          const at = `${p.id} ${viewportHeightPx}px/${occlusionPx}px bar, zoom ${zoom}`;
          const before = frameEdgesPx(p.id, zoom, {
            viewportHeightPx,
            occlusionPx: 0,
          });
          const after = frameEdgesPx(p.id, zoom, framing);
          const barTop = viewportHeightPx - occlusionPx;

          // Lifting the bottom edge clear by pushing the top edge off screen
          // would not be showing the whole frame, so the offset never spends
          // more than its share of the gap it started with.
          assert.ok(
            after.top >= before.top * (1 - FRAMING_HEADROOM_SHARE) - 1e-6,
            `${at} spent ${(before.top - after.top).toFixed(1)}px of ${before.top.toFixed(1)}px of headroom`,
          );

          if (before.bottom <= barTop - FRAMING_BREATHING_PX) {
            assert.equal(framingDrop(p.id, zoom, framing), 0, `${at} moved`);
            continue;
          }

          moved += 1;
          assert.ok(after.bottom < before.bottom - 1e-6, `${at} did not move`);
          assert.ok(
            after.bottom <= barTop - FRAMING_BREATHING_PX + 1e-6 ||
              // Or it gave up short of clearing, which it is allowed to do
              // only by running into one of the two bounds. Which one, and
              // whether the answer is good enough, is settled below and in the
              // real-viewport test; here it only has to be one of them.
              after.top <= before.top * (1 - FRAMING_HEADROOM_SHARE) + 1e-6 ||
              framedRoomPose(p.id, zoom, framing).y <=
                frameBottomY(p.id) + 1e-6,
            `${at} stopped ${(after.bottom - barTop).toFixed(1)}px into the bar with ${after.top.toFixed(1)}px free above and the eye still at ${framedRoomPose(p.id, zoom, framing).y.toFixed(2)}`,
          );

          // The eye never ends up below the art it is looking at.
          assert.ok(
            framedRoomPose(p.id, zoom, framing).y >= frameBottomY(p.id) - 1e-6,
            `${at} put the eye under the frame`,
          );
        }
      }
    }
  }

  assert.ok(moved > 0, "no case in the grid actually needed reframing");
});

/**
 * The three heights the bar is actually rendered at, measured in the browser:
 * folded to its pen, open on the prompt row, and open with the results grid.
 * The grid varies by a row of padding depending on whether The Met's
 * thumbnails have landed, which is its own small argument against picking a
 * number instead of measuring one.
 */
const BAR_PX = { pen: 72, promptRow: 102, grid: 292, gridLoading: 312 };

/**
 * The bug as it was reported: the middle back hang, the bar open on its
 * results grid, on a laptop viewport. This is the case that has to come out
 * from under the panel cleanly — no headroom excuse, no clamp excuse.
 */
test("the bar's real heights clear the frame on real viewports", () => {
  for (const viewportHeightPx of [560, 720, 900]) {
    for (const occlusionPx of Object.values(BAR_PX)) {
      for (const id of ["back-2", "left-2"]) {
        const framing = { viewportHeightPx, occlusionPx };
        const zoom = GALLERY_ZOOM_DEFAULT;
        const at = `${id} on ${viewportHeightPx}px with a ${occlusionPx}px bar`;
        const before = frameEdgesPx(id, zoom, { ...framing, occlusionPx: 0 });
        const after = frameEdgesPx(id, zoom, framing);
        const barTop = viewportHeightPx - occlusionPx;

        if (before.bottom <= barTop - FRAMING_BREATHING_PX) {
          assert.equal(
            framingDrop(id, zoom, framing),
            0,
            `${at} moved the camera for a bar that was never in the way`,
          );
          continue;
        }

        const hidden = after.bottom - barTop;
        if (viewportHeightPx >= 720) {
          // Room to solve it properly, so it has to be solved properly.
          assert.ok(
            hidden <= -FRAMING_BREATHING_PX + 1e-6,
            `${at} still sits ${hidden.toFixed(1)}px into the bar`,
          );
        } else {
          // Not enough screen to clear it outright, so most of the way and a
          // camera left somewhere sane — never worse than it started.
          assert.ok(hidden < before.bottom - barTop, `${at} did not improve`);
          assert.ok(
            hidden < (before.bottom - barTop) * 0.4,
            `${at} recovered only ${(before.bottom - barTop - hidden).toFixed(1)}px of ${(before.bottom - barTop).toFixed(1)}px`,
          );
        }

        assert.ok(
          after.top >= before.top * (1 - FRAMING_HEADROOM_SHARE) - 1e-6,
          `${at} pushed the frame's top edge to ${after.top.toFixed(1)}px`,
        );

        // The eye stays level with the art rather than dropping under it.
        const eyeY = framedRoomPose(id, zoom, framing).y;
        assert.ok(
          eyeY >= frameBottomY(id) - 1e-9,
          `${at} dropped the eye to ${eyeY.toFixed(2)}, below the frame`,
        );
      }
    }
  }
});

/** The two states that need no help, and must therefore get none. */
test("the folded bar and the prompt row leave a laptop framing untouched", () => {
  for (const viewportHeightPx of [720, 900]) {
    for (const occlusionPx of [BAR_PX.pen, BAR_PX.promptRow]) {
      for (const p of GALLERY_PAINTINGS) {
        assert.deepEqual(
          framedRoomPose(p.id, GALLERY_ZOOM_DEFAULT, {
            viewportHeightPx,
            occlusionPx,
          }),
          roomPoseForPainting(p.id, GALLERY_ZOOM_DEFAULT),
          `${p.id} moved for a ${occlusionPx}px bar on ${viewportHeightPx}px`,
        );
      }
    }
  }
});

/**
 * The reason this is measured rather than picked: the bar is a different
 * height folded, open on its prompt row, and open with the results grid, and
 * one number cannot be right for all three.
 */
test("the drop tracks the bar's real height", () => {
  const viewportHeightPx = 620;
  const bars = [72, 120, 200, 260, 340];

  for (const p of GALLERY_PAINTINGS) {
    const drops = bars.map((occlusionPx) =>
      framingDrop(p.id, GALLERY_ZOOM_DEFAULT, {
        viewportHeightPx,
        occlusionPx,
      }),
    );
    for (let i = 1; i < drops.length; i++) {
      assert.ok(
        drops[i]! >= drops[i - 1]! - 1e-9,
        `${p.id} drop fell from ${drops[i - 1]} to ${drops[i]} as the bar grew`,
      );
    }
    assert.ok(
      drops.at(-1)! > drops[0]! + 1e-6,
      `${p.id} answered the tallest and the shortest bar identically`,
    );
  }
});

/**
 * The clamp this guards is new. Every other camera move runs along a wall
 * normal, where the stand-off bound holds it inside the room; this is the
 * first one with a vertical component, so it is the first that could put the
 * eye through the floor or the ceiling.
 */
test("no bar, however tall, drives the eye out of the room", () => {
  const { width, depth, height } = GALLERY_ROOM;
  const viewports = [240, 518, 900, 4000];
  const bars = [300, 2000, 1e6, Number.MAX_SAFE_INTEGER];
  const zooms = [...ZOOM_LEVELS, GALLERY_ZOOM_MAX * 4, 1e6];

  for (const viewportHeightPx of viewports) {
    for (const occlusionPx of bars) {
      for (const zoom of zooms) {
        for (const p of GALLERY_PAINTINGS) {
          const framing = { viewportHeightPx, occlusionPx };
          const pose = framedRoomPose(p.id, zoom, framing);
          const at = `${p.id} ${viewportHeightPx}px/${occlusionPx}px bar, zoom ${zoom}`;

          for (const [axis, v] of Object.entries(pose)) {
            assert.ok(Number.isFinite(v), `${at} produced a broken ${axis}`);
          }
          assert.ok(pose.y > 0.2, `${at} sank the eye to ${pose.y}`);
          assert.ok(pose.y < height - 0.2, `${at} raised the eye to ${pose.y}`);
          assert.ok(Math.abs(pose.x) < width / 2, `${at} eye left the room in x`);
          assert.ok(Math.abs(pose.z) < depth / 2, `${at} eye left the room in z`);

          // The dolly is untouched: reframing is vertical only, so the eye
          // stays as far off the wall, and as centered on the hang, as it was.
          const plain = roomPoseForPainting(p.id, zoom);
          assert.equal(pose.x, plain.x, `${at} slid off the hang in x`);
          assert.equal(pose.z, plain.z, `${at} slid off the hang in z`);
          assert.equal(pose.lookX, plain.lookX, `${at} look x`);
          assert.equal(pose.lookZ, plain.lookZ, `${at} look z`);

          // Eye and target dropped together, so the view is no more tilted
          // than it was — a canvas is a flat plane and a tilt keystones it.
          assert.ok(
            Math.abs(pose.y - pose.lookY - (plain.y - plain.lookY)) < 1e-9,
            `${at} tilted the camera off level`,
          );
        }
      }
    }
  }
});

test("a broken measurement leaves the framing alone", () => {
  const broken: GalleryFraming[] = [
    { viewportHeightPx: Number.NaN, occlusionPx: 240 },
    { viewportHeightPx: 900, occlusionPx: Number.NaN },
    { viewportHeightPx: 0, occlusionPx: 240 },
    { viewportHeightPx: -900, occlusionPx: 240 },
    { viewportHeightPx: 900, occlusionPx: -240 },
    { viewportHeightPx: Number.POSITIVE_INFINITY, occlusionPx: 240 },
    { viewportHeightPx: 900, occlusionPx: Number.POSITIVE_INFINITY },
  ];
  for (const framing of broken) {
    for (const p of GALLERY_PAINTINGS) {
      assert.deepEqual(
        framedRoomPose(p.id, GALLERY_ZOOM_DEFAULT, framing),
        roomPoseForPainting(p.id, GALLERY_ZOOM_DEFAULT),
        `${p.id} moved for ${JSON.stringify(framing)}`,
      );
    }
  }
});

test("clampFramingDrop keeps the eye clear of the floor and the ceiling", () => {
  const { eyeY, height } = GALLERY_ROOM;

  assert.equal(clampFramingDrop(0), 0);
  assert.equal(clampFramingDrop(0.2), 0.2);
  assert.equal(clampFramingDrop(-0.2), -0.2);
  assert.equal(clampFramingDrop(Number.NaN), 0);

  assert.ok(eyeY - clampFramingDrop(1e6) > 0.2, "floor");
  assert.ok(eyeY - clampFramingDrop(-1e6) < height - 0.2, "ceiling");
});

test("easeWithPanel samples the curve the action bar opens on", () => {
  assert.equal(easeWithPanel(0), 0);
  assert.equal(easeWithPanel(1), 1);
  assert.equal(easeWithPanel(-1), 0);
  assert.equal(easeWithPanel(2), 1);

  let previous = 0;
  for (let i = 1; i <= 100; i++) {
    const v = easeWithPanel(i / 100);
    assert.ok(v >= previous - 1e-9, `fell back at t=${i / 100}`);
    assert.ok(v >= 0 && v <= 1, `left [0,1] at t=${i / 100}`);
    previous = v;
  }

  // cubic-bezier(0.4, 0, 0.2, 1) is front-loaded — three quarters of the way
  // there by the midpoint of its run. An ease that were merely symmetric
  // would sit at 0.5 here and lag the panel through the whole transition.
  const mid = easeWithPanel(0.5);
  assert.ok(Math.abs(mid - 0.7757) < 0.005, `midpoint sampled ${mid}`);
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
