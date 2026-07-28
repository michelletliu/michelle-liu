# Button radius toggles

## Goal

Make button corner treatment consistent within each design-system specimen while allowing the viewer to compare pill/circular and rectangular/squircle treatments.

## Scope

Add an independent radius toggle to each of the three button cards:

- Solid matrix
- Glass matrix
- Playground

## Behavior

- Every card defaults to the pill/circular treatment.
- The card's top-right control previews the alternate treatment:
  - Show a squircle while the card uses pills/circles.
  - Show a circle while the card uses rectangles/squircles.
- Activating the control toggles every button rendered by that card.
- Matrix toggles affect every variant, size, and content mode in that card.
- The Playground toggle affects its current preview button.
- Solid, Glass, and Playground states remain independent.

## Visual and accessibility details

- Position the control consistently at the top-right of the specimen surface.
- Reuse the existing ghost icon-button treatment.
- Keep the control background neutral in both states; the icon shape communicates the available action.
- Expose state with `aria-pressed`.
- Use an action-oriented accessible label: “Use rectangular buttons” or “Use circular buttons.”
- Preserve existing button dimensions; only corner radius changes.

## Implementation shape

- Add shared circle and squircle glyph components to the icon library and catalog both in Iconography.
- Replace variant-owned specimen radii with a card-level radius mode passed to button samples.
- Keep production button APIs unchanged; this is a design-system specimen control only.
