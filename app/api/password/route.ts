import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

const PROJECT_NAME_RE = /^[a-zA-Z0-9_-]{1,64}$/;

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: "Too many attempts" },
      { status: 429 },
    );
  }

  const password = req.headers.get("x-password");
  const body = await req.json().catch(() => ({}));
  const project = body?.project as string | undefined;

  if (!password || !project) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  if (!PROJECT_NAME_RE.test(project)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const envKey = `PASSWORD_${project.toUpperCase()}`;
  const expected = process.env[envKey];

  if (!expected) {
    return NextResponse.json({ success: false });
  }

  return NextResponse.json({ success: safeEqual(password, expected) });
}
