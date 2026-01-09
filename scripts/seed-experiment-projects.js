// Script to seed experiment projects into Sanity
// Run with: SANITY_TOKEN=<your-token> node scripts/seed-experiment-projects.js

const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'am3v0x1c',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN, // Need a write token
});

const experimentProjects = [
  {
    _type: 'experimentProject',
    projectId: 'polaroid',
    title: 'Polaroid Studio',
    year: '2025',
    description: 'A digital way to customize your own polaroid.',
    muxPlaybackId: 'XJFJ1P3u9pKsFYvH9lTtOp4gPRydSpMkRrX9dRmNE5w',
    xLink: 'https://x.com/michelletliu/status/1991201412072734777',
    tryItOutHref: '/polaroid',
    toolCategories: [
      { _type: 'toolCategory', _key: 'design', label: 'Design', tools: ['Figma'] },
      { _type: 'toolCategory', _key: 'frontend', label: 'Frontend', tools: ['TypeScript', 'React', 'Vite'] },
      { _type: 'toolCategory', _key: 'styling', label: 'Styling', tools: ['Tailwind CSS'] },
      { _type: 'toolCategory', _key: 'ai', label: 'AI', tools: ['Figma Make', 'Cursor'] },
    ],
    order: 0,
    isPublished: true,
  },
  {
    _type: 'experimentProject',
    projectId: 'screentime',
    title: 'Screentime Receipt',
    year: '2025',
    description: 'A receipt for your daily or weekly screentime.',
    muxPlaybackId: 'AdZWDHKkfyhXntZy01keNYtPB7Q6w8GxeaUWmP8501SLI',
    xLink: 'https://x.com/michelletliu/status/2000987498550383032',
    tryItOutHref: '/screentime',
    toolCategories: [
      { _type: 'toolCategory', _key: 'design', label: 'Design', tools: ['Figma'] },
      { _type: 'toolCategory', _key: 'frontend', label: 'Frontend', tools: ['TypeScript', 'React', 'Vite'] },
      { _type: 'toolCategory', _key: 'styling', label: 'Styling', tools: ['Tailwind CSS'] },
      { _type: 'toolCategory', _key: 'ai', label: 'AI', tools: ['Figma Make', 'Cursor'] },
    ],
    order: 1,
    isPublished: true,
  },
  {
    _type: 'experimentProject',
    projectId: 'sketchbook',
    title: 'Digital Sketchbook',
    year: '2025',
    description: 'A digital home for sketches and visual journaling. Live app coming soon!',
    muxPlaybackId: 'iEo013MYI028Zit3nPTJetFvqbgweCC8e2NHbY702qsQBg',
    tryItOutHref: '/art',
    toolCategories: [
      { _type: 'toolCategory', _key: 'design', label: 'Design', tools: ['Figma'] },
      { _type: 'toolCategory', _key: 'frontend', label: 'Frontend', tools: ['TypeScript', 'React', 'Vite'] },
      { _type: 'toolCategory', _key: 'styling', label: 'Styling', tools: ['Tailwind CSS'] },
      { _type: 'toolCategory', _key: 'ai', label: 'AI', tools: ['Figma Make', 'Cursor'] },
    ],
    order: 2,
    isPublished: true,
  },
  {
    _type: 'experimentProject',
    projectId: 'library',
    title: 'Personal Library',
    year: '2025',
    description: 'My dream digital bookshelf',
    muxPlaybackId: 'a3NxNdblQi02JVCg0177eEWZRycP1BduGb2pt7o00FUPfo',
    xLink: 'https://x.com/michelletliu/status/1981030966044061894',
    tryItOutHref: '/library',
    toolCategories: [
      { _type: 'toolCategory', _key: 'design', label: 'Design', tools: ['Figma'] },
      { _type: 'toolCategory', _key: 'frontend', label: 'Frontend', tools: ['TypeScript', 'React', 'Vite'] },
      { _type: 'toolCategory', _key: 'styling', label: 'Styling', tools: ['Tailwind CSS'] },
      { _type: 'toolCategory', _key: 'ai', label: 'AI', tools: ['Figma Make', 'Cursor'] },
    ],
    order: 3,
    isPublished: true,
  },
];

async function seedProjects() {
  if (!process.env.SANITY_TOKEN) {
    console.error('Error: SANITY_TOKEN environment variable is required');
    console.log('Get a token from: https://www.sanity.io/manage/project/am3v0x1c/api#tokens');
    process.exit(1);
  }

  console.log('Seeding experiment projects...\n');

  for (const project of experimentProjects) {
    try {
      // Check if project already exists
      const existing = await client.fetch(
        `*[_type == "experimentProject" && projectId == $projectId][0]`,
        { projectId: project.projectId }
      );

      if (existing) {
        console.log(`⏭️  Skipping "${project.title}" - already exists (id: ${existing._id})`);
        continue;
      }

      // Create the document
      const result = await client.create(project);
      console.log(`✅ Created "${project.title}" (id: ${result._id})`);
    } catch (error) {
      console.error(`❌ Error creating "${project.title}":`, error.message);
    }
  }

  console.log('\nDone! You can now view these in Sanity Studio under "Experiment Project".');
}

seedProjects();
