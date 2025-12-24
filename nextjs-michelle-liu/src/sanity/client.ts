import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "am3v0x1c",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
});

