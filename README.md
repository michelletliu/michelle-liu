  # **michelle liu**

  Personal portfolio website. Designed in Figma, built with Next.js.

  ### Develop Project Overlay

  This is a code bundle for Develop Project Overlay. The original project is available at https://www.figma.com/design/8FInO8lSUrUMMkOx8IVVxJ/Develop-Project-Overlay.

  ### Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

### Protected sections security

Protected project-section passwords are verified server-side by `api/verify-password.ts`.

- Passwords are intentionally stored outside Sanity in `PROTECTED_SECTION_PASSWORDS_JSON`.
- Format: `{"<projectId-or-company>:<sectionKey>":"<password>"}`.
- Public Sanity datasets expose readable fields through the query API, so do not store plaintext passwords in Sanity.
  
