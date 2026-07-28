# Contact Badge Base Size + Intro Fade

## Goal

On the Work homepage header, make the green contact CTA use base typography, and fade the neighboring gray intro copy (including the Apple mark) further when the pill expands so its padding can visually overlap that text.

## Design

- Pass `size="md"` to the Work-page `ContactBadge` so its CTA uses `text-base` and the matching medium expanded padding.
- Keep the About-page / scroll-expand badge behavior unchanged.
- When the Work-page badge is expanded, fade the intro copy wrapper from `opacity-40` to `opacity-20`.
- The Apple SVG inherits that wrapper opacity; no separate SVG opacity tweak is required.
- Collapsed badge state still leaves intro copy at full opacity on desktop (and always full opacity on mobile, where the badge is hidden).

## Scope

Only the Work homepage header pairing of intro copy + `ContactBadge`. Do not change badge copy, mailto behavior, About-page usage, or mobile layout.

## Testing

Add a source-level regression test covering:

- Work-page `ContactBadge` is rendered with `size="md"`.
- Expanded intro-copy opacity is `opacity-20`.

Run the targeted test, the repository test suite, and the production build.
