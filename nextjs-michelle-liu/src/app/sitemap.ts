import { MetadataRoute } from "next";
import { client } from "@/sanity/client";
import { PROJECTS_QUERY } from "@/sanity/queries";
import type { Project } from "@/sanity/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://michelleliu.design";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch all published projects
  const projects = await client.fetch<Project[]>(PROJECTS_QUERY);

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  // Dynamic project pages
  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${siteUrl}/projects/${project.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...projectPages];
}

