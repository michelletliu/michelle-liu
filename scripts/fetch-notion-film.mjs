import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.NOTION_FILM_DATABASE_ID;
if (!NOTION_TOKEN || !DATABASE_ID) {
  console.error('Set NOTION_TOKEN and NOTION_FILM_DATABASE_ID (e.g. in .env.local), then run again.');
  process.exit(1);
}
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'film');
const MANIFEST_JSON = path.join(OUTPUT_DIR, 'notion-export-manifest.json');

const MONTH_ORDER = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function notionFetch(urlPath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.notion.com',
      path: urlPath,
      method,
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`Parse error: ${data.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function getJpegDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  let offset = 2;
  while (offset < buf.length) {
    if (buf[offset] !== 0xFF) break;
    const marker = buf[offset + 1];
    if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return { width, height };
    }
    const len = buf.readUInt16BE(offset + 2);
    offset += 2 + len;
  }
  return { width: 1, height: 1 };
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${dest}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', reject);
  });
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. Fetch all pages
  console.log('Fetching database pages...');
  let allPages = [];
  let cursor = undefined;
  while (true) {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const resp = await notionFetch(`/v1/databases/${DATABASE_ID}/query`, 'POST', body);
    allPages.push(...resp.results);
    if (!resp.has_more) break;
    cursor = resp.next_cursor;
  }
  console.log(`Found ${allPages.length} pages`);

  // 2. For each page, fetch image blocks (parallel, batched)
  console.log('Fetching image blocks...');
  const BATCH = 10;
  const entries = [];

  for (let i = 0; i < allPages.length; i += BATCH) {
    const batch = allPages.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(async (page) => {
      const props = page.properties;
      const title = props.Title?.title?.[0]?.plain_text || 'untitled';
      const month = props.Month?.select?.name || 'Unknown';
      const yearArr = props.Year?.multi_select || [];
      const year = yearArr.length > 0 ? parseInt(yearArr[0].name) : 2025;
      const noteProp = props.Note;
      let noteRaw = '';
      if (noteProp?.select?.name) noteRaw = String(noteProp.select.name).trim();
      else if (noteProp?.multi_select?.length) {
        noteRaw = noteProp.multi_select.map((x) => x.name || '').filter(Boolean).join(', ').trim();
      } else if (noteProp?.rich_text?.length) {
        noteRaw = noteProp.rich_text.map((r) => r.plain_text || '').join('').trim();
      }

      const blocks = await notionFetch(`/v1/blocks/${page.id}/children`);
      const imageBlock = blocks.results?.find(b => b.type === 'image');
      if (!imageBlock) return null;

      const imageData = imageBlock.image;
      const url = imageData.type === 'file'
        ? imageData.file.url
        : imageData.external?.url;
      if (!url) return null;

      return {
        title,
        month,
        year,
        url,
        pageId: page.id,
        ...(noteRaw ? { note: noteRaw } : {}),
      };
    }));

    entries.push(...results.filter(Boolean));
    process.stdout.write(`  ${Math.min(i + BATCH, allPages.length)}/${allPages.length}\n`);
  }

  console.log(`Found ${entries.length} images`);

  // 3. Download images
  console.log('Downloading images...');
  const manifest = [];

  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    await Promise.all(batch.map(async (entry, j) => {
      const idx = i + j;
      const ext = 'jpg';
      const filename = `${entry.month.toLowerCase()}-${entry.year}-${String(idx).padStart(3, '0')}.${ext}`;
      const dest = path.join(OUTPUT_DIR, filename);

      try {
        await downloadFile(entry.url, dest);
        const dims = getJpegDimensions(dest);
        const aspectRatio = dims.width / dims.height;
        manifest.push({
          id: `${entry.month.toLowerCase()}-${entry.year}-${idx}`,
          filename,
          title: entry.title,
          month: entry.month,
          year: entry.year,
          aspectRatio: Math.round(aspectRatio * 1000) / 1000,
          ...(entry.note ? { note: entry.note } : {}),
        });
      } catch (err) {
        console.error(`  Failed: ${filename} - ${err.message}`);
      }
    }));
    process.stdout.write(`  Downloaded ${Math.min(i + BATCH, entries.length)}/${entries.length}\n`);
  }

  // 4. Sort by year, then month order, then title
  manifest.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    const mA = MONTH_ORDER.indexOf(a.month);
    const mB = MONTH_ORDER.indexOf(b.month);
    if (mA !== mB) return mA - mB;
    return a.title.localeCompare(b.title);
  });

  // 5. Optional local manifest (the site loads live from Notion via /api/film-photos)
  fs.writeFileSync(MANIFEST_JSON, JSON.stringify(manifest, null, 2));
  console.log(`\nWrote ${manifest.length} JPEGs under public/film/ and manifest ${MANIFEST_JSON}`);
  console.log('The film page uses Notion at runtime; set NOTION_TOKEN + NOTION_FILM_DATABASE_ID in .env.local.');
  console.log('Done!');
}

main().catch(console.error);
