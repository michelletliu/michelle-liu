module.exports = async function handler(req, res) {
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

  const projectId = 'am3v0x1c';
  const dataset = 'production';
  const apiVersion = '2026-01-06';

  const mutations = [{
    create: {
      _type: 'bookSuggestion',
      bookTitle: bookTitle.trim(),
      submittedAt: new Date().toISOString(),
      status: 'new',
    }
  }];

  try {
    const response = await fetch(
      `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ mutations }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sanity API error:', errorText);
      return res.status(500).json({ error: 'Sanity API error', details: errorText });
    }

    const result = await response.json();
    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Error creating book suggestion:', error);
    return res.status(500).json({ error: 'Failed to submit suggestion', details: String(error) });
  }
};
