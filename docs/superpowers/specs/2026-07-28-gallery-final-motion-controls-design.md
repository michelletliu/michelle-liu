# Gallery Final Motion and Controls Design

## Scope

Refine gallery interactions:

1. Replace the warped button-to-prompt-bar layout morph.
2. Make the directional control easier to tap and keep it clear of artwork on mobile.
3. Double-click (and double-tap via successive clicks) on a painting opens the composer.

## Prompt bar motion

The collapsed button and expanded panel render as separate, center-aligned shells. They transition in both directions using uniform transform scale and opacity instead of interpolating width and height through Motion layout animation.

- Opening: the button scales down and fades out while the panel scales from approximately `0.9` to `1`.
- Closing: the panel scales down and fades out while the button scales up to its resting size.
- The transform origin remains centered.
- Panel content uses a short one-time opacity and `6px` blur reveal. The reverse transition restores the blur while fading out.
- Blur stays at or below `6px`, is limited to the small content surface, and is not continuous.
- Reduced-motion mode removes scale and blur movement and swaps states immediately.

The existing focus transfer, click-outside dismissal, Escape behavior, generation state, and inspiration picker behavior remain unchanged.

## Directional control

Increase the control base from 92px to 112px and the center knob from 38px to 44px. The wider ring provides four non-overlapping minimum 44×44px button targets for previous, next, zoom in, and zoom out while preserving center-knob dragging.

The visual glyphs remain the same size. Only the invisible targets, outer ring, and slightly larger center knob change.

On narrow screens, move the control from vertical center into the lower third so it no longer covers the gallery frame. Preserve the current bottom-right desktop position at the existing medium breakpoint. Keep the control within the mobile safe area and clear of the prompt bar.

## Double-click opens composer

Double-clicking a painting in the room expands the prompt bar the same way the pen button does, including focus transfer into the prompt field. Single-click continues to select/focus the painting only.

Implementation detects a second click on the same painting within a short window so desktop double-click and mobile double-tap (which surfaces as successive clicks on the canvas) share one path. Expanding is idempotent when the bar is already open. Click-outside and Escape dismissal remain unchanged after opening via this path.

## Verification

- Confirm opening and closing remain centered with no stretched content.
- Confirm content blur resolves cleanly in both directions.
- Confirm reduced-motion mode performs no scale or blur animation.
- Confirm all four directional targets are at least 44×44px and do not overlap.
- Confirm dragging from the center knob still works.
- Confirm the control clears gallery frames and the prompt bar on narrow viewports.
- Confirm double-click / double-tap on a painting opens the composer and focuses the prompt.
- Confirm single-click still only focuses the painting.
- Confirm click-outside still collapses the bar after opening via double-click.
- Run the project’s focused lint/type checks for touched components.
