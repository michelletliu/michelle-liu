# Gallery Reve Generate (Focused Canvas)

**Date:** 2026-07-24  
**Status:** Approved  
**Route:** `/gallery`

## Goal

Let visitors type a prompt in a floating bottom bar and generate art onto the **currently focused** blank canvas via Reve, without exposing the API key to the client.

## Behavior

- Floating bottom action bar: prompt input + Generate
- Generate fills only the focused painting (`imageUrl` in client state)
- Aspect ratio from painting: portrait → `2:3`, landscape → `3:2`
- Loading state while generating; error message in the bar on failure
- Key stored as `REVE_API_TOKEN` in `.env.local` (gitignored); server route only

## Architecture

- `POST /api/gallery/generate` — `{ prompt, paintingId }` → Reve create → `{ imageUrl }` (data URL)
- `GalleryActionBar` — UI + fetch
- `GalleryPage` — owns painting overrides map + generating id
- `GalleryRoom` — renders `paintings` prop (defaults + overrides)

## Out of scope

- Fill-all canvases, CMS persistence, edit/remix, nav link
