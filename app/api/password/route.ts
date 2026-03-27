import { NextRequest, NextResponse } from "next/server";

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

  return NextResponse.json({ success: password === expected });
}
