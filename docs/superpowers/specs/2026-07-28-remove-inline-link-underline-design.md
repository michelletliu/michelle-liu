# Remove Inline Link Underlines

## Goal

Remove the persistent underline from every link that uses the shared `INLINE_LINK_CLASS` while preserving the existing color, focus, and transition behavior.

## Scope

- Remove the underline utilities from `src/components/inlineLink.ts`.
- Update `src/components/inlineLink.test.ts` to require an underline-free shared class.
- Leave component-specific links and all unrelated typography, layout, icons, and copy unchanged.

## Behavior

Shared inline links inherit their surrounding text color at rest. Hover and keyboard focus continue to use the site's blue interaction color with the existing 200ms ease-out transition. The affected links are the protected-content email links, the Met Museum source link, and the design-system social/meta link specimen.

## Verification

Run the focused inline-link test, the full test suite, and the production build. Confirm the shared class contains neither `underline` nor `underline-offset-*`.
