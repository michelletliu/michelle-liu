const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'am3v0x1c',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

const missingReviews = require('./missing-reviews.json');

async function patchReviews() {
  console.log(`Patching ${missingReviews.length} reviews...`);
  
  for (const book of missingReviews) {
    try {
      await client
        .patch(book._id)
        .set({ review: book.review })
        .commit();
      console.log(`✓ Patched: ${book.title}`);
    } catch (err) {
      console.error(`✗ Failed: ${book.title}`, err.message);
    }
  }
  
  console.log('\nDone! Now publish the drafts in Sanity Studio.');
}

patchReviews();
