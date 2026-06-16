import { createHmac, timingSafeEqual } from "node:crypto";

type ContentSection = {
  _type?: string;
  visibility?: "both" | "locked" | "unlocked" | string;
  password?: unknown;
  [key: string]: unknown;
};

type ProjectWithContent = {
  content?: unknown[];
};

type AttemptLimiterOptions = {
  maxAttempts: number;
  windowMs: number;
};

const TOKEN_VERSION = "v1";

export function normalizeProjectId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(normalized) ? normalized : null;
}

function isPublicBeforeUnlock(section: ContentSection): boolean {
  if (section._type === "protectedSection") return true;
  return !section.visibility || section.visibility === "both" || section.visibility === "locked";
}

function stripProtectedSectionPassword(section: ContentSection): ContentSection {
  if (section._type !== "protectedSection") return section;
  const { password: _password, ...safeSection } = section;
  return safeSection;
}

export function filterProjectForPublicAccess<T extends ProjectWithContent>(project: T): T {
  const content = Array.isArray(project.content)
    ? project.content
        .filter((section): section is ContentSection => {
          return (
            typeof section === "object" &&
            section !== null &&
            isPublicBeforeUnlock(section as ContentSection)
          );
        })
        .map(stripProtectedSectionPassword)
    : project.content;

  return {
    ...project,
    content,
  };
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createUnlockToken(
  project: string,
  secret: string,
  ttlMs: number,
  now = Date.now(),
): string {
  const payload = Buffer.from(
    JSON.stringify({
      v: TOKEN_VERSION,
      project,
      exp: now + ttlMs,
    }),
  ).toString("base64url");
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

export function verifyUnlockToken(
  token: string | undefined,
  project: string,
  secret: string,
  now = Date.now(),
): boolean {
  if (!token) return false;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;

  const expectedSignature = sign(payload, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      v?: string;
      project?: string;
      exp?: number;
    };

    return (
      decoded.v === TOKEN_VERSION &&
      decoded.project === project &&
      typeof decoded.exp === "number" &&
      decoded.exp > now
    );
  } catch {
    return false;
  }
}

export function createAttemptLimiter({ maxAttempts, windowMs }: AttemptLimiterOptions) {
  const attempts = new Map<string, number[]>();

  function keyFor(identity: string, project: string) {
    return `${identity}:${project}`;
  }

  return {
    recordFailure(identity: string, project: string, now = Date.now()) {
      const key = keyFor(identity, project);
      const recent = (attempts.get(key) || []).filter((timestamp) => timestamp > now - windowMs);
      recent.push(now);
      attempts.set(key, recent);

      return {
        allowed: recent.length <= maxAttempts,
        retryAfterMs: recent.length > maxAttempts ? Math.max(0, recent[0] + windowMs - now) : 0,
      };
    },
    reset(identity: string, project: string) {
      attempts.delete(keyFor(identity, project));
    },
  };
}
