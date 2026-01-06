// scripts/download-assets.js
// Download assets from a URL list file
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const urlsPath = process.argv[2];
if (!urlsPath) {
  console.error("Usage: node scripts/download-assets.js path/to/asset-urls.txt");
  process.exit(1);
}

const outputDir = path.join(path.dirname(urlsPath), "downloads");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const urls = fs.readFileSync(urlsPath, "utf8").split("\n").filter(Boolean);
console.log(`Downloading ${urls.length} assets to ${outputDir}\n`);

let downloaded = 0;
let failed = 0;

for (const url of urls) {
  try {
    // Extract filename from URL
    const urlObj = new URL(url);
    let filename = path.basename(urlObj.pathname);
    
    // Handle Squarespace URLs - get the readable name
    if (url.includes("squarespace-cdn.com")) {
      const parts = urlObj.pathname.split("/");
      // Last part is the filename with encoding
      filename = decodeURIComponent(parts[parts.length - 1]);
    }
    
    // Clean up filename - replace + with space, remove query params influence
    filename = filename.replace(/\+/g, " ").replace(/\s+/g, "_");
    
    // Add extension for thumbnails
    if (filename === "thumbnail") {
      const id = urlObj.pathname.split("/").slice(-2, -1)[0];
      filename = `thumbnail_${id.slice(0, 8)}.jpg`;
    }
    
    // Ensure we have an extension
    if (!path.extname(filename)) {
      filename += ".jpg"; // default to jpg for extensionless files
    }
    
    const outputPath = path.join(outputDir, filename);
    
    console.log(`Downloading: ${filename}`);
    execSync(`curl -sL -o "${outputPath}" "${url}"`, { stdio: "pipe" });
    downloaded++;
  } catch (err) {
    console.error(`  Failed: ${url}`);
    failed++;
  }
}

console.log(`\n✓ Downloaded: ${downloaded}`);
if (failed > 0) console.log(`✗ Failed: ${failed}`);
console.log(`\nFiles saved to: ${outputDir}`);
