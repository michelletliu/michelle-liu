import Link from "next/link";
import type { Metadata } from "next";
import { client } from "@/sanity/client";
import { ALL_PROJECTS_QUERY } from "@/sanity/queries";
import { urlFor } from "@/sanity/image";
import type { Project } from "@/sanity/types";

export const metadata: Metadata = {
  title: "work",
  description:
    "Explore my product design work at Apple, Roblox, and NASA. Case studies showcasing user-centered design solutions that spark delight.",
  openGraph: {
    title: "work | michelle liu",
    description:
      "Explore my product design work at Apple, Roblox, and NASA. Case studies showcasing user-centered design solutions that spark delight.",
  },
  twitter: {
    title: "work | michelle liu",
    description:
      "Explore my product design work at Apple, Roblox, and NASA. Case studies showcasing user-centered design solutions that spark delight.",
  },
};

export default async function Home() {
  const projects = await client.fetch<Project[]>(ALL_PROJECTS_QUERY);

  return (
    <main className="min-h-screen bg-white px-8 py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Projects</h1>
        <p className="mb-12 text-lg text-gray-600">
          Content from Sanity ({projects.length} projects)
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project._id}
              href={`/projects/${project.slug}`}
              className="group block overflow-hidden rounded-2xl border border-gray-200 transition-shadow hover:shadow-lg"
            >
              {/* Hero Image */}
              {project.heroImage && (
                <div className="aspect-video overflow-hidden bg-gray-100">
                  <img
                    src={urlFor(project.heroImage).width(800).height(450).url()}
                    alt={project.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <div className="mb-2 flex items-center gap-3">
                  {/* Logo */}
                  {project.logo && (
                    <img
                      src={urlFor(project.logo).width(40).height(40).url()}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {project.title}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {project.company &&
                        project.company.charAt(0).toUpperCase() +
                          project.company.slice(1)}{" "}
                      {project.year && `• ${project.year}`}
                    </p>
                  </div>
                </div>

                {project.shortDescription && (
                  <p className="mt-3 text-gray-600">{project.shortDescription}</p>
                )}

                {/* Status badge */}
                <div className="mt-4">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      project.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {project.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="rounded-xl bg-gray-50 p-12 text-center">
            <p className="text-gray-500">
              No projects found. Create some in your{" "}
              <a
                href="http://localhost:3333"
                className="text-blue-600 underline"
                target="_blank"
              >
                Sanity Studio
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
