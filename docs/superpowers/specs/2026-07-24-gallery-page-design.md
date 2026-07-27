# Semi-Skeuomorphic Gallery Page

**Date:** 2026-07-24  
**Status:** Approved  
**Route:** `/gallery`  
**Branch:** `feat/gallery`

## Goal

Ship an immersive, semi-skeuomorphic white gallery room at `/gallery`: one-point perspective, paintings at eye level, only one painting in focus at a time. Structure first with blank canvases; Reve-generated art plugs in later.

## Success Criteria

- `/gallery` renders a closed white room (left, right, and back walls meet) in one-point perspective matching the reference, without an open hallway continuation.
- Frames hang at a consistent eye-level band; side walls use portrait panels, back wall uses landscape.
- Exactly one painting is in focus at a time (sharper / slightly closer); others are softer and more blurred.
- Scroll and drag walk through the room; focus follows the painting nearest the camera center.
- Arrow keys and click/tap snap focus to a painting and ease the camera to it.
- Fully immersive: no site sidebar/chrome; `LogoBackButton` and Esc return home.
- First pass uses blank white canvases with raised frame depth only (no stock art).
- Glossy floor reflections and focus blur use a Canvas/WebGL layer over a CSS 3D room shell.

## Scope

**In:**
- New route `app/gallery/page.tsx`
- Client gallery components under `src/components/gallery/`
- CSS 3D room geometry + frame placement
- Canvas/WebGL layer for floor reflection and depth-of-field cues
- Shared state for walk progress + focused painting
- Scroll / drag / keyboard / click-tap focus
- Minimal exit via existing `LogoBackButton` + Esc
- Static painting config (~5–7 blank slots) ready for later `imageUrl`s

**Out:**
- Reve API integration (follow-up once structure is approved and API key is provided)
- Sanity / CMS schema
- Main site nav link
- Three.js / full WebGL scene graph
- Real artwork content
- Sound, captions, or lightbox overlays beyond focus

## Experience

Viewer stands at the near end of a closed white gallery box looking toward a vanishing point on the back wall.

| Element | Treatment |
|---------|-----------|
| Walls | Matte white; soft ambient-occlusion at edges |
| Ceiling | Recessed rectangular light panel with faint horizontal bars |
| Floor | Glossy white with muted, blurred reflections of frames and light |
| Frames | Thin raised white panels, soft contact shadows, eye-level band |
| Focus | One frame sharp and slightly advanced on Z; others blurred / quieter |

**Layout (initial):** ~5–7 blank paintings — e.g. 3 left, 2 right, 1–2 back — so perspective reads clearly. Mobile may drop to fewer frames if clarity requires it.

## Architecture

```
app/gallery/page.tsx          → metadata + GalleryPage
src/components/gallery/
  GalleryPage.tsx             → fullscreen shell, LogoBackButton, Esc, input wiring
  GalleryRoom.tsx             → CSS 3D box: floor, ceiling, 3 walls, light, frames
  GalleryCanvas.tsx           → Canvas/WebGL: floor reflection + DoF blur cues
  galleryPaintings.ts         → static painting config (id, wall, depth, aspect)
  useGalleryCamera.ts         → progress + focusedId + input handlers
```

**Hybrid split:**
- **CSS 3D** owns room planes and frame transforms (position, scale by depth, focus Z nudge).
- **Canvas/WebGL** owns glossy floor reflection sampling and soft focus blur cues; no Three.js dependency for this pass — raw canvas/WebGL or a minimal helper.

**Painting config shape (illustrative):**

```ts
type GalleryPainting = {
  id: string;
  wall: "left" | "right" | "back";
  depth: number; // 0 near → 1 far
  aspect: "portrait" | "landscape";
  imageUrl?: string; // omitted = blank white canvas
};
```

## Interaction & state

| Input | Behavior |
|-------|----------|
| Scroll / drag | Updates `progress` (0→1 along the room) |
| Auto focus | `focusedId` = painting whose depth is closest to the camera plane |
| ←/→ or ↑/↓ | Snap `focusedId` along paintings sorted by `depth` (near→far); ease `progress` to that painting |
| Click / tap frame | Same snap + ease as keyboard |
| Logo / Esc | Navigate home |

**Focus visual rules:**
- Focused: reduced blur, slightly larger / closer on Z, full contrast
- Unfocused: increased blur, quieter contrast, no Z advance

Touch: drag to walk; tap a frame to focus.

## Visual reference constraints

- Closed box: side walls intersect the back wall (not an open L-shaped continuation).
- Monochrome white with soft gray shadows only.
- Semi-skeuomorphic: believable depth via shadows, reflections, and light falloff — not a flat illustration and not a photoreal engine render.
- Reference screenshot stored with the branch conversation assets for visual QA.

## Follow-up (not this pass)

- Wire Reve API with user-provided key to generate painting images into `imageUrl`.
- Optional: add `/gallery` to site navigation once the room feels finished.

## Testing / QA

- Desktop: scroll walk, drag walk, arrow snap, click focus, Esc/logo exit.
- Mobile: drag walk, tap focus, logo exit; room remains readable.
- Visual: walls meet back wall; one focus at a time; blank frames with visible depth; floor shows soft reflection.
- Perf: 60fps target on desktop while walking; degrade blur/reflection quality before dropping interaction.
`)