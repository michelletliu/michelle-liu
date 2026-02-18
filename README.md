  # **michelle liu**

  Welcome to my personal portfolio website! Designed in Figma, built with Next.js and Claude Opus 4.5.

  ### Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

### Protected sections security

Protected project-section passwords are verified server-side by `api/password.ts`.

- Passwords are stored as individual environment variables: `PASSWORD_NASA`, `PASSWORD_ADOBE`, `PASSWORD_ROBLOX`.
- The client sends the password in an `x-password` header and the company name in the request body.
- Public Sanity datasets expose readable fields through the query API, so passwords are never stored in Sanity.

