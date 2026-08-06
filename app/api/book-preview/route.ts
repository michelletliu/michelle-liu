import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";

type BookPreviewDoc = {
  title?: string;
  author?: string;
  year?: string;
  coverAssetUrl?: string;
  externalCoverUrl?: string;
};

const client = createClient({
  projectId: "am3v0x1c",
  dataset: "production",
  apiVersion: "2026-01-06",
  useCdn: true,
});

const BOOK_PREVIEW_QUERY = `
  *[_type == "shelfItem" && isPublished == true && mediaType == "book"]{
    title,
    author,
    year,
    "coverAssetUrl": cover.asset->url,
    externalCoverUrl
  }
`;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderPreviewHtml({
  title,
  description,
  canonicalUrl,
  imageUrl,
  redirectUrl,
}: {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  redirectUrl: string;
}) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const u = escapeHtml(canonicalUrl);
  const i = escapeHtml(imageUrl);
  const r = escapeHtml(redirectUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${u}" />
    <meta property="og:image" content="${i}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${i}" />
    <script>
      if (typeof window !== "undefined") {
        window.location.replace("${r}");
      }
    </script>
  </head>
  <body>
    <p><a href="${r}">${t}</a></p>
  </body>
</html>`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const slug = searchParams.get("bookSlug") || "";
  const origin = req.nextUrl.origin;

  const pathname = req.nextUrl.pathname;
  const isProjectFullPath = pathname.startsWith("/project/library/full/");
  const fallbackPath = isProjectFullPath ? "/project/library/full" : "/library";
  const appRedirectUrl = `${fallbackPath}?book=${encodeURIComponent(slug)}`;

  try {
    const books = await client.fetch<BookPreviewDoc[]>(BOOK_PREVIEW_QUERY);
    const match = books.find((book) => slugify(book.title || "") === slug);

    if (!match?.title) {
      return NextResponse.redirect(new URL(appRedirectUrl, origin), 302);
    }

    const previewTitle = match.year
      ? `${match.title}, ${match.year}`
      : match.title;
    const description = match.author
      ? `By ${match.author} · From Michelle Liu's library`
      : `From Michelle Liu's library`;
    const imageUrl = `${origin}/og-image.jpg?v=6`;
    const canonicalUrl = `${origin}${pathname}`;

    return new NextResponse(
      renderPreviewHtml({
        title: previewTitle,
        description,
        canonicalUrl,
        imageUrl,
        redirectUrl: appRedirectUrl,
      }),
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      },
    );
  } catch (error) {
    console.error("[book-preview] Failed to build preview metadata", error);
    return NextResponse.redirect(new URL(appRedirectUrl, origin), 302);
  }
}
