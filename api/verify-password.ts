import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'am3v0x1c',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false, // We need fresh data for password checks
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId, sectionKey, password } = req.body;

    if (!projectId || !sectionKey || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch only the specific password from Sanity (never sent to client)
    const query = `
      *[_type == "project" && (slug.current == $projectId || company == $projectId)][0] {
        "sectionPassword": content[_key == $sectionKey][0].password
      }
    `;

    const result = await client.fetch(query, { projectId, sectionKey });

    if (!result || !result.sectionPassword) {
      return res.status(404).json({ error: 'Protected section not found' });
    }

    // Compare passwords server-side
    const isCorrect = result.sectionPassword === password;

    return res.status(200).json({ success: isCorrect });
  } catch (error) {
    console.error('Password verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
