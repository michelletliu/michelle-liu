// scripts/har-to-urls.js
// Extract asset URLs from a HAR file for downloading
import fs from "fs";
import path from "path";

const harPath = process.argv[2];
if (!harPath) {
  console.error("Usage: node scripts/har-to-urls.js path/to/file.har");
  process.exit(1);
}

const har = JSON.parse(fs.readFileSync(harPath, "utf8"));
const urls = har.log.entries
  .map(e => e.request.url)
  .filter(u =>
    /\.(png|jpe?g|webp|gif|svg|mp4|mov|woff2?|ttf|otf|css)$/i.test(u) ||
    u.includes("squarespace-cdn.com") ||
    u.includes("static1.squarespace.com")
  );

const uniq = [...new Set(urls)];

// Output file next to the HAR file
const outputPath = path.join(path.dirname(harPath), "asset-urls.txt");
fs.writeFileSync(outputPath, uniq.join("\n"));
console.log(`Wrote ${uniq.length} URLs to ${outputPath}`);
