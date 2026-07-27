import {
  isGenerationEligible,
  openAccessImageUrl,
} from "@/components/gallery/metArtworks";
import { MetApiError, fetchMetObject } from "@/lib/met/metClient";

export const runtime = "nodejs";

/** The only host this will proxy. The URL comes from The Met's own API, and
 * pinning the host anyway keeps a surprise in that response from turning this
 * route into a way to fetch arbitrary URLs from the server. */
const MET_IMAGE_HOST = "images.metmuseum.org";

const FETCH_TIMEOUT_MS = 8000;

/**
 * An artwork's Open Access image, served from our own origin.
 *
 * A proxy rather than a redirect, and that is the whole point of the route.
 * The shimmer palette is sampled by drawing this image to a canvas and reading
 * the pixels back, and a canvas painted with a cross-origin image is tainted:
 * `getImageData` throws. The usual answer is `crossOrigin="anonymous"`, which
 * needs the image host to send `access-control-allow-origin` — and The Met's
 * image CDN does not. It was checked against ten Open Access works spanning
 * four departments and none of them sent the header, though its *404 pages*
 * do, which is a good way to convince yourself the opposite.
 *
 * Served from here the image is same-origin, so the read is simply allowed. It
 * costs a second download of a picture the picker has already shown, since a
 * different URL is a different cache entry; roughly 130KB, once per artwork
 * per browser, against a day of caching.
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("objectID");
  const objectID = Number(raw);
  if (!raw || !Number.isInteger(objectID) || objectID <= 0) {
    return Response.json(
      { error: "objectID must be a positive integer" },
      { status: 400 },
    );
  }

  let imageUrl: string | null = null;
  try {
    const artwork = await fetchMetObject(objectID);
    // Gated on eligibility, not just on having an image: this route re-serves
    // Met bytes from our origin, and only Open Access works may be handled
    // that way.
    imageUrl = artwork && isGenerationEligible(artwork)
      ? openAccessImageUrl(artwork)
      : null;
  } catch (err) {
    const status = err instanceof MetApiError ? err.status : 502;
    return Response.json({ error: "Could not reach The Met" }, { status });
  }

  if (!imageUrl || new URL(imageUrl).hostname !== MET_IMAGE_HOST) {
    return Response.json({ error: "No Open Access image" }, { status: 404 });
  }

  try {
    const upstream = await fetch(imageUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!upstream.ok || !upstream.body) {
      return Response.json({ error: "Image unavailable" }, { status: 502 });
    }
    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
        // A content-addressed path for an immutable museum record.
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      },
    });
  } catch {
    return Response.json({ error: "Image unavailable" }, { status: 504 });
  }
}
