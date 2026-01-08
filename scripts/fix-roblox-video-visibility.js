const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'am3v0x1c',
  dataset: 'production',
  apiVersion: '2026-01-07',
  token: process.env.SANITY_TOKEN, // Set this in your environment
  useCdn: false,
});

async function fixVideoVisibility() {
  try {
    const projectId = 'drafts.db721e83-7f42-4908-86f5-9d19096d2237';
    
    // Fetch the draft document
    const doc = await client.getDocument(projectId);
    
    console.log('Fetched draft document');
    
    // Find the feature section with the video and update its visibility
    const updatedContent = doc.content.map((section) => {
      if (section._key === '4accb5e8fe2c' && section._type === 'featureSection') {
        console.log('Found feature section with video, changing visibility from "locked" to "unlocked"');
        return {
          ...section,
          visibility: 'unlocked'
        };
      }
      return section;
    });
    
    // Update the document
    await client
      .patch(projectId)
      .set({ content: updatedContent })
      .commit();
    
    console.log('✅ Successfully updated visibility to "unlocked"');
    console.log('The video section should now be visible in the project!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixVideoVisibility();
