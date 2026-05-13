<img width="44" height="44" alt="logo" src="https://github.com/user-attachments/assets/1370d6e7-9a33-4f69-9724-f8cc8805570f" />

  
  # **michelle liu**
  
  Welcome to my personal portfolio website! Designed in Figma, built with Next.js and Claude Opus 4.5.

  ### Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

### Protected sections security

Protected project-section passwords are verified server-side by `app/api/password/route.ts`.

- Passwords are stored **exclusively** as environment variables (`PASSWORD_<COMPANY>`). They are **not** stored in Sanity.
- On successful verification, a signed `HttpOnly` cookie is set. Protected content is then served by `/api/protected-content` which validates the cookie before returning any data.
- The GROQ queries sent to the public Sanity CDN never include `visibility: "unlocked"` section bodies — only stubs with `_key`, `_type`, and `visibility`.
- Rate limiting, constant-time comparison, and a project allowlist are enforced on `/api/password`.
- `PASSWORD_SIGNING_SECRET` env var (≥ 32 chars) is required for cookie signing.

