const { createClient } = require('@sanity/client');
const reviews = require('./reviews-to-patch.json');

const client = createClient({
  projectId: 'am3v0x1c',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

async function patchReviews() {
  console.log(`Patching ${reviews.length} reviews...`);
  
  let success = 0;
  let failed = 0;
  
  for (const r of reviews) {
    try {
      await client.patch(r._id).set({ review: r.review }).commit();
      success++;
      if (success % 10 === 0) {
        console.log(`Progress: ${success}/${reviews.length}`);
      }
    } catch (err) {
      console.error(`Failed to patch ${r.title}:`, err.message);
      failed++;
    }
  }
  
  console.log(`Done! Success: ${success}, Failed: ${failed}`);
}

patchReviews();
