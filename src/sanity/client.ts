import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export const client = createClient({
  projectId: "am3v0x1c",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: true, // Using CDN for faster image delivery
});

const builder = imageUrlBuilder(client);

export function urlFor(source: any) {
  return builder.image(source);
}



