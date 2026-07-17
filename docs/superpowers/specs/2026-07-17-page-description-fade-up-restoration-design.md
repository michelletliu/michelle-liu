# Page Description Fade-Up Restoration

## Goal

Restore the live-site entrance animation for the shared Work, Art, and About page descriptions. The description should fade up whenever a page header mounts, including return visits during the same browser session.

## Root Cause

`PageHeader` conditionally removes the existing `projectCardEnter` animation after `useHeroAnimation` marks the hero animation as played. This session-level optimization unintentionally suppresses the description animation on later tab switches.

## Design

Keep the existing keyed description wrapper and always apply the existing `projectCardEnter` animation:

- Duration: 360ms
- Easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- Fill mode: `both`
- Animated properties: opacity and transform, as defined by the existing keyframes

Do not change page copy, layout, navigation behavior, or animation timing. Keep the broader hero-animation state intact for other consumers.

## Testing

Add a focused `PageHeader` source regression test, following the repository's existing zero-dependency `node:test` pattern, that verifies the shared description wrapper always receives the entrance animation and has no session-state conditional. Because Work, Art, and About all use this shared wrapper keyed by variant, this protects every page. Run the focused test first in a failing state, apply the minimal fix, then run the focused and related test suites.
