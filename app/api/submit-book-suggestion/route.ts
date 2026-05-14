import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";

const token = process.env.SANITY_WRITE_TOKEN;

function getSanityClient() {
  if (!token) return null;
  return createClient({
    projectId: "am3v0x1c",
    dataset: "production",
    apiVersion: "2026-01-06",
    useCdn: false,
    token,
  });
}

const submissions = new Map<string, { count: number; resetAt: number }>();
const MAX_SUBMISSIONS = 5;
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = submissions.get(ip);
  if (!entry || now > entry.resetAt) {
    submissions.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_SUBMISSIONS;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many submissions, please try again later" },
      { status: 429 },
    );
  }

  const client = getSanityClient();
  if (!client) {
    console.error(
      "[submit-book-suggestion] SANITY_WRITE_TOKEN is not configured",
    );
    return NextResponse.json(
      { error: "Book suggestions are not configured" },
      { status: 503 },
    );
  }

  try {
    const { bookTitle, senderNote } = await req.json();

    if (!bookTitle || typeof bookTitle !== "string" || !bookTitle.trim()) {
      return NextResponse.json(
        { error: "Missing book title" },
        { status: 400 },
      );
    }

    await client.create({
      _type: "bookSuggestion",
      bookTitle: bookTitle.trim(),
      submittedAt: new Date().toISOString(),
      status: "new",
      ...(typeof senderNote === "string" && senderNote.trim()
        ? { senderNote: senderNote.trim() }
        : {}),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Book suggestion error:", error);
    return NextResponse.json(
      { error: "Failed to submit book suggestion" },
      { status: 500 },
    );
  }
}
