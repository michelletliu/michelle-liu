export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = process.env.SANITY_WRITE_TOKEN;
  
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing SANITY_WRITE_TOKEN env var' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { bookTitle } = body || {};

  if (!bookTitle || typeof bookTitle !== 'string' || !bookTitle.trim()) {
    return new Response(JSON.stringify({ error: 'Book title is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
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
      return new Response(JSON.stringify({ error: 'Sanity API error', details: errorText }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();
    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating book suggestion:', error);
    return new Response(JSON.stringify({ error: 'Failed to submit suggestion', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
