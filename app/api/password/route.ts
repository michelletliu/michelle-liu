import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against self to keep constant time regardless of length mismatch
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  const password = req.headers.get("x-password");
  const body = await req.json().catch(() => ({}));
  const project = body?.project as string | undefined;

  if (!password || !project) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const envKey = `PASSWORD_${project.toUpperCase()}`;
  const expected = process.env[envKey];

  if (!expected) {
    return NextResponse.json({ success: false });
  }

  return NextResponse.json({ success: safeEqual(password, expected) });
}
