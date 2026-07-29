# Semi-Skeuomorphic Gallery Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an immersive `/gallery` page: closed white one-point room, blank eye-level frames, one painting in focus via scroll/drag walk plus keyboard/click snap; hybrid CSS 3D shell + Canvas floor reflection / focus cues.

**Architecture:** Thin App Router page mounts a client `GalleryPage`. Pure helpers own painting config + focus math. CSS 3D builds the closed room and frames. A Canvas layer draws glossy floor reflections. A camera hook ties wheel/pointer/keyboard to `progress` and `focusedId`.

**Tech Stack:** Next.js App Router, React client components, CSS 3D transforms, Canvas 2D (no Three.js), `node:test` for pure helpers, existing `LogoBackButton` + `useNavigate`.

## Global Constraints

- Route slug is `/gallery` only (no nav link this pass).
- Fully immersive — no site sidebar/chrome; exit via `LogoBackButton` and Esc → `/`.
- Closed box: left/right walls meet a flat back wall (no open hallway continuation).
- Blank white canvases with raised frame depth only (`imageUrl` optional for later Reve).
- Exactly one painting in focus at a time.
- Scroll/drag updates walk `progress`; focus = nearest painting by depth. Arrow keys and click/tap snap focus along paintings sorted by `depth` near→far.
- Hybrid: CSS 3D room + Canvas for floor reflection and DoF cues; no Three.js.
- Side frames portrait; back wall landscape; ~5–7 paintings (default 3 left, 2 right, 2 back).
- Surgical edits only. Commit only when the user asks (Commit steps are optional gates).

## File Structure

| File | Responsibility |
|---|---|
| `src/components/gallery/galleryPaintings.ts` | Painting type, static blank config, focus/progress pure helpers |
| `src/components/gallery/galleryPaintings.test.ts` | `node:test` coverage for helpers |
| `src/components/gallery/useGalleryCamera.ts` | `progress` / `focusedId`, wheel/pointer/keyboard handlers, ease-to-focus |
| `src/components/gallery/GalleryRoom.tsx` | CSS 3D closed room + frames driven by camera state |
| `src/components/gallery/GalleryCanvas.tsx` | Canvas floor reflections + soft focus vignette cues |
| `src/components/gallery/GalleryPage.tsx` | Fullscreen shell, exit, compose room + canvas + camera |
| `app/gallery/page.tsx` | Metadata + `<GalleryPage />` |

---

### Task 1: Painting config + focus helpers

**Files:**
- Create: `src/components/gallery/galleryPaintings.ts`
- Create: `src/components/gallery/galleryPaintings.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `export type GalleryWall = "left" | "right" | "back"`
  - `export type GalleryPainting = { id: string; wall: GalleryWall; depth: number; aspect: "portrait" | "landscape"; imageUrl?: string }`
  - `export const GALLERY_PAINTINGS: GalleryPainting[]`
  - `export function paintingsByDepth(paintings?: GalleryPainting[]): GalleryPainting[]`
  - `export function clampProgress(progress: number): number`
  - `export function focusedPaintingId(progress: number, paintings?: GalleryPainting[]): string`
  - `export function adjacentPaintingId(focusedId: string, direction: -1 | 1, paintings?: GalleryPainting[]): string`
  - `export function progressForPainting(id: string, paintings?: GalleryPainting[]): number`

- [ ] **Step 1: Write the failing test**

Create `src/components/gallery/galleryPaintings.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  GALLERY_PAINTINGS,
  adjacentPaintingId,
  clampProgress,
  focusedPaintingId,
  paintingsByDepth,
  progressForPainting,
} from "./galleryPaintings.ts";

test("GALLERY_PAINTINGS has 5–7 blank slots with left/right/back coverage", () => {
  assert.ok(GALLERY_PAINTINGS.length >= 5 && GALLERY_PAINTINGS.length <= 7);
  const walls = new Set(GALLERY_PAINTINGS.map((p) => p.wall));
  assert.ok(walls.has("left") && walls.has("right") && walls.has("back"));
  for (const p of GALLERY_PAINTINGS) {
    assert.equal(p.imageUrl, undefined);
    assert.ok(p.depth >= 0 && p.depth <= 1);
  }
});

test("side walls are portrait and back wall is landscape", () => {
  for (const p of GALLERY_PAINTINGS) {
    if (p.wall === "back") assert.equal(p.aspect, "landscape");
    else assert.equal(p.aspect, "portrait");
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
    { id: "a", wall: "left" as const, depth: 0.2, aspect: "portrait" as const },
    { id: "b", wall: "right" as const, depth: 0.5, aspect: "portrait" as const },
    { id: "c", wall: "back" as const, depth: 0.9, aspect: "landscape" as const },
  ];
  assert.equal(focusedPaintingId(0.22, sample), "a");
  assert.equal(focusedPaintingId(0.55, sample), "b");
  assert.equal(focusedPaintingId(0.95, sample), "c");
});

test("adjacentPaintingId walks sorted depth order and clamps at ends", () => {
  const first = paintingsByDepth()[0]!.id;
  const second = paintingsByDepth()[1]!.id;
  const last = paintingsByDepth().at(-1)!.id;
  assert.equal(adjacentPaintingId(first, -1), first);
  assert.equal(adjacentPaintingId(first, 1), second);
  assert.equal(adjacentPaintingId(last, 1), last);
});

test("progressForPainting returns that painting's depth", () => {
  const p = GALLERY_PAINTINGS[0]!;
  assert.equal(progressForPainting(p.id), p.depth);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --experimental-strip-types src/components/gallery/galleryPaintings.test.ts`

Expected: FAIL (module not found).

- [ ] **Step 3: Implement helpers**

Create `src/components/gallery/galleryPaintings.ts`:

```ts
export type GalleryWall = "left" | "right" | "back";

export type GalleryPainting = {
  id: string;
  wall: GalleryWall;
  depth: number; // 0 near → 1 far
  aspect: "portrait" | "landscape";
  imageUrl?: string;
};

/** Default blank hang — 3 left, 2 right, 2 back. */
export const GALLERY_PAINTINGS: GalleryPainting[] = [
  { id: "left-1", wall: "left", depth: 0.18, aspect: "portrait" },
  { id: "right-1", wall: "right", depth: 0.28, aspect: "portrait" },
  { id: "left-2", wall: "left", depth: 0.42, aspect: "portrait" },
  { id: "right-2", wall: "right", depth: 0.55, aspect: "portrait" },
  { id: "left-3", wall: "left", depth: 0.68, aspect: "portrait" },
  { id: "back-1", wall: "back", depth: 0.88, aspect: "landscape" },
  { id: "back-2", wall: "back", depth: 0.96, aspect: "landscape" },
];

export function paintingsByDepth(
  paintings: GalleryPainting[] = GALLERY_PAINTINGS,
): GalleryPainting[] {
  return [...paintings].sort((a, b) => a.depth - b.depth);
}

export function clampProgress(progress: number): number {
  if (progress < 0) return 0;
  if (progress > 1) return 1;
  return progress;
}

export function focusedPaintingId(
  progress: number,
  paintings: GalleryPainting[] = GALLERY_PAINTINGS,
): string {
  const p = clampProgress(progress);
  let best = paintings[0]!;
  let bestDist = Math.abs(best.depth - p);
  for (const painting of paintings) {
    const dist = Math.abs(painting.depth - p);
    if (dist < bestDist) {
      best = painting;
      bestDist = dist;
    }
  }
  return best.id;
}

export function adjacentPaintingId(
  focusedId: string,
  direction: -1 | 1,
  paintings: GalleryPainting[] = GALLERY_PAINTINGS,
): string {
  const sorted = paintingsByDepth(paintings);
  const index = sorted.findIndex((p) => p.id === focusedId);
  if (index < 0) return sorted[0]!.id;
  const next = Math.min(sorted.length - 1, Math.max(0, index + direction));
  return sorted[next]!.id;
}

export function progressForPainting(
  id: string,
  paintings: GalleryPainting[] = GALLERY_PAINTINGS,
): number {
  return paintings.find((p) => p.id === id)?.depth ?? 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --experimental-strip-types src/components/gallery/galleryPaintings.test.ts`

Expected: PASS (all tests).

- [ ] **Step 5: Commit (optional — only if user asked)**

```bash
git add src/components/gallery/galleryPaintings.ts src/components/gallery/galleryPaintings.test.ts
git commit -m "Add gallery painting config and focus helpers."
```

---

### Task 2: Route stub + fullscreen shell

**Files:**
- Create: `app/gallery/page.tsx`
- Create: `src/components/gallery/GalleryPage.tsx`

**Interfaces:**
- Consumes: `LogoBackButton`, `useNavigate` from `@/lib/navigation`
- Produces: `/gallery` renders immersive white fullscreen with logo exit + Esc → `/`

- [ ] **Step 1: Create the route page**

Create `app/gallery/page.tsx`:

```tsx
import type { Metadata } from "next";
import GalleryPage from "@/components/gallery/GalleryPage";

export const metadata: Metadata = {
  title: "gallery",
};

export default function Page() {
  return <GalleryPage />;
}
```

- [ ] **Step 2: Create minimal GalleryPage shell**

Create `src/components/gallery/GalleryPage.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import LogoBackButton from "@/components/LogoBackButton";
import { useNavigate } from "@/lib/navigation";

export default function GalleryPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate("/");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#f4f4f4] text-zinc-900">
      <LogoBackButton onClick={() => navigate("/")} />
      <div className="flex h-full items-center justify-center text-sm text-zinc-400">
        gallery room
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Manual check**

Run: `npm run dev` (or existing next dev), open `http://localhost:3000/gallery`

Expected: full-viewport light gray page, logo top-left returns home, Esc returns home. No site sidebar.

- [ ] **Step 4: Commit (optional — only if user asked)**

```bash
git add app/gallery/page.tsx src/components/gallery/GalleryPage.tsx
git commit -m "Add immersive /gallery route shell."
```

---

### Task 3: CSS 3D closed room + blank frames

**Files:**
- Create: `src/components/gallery/GalleryRoom.tsx`
- Modify: `src/components/gallery/GalleryPage.tsx`

**Interfaces:**
- Consumes: `GALLERY_PAINTINGS`, `GalleryPainting` from `./galleryPaintings`
- Produces: `GalleryRoom({ progress, focusedId, onSelectPainting })` — CSS 3D box with walls meeting back wall; frames at eye level; focus blur/Z nudge

- [ ] **Step 1: Implement GalleryRoom**

Create `src/components/gallery/GalleryRoom.tsx`:

```tsx
"use client";

import {
  GALLERY_PAINTINGS,
  type GalleryPainting,
} from "./galleryPaintings";

type GalleryRoomProps = {
  progress: number;
  focusedId: string;
  onSelectPainting: (id: string) => void;
};

const ROOM_DEPTH_PX = 900;
const EYE_LEVEL = "46%";

function frameStyle(painting: GalleryPainting, focusedId: string): React.CSSProperties {
  const focused = painting.id === focusedId;
  const blur = focused ? 0 : Math.min(6, 1.5 + Math.abs(painting.depth - 0.5) * 4);
  const size =
    painting.aspect === "portrait"
      ? { width: 72, height: 96 }
      : { width: 110, height: 72 };

  if (painting.wall === "left") {
    return {
      ...size,
      position: "absolute",
      top: EYE_LEVEL,
      left: `${8 + painting.depth * 35}%`,
      transform: `translateY(-50%) translateZ(${focused ? 18 : 0}px)`,
      filter: `blur(${blur}px)`,
      opacity: focused ? 1 : 0.85,
    };
  }
  if (painting.wall === "right") {
    return {
      ...size,
      position: "absolute",
      top: EYE_LEVEL,
      right: `${8 + painting.depth * 35}%`,
      transform: `translateY(-50%) translateZ(${focused ? 18 : 0}px)`,
      filter: `blur(${blur}px)`,
      opacity: focused ? 1 : 0.85,
    };
  }
  // back wall — landscape, centered band
  const indexOnBack = GALLERY_PAINTINGS.filter((p) => p.wall === "back").findIndex(
    (p) => p.id === painting.id,
  );
  const x = indexOnBack <= 0 ? "32%" : "58%";
  return {
    ...size,
    position: "absolute",
    top: EYE_LEVEL,
    left: x,
    transform: `translate(-50%, -50%) translateZ(${focused ? 18 : 0}px)`,
    filter: `blur(${blur}px)`,
    opacity: focused ? 1 : 0.85,
  };
}

export default function GalleryRoom({
  progress,
  focusedId,
  onSelectPainting,
}: GalleryRoomProps) {
  // Camera eases slightly forward as progress increases
  const cameraZ = 80 - progress * 420;

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{ perspective: "900px", perspectiveOrigin: "50% 48%" }}
      aria-hidden={false}
    >
      <div
        className="relative"
        style={{
          width: "min(920px, 92vw)",
          height: "min(620px, 78vh)",
          transformStyle: "preserve-3d",
          transform: `translateZ(${cameraZ}px)`,
          transition: "transform 200ms ease-out",
        }}
      >
        {/* Floor */}
        <div
          className="absolute inset-x-0 bottom-0 origin-bottom"
          style={{
            height: "50%",
            background:
              "linear-gradient(to top, #e8e8e8 0%, #f7f7f7 55%, #fafafa 100%)",
            transform: `rotateX(72deg) translateZ(0px)`,
            transformOrigin: "bottom center",
            boxShadow: "inset 0 40px 80px rgba(0,0,0,0.04)",
          }}
        />
        {/* Ceiling */}
        <div
          className="absolute inset-x-0 top-0 origin-top"
          style={{
            height: "42%",
            background:
              "linear-gradient(to bottom, #f0f0f0 0%, #fafafa 100%)",
            transform: `rotateX(-68deg)`,
            transformOrigin: "top center",
          }}
        >
          {/* Recessed light panel */}
          <div
            className="absolute left-1/2 top-[28%]"
            style={{
              width: "42%",
              height: "38%",
              transform: "translateX(-50%)",
              background:
                "linear-gradient(to bottom, #ffffff 0%, #f3f3f3 100%)",
              boxShadow:
                "inset 0 0 0 1px rgba(0,0,0,0.04), 0 0 40px rgba(255,255,255,0.8)",
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent, transparent 18%, rgba(0,0,0,0.04) 18%, rgba(0,0,0,0.04) 20%)",
            }}
          />
        </div>
        {/* Back wall — closed end */}
        <div
          className="absolute left-[18%] right-[18%] top-[18%] bottom-[22%]"
          style={{
            background: "#fbfbfb",
            transform: `translateZ(${-ROOM_DEPTH_PX * 0.55}px)`,
            boxShadow: "inset 0 0 60px rgba(0,0,0,0.03)",
          }}
        />
        {/* Left wall */}
        <div
          className="absolute left-0 top-[10%] bottom-[12%] origin-left"
          style={{
            width: "55%",
            background:
              "linear-gradient(to right, #f2f2f2 0%, #fafafa 100%)",
            transform: `rotateY(58deg) translateZ(0)`,
            boxShadow: "inset -30px 0 50px rgba(0,0,0,0.03)",
          }}
        >
          {GALLERY_PAINTINGS.filter((p) => p.wall === "left").map((painting) => (
            <button
              key={painting.id}
              type="button"
              aria-label={`Focus painting ${painting.id}`}
              aria-pressed={painting.id === focusedId}
              className="pointer-events-auto cursor-pointer border-0 bg-white p-0"
              style={{
                ...frameStyle(painting, focusedId),
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.06), 0 8px 20px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.04)",
                transition: "filter 200ms ease, transform 200ms ease, opacity 200ms ease",
              }}
              onClick={() => onSelectPainting(painting.id)}
            />
          ))}
        </div>
        {/* Right wall */}
        <div
          className="absolute right-0 top-[10%] bottom-[12%] origin-right"
          style={{
            width: "55%",
            background:
              "linear-gradient(to left, #f2f2f2 0%, #fafafa 100%)",
            transform: `rotateY(-58deg) translateZ(0)`,
            boxShadow: "inset 30px 0 50px rgba(0,0,0,0.03)",
          }}
        >
          {GALLERY_PAINTINGS.filter((p) => p.wall === "right").map((painting) => (
            <button
              key={painting.id}
              type="button"
              aria-label={`Focus painting ${painting.id}`}
              aria-pressed={painting.id === focusedId}
              className="pointer-events-auto cursor-pointer border-0 bg-white p-0"
              style={{
                ...frameStyle(painting, focusedId),
                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.06), 0 8px 20px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.04)",
                transition: "filter 200ms ease, transform 200ms ease, opacity 200ms ease",
              }}
              onClick={() => onSelectPainting(painting.id)}
            />
          ))}
        </div>
        {/* Back-wall frames (parent is scene, not back plane, so they sit in front of back wall) */}
        {GALLERY_PAINTINGS.filter((p) => p.wall === "back").map((painting) => (
          <button
            key={painting.id}
            type="button"
            aria-label={`Focus painting ${painting.id}`}
            aria-pressed={painting.id === focusedId}
            className="pointer-events-auto absolute cursor-pointer border-0 bg-white p-0"
            style={{
              ...frameStyle(painting, focusedId),
              top: "42%",
              transform: `translate(-50%, -50%) translateZ(${-ROOM_DEPTH_PX * 0.52 + (painting.id === focusedId ? 18 : 0)}px)`,
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.06), 0 8px 20px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.04)",
              transition: "filter 200ms ease, transform 200ms ease, opacity 200ms ease",
            }}
            onClick={() => onSelectPainting(painting.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

Tune transforms visually against the reference screenshot until walls clearly meet the back wall and frames sit at eye level. Prefer small CSS tweaks over redesign.

- [ ] **Step 2: Wire into GalleryPage with fixed camera props for visual check**

In `GalleryPage.tsx`, import `GalleryRoom` and replace the placeholder with:

```tsx
import GalleryRoom from "./GalleryRoom";
import { focusedPaintingId } from "./galleryPaintings";

// inside component, temporary constants until Task 4:
const progress = 0.3;
const focusedId = focusedPaintingId(progress);

// in JSX, replace placeholder div:
<GalleryRoom
  progress={progress}
  focusedId={focusedId}
  onSelectPainting={() => {}}
/>
```

- [ ] **Step 3: Manual visual QA**

Open `/gallery`. Confirm:
- Closed white room (no open side hallway)
- Blank raised frames on left, right, back
- Soft shadows / AO feel
- Recessed ceiling light with faint bars

- [ ] **Step 4: Commit (optional — only if user asked)**

```bash
git add src/components/gallery/GalleryRoom.tsx src/components/gallery/GalleryPage.tsx
git commit -m "Add CSS 3D gallery room with blank frames."
```

---

### Task 4: Camera hook (scroll, drag, keyboard, click snap)

**Files:**
- Create: `src/components/gallery/useGalleryCamera.ts`
- Modify: `src/components/gallery/GalleryPage.tsx`

**Interfaces:**
- Consumes: helpers from `./galleryPaintings`
- Produces:
  - `useGalleryCamera()` → `{ progress, focusedId, selectPainting, bindProps }`
  - `bindProps` includes `onWheel`, `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel` for the fullscreen root
  - Keyboard ←/→ and ↑/↓ snap via window listener inside the hook
  - `selectPainting(id)` eases `progress` toward `progressForPainting(id)` and sets focus

- [ ] **Step 1: Implement useGalleryCamera**

Create `src/components/gallery/useGalleryCamera.ts`:

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  adjacentPaintingId,
  clampProgress,
  focusedPaintingId,
  progressForPainting,
} from "./galleryPaintings";

const WHEEL_SCALE = 0.0012;
const DRAG_SCALE = 0.0015;
const EASE_MS = 280;

export function useGalleryCamera() {
  const [progress, setProgress] = useState(0.25);
  const [focusedId, setFocusedId] = useState(() => focusedPaintingId(0.25));
  const dragging = useRef(false);
  const lastY = useRef(0);
  const animFrame = useRef<number | null>(null);

  const syncFocus = useCallback((nextProgress: number) => {
    const p = clampProgress(nextProgress);
    setProgress(p);
    setFocusedId(focusedPaintingId(p));
  }, []);

  const easeTo = useCallback(
    (target: number) => {
      const from = progress;
      const to = clampProgress(target);
      const start = performance.now();
      if (animFrame.current) cancelAnimationFrame(animFrame.current);

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / EASE_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = from + (to - from) * eased;
        syncFocus(value);
        if (t < 1) animFrame.current = requestAnimationFrame(tick);
      };
      animFrame.current = requestAnimationFrame(tick);
    },
    [progress, syncFocus],
  );

  const selectPainting = useCallback(
    (id: string) => {
      setFocusedId(id);
      easeTo(progressForPainting(id));
    },
    [easeTo],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = adjacentPaintingId(focusedId, 1);
        setFocusedId(next);
        easeTo(progressForPainting(next));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const next = adjacentPaintingId(focusedId, -1);
        setFocusedId(next);
        easeTo(progressForPainting(next));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [easeTo, focusedId]);

  useEffect(() => {
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, []);

  const bindProps = {
    onWheel: (e: React.WheelEvent) => {
      e.preventDefault();
      syncFocus(progress + e.deltaY * WHEEL_SCALE);
    },
    onPointerDown: (e: React.PointerEvent) => {
      dragging.current = true;
      lastY.current = e.clientY;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const dy = e.clientY - lastY.current;
      lastY.current = e.clientY;
      syncFocus(progress + dy * DRAG_SCALE);
    },
    onPointerUp: (e: React.PointerEvent) => {
      dragging.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    onPointerCancel: () => {
      dragging.current = false;
    },
  };

  return { progress, focusedId, selectPainting, bindProps };
}
```

Note: `onWheel` with `preventDefault` requires the listener to be non-passive. If the browser ignores preventDefault on React's wheel prop, attach a native `{ passive: false }` listener on the root ref inside the hook instead — same `syncFocus(progress + deltaY * WHEEL_SCALE)` math.

- [ ] **Step 2: Wire camera into GalleryPage**

Replace temporary constants in `GalleryPage.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import LogoBackButton from "@/components/LogoBackButton";
import { useNavigate } from "@/lib/navigation";
import GalleryRoom from "./GalleryRoom";
import { useGalleryCamera } from "./useGalleryCamera";

export default function GalleryPage() {
  const navigate = useNavigate();
  const { progress, focusedId, selectPainting, bindProps } = useGalleryCamera();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate("/");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  return (
    <div
      className="fixed inset-0 touch-none overflow-hidden bg-[#f4f4f4] text-zinc-900"
      {...bindProps}
    >
      <LogoBackButton onClick={() => navigate("/")} />
      <GalleryRoom
        progress={progress}
        focusedId={focusedId}
        onSelectPainting={selectPainting}
      />
    </div>
  );
}
```

- [ ] **Step 3: Manual interaction QA**

On `/gallery`:
- Scroll / drag walks; focus moves to nearest frame
- Arrow keys snap along depth order
- Click a frame snaps and eases
- Only one frame sharp at a time

- [ ] **Step 4: Commit (optional — only if user asked)**

```bash
git add src/components/gallery/useGalleryCamera.ts src/components/gallery/GalleryPage.tsx
git commit -m "Wire gallery camera walk and focus snap."
```

---

### Task 5: Canvas floor reflection + DoF cues

**Files:**
- Create: `src/components/gallery/GalleryCanvas.tsx`
- Modify: `src/components/gallery/GalleryPage.tsx`

**Interfaces:**
- Consumes: `progress`, `focusedId`, `GALLERY_PAINTINGS`
- Produces: `GalleryCanvas({ progress, focusedId })` — full-bleed canvas under/over the room that draws:
  1. Soft floor reflection quads (white rounded rects, low opacity, vertical flip illusion via gradient fade)
  2. Subtle radial vignette stronger when unfocused frames dominate (DoF cue)

- [ ] **Step 1: Implement GalleryCanvas**

Create `src/components/gallery/GalleryCanvas.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { GALLERY_PAINTINGS } from "./galleryPaintings";

type GalleryCanvasProps = {
  progress: number;
  focusedId: string;
};

export default function GalleryCanvas({ progress, focusedId }: GalleryCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const draw = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Floor band reflection cues (bottom third)
      const floorTop = h * 0.55;
      for (const painting of GALLERY_PAINTINGS) {
        const dist = Math.abs(painting.depth - progress);
        const alpha = Math.max(0.02, 0.12 - dist * 0.15);
        const focusedBoost = painting.id === focusedId ? 1.4 : 0.7;
        const xBase =
          painting.wall === "left"
            ? w * (0.22 + painting.depth * 0.15)
            : painting.wall === "right"
              ? w * (0.78 - painting.depth * 0.15)
              : w * 0.5;
        const y = floorTop + painting.depth * (h * 0.28);
        const fw = painting.aspect === "portrait" ? 36 : 56;
        const fh = painting.aspect === "portrait" ? 48 : 32;
        const grd = ctx.createLinearGradient(0, y, 0, y + fh);
        grd.addColorStop(0, `rgba(255,255,255,${alpha * focusedBoost})`);
        grd.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grd;
        ctx.fillRect(xBase - fw / 2, y, fw, fh);
      }

      // Soft vignette DoF cue
      const vig = ctx.createRadialGradient(
        w / 2,
        h * 0.45,
        h * 0.15,
        w / 2,
        h * 0.45,
        h * 0.75,
      );
      vig.addColorStop(0, "rgba(244,244,244,0)");
      vig.addColorStop(1, "rgba(230,230,230,0.35)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [progress, focusedId]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden
    />
  );
}
```

If continuous rAF is too hot, redraw only when `progress` / `focusedId` / resize change (no loop). Prefer event-driven redraw if profiling shows jank.

- [ ] **Step 2: Compose under the room**

In `GalleryPage.tsx`, place canvas behind the room:

```tsx
import GalleryCanvas from "./GalleryCanvas";

// inside the root div, before GalleryRoom:
<GalleryCanvas progress={progress} focusedId={focusedId} />
<div className="relative z-10 h-full w-full">
  <GalleryRoom
    progress={progress}
    focusedId={focusedId}
    onSelectPainting={selectPainting}
  />
</div>
```

Keep `LogoBackButton` above both (`z-40` already).

- [ ] **Step 3: Visual QA**

Confirm floor shows faint frame-like reflections that shift with walk/focus, and the room still reads as the reference white gallery.

- [ ] **Step 4: Commit (optional — only if user asked)**

```bash
git add src/components/gallery/GalleryCanvas.tsx src/components/gallery/GalleryPage.tsx
git commit -m "Add gallery floor reflection canvas layer."
```

---

### Task 6: Polish, mobile, and acceptance pass

**Files:**
- Modify as needed: `GalleryRoom.tsx`, `GalleryCanvas.tsx`, `GalleryPage.tsx`, `useGalleryCamera.ts`
- Modify: `docs/superpowers/specs/2026-07-24-gallery-page-design.md` (status already Approved; no content change required unless behavior drifts)

**Interfaces:**
- Consumes: Tasks 1–5
- Produces: Spec success criteria met

- [ ] **Step 1: Desktop acceptance checklist**

On `/gallery`:
- [ ] Closed box — walls meet back wall
- [ ] Eye-level blank frames with raised depth
- [ ] Ceiling light panel with faint bars
- [ ] Scroll + drag walk; focus follows nearest
- [ ] Arrows + click snap along depth order
- [ ] One painting sharp; others blurred/quieter
- [ ] Logo + Esc → home
- [ ] No site sidebar

- [ ] **Step 2: Mobile acceptance**

- [ ] Drag walk + tap focus work with `touch-none` on root
- [ ] Room remains readable; if frames collide, reduce to 5 paintings in `GALLERY_PAINTINGS` (still ≥5)

- [ ] **Step 3: Perf sanity**

Walk continuously for ~10s. If frame drops, switch `GalleryCanvas` to resize/`progress`/`focusedId`-driven redraw (no perpetual rAF).

- [ ] **Step 4: Re-run unit tests**

Run: `node --test --experimental-strip-types src/components/gallery/galleryPaintings.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit (optional — only if user asked)**

```bash
git add src/components/gallery app/gallery docs/superpowers/specs/2026-07-24-gallery-page-design.md
git commit -m "Polish gallery room perspective and focus interactions."
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|---|---|
| `/gallery` route + metadata | 2 |
| Closed one-point white room | 3 |
| Eye-level frames; portrait sides / landscape back | 1, 3 |
| Blank canvases with depth | 1, 3 |
| One focus at a time | 1, 3, 4 |
| Scroll/drag walk + nearest focus | 4 |
| Arrow + click/tap snap by depth | 1, 4 |
| Immersive + LogoBackButton + Esc | 2, 4 |
| Hybrid CSS 3D + Canvas reflection/DoF | 3, 5 |
| ~5–7 paintings; Reve later via `imageUrl` | 1 |
| No nav / no Reve / no Three.js | Global constraints |
| Mobile drag/tap | 4, 6 |

No TBD/TODO placeholders remain. Helper names are consistent across tasks (`focusedPaintingId`, `adjacentPaintingId`, `progressForPainting`, `useGalleryCamera`).
`)