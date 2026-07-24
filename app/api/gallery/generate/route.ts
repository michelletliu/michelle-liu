import { NextRequest, NextResponse } from "next/server";
import {
  GALLERY_PAINTINGS,
  type GalleryPainting,
} from "@/components/gallery/galleryPaintings";
import {
  artworkEligibility,
  composeInspiredPrompt,
  type MetArtwork,
} from "@/components/gallery/metArtworks";
import { MetApiError, fetchMetObject } from "@/lib/met/metClient";

export const runtime = "nodejs";
export const maxDuration = 120;

type GenerateBody = {
  prompt?: string;
  paintingId?: string;
  /**
   * Optional Met object to take style cues from. Only the id is accepted —
   * the record itself is re-fetched here so a client cannot assert its own
   * eligibility or inject prompt text through the metadata fields.
   */
  inspirationObjectID?: number;
};

function aspectForPainting(painting: GalleryPainting): "2:3" | "3:2" {
  return painting.aspect === "portrait" ? "2:3" : "3:2";
}

export async function POST(req: NextRequest) {
  const token = process.env.REVE_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "REVE_API_TOKEN is not configured" },
      { status: 500 },
    );
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = body.prompt?.trim() ?? "";
  const paintingId = body.paintingId?.trim() ?? "";
  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }
  if (prompt.length > 2000) {
    return NextResponse.json({ error: "Prompt is too long" }, { status: 400 });
  }

  const painting = GALLERY_PAINTINGS.find((p) => p.id === paintingId);
  if (!painting) {
    return NextResponse.json({ error: "Unknown painting" }, { status: 400 });
  }

  const inspirationId = body.inspirationObjectID;
  let inspiration: MetArtwork | null = null;
  if (inspirationId !== undefined) {
    if (typeof inspirationId !== "number" || !Number.isInteger(inspirationId)) {
      return NextResponse.json(
        { error: "inspirationObjectID must be an integer" },
        { status: 400 },
      );
    }

    try {
      inspiration = await fetchMetObject(inspirationId);
    } catch (err) {
      const status = err instanceof MetApiError ? err.status : 502;
      return NextResponse.json(
        { error: "Could not verify the artwork with The Met" },
        { status },
      );
    }

    if (!inspiration) {
      return NextResponse.json(
        { error: "That artwork is not in The Met's Open Access collection" },
        { status: 404 },
      );
    }

    // Eligibility is re-derived from the freshly fetched record on every call;
    // the client's view of public-domain status is never trusted.
    const eligibility = artworkEligibility(inspiration);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: eligibility.message, reason: eligibility.reason },
        { status: 403 },
      );
    }
  }

  const composed = composeInspiredPrompt(prompt, inspiration);
  const aspect_ratio = aspectForPainting(painting);
  let reveRes: Response;
  try {
    reveRes = await fetch("https://api.reve.com/v1/image/create/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: composed.prompt,
        aspect_ratio,
        version: "latest",
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach Reve API" },
      { status: 502 },
    );
  }

  const raw = await reveRes.text();
  if (!reveRes.ok) {
    let message = `Reve error (${reveRes.status})`;
    try {
      const err = JSON.parse(raw) as { message?: string; error?: string };
      message = err.message || err.error || message;
    } catch {
      /* keep default */
    }
    return NextResponse.json(
      { error: message },
      { status: reveRes.status === 401 ? 502 : reveRes.status },
    );
  }

  try {
    const data = JSON.parse(raw) as {
      image?: string;
      content_violation?: boolean;
    };
    if (data.content_violation) {
      return NextResponse.json(
        { error: "Prompt was blocked by content policy" },
        { status: 400 },
      );
    }
    if (!data.image) {
      return NextResponse.json(
        { error: "Reve returned no image" },
        { status: 502 },
      );
    }
    return NextResponse.json({
      imageUrl: `data:image/png;base64,${data.image}`,
      paintingId: painting.id,
      inspiredByObjectID: composed.inspiredByObjectID,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid Reve response" },
      { status: 502 },
    );
  }
}
