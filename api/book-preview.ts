import type { VercelRequest, VercelResponse } from "@vercel/node";
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

const BOT_UA_REGEX =
  /(Twitterbot|facebookexternalhit|Facebot|Slackbot|Discordbot|LinkedInBot|WhatsApp|TelegramBot|SkypeUriPreview|Applebot|Pinterest|crawler|spider|bot)/i;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getRequestOrigin(req: VercelRequest) {
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
  return `${proto}://${host}`;
}

function getSlugFromRequest(req: VercelRequest) {
  const fromParam = req.query.bookSlug;
  if (typeof fromParam === "string") {
    return decodeURIComponent(fromParam);
  }
  if (Array.isArray(fromParam) && fromParam.length > 0) {
    return decodeURIComponent(fromParam[0]);
  }
  return "";
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
}: {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
}) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const u = escapeHtml(canonicalUrl);
  const i = escapeHtml(imageUrl);

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
  </head>
  <body>
    <p>${t}</p>
  </body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = getSlugFromRequest(req);
  const origin = getRequestOrigin(req);

  // Keep direct human navigation functional by routing into SPA query flow.
  const pathname = req.url?.split("?")[0] || "";
  const isProjectFullPath = pathname.startsWith("/project/library/full/");
  const fallbackPath = isProjectFullPath ? "/project/library/full" : "/library";
  const appRedirectUrl = `${fallbackPath}?book=${encodeURIComponent(slug)}`;

  const ua = String(req.headers["user-agent"] || "");
  const isBotRequest = BOT_UA_REGEX.test(ua);

  if (!isBotRequest) {
    res.setHeader("Cache-Control", "no-store");
    return res.redirect(307, appRedirectUrl);
  }

  try {
    const books = await client.fetch<BookPreviewDoc[]>(BOOK_PREVIEW_QUERY);
    const match = books.find((book) => slugify(book.title || "") === slug);

    if (!match?.title) {
      return res.redirect(302, appRedirectUrl);
    }

    const previewTitle = match.year
      ? `${match.title}, ${match.year}`
      : match.title;
    const description = match.author
      ? `By ${match.author} · From Michelle Liu's library`
      : `From Michelle Liu's library`;
    const imageUrl =
      match.coverAssetUrl ||
      match.externalCoverUrl ||
      `${origin}/og-image.png?v=5`;
    const canonicalUrl = `${origin}${pathname}`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    return res.status(200).send(
      renderPreviewHtml({
        title: previewTitle,
        description,
        canonicalUrl,
        imageUrl,
      }),
    );
  } catch (error) {
    console.error("[book-preview] Failed to build preview metadata", error);
    return res.redirect(302, appRedirectUrl);
  }
}
