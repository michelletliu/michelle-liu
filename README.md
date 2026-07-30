<img width="44" height="44" alt="logo" src="https://github.com/user-attachments/assets/1370d6e7-9a33-4f69-9724-f8cc8805570f" />

  
  # **michelle liu**
  
  Welcome to my personal portfolio website! Designed in Figma, built with Next.js and Claude/Cursor/Codex/Devin.

  ### Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

### Protected sections security

Protected project-section passwords are verified server-side by `app/api/password/route.ts`.

- Passwords are stored as individual environment variables
- Successful unlocks are stored in signed HttpOnly cookies using `PASSWORD_SESSION_SECRET`
- Project content is fetched through `app/api/project/route.ts`, which strips `visibility: "unlocked"` sections unless the signed cookie verifies
- Set `SANITY_READ_TOKEN` if protected project content requires authenticated Sanity reads

Important: app-level filtering is not enough if confidential content remains in a publicly readable Sanity dataset. For NDA-grade protection, move protected content behind private Sanity access, such as a private dataset or private document model that anonymous GROQ requests cannot query.

## License

The source code in this repository is licensed under the MIT License.

All portfolio content, case studies, images, screenshots, logos, personal branding, and written materials are © Michelle Liu. All rights reserved. They may not be copied, reused, redistributed, or modified without permission.
