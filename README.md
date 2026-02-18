  # **michelle liu**

  Welcome to my personal portfolio website! Designed in Figma, built with Next.js and Claude Opus 4.5.

  ### Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

### Protected sections security

Protected project-section passwords are verified server-side by `api/verify-password.ts`.

- Passwords are intentionally stored outside Sanity in `PROTECTED_SECTION_PASSWORDS_JSON`.
- Format: `{"<projectId-or-company>:<sectionKey>":"<password>"}`.
- Public Sanity datasets expose readable fields through the query API, so do not store plaintext passwords in Sanity.
  
