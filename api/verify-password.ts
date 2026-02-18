import type { VercelRequest, VercelResponse } from '@vercel/node';
import { timingSafeEqual } from 'node:crypto';

type PasswordMap = Record<string, string>;

const PROTECTED_SECTION_PASSWORDS_JSON = process.env.PROTECTED_SECTION_PASSWORDS_JSON;

function loadPasswordMap(): PasswordMap | null {
  if (!PROTECTED_SECTION_PASSWORDS_JSON) return null;

  try {
    const parsed = JSON.parse(PROTECTED_SECTION_PASSWORDS_JSON);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as PasswordMap;
  } catch {
    return null;
  }
}

function safePasswordCompare(expected: string, provided: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

function getExpectedPassword(
  passwordMap: PasswordMap,
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const passwordMap = loadPasswordMap();
  if (!passwordMap) {
    console.error(
      '[verify-password] Missing/invalid PROTECTED_SECTION_PASSWORDS_JSON. Passwords must be stored outside Sanity.'
    );
    return res.status(503).json({ error: 'Password verification is not configured' });
  }

  try {
    const { projectId, sectionKey, password } = req.body;

    if (!projectId || !sectionKey || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Passwords are intentionally stored outside Sanity to avoid public-dataset exposure.
    const expectedPassword = getExpectedPassword(passwordMap, projectId, sectionKey);
    if (!expectedPassword) {
      return res.status(404).json({ error: 'Protected section not found' });
    }

    // Compare passwords server-side
    const isCorrect = safePasswordCompare(expectedPassword, password);

    return res.status(200).json({ success: isCorrect });
  } catch (error) {
    console.error('Password verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
