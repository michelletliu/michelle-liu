import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export const client = createClient({
  projectId: "am3v0x1c",
  dataset: "production",
  apiVersion: "2026-01-06", // Updated API version to bust cache
  useCdn: false, // Disabled CDN to ensure fresh data
});

const builder = imageUrlBuilder(client);

export function urlFor(source: any) {
  return builder.image(source);
}



