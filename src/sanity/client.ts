import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export const client = createClient({
  projectId: "am3v0x1c",
  dataset: "production",
  apiVersion: "2026-01-06",
  useCdn: true, // Enable CDN caching for better performance
});


const builder = imageUrlBuilder(client);

// Base urlFor for building custom image URLs
export function urlFor(source: any) {
  // Apply auto-format and quality by default for bandwidth optimization
  return builder.image(source).auto('format').quality(75);
}



