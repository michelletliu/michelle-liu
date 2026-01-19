import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'am3v0x1c',
  dataset: 'production',
  apiVersion: '2026-01-06',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bookTitle } = req.body;

  if (!bookTitle || typeof bookTitle !== 'string' || !bookTitle.trim()) {
    return res.status(400).json({ error: 'Book title is required' });
  }

  try {
    const result = await client.create({
      _type: 'bookSuggestion',
      bookTitle: bookTitle.trim(),
      submittedAt: new Date().toISOString(),
      status: 'new',
    });

    return res.status(200).json({ success: true, id: result._id });
  } catch (error) {
    console.error('Error creating book suggestion:', error);
    return res.status(500).json({ error: 'Failed to submit suggestion' });
  }
}
