<img width="44" height="44" alt="Michelle Liu logo" src="https://github.com/user-attachments/assets/1370d6e7-9a33-4f69-9724-f8cc8805570f" />

# michelle liu

Welcome to my personal portfolio and digital archive! Designed in Figma and built with Next.js, TypeScript, React, Sanity, Notion, and a few agentic coding friends.

## Contents

- 🔐 Portfolio case studies 
- 🧩 Design system 
- 📚 Library: a personal bookshelf with Goodreads-powered reading data
- 🎞️ Film: movie notes and photo memories from a Notion-backed film log
- 🖼️ Gallery: an image-generation playground for visual experiments
- ✏️ Sketchbook: loose drawings, fragments, and in-progress ideas
- 🎨 Art: a small archive of visual work and studies
- ⏳ Screen Time Receipt: a receipt-style interaction for reflecting on attention
- 📸 Polaroid Studio: a nostalgic photo customizer
- 🪄 Utility scripts for syncing Goodreads, Letterboxd, covers, posters, and metadata

## Tech stack

- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Sanity for portfolio and shelf content
- Notion API for film photo data
- PostHog for optional analytics
- Vercel for deployment

## Getting started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Create `.env.local` for local development. Most pages render without every integration configured, but protected content, writes, and external syncs require the relevant tokens.

| Variable | Required | Used for |
| --- | --- | --- |
| `PASSWORD_SESSION_SECRET` | Production | Signing protected-section unlock cookies. Falls back to `NEXTAUTH_SECRET` when present. |
| `PASSWORD_<PROJECT_ID>` | Optional | Password for a protected project, where `<PROJECT_ID>` is the uppercased project slug with hyphens replaced by underscores. |
| `SANITY_READ_TOKEN` | Optional | Authenticated reads for protected Sanity-backed project content. |
| `SANITY_WRITE_TOKEN` | Optional | Book suggestion writes through `app/api/submit-book-suggestion/route.ts`. |
| `SANITY_TOKEN` | Optional | Local content maintenance scripts that write to Sanity. |
| `NOTION_TOKEN` | Optional locally, required for production film data | Runtime Notion access for film photos. |
| `NOTION_FILM_DATABASE_ID` | Production | Notion database ID for film photos. Development has a fallback database ID. |
| `PIKA_API_KEY` | Optional | Image generation in the gallery API. |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | Enables PostHog analytics. |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional | Overrides the PostHog host. |
| `GOODREADS_USER_ID` | Optional | Goodreads sync scripts. |
| `GOODREADS_SHELF` | Optional | Goodreads sync scripts. Defaults to `read`. |
| `LETTERBOXD_USERNAME` | Optional | Letterboxd sync scripts. |
| `TMDB_API_KEY` | Optional | Movie poster resolution in Letterboxd scripts. |
| `SPOTIFY_CLIENT_ID` | Optional | Spotify URL repair scripts. |
| `SPOTIFY_CLIENT_SECRET` | Optional | Spotify URL repair scripts. |

Never commit `.env.local` or personal API tokens.

## Scripts

```bash
npm run dev      # Start the local Next.js dev server
npm run build    # Build the production app
npm run start    # Start the built app
npm run test     # Run the focused Node test suite
npm run clean    # Remove generated build artifacts
```

The `scripts/` directory also contains one-off content maintenance utilities. Many of them run as dry runs without `SANITY_TOKEN`; read the file header before running a script that mutates Sanity.

## Project structure

```text
app/            Next.js routes, pages, loading states, and API routes
src/components/ React components grouped by feature area
src/lib/        Shared data, integration, and utility logic
src/sanity/     Sanity queries and preload helpers
src/styles/     Global styles
src/assets/     Source assets used by portfolio sections
public/         Public static assets
scripts/        Content sync and maintenance scripts
docs/           Planning and implementation notes
```

## Protected sections security

Protected project-section passwords are verified server-side by `app/api/password/route.ts`.

- Passwords are stored as individual environment variables
- Successful unlocks are stored in signed HttpOnly cookies using `PASSWORD_SESSION_SECRET`
- Project content is fetched through `app/api/project/route.ts`, which strips `visibility: "unlocked"` sections unless the signed cookie verifies
- Set `SANITY_READ_TOKEN` if protected project content requires authenticated Sanity reads

Important: app-level filtering is not enough if confidential content remains in a publicly readable Sanity dataset. For NDA-grade protection, move protected content behind private Sanity access, such as a private dataset or private document model that anonymous GROQ requests cannot query.

## Deployment

The app is configured for Vercel via `vercel.json`. Configure production environment variables in Vercel before deploying, especially `PASSWORD_SESSION_SECRET`, any `PASSWORD_<PROJECT_ID>` values, and the production Notion/Sanity tokens needed by live routes.

## Ownership and license

The source code in this repository is licensed under the MIT License.

All portfolio content, case studies, images, screenshots, logos, personal branding, and written materials are © Michelle Liu. All rights reserved. They may not be copied, reused, redistributed, or modified without permission.
