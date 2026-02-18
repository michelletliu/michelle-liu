import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@sanity/client';

const token = process.env.SANITY_WRITE_TOKEN || process.env.VITE_SANITY_WRITE_TOKEN;

function getSanityClient() {
  if (!token) return null;

  return createClient({
    projectId: 'am3v0x1c',
    dataset: 'production',
    apiVersion: '2026-01-06',
    useCdn: false,
    token,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = getSanityClient();
  if (!client) {
    console.error('[submit-book-suggestion] SANITY_WRITE_TOKEN is not configured');
    return res.status(503).json({ error: 'Book suggestions are not configured' });
  }

  try {
    const { bookTitle } = req.body;

    if (!bookTitle || typeof bookTitle !== 'string' || !bookTitle.trim()) {
      return res.status(400).json({ error: 'Missing book title' });
    }

    await client.create({
      _type: 'bookSuggestion',
      bookTitle: bookTitle.trim(),
      submittedAt: new Date().toISOString(),
      status: 'new',
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Book suggestion error:', error);
    return res.status(500).json({ error: 'Failed to submit book suggestion' });
  }
}
