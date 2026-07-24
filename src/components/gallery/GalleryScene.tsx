"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  GALLERY_PAINTINGS,
  GALLERY_ROOM,
  fovForZoom,
  paintingLayout,
  type GalleryPainting,
  type GalleryRoomPose,
} from "./galleryPaintings";

type GallerySceneProps = {
  pose: GalleryRoomPose;
  zoom?: number;
  focusedId: string;
  paintings?: GalleryPainting[];
  generatingId?: string | null;
  onSelectPainting: (id: string) => void;
};

type FrameEntry = {
  id: string;
  mesh: THREE.Mesh;
  frame: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  texture: THREE.Texture | null;
};

/**
 * White-cube palette. Planes differ by only a few values so corners stay
 * readable without the room reading gray.
 */
const WALL_BACK = 0xfdfdfd;
const WALL_SIDE = 0xfafafa;
const WALL_FRONT = 0xfafafa;
const FLOOR = 0xf6f6f6;
const CEILING = 0xfbfbfb;
const COFFER_SIDE = 0xfafafa;
const FRAME = 0xffffff;
/** Mid gray — the one deliberately dark note, so hangs read against white. */
const FRAME_LIP = 0xc4c4c4;
/** Trim reads as a fine shadow line at each junction, not a gray band. */
const TRIM = 0xe6e6e6;
const POST = 0xe8e8e8;

/** Recessed ceiling grid, matching the coffered reference. */
const COFFER = {
  cols: 6,
  rows: 6,
  /** Flat soffit width between recesses. */
  beam: 0.26,
  /** How far each recess climbs above the ceiling plane. */
  recess: 0.38,
  /** Flat top panel size as a fraction of the opening. */
  innerRatio: 0.36,
} as const;

function makeWallMaterial(color: number, roughness = 0.92) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0,
  });
}

/**
 * Inward-facing sides of one coffer: a rectangular frustum that narrows as it
 * rises. Built non-indexed so each bevel keeps its own flat normal.
 */
function cofferSideGeometry(
  openW: number,
  openD: number,
  innerW: number,
  innerD: number,
  depth: number,
): THREE.BufferGeometry {
  const bx = openW / 2;
  const bz = openD / 2;
  const tx = innerW / 2;
  const tz = innerD / 2;

  const bottom: [number, number, number][] = [
    [-bx, 0, -bz],
    [bx, 0, -bz],
    [bx, 0, bz],
    [-bx, 0, bz],
  ];
  const top: [number, number, number][] = [
    [-tx, depth, -tz],
    [tx, depth, -tz],
    [tx, depth, tz],
    [-tx, depth, tz],
  ];

  const pos: number[] = [];
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    const b0 = bottom[i]!;
    const b1 = bottom[next]!;
    const t0 = top[i]!;
    const t1 = top[next]!;
    pos.push(...b0, ...t0, ...t1);
    pos.push(...b0, ...t1, ...b1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

function buildCofferedCeiling(
  scene: THREE.Scene,
  w: number,
  d: number,
  h: number,
): THREE.Vector3[] {
  const { cols, rows, beam, recess, innerRatio } = COFFER;
  const cellX = w / cols;
  const cellZ = d / rows;
  const openW = cellX - beam;
  const openD = cellZ - beam;
  const innerW = openW * innerRatio;
  const innerD = openD * innerRatio;

  // Ceiling plane with a square hole per coffer; the flat remainder is the grid.
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, -d / 2);
  shape.lineTo(w / 2, -d / 2);
  shape.lineTo(w / 2, d / 2);
  shape.lineTo(-w / 2, d / 2);
  shape.closePath();

  const centers: [number, number][] = [];
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const cx = -w / 2 + cellX * (i + 0.5);
      const cz = -d / 2 + cellZ * (j + 0.5);
      centers.push([cx, cz]);

      const hole = new THREE.Path();
      hole.moveTo(cx - openW / 2, cz - openD / 2);
      hole.lineTo(cx - openW / 2, cz + openD / 2);
      hole.lineTo(cx + openW / 2, cz + openD / 2);
      hole.lineTo(cx + openW / 2, cz - openD / 2);
      hole.closePath();
      shape.holes.push(hole);
    }
  }

  const soffit = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({
      color: CEILING,
      roughness: 0.9,
      metalness: 0,
    }),
  );
  // Shape XY maps to world XZ under +90° about X, and the normal points down.
  soffit.rotation.x = Math.PI / 2;
  soffit.position.y = h;
  scene.add(soffit);

  const sideGeo = cofferSideGeometry(openW, openD, innerW, innerD, recess);
  const sideMat = new THREE.MeshStandardMaterial({
    color: COFFER_SIDE,
    roughness: 0.9,
    metalness: 0,
    flatShading: true,
    side: THREE.DoubleSide,
  });
  const topGeo = new THREE.PlaneGeometry(innerW, innerD);
  const topMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0,
  });

  for (const [cx, cz] of centers) {
    const sides = new THREE.Mesh(sideGeo, sideMat);
    sides.position.set(cx, h, cz);
    scene.add(sides);

    const cap = new THREE.Mesh(topGeo, topMat);
    cap.rotation.x = Math.PI / 2;
    cap.position.set(cx, h + recess, cz);
    scene.add(cap);
  }

  // Flush recessed downlights on the grid intersections: a shallow can sunk
  // into the soffit with only the lens sitting at the ceiling plane.
  const canGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.07, 16, 1, true);
  const canMat = new THREE.MeshStandardMaterial({
    color: 0xe6e6e6,
    roughness: 0.55,
    side: THREE.DoubleSide,
  });
  const lensGeo = new THREE.CircleGeometry(0.07, 20);
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 2.4,
    roughness: 0.25,
  });

  const lightPoints: THREE.Vector3[] = [];
  for (let i = 1; i < cols; i += 2) {
    for (let j = 1; j < rows; j += 2) {
      const cx = -w / 2 + cellX * i;
      const cz = -d / 2 + cellZ * j;

      const can = new THREE.Mesh(canGeo, canMat);
      can.position.set(cx, h + 0.035, cz);
      scene.add(can);

      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(cx, h + 0.004, cz);
      scene.add(lens);

      // Hung well below the soffit so each lamp casts a soft pool rather than
      // a pinpoint blowout on the panel it is mounted to.
      lightPoints.push(new THREE.Vector3(cx, h - 0.3, cz));
    }
  }

  return lightPoints;
}

function addBaseboard(
  scene: THREE.Scene,
  w: number,
  d: number,
  mat: THREE.Material,
) {
  const h = 0.12;
  const t = 0.04;
  // Along each wall, slightly inset
  const boards: Array<{
    geo: THREE.BufferGeometry;
    pos: [number, number, number];
    rotY?: number;
  }> = [
    {
      geo: new THREE.BoxGeometry(w - 0.02, h, t),
      pos: [0, h / 2, -d / 2 + t / 2],
    },
    {
      geo: new THREE.BoxGeometry(w - 0.02, h, t),
      pos: [0, h / 2, d / 2 - t / 2],
    },
    {
      geo: new THREE.BoxGeometry(t, h, d - 0.02),
      pos: [-w / 2 + t / 2, h / 2, 0],
    },
    {
      geo: new THREE.BoxGeometry(t, h, d - 0.02),
      pos: [w / 2 - t / 2, h / 2, 0],
    },
  ];
  for (const b of boards) {
    const mesh = new THREE.Mesh(b.geo, mat);
    mesh.position.set(...b.pos);
    scene.add(mesh);
  }
}

function buildClosedRoom(scene: THREE.Scene): THREE.Vector3[] {
  const { width: w, height: h, depth: d } = GALLERY_ROOM;
  const t = 0.1;

  // Fully dielectric: any metalness here would eat into the diffuse albedo and
  // drag the floor several values below the walls.
  const floorMat = new THREE.MeshStandardMaterial({
    color: FLOOR,
    roughness: 0.4,
    metalness: 0,
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const downlights = buildCofferedCeiling(scene, w, d, h);

  // Four walls — distinct enough tones that corners read in one-point view
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    makeWallMaterial(WALL_BACK),
  );
  back.position.set(0, h / 2, -d / 2);
  scene.add(back);

  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    makeWallMaterial(WALL_FRONT),
  );
  front.rotation.y = Math.PI;
  front.position.set(0, h / 2, d / 2);
  scene.add(front);

  const left = new THREE.Mesh(
    new THREE.PlaneGeometry(d, h),
    makeWallMaterial(WALL_SIDE),
  );
  left.rotation.y = Math.PI / 2;
  left.position.set(-w / 2, h / 2, 0);
  scene.add(left);

  const right = new THREE.Mesh(
    new THREE.PlaneGeometry(d, h),
    makeWallMaterial(WALL_SIDE),
  );
  right.rotation.y = -Math.PI / 2;
  right.position.set(w / 2, h / 2, 0);
  scene.add(right);

  const postMat = new THREE.MeshStandardMaterial({
    color: POST,
    roughness: 0.85,
  });
  const corners: [number, number][] = [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [-w / 2, d / 2],
    [w / 2, d / 2],
  ];
  for (const [cx, cz] of corners) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(t, h, t), postMat);
    post.position.set(cx, h / 2, cz);
    scene.add(post);
  }

  const trimMat = new THREE.MeshStandardMaterial({
    color: TRIM,
    roughness: 0.7,
  });
  addBaseboard(scene, w, d, trimMat);

  // Crown molding line under the ceiling
  const crownH = 0.08;
  const crownY = h - crownH / 2;
  for (const [geo, pos] of [
    [new THREE.BoxGeometry(w, crownH, 0.04), [0, crownY, -d / 2 + 0.02]],
    [new THREE.BoxGeometry(w, crownH, 0.04), [0, crownY, d / 2 - 0.02]],
    [new THREE.BoxGeometry(0.04, crownH, d), [-w / 2 + 0.02, crownY, 0]],
    [new THREE.BoxGeometry(0.04, crownH, d), [w / 2 - 0.02, crownY, 0]],
  ] as const) {
    const mesh = new THREE.Mesh(geo, trimMat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    scene.add(mesh);
  }

  return downlights;
}

function buildFrames(
  paintings: GalleryPainting[],
  root: THREE.Group,
): Map<string, FrameEntry> {
  const frames = new Map<string, FrameEntry>();

  for (const painting of paintings) {
    const layout = paintingLayout(painting);
    const group = new THREE.Group();
    group.position.set(layout.position.x, layout.position.y, layout.position.z);
    if (painting.wall === "left") group.rotation.y = Math.PI / 2;
    else if (painting.wall === "right") group.rotation.y = -Math.PI / 2;
    else if (painting.wall === "front") group.rotation.y = Math.PI;

    // Outer frame lip — light gray so hangs still read on white walls
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(layout.width + 0.12, layout.height + 0.12, 0.06),
      new THREE.MeshStandardMaterial({
        color: FRAME_LIP,
        roughness: 0.45,
        metalness: 0.08,
      }),
    );
    frame.position.z = 0.01;
    group.add(frame);

    const matte = new THREE.Mesh(
      new THREE.PlaneGeometry(layout.width + 0.04, layout.height + 0.04),
      new THREE.MeshStandardMaterial({
        color: FRAME,
        roughness: 0.7,
        metalness: 0,
      }),
    );
    matte.position.z = 0.045;
    group.add(matte);

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0,
      emissive: 0xffffff,
      emissiveIntensity: 0.08,
    });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(layout.width, layout.height),
      material,
    );
    mesh.position.z = 0.055;
    mesh.userData.paintingId = painting.id;
    group.userData.paintingId = painting.id;
    group.add(mesh);
    root.add(group);

    frames.set(painting.id, {
      id: painting.id,
      mesh,
      frame,
      material,
      texture: null,
    });
  }

  return frames;
}

export default function GalleryScene({
  pose,
  zoom = 1,
  focusedId,
  paintings = GALLERY_PAINTINGS,
  generatingId = null,
  onSelectPainting,
}: GallerySceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const poseRef = useRef(pose);
  const zoomRef = useRef(zoom);
  const focusedRef = useRef(focusedId);
  const generatingRef = useRef(generatingId);
  const paintingsRef = useRef(paintings);
  const onSelectRef = useRef(onSelectPainting);
  const framesRef = useRef<Map<string, FrameEntry> | null>(null);

  poseRef.current = pose;
  zoomRef.current = zoom;
  focusedRef.current = focusedId;
  generatingRef.current = generatingId;
  paintingsRef.current = paintings;
  onSelectRef.current = onSelectPainting;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfcfcfc);

    const camera = new THREE.PerspectiveCamera(
      fovForZoom(zoomRef.current),
      1,
      0.08,
      80,
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1;
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
      touchAction: "none",
    });

    const downlights = buildClosedRoom(scene);

    // Bright enough that every plane reads white, but deliberately short of
    // clipping: that headroom is what keeps corners, coffer facets and
    // junctions legible instead of fusing into one flat sheet of 255.
    // three.js divides these by PI on the way to the surface, so the numbers
    // read high; they land flat white surfaces at ~245-250 without clipping.
    // (toneMappingExposure is deliberately not used to get here: NoToneMapping
    // ignores it, and any tone curve would pull the highlights back down.)
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    scene.add(new THREE.HemisphereLight(0xffffff, 0xfbfbfb, 1.3));

    // Gentle top-down gradient keeps the box from reading flat. No shadow map:
    // the walls sit nearly parallel to this light, so shadow-mapping them just
    // produces self-shadow acne that drags the whole room back toward gray.
    const key = new THREE.DirectionalLight(0xffffff, 0.4);
    key.position.set(2.5, 8, 5);
    scene.add(key);

    // Pools under the ceiling downlights — shades the coffer bevels.
    for (const point of downlights) {
      const lamp = new THREE.PointLight(0xffffff, 0.35, 7, 2);
      lamp.position.copy(point);
      scene.add(lamp);
    }

    const framesRoot = new THREE.Group();
    scene.add(framesRoot);
    const frames = buildFrames(paintingsRef.current, framesRoot);
    framesRef.current = frames;

    // Apply any images already present when the scene boots.
    for (const painting of paintingsRef.current) {
      if (!painting.imageUrl) continue;
      const entry = frames.get(painting.id);
      if (!entry) continue;
      const url = painting.imageUrl;
      new THREE.TextureLoader().load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.userData.url = url;
        entry.texture = tex;
        entry.material.map = tex;
        entry.material.color.set(0xffffff);
        entry.material.needsUpdate = true;
      });
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const resize = () => {
      const { clientWidth: cw, clientHeight: ch } = mount;
      if (cw < 1 || ch < 1) return;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let raf = 0;
    const tick = () => {
      const p = poseRef.current;
      camera.position.set(p.x, p.y, p.z);
      camera.lookAt(p.lookX, p.lookY, p.lookZ);
      camera.fov = fovForZoom(zoomRef.current);
      camera.updateProjectionMatrix();

      const focused = focusedRef.current;
      const generating = generatingRef.current;
      for (const [id, entry] of frames) {
        const isFocused = id === focused;
        const isGenerating = id === generating;
        entry.mesh.position.z = isFocused ? 0.08 : 0.055;
        entry.frame.scale.setScalar(isFocused ? 1.05 : 1);
        entry.material.opacity = isGenerating ? 0.55 : 1;
        entry.material.transparent = isGenerating;
        entry.material.emissiveIntensity = isFocused ? 0.14 : 0.04;
        if (!entry.texture) {
          entry.material.color.set(isFocused ? 0xffffff : 0xf3f3f3);
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(
        [...frames.values()].map((f) => f.mesh),
        false,
      );
      const id = hits[0]?.object.userData.paintingId as string | undefined;
      if (id) onSelectRef.current(id);
    };
    renderer.domElement.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("click", onClick);
      for (const entry of frames.values()) {
        entry.texture?.dispose();
        entry.material.dispose();
        entry.mesh.geometry.dispose();
        entry.frame.geometry.dispose();
        (entry.frame.material as THREE.Material).dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      framesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const frames = framesRef.current;
    if (!frames) return;

    for (const painting of paintings) {
      const entry = frames.get(painting.id);
      if (!entry) continue;

      const url = painting.imageUrl;
      if (!url) {
        if (entry.texture) {
          entry.texture.dispose();
          entry.texture = null;
          entry.material.map = null;
          entry.material.needsUpdate = true;
        }
        continue;
      }

      const prev = entry.texture?.userData.url as string | undefined;
      if (prev === url) continue;

      const loader = new THREE.TextureLoader();
      loader.load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.userData.url = url;
        entry.texture?.dispose();
        entry.texture = tex;
        entry.material.map = tex;
        entry.material.color.set(0xffffff);
        entry.material.needsUpdate = true;
      });
    }
  }, [paintings]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 z-10 h-full w-full"
      aria-label="3D gallery room"
    />
  );
}
