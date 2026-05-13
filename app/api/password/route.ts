import { NextRequest, NextResponse } from "next/server";
import {
  safeEqual,
  signUnlockToken,
  unlockCookieName,
} from "../../../src/lib/unlock-token";

// ---------------------------------------------------------------------------
// Project allowlist — only these project IDs may be used with this endpoint.
// Add new entries here when a new password-protected project is created.
// ---------------------------------------------------------------------------
const ALLOWED_PROJECTS = new Set(["nasa", "adobe", "roblox", "apple"]);

// ---------------------------------------------------------------------------
// In-memory rate limiter (per serverless instance).
// Not a substitute for a proper distributed rate limiter (e.g. Upstash Redis)
// but provides baseline brute-force protection on Vercel's per-instance model.
// ---------------------------------------------------------------------------
const MAX_ATTEMPTS = 8; // per window per IP
const WINDOW_MS = 60_000; // 1 minute
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now >= entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // --- rate limit ---
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  // --- parse & validate body ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
  const { password, project } = body as Record<string, unknown>;

  if (
    typeof password !== "string" ||
    typeof project !== "string" ||
    password.length === 0 ||
    password.length > 256 ||
    project.length === 0
  ) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  // --- allowlist check ---
  const normalizedProject = project.toLowerCase();
  if (!ALLOWED_PROJECTS.has(normalizedProject)) {
    return NextResponse.json({ success: false });
  }

  // --- env lookup ---
  const envKey = `PASSWORD_${normalizedProject.toUpperCase()}`;
  const expected = process.env[envKey];
  if (!expected) {
    return NextResponse.json({ success: false });
  }

  // --- constant-time compare ---
  if (!safeEqual(password, expected)) {
    return NextResponse.json({ success: false });
  }

  // --- success: set signed cookie ---
  const token = signUnlockToken(normalizedProject);
  const res = NextResponse.json({ success: true });

  if (token) {
    res.cookies.set(unlockCookieName(normalizedProject), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 86400, // 24 hours
    });
  }

  return res;
}
