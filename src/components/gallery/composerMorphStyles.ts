/**
 * Drawesome MorphBar pattern: one shell animates width/height; panels stack
 * and cross-fade with blur+scale. Settled expanded state drops filter/scale
 * so the native caret isn't pushed through a compositor layer.
 *
 * Collapse is snappier than expand — a 13× width drop with Drawesome's long
 * settle tail reads as a wide pill for too long. Collapse eases to a disc
 * fast; expand keeps a softer unfurl.
 */
export const COMPOSER_MORPH_STYLE = `
.gallery-composer-morph {
  position: relative;
  overflow: hidden;
  /* Stadium in both states — half-height ends on the wide bar, circle when
     collapsed to the pen. Site-wide corner-shape:squircle would otherwise
     turn this into a soft-rect; force round like .rounded-full. */
  border-radius: 9999px;
  corner-shape: round;
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  --ease-settle: cubic-bezier(0.22, 0.9, 0.16, 1);
  --ease-snap: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-smooth: cubic-bezier(0.19, 1, 0.22, 1);
  /* Expand default: softer unfurl into the wide composer. */
  transition:
    width 400ms var(--ease-settle),
    height 400ms var(--ease-settle),
    border-radius 400ms var(--ease-settle);
}
/* Multi-line prompt only: a full stadium on a tall shell reads as two giant
   half-circles. Soft continuous radius instead; one-line stays stadium. */
.gallery-composer-morph[data-morph-to="expanded"][data-multiline] {
  border-radius: 28px;
}
/* Single ↔ multiline layout: re-enable a short height/radius ease even while
   the expanded panel is otherwise settled (typing line-growth stays snappy). */
.gallery-composer-morph[data-morph-to="expanded"][data-multiline-morph] {
  transition:
    height 280ms var(--ease-smooth),
    border-radius 280ms var(--ease-smooth),
    width 400ms var(--ease-settle);
}
/* Collapse: get circular fast so the shell doesn't hang as a wide pill
   after the pen has already cross-faded in. */
.gallery-composer-morph[data-morph-to="actions"],
.gallery-composer-morph[data-morph-to="generating"] {
  transition:
    width 300ms var(--ease-snap),
    height 300ms var(--ease-snap);
}
.gallery-composer-morph[data-reduce-motion],
.gallery-composer-morph[data-instant] {
  transition: none;
}
.gallery-composer-morph__clip {
  position: absolute;
  inset: 0;
}
.gallery-composer-morph__panel {
  position: absolute;
  top: 50%;
  left: 50%;
  translate: -50% -50%;
  width: max-content;
  max-width: none;
  opacity: 0;
  filter: blur(8px);
  scale: 0.86;
  pointer-events: none;
  transition:
    opacity 200ms var(--ease-smooth),
    filter 240ms var(--ease-smooth),
    scale 300ms var(--ease-snap);
}
.gallery-composer-morph__panel[data-active] {
  opacity: 1;
  filter: blur(0);
  scale: 1;
  pointer-events: auto;
  /* Incoming content waits for the shell to leave the wide regime so the
     pen doesn't sit inside a still-stretched pill. */
  transition-delay: 90ms, 90ms, 0ms;
}
/* Outgoing expanded content clears fast on collapse — don't leave a wide
   ghost riding the shell while width is still catching up. */
.gallery-composer-morph[data-morph-to="actions"] .gallery-composer-morph__panel[data-kind="expanded"]:not([data-active]),
.gallery-composer-morph[data-morph-to="generating"] .gallery-composer-morph__panel[data-kind="expanded"]:not([data-active]) {
  transition-duration: 140ms, 160ms, 220ms;
  transition-delay: 0ms, 0ms, 0ms;
}
.gallery-composer-morph[data-morph-to="expanded"] .gallery-composer-morph__panel[data-active] {
  /* Expand can reveal a beat sooner — shell is growing into the content. */
  transition-delay: 40ms, 40ms, 0ms;
  transition-duration: 220ms, 280ms, 400ms;
  transition-timing-function: var(--ease-smooth), var(--ease-smooth), var(--ease-settle);
}
.gallery-composer-morph[data-reduce-motion] .gallery-composer-morph__panel {
  transition: none;
  filter: none;
  scale: none;
}
.gallery-composer-morph[data-settled] .gallery-composer-morph__panel[data-active][data-kind="expanded"] {
  filter: none;
  scale: none;
  transition: none;
}
/* Settled expanded: snap height to wrapped prompt lines (no 400ms ease). */
.gallery-composer-morph[data-settled][data-morph-to="expanded"] {
  transition: none;
}
/*
 * Expanded panel stays at the shell's *target* width (via --composer-expanded-w),
 * centered with the default left/translate. The shell grows around it — Drawesome
 * MorphBar. Never set width:100%/left:0 here: that ties layout to the animating
 * shell and reflows the prompt every frame (janky expand).
 *
 * Inner form is width:100% of that fixed panel so the textarea flexes to the
 * real + → Generate gap (wrap fix without breaking morph).
 */
.gallery-composer-morph__panel[data-kind="expanded"] {
  width: var(--composer-expanded-w, max-content);
}
.gallery-composer-morph__panel[data-kind="expanded"] > * {
  width: 100%;
}
`;

export type ComposerPanelId = "expanded" | "generating" | "actions";

/** Collapse settles faster than expand — keep the JS fallback in sync. */
export const COMPOSER_MORPH_MS = {
  expand: 400,
  collapse: 300,
} as const;
