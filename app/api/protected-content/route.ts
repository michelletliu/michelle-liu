import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import {
  verifyUnlockToken,
  unlockCookieName,
} from "../../../src/lib/unlock-token";

const sanity = createClient({
  projectId: "am3v0x1c",
  dataset: "production",
  apiVersion: "2026-01-06",
  useCdn: true,
});

const ALLOWED_PROJECTS = new Set(["nasa", "adobe", "roblox", "apple"]);

// GROQ: fetch only visibility=="unlocked" sections for a given project.
const PROTECTED_CONTENT_QUERY = `
  *[_type == "project" && company == $company][0] {
    "protectedContent": content[visibility == "unlocked"] {
      _key,
      _type,
      ...
    }
  }
`;

export async function GET(req: NextRequest) {
  const project = req.nextUrl.searchParams.get("project");
  if (!project || !ALLOWED_PROJECTS.has(project.toLowerCase())) {
    return NextResponse.json({ error: "Invalid project" }, { status: 400 });
  }

  const normalizedProject = project.toLowerCase();

  // Verify signed unlock cookie
  const cookieValue = req.cookies.get(
    unlockCookieName(normalizedProject),
  )?.value;
  if (!cookieValue || !verifyUnlockToken(normalizedProject, cookieValue)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sanity.fetch(PROTECTED_CONTENT_QUERY, {
      company: normalizedProject,
    });
    return NextResponse.json({
      protectedContent: result?.protectedContent ?? [],
    });
  } catch (err) {
    console.error("[protected-content] Sanity fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 },
    );
  }
}
