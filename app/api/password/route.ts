import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import {
  createAttemptLimiter,
  createUnlockToken,
  normalizeProjectId,
} from "@/lib/protected-project-access";

export const runtime = "nodejs";

const UNLOCK_TTL_SECONDS = 60 * 60 * 4;
const limiter = createAttemptLimiter({
  maxAttempts: 8,
  windowMs: 5 * 60 * 1000,
});

function getPasswordEnvKey(project: string) {
  return `PASSWORD_${project.toUpperCase().replace(/-/g, "_")}`;
}

function getUnlockCookieName(project: string) {
  return `project_unlock_${project}`;
}

function getSessionSecret() {
  if (process.env.PASSWORD_SESSION_SECRET) return process.env.PASSWORD_SESSION_SECRET;
  if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;
  if (process.env.NODE_ENV !== "production") return "dev-password-session-secret";
  return null;
}

function getClientIdentity(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function matchesPassword(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const password = typeof body?.password === "string" ? body.password : null;
  const project = normalizeProjectId(body?.project);

  if (!password || !project) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const envKey = getPasswordEnvKey(project);
  const expected = process.env[envKey];

  if (!expected) {
    return NextResponse.json({ success: false });
  }

  const identity = getClientIdentity(req);
  if (!matchesPassword(password, expected)) {
    const attempt = limiter.recordFailure(identity, project);
    return NextResponse.json(
      { success: false },
      attempt.allowed
        ? undefined
        : {
            status: 429,
            headers: {
              "Retry-After": String(Math.ceil(attempt.retryAfterMs / 1000)),
            },
          },
    );
  }

  const sessionSecret = getSessionSecret();
  if (!sessionSecret) {
    return NextResponse.json(
      { success: false, error: "Password sessions are not configured" },
      { status: 500 },
    );
  }

  limiter.reset(identity, project);

  const response = NextResponse.json({ success: true });
  response.cookies.set(
    getUnlockCookieName(project),
    createUnlockToken(project, sessionSecret, UNLOCK_TTL_SECONDS * 1000),
    {
      httpOnly: true,
      maxAge: UNLOCK_TTL_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  );

  return response;
}
