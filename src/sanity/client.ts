import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export const client = createClient({
  projectId: "am3v0x1c",
  dataset: "production",
  apiVersion: "2026-01-06",
  useCdn: true, // Enable CDN caching for better performance
});

// Write client for mutations (book suggestions)
const writeToken = import.meta.env.VITE_SANITY_WRITE_TOKEN;
if (!writeToken) {
  console.warn('VITE_SANITY_WRITE_TOKEN is not set - book suggestions will fail');
}

export const writeClient = createClient({
  projectId: "am3v0x1c",
  dataset: "production",
  apiVersion: "2026-01-06",
  useCdn: false,
  token: writeToken,
});

const builder = imageUrlBuilder(client);

// Base urlFor for building custom image URLs
export function urlFor(source: any) {
  // Apply auto-format and quality by default for bandwidth optimization
  return builder.image(source).auto('format').quality(75);
}



