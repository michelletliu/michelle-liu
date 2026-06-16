import { createClient } from "@sanity/client";
import { NextRequest, NextResponse } from "next/server";

import {
  filterProjectForPublicAccess,
  normalizeProjectId,
  verifyUnlockToken,
} from "@/lib/protected-project-access";
import { PROJECT_BY_COMPANY_QUERY } from "@/sanity/queries";
import type { Project } from "@/sanity/types";

export const runtime = "nodejs";

function getUnlockCookieName(project: string) {
  return `project_unlock_${project}`;
}

function getSessionSecret() {
  if (process.env.PASSWORD_SESSION_SECRET) return process.env.PASSWORD_SESSION_SECRET;
  if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;
  if (process.env.NODE_ENV !== "production") return "dev-password-session-secret";
  return null;
}

const sanityClient = createClient({
  projectId: "am3v0x1c",
  dataset: "production",
  apiVersion: "2026-01-06",
  useCdn: !process.env.SANITY_READ_TOKEN,
  token: process.env.SANITY_READ_TOKEN,
});

function hasProjectAccess(req: NextRequest, project: string) {
  const sessionSecret = getSessionSecret();
  if (!sessionSecret) return false;

  const token = req.cookies.get(getUnlockCookieName(project))?.value;
  return verifyUnlockToken(token, project, sessionSecret);
}

export async function GET(req: NextRequest) {
  const company = normalizeProjectId(req.nextUrl.searchParams.get("company"));
  if (!company) {
    return NextResponse.json({ error: "Missing project" }, { status: 400 });
  }

  const project = await sanityClient.fetch<Project | null>(PROJECT_BY_COMPANY_QUERY, {
    company,
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const unlocked = hasProjectAccess(req, company);
  const responseProject = unlocked ? project : filterProjectForPublicAccess(project);

  return NextResponse.json(responseProject, {
    headers: {
      "Cache-Control": "private, no-store",
      "X-Project-Unlocked": unlocked ? "true" : "false",
    },
  });
}
