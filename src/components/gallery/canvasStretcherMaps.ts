import * as THREE from "three";

/**
 * Fine canvas-weave normal map for gallery-wrap stretcher sides.
 *
 * Same rationale as frame woodgrain: relief in the normal (not albedo) so the
 * `#cfcfcf` stretcher tint and focus ease stay intact, and the room's diffuse
 * lighting can catch the cloth. Shared across all Fine Art hangs — per-frame
 * UVs set the physical weave scale.
 */
const SIZE = 256;

/** Plain-weave cell count across the tile. */
const THREADS = 48;

/** Peak normal tilt from the weave, in degrees — quiet from across the room. */
const MAX_TILT_DEGREES = 9;

/**
 * Procedural canvas weave as a tiling normal map. Caller owns disposal.
 */
export function createCanvasWeaveNormalMap(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d canvas unavailable for stretcher weave");

  const height = new Float32Array(SIZE * SIZE);
  for (let py = 0; py < SIZE; py++) {
    const v = py / SIZE;
    for (let px = 0; px < SIZE; px++) {
      const u = px / SIZE;
      // Crossed threads: warp + weft with a slight over/under basket.
      const warp = 0.5 + 0.5 * Math.sin(u * THREADS * Math.PI * 2);
      const weft = 0.5 + 0.5 * Math.sin(v * THREADS * Math.PI * 2);
      const basket =
        Math.sin(u * THREADS * Math.PI) * Math.sin(v * THREADS * Math.PI);
      height[py * SIZE + px] =
        0.55 * warp + 0.55 * weft + 0.12 * basket;
    }
  }

  const at = (x: number, y: number) =>
    height[(((y % SIZE) + SIZE) % SIZE) * SIZE + (((x % SIZE) + SIZE) % SIZE)]!;
  const gradU = new Float32Array(SIZE * SIZE);
  const gradV = new Float32Array(SIZE * SIZE);
  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      gradU[py * SIZE + px] = (at(px + 1, py) - at(px - 1, py)) * 0.5;
      gradV[py * SIZE + px] = (at(px, py + 1) - at(px, py - 1)) * 0.5;
    }
  }

  const magnitudes = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < magnitudes.length; i++) {
    magnitudes[i] = Math.hypot(gradU[i]!, gradV[i]!);
  }
  const sorted = Float32Array.from(magnitudes).sort();
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 1;
  const scale = Math.tan((MAX_TILT_DEGREES * Math.PI) / 180) / p99;

  const image = ctx.createImageData(SIZE, SIZE);
  const data = image.data;
  for (let i = 0; i < SIZE * SIZE; i++) {
    const nx = -gradU[i]! * scale;
    const ny = -gradV[i]! * scale;
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
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/**
 * Soft rectangular contact falloff for wall AO under a stretcher.
 * Opaque centre, transparent rim — sized to the hang footprint so it cannot
 * peek past the sides as a fake frame (the old 1.045× veil).
 */
export function createStretcherContactShadowMap(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d canvas unavailable for stretcher contact AO");

  const image = ctx.createImageData(size, size);
  const data = image.data;
  const mid = (size - 1) / 2;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      // Chebyshev distance from centre, 0 at middle → 1 at edge.
      const dx = Math.abs(px - mid) / mid;
      const dy = Math.abs(py - mid) / mid;
      const edge = Math.max(dx, dy);
      // Soft only in the outer ~12% so the core stays under the stretcher.
      const alpha =
        edge < 0.88
          ? 1
          : Math.max(0, 1 - (edge - 0.88) / 0.12);
      const o = (py * size + px) * 4;
      data[o] = 0;
      data[o + 1] = 0;
      data[o + 2] = 0;
      data[o + 3] = Math.round(alpha * 255);
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}
