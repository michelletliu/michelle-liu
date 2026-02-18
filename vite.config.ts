
  import { defineConfig, loadEnv, type Plugin } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import tailwindcss from '@tailwindcss/vite';
  import path from 'path';
  import { timingSafeEqual } from 'node:crypto';
  import { createClient } from '@sanity/client';

  function safePasswordCompare(expected: string, provided: string): boolean {
    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(provided);

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, providedBuffer);
  }

  function getExpectedPassword(
    passwordMap: Record<string, string>,
    projectId: string,
    sectionKey: string
  ): string | null {
    const direct = passwordMap[`${projectId}:${sectionKey}`];
    if (direct) return direct;

    const lowerCaseMatch = passwordMap[`${projectId.toLowerCase()}:${sectionKey}`];
    if (lowerCaseMatch) return lowerCaseMatch;

    const matchingKeys = Object.keys(passwordMap).filter((key) => key.endsWith(`:${sectionKey}`));
    if (matchingKeys.length === 1) {
      return passwordMap[matchingKeys[0]];
    }

    return null;
  }

  function devVerifyPasswordApiPlugin(mode: string): Plugin {
    const env = loadEnv(mode, process.cwd(), '');
    const rawMap = env.PROTECTED_SECTION_PASSWORDS_JSON;

    return {
      name: 'dev-verify-password-api',
      configureServer(server) {
        server.middlewares.use('/api/verify-password', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          if (!rawMap) {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Password verification is not configured' }));
            return;
          }

          let passwordMap: Record<string, string>;
          try {
            const parsed = JSON.parse(rawMap);
            if (!parsed || typeof parsed !== 'object') {
              throw new Error('Invalid password map');
            }
            passwordMap = parsed;
          } catch {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Password verification is not configured' }));
            return;
          }

          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}') as {
                projectId?: string;
                sectionKey?: string;
                password?: string;
              };

              const { projectId, sectionKey, password } = payload;
              if (!projectId || !sectionKey || !password) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing required fields' }));
                return;
              }

              const expectedPassword = getExpectedPassword(passwordMap, projectId, sectionKey);
              if (!expectedPassword) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Protected section not found' }));
                return;
              }

              const success = safePasswordCompare(expectedPassword, password);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success }));
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid request body' }));
            }
          });
        });
      },
    };
  }

  function devSubmitBookSuggestionPlugin(mode: string): Plugin {
    const env = loadEnv(mode, process.cwd(), '');
    const token = env.SANITY_WRITE_TOKEN || env.VITE_SANITY_WRITE_TOKEN;

    return {
      name: 'dev-submit-book-suggestion-api',
      configureServer(server) {
        server.middlewares.use('/api/submit-book-suggestion', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          if (!token) {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Book suggestions are not configured' }));
            return;
          }

          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', async () => {
            try {
              const { bookTitle } = JSON.parse(body || '{}') as { bookTitle?: string };
              if (!bookTitle || typeof bookTitle !== 'string' || !bookTitle.trim()) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing book title' }));
                return;
              }

              const sanityClient = createClient({
                projectId: 'am3v0x1c',
                dataset: 'production',
                apiVersion: '2026-01-06',
                useCdn: false,
                token,
              });

              await sanityClient.create({
                _type: 'bookSuggestion',
                bookTitle: bookTitle.trim(),
                submittedAt: new Date().toISOString(),
                status: 'new',
              });

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to submit book suggestion' }));
            }
          });
        });
      },
    };
  }

  export default defineConfig(({ mode }) => ({
    plugins: [react(), tailwindcss(), devVerifyPasswordApiPlugin(mode), devSubmitBookSuggestionPlugin(mode)],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'vaul@1.1.2': 'vaul',
        'sonner@2.0.3': 'sonner',
        'recharts@2.15.2': 'recharts',
        'react-resizable-panels@2.1.7': 'react-resizable-panels',
        'react-hook-form@7.55.0': 'react-hook-form',
        'react-day-picker@8.10.1': 'react-day-picker',
        'next-themes@0.4.6': 'next-themes',
        'lucide-react@0.487.0': 'lucide-react',
        'input-otp@1.4.2': 'input-otp',
        'figma:asset/a76eb5a0f18de2c3b9c2ac1e18fa0165affdd477.png': path.resolve(__dirname, './src/assets/a76eb5a0f18de2c3b9c2ac1e18fa0165affdd477.png'),
        'embla-carousel-react@8.6.0': 'embla-carousel-react',
        'cmdk@1.1.1': 'cmdk',
        'class-variance-authority@0.7.1': 'class-variance-authority',
        '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
        '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
        '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
        '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
        '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
        '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
        '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
        '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
        '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
        '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
        '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
        '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
        '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
        '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
        '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
        '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
        '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
        '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
        '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
        '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
        '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
        '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
        '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
        '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
        '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
    },
    server: {
      port: 3000,
      open: true,
    },
  }));