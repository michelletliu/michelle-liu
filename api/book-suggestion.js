
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.SANITY_WRITE_TOKEN;
  
  if (!token) {
    return res.status(500).json({ error: 'Missing SANITY_WRITE_TOKEN env var' });
  }

  const { bookTitle } = req.body || {};

  if (!bookTitle || typeof bookTitle !== 'string' || !bookTitle.trim()) {
    return res.status(400).json({ error: 'Book title is required' });
  }

  try {
    const { createClient } = await import('@sanity/client');
    
    const client = createClient({
      projectId: 'am3v0x1c',
      dataset: 'production',
      apiVersion: '2026-01-06',
      useCdn: false,
      token,
    });

    const result = await client.create({
      _type: 'bookSuggestion',
      bookTitle: bookTitle.trim(),
      submittedAt: new Date().toISOString(),
      status: 'new',
    });

    return res.status(200).json({ success: true, id: result._id });
  } catch (error) {
    console.error('Error creating book suggestion:', error);
    return res.status(500).json({ error: 'Failed to submit suggestion', details: error.message });
  }
}
