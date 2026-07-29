import * as THREE from "three";

/**
 * A tiling grayscale woodgrain for the picture frames, generated procedurally.
 *
 * Drawn rather than shipped as an image: it is a few dozen lines of noise, and
 * a binary asset would cost a network fetch, sit outside version-controlled
 * review, and be fixed at whatever scale it was exported at. This can be
 * retuned by changing a number.
 *
 * The output is a `normalMap`, never a `map`. Grain painted into albedo is a
 * grayscale picture printed on the frame; grain in the surface normal is a
 * relief that catches the room's light, which is what wood actually is. It
 * also leaves the frame's colour completely untouched, so the animated
 * charcoal-to-light-gray focus tint keeps its full contrast — a lightness map
 * would have compressed it.
 *
 * Normal rather than the more obvious `roughnessMap` or `bumpMap`, both of
 * which were tried first and measured as doing nothing at all here:
 *
 * - Roughness only modulates the specular lobe. This room is ambient 1.5 plus
 *   hemisphere 1.3 against a single 0.4 directional light, and neither of the
 *   first two produces any specular, so there is almost no specular to vary.
 * - three.js derives bump from the height difference across one screen pixel.
 *   The rail is fifteen pixels tall even at maximum zoom, so that difference
 *   is taken deep in the mip chain where the grain has already been filtered
 *   flat. Raising `bumpScale` fifty-fold moved the measured variation by 0.05.
 *
 * A normal map depends on neither: it states the perturbed normal outright,
 * and the diffuse term — which is what this room actually has — responds.
 */
const SIZE = 512;

/** Lattice period, in cells, of the coarsest noise octave. Keeps the tile seamless. */
const NOISE_PERIOD = 8;

/** Growth rings across the grain, per tile. */
const RINGS = 4;

/**
 * Steepest tilt the grain gives the surface normal, in degrees.
 *
 * Calibrated against the field's own 99th-percentile gradient rather than
 * applied as a raw multiplier, so retuning the noise above cannot silently
 * change how strong the relief comes out. Small on purpose: the grain has to
 * be imperceptible from across the room and only findable up close.
 */
const MAX_TILT_DEGREES = 25;

function hash(ix: number, iy: number, px: number, py: number) {
  const x = ((ix % px) + px) % px;
  const y = ((iy % py) + py) % py;
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

/** Value noise whose lattice wraps, so every octave tiles exactly. */
function pnoise(x: number, y: number, px: number, py: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy, px, py);
  const b = hash(ix + 1, iy, px, py);
  const c = hash(ix, iy + 1, px, py);
  const d = hash(ix + 1, iy + 1, px, py);
  const top = a + (b - a) * ux;
  const bottom = c + (d - c) * ux;
  return top + (bottom - top) * uy;
}

/** Octaves double in frequency, so their periods double too and the tile holds. */
function pfbm(
  x: number,
  y: number,
  px: number,
  py: number,
  octaves: number,
): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value +=
      amplitude *
      pnoise(x * frequency, y * frequency, px * frequency, py * frequency);
    frequency *= 2;
    amplitude *= 0.5;
  }
  return value;
}

/**
 * Build the shared woodgrain. One texture serves every frame — see
 * `scaleBoxUvsToWorld` for how each frame gets a consistent physical grain
 * size out of it — and the caller owns disposing it.
 *
 * Grain runs along the texture's U axis, which lands horizontal on the frames.
 * Orienting it per rail, so it always ran lengthways, would mean either
 * rebuilding each frame from four mitred rails or writing custom UVs that
 * cannot then tile; neither is worth it for an effect this quiet, and the
 * across-grain half is what reads as end grain at a corner anyway.
 */
export function createWoodgrainTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d canvas unavailable for the frame woodgrain");

  // Height first, then normals from it. Doing both in one pass would mean
  // recomputing each neighbour's height four times over.
  const height = new Float32Array(SIZE * SIZE);
  for (let py = 0; py < SIZE; py++) {
    const v = py / SIZE;
    for (let px = 0; px < SIZE; px++) {
      const u = px / SIZE;
      // Grain is stretched noise: near-constant along its length, busy across
      // it. Every frequency below is low in u and high in v for that reason.
      const wander = pfbm(u * 2, v * 6, 2, 6, 3);
      const rings =
        0.5 + 0.5 * Math.sin((v * RINGS + wander * 0.9) * Math.PI * 2);
      const pore = pfbm(u * 6, v * 24, 6, 24, 2);
      height[py * SIZE + px] = 0.66 * rings + 0.34 * pore;
    }
  }

  // Central differences, wrapping at the edges so the relief tiles as cleanly
  // as the height field does.
  const at = (x: number, y: number) =>
    height[(((y % SIZE) + SIZE) % SIZE) * SIZE + (((x % SIZE) + SIZE) % SIZE)];
  const gradU = new Float32Array(SIZE * SIZE);
  const gradV = new Float32Array(SIZE * SIZE);
  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      gradU[py * SIZE + px] = (at(px + 1, py) - at(px - 1, py)) * 0.5;
      gradV[py * SIZE + px] = (at(px, py + 1) - at(px, py - 1)) * 0.5;
    }
  }

  // Scale so the steepest gradients in the field land at MAX_TILT_DEGREES,
  // using a percentile rather than the maximum so one outlier texel cannot
  // flatten everything else.
  const magnitudes = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < magnitudes.length; i++) {
    magnitudes[i] = Math.hypot(gradU[i], gradV[i]);
  }
  const sorted = Float32Array.from(magnitudes).sort();
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 1;
  const scale = Math.tan((MAX_TILT_DEGREES * Math.PI) / 180) / p99;

  const image = ctx.createImageData(SIZE, SIZE);
  const data = image.data;
  for (let i = 0; i < SIZE * SIZE; i++) {
    // Negated: a normal map points away from rising height.
    const nx = -gradU[i] * scale;
    const ny = -gradV[i] * scale;
    const len = Math.hypot(nx, ny, 1);
    const o = i * 4;
    data[o] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
    data[o + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
    data[o + 2] = Math.round((1 / len) * 255);
    data[o + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // Surface data, not colour: it must not go through the sRGB decode that a
  // texture headed for `map` would.
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/**
 * World-space size of one tile of the grain, in the room's units.
 *
 * The frame rails are 0.06 deep and the frames are over a metre across, so
 * per-face 0..1 UVs would spend all their resolution on the hidden middle of
 * the frame and leave a rail about twenty texels wide. Tiling by world size
 * instead gives every rail the same density, and makes the grain identical on
 * the landscape frames of the back wall and the portrait frames of the sides
 * rather than stretching to each one's aspect.
 */
const GRAIN_PERIOD = 0.09;

/**
 * Rewrite a box's per-face 0..1 UVs as multiples of `GRAIN_PERIOD`.
 *
 * `BoxGeometry` lays its UVs out four vertices per face in the order +X, -X,
 * +Y, -Y, +Z, -Z, and each face spans the full 0..1 regardless of its size.
 */
export function scaleBoxUvsToWorld(
  geometry: THREE.BufferGeometry,
  width: number,
  height: number,
  depth: number,
) {
  const uv = geometry.getAttribute("uv");
  const spans: [number, number][] = [
    [depth, height],
    [depth, height],
    [width, depth],
    [width, depth],
    [width, height],
    [width, height],
  ];
  for (let face = 0; face < spans.length; face++) {
    const [spanU, spanV] = spans[face];
    for (let corner = 0; corner < 4; corner++) {
      const i = face * 4 + corner;
      uv.setXY(
        i,
        uv.getX(i) * (spanU / GRAIN_PERIOD),
        uv.getY(i) * (spanV / GRAIN_PERIOD),
      );
    }
  }
  uv.needsUpdate = true;
}
