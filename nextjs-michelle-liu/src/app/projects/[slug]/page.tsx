import Link from "next/link";
import type { Metadata } from "next";
import { client } from "@/sanity/client";
import { PROJECT_QUERY, ALL_PROJECTS_QUERY } from "@/sanity/queries";
import { urlFor } from "@/sanity/image";
import type { Project, ContentSection } from "@/sanity/types";
import { PortableText } from "@portabletext/react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all projects
export async function generateStaticParams() {
  const projects = await client.fetch<Project[]>(ALL_PROJECTS_QUERY);
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

// Generate dynamic metadata for each project
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await client.fetch<Project>(PROJECT_QUERY, { slug });

  if (!project) {
    return {
      title: "Project Not Found",
      description: "The requested project could not be found.",
    };
  }

  const companyName = project.company
    ? project.company.charAt(0).toUpperCase() + project.company.slice(1)
    : "";
  
  const title = `${project.title}${companyName ? ` at ${companyName}` : ""}`;
  const description =
    project.shortDescription ||
    `${project.title} - A product design case study by Michelle Liu.`;

  const ogImage = project.heroImage
    ? urlFor(project.heroImage).width(1200).height(630).url()
    : "/og-image.png";

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Michelle Liu`,
      description,
      type: "article",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Michelle Liu`,
      description,
      images: [ogImage],
    },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await client.fetch<Project>(PROJECT_QUERY, { slug });

  if (!project) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Project not found</h1>
          <Link href="/" className="mt-4 text-blue-600 underline">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b px-8 py-4">
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          ← Back to projects
        </Link>
      </div>

      {/* Hero Section */}
      <div className="mx-auto max-w-5xl px-8 py-16">
        {/* Logo */}
        {project.logo && (
          <img
            src={urlFor(project.logo).width(80).height(80).url()}
            alt=""
            className="mb-8 h-20 w-20 rounded-2xl object-cover"
          />
        )}

        {/* Title */}
        <h1 className="mb-8 text-4xl font-normal text-gray-900">
          {project.title}
        </h1>

        {/* Metadata */}
        {project.metadata && project.metadata.length > 0 && (
          <div className="mb-8 grid grid-cols-2 gap-6 md:grid-cols-5">
            {project.metadata.map((item) => (
              <div key={item._key}>
                <p className="text-sm font-semibold text-gray-400">
                  {item.label}
                </p>
                <p className="mt-1 text-gray-900">
                  {item.value.map((v, i) => (
                    <span key={i}>
                      {v}
                      {i < item.value.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Separator */}
        <div className="mb-8 h-px bg-gray-200" />

        {/* Hero Image */}
        {project.heroImage && (
          <div className="mb-16 overflow-hidden rounded-3xl">
            <img
              src={urlFor(project.heroImage).width(1200).url()}
              alt=""
              className="w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Content Sections */}
      <div className="mx-auto max-w-5xl px-8 pb-16">
        {project.content?.map((section) => (
          <ContentBlock key={section._key} section={section} />
        ))}
      </div>

      {/* Related Projects */}
      {project.relatedProjects && project.relatedProjects.length > 0 && (
        <div className="mx-auto max-w-5xl px-8 py-16">
          <h2 className="mb-8 text-xl text-gray-500">Also check out...</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {project.relatedProjects.map((related) => (
              <Link
                key={related._id}
                href={`/projects/${related.slug}`}
                className="group block overflow-hidden rounded-2xl transition-transform hover:scale-[0.99]"
              >
                {related.heroImage && (
                  <div className="aspect-video overflow-hidden rounded-2xl">
                    <img
                      src={urlFor(related.heroImage).width(700).height(380).url()}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="mt-3 px-3">
                  <p className="font-medium text-gray-900">
                    {related.title}{" "}
                    <span className="text-gray-400">• {related.year}</span>
                  </p>
                  <p className="text-gray-400">{related.shortDescription}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

// Content section renderer
function ContentBlock({ section }: { section: ContentSection }) {
  switch (section._type) {
    case "missionSection":
      return (
        <div className="mb-16 grid gap-8 md:grid-cols-[2fr_1fr_2fr]">
          <div>
            <p className="mb-4 text-gray-400">{section.sectionLabel || "The Mission"}</p>
            <p className="text-2xl leading-relaxed text-gray-900">
              {section.missionTitle}
            </p>
          </div>
          <div />
          <div className="prose text-gray-600">
            {section.missionDescription && (
              <PortableText value={section.missionDescription} />
            )}
          </div>
        </div>
      );

    case "protectedSection":
      return (
        <div className="mb-16 rounded-3xl bg-gray-50 p-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="mt-8 opacity-60">
            <h3 className="text-2xl text-gray-900">{section.title || "Confidential"}</h3>
            <p className="mt-2 text-lg text-gray-500">
              {section.message || "Interested? Please email me!"}
            </p>
          </div>
        </div>
      );

    case "gallerySection":
      const cols = section.layout === "2-col" ? "md:grid-cols-2" : 
                   section.layout === "3-col" ? "md:grid-cols-3" : "md:grid-cols-4";
      return (
        <div className={`mb-16 grid gap-8 ${cols}`}>
          {section.images?.map((image) => (
            <div key={image._key} className="aspect-[2/3] overflow-hidden rounded-3xl shadow-sm">
              <img
                src={urlFor(image as any).width(400).height(600).url()}
                alt={image.alt || ""}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      );

    case "textSection":
      return (
        <div className="mb-16">
          {section.label && <p className="mb-4 text-gray-400">{section.label}</p>}
          {section.heading && <h2 className="mb-4 text-2xl text-gray-900">{section.heading}</h2>}
          {section.body && (
            <div className="prose max-w-none text-gray-600">
              <PortableText value={section.body} />
            </div>
          )}
        </div>
      );

    case "imageSection":
      return (
        <div className="mb-16">
          <div className={`overflow-hidden ${section.rounded !== false ? "rounded-3xl" : ""}`}>
            <img
              src={urlFor(section.image).width(1200).url()}
              alt={section.alt || ""}
              className="w-full object-cover"
            />
          </div>
          {section.caption && (
            <p className="mt-3 text-center text-gray-500">{section.caption}</p>
          )}
        </div>
      );

    case "testimonialSection":
      return (
        <div className="mb-16 rounded-3xl bg-gray-50 p-12">
          <blockquote className="text-2xl italic text-gray-900">
            "{section.quote}"
          </blockquote>
          <div className="mt-6 flex items-center gap-4">
            {section.authorImage && (
              <img
                src={urlFor(section.authorImage).width(48).height(48).url()}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-medium text-gray-900">{section.authorName}</p>
              <p className="text-gray-500">
                {section.authorTitle}
                {section.authorCompany && `, ${section.authorCompany}`}
              </p>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}


