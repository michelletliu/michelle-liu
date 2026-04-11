  # **michelle liu**

  Personal portfolio website. Designed in Figma, built with Next.js.

  ### Repo map

  - `app/`: Next.js routes (App Router)
  - `src/components/`: shared UI and feature components
  - `src/hooks/`: shared hooks
  - `src/styles/`: shared styling constants
  - `src/sanity/` + `studio-michelle-liu/`: CMS integration and Sanity Studio
  - `scripts/`: one-off data and maintenance scripts
  - `public/`: static assets served directly

  ### Generated files you can safely clean locally

  - `.next/`
  - `dist/`
  - `*.tsbuildinfo`

  Run:

  `npm run clean`

  ### Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

### Protected sections security

Protected project-section passwords are verified server-side by `api/password.ts`.

- Passwords are stored as individual environment variables: `PASSWORD_NASA`, `PASSWORD_ADOBE`, `PASSWORD_ROBLOX`.
- The client sends the password in an `x-password` header and the company name in the request body.
- Public Sanity datasets expose readable fields through the query API, so passwords are never stored in Sanity.

