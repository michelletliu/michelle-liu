import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false });
  }

  const password = req.headers['x-password'] as string | undefined;
  const { project } = req.body ?? {};

  if (!password || !project) {
    return res.status(400).json({ success: false });
  }

  const envKey = `PASSWORD_${project.toUpperCase()}`;
  const expected = process.env[envKey];

  if (!expected) {
    return res.status(200).json({ success: false });
  }

  return res.status(200).json({ success: password === expected });
}
