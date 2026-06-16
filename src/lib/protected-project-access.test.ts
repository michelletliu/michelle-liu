import assert from "node:assert/strict";
import test from "node:test";

import {
  createAttemptLimiter,
  createUnlockToken,
  filterProjectForPublicAccess,
  normalizeProjectId,
  verifyUnlockToken,
} from "./protected-project-access.ts";

test("filters unlocked-only project content from public payloads", () => {
  const project = {
    title: "Adobe",
    content: [
      { _key: "both", _type: "textSection", visibility: "both", body: "public" },
      { _key: "locked", _type: "textSection", visibility: "locked", body: "locked teaser" },
      { _key: "default", _type: "textSection", body: "default public" },
      { _key: "secret", _type: "textSection", visibility: "unlocked", body: "secret" },
      {
        _key: "gate",
        _type: "protectedSection",
        visibility: "locked",
        password: "do-not-ship",
        showPasswordProtection: true,
      },
    ],
  };

  const filtered = filterProjectForPublicAccess(project);

  assert.deepEqual(
    filtered.content.map((section: { _key: string }) => section._key),
    ["both", "locked", "default", "gate"],
  );
  assert.equal(filtered.content.some((section: { body?: string }) => section.body === "secret"), false);
  assert.equal((filtered.content[3] as { password?: string }).password, undefined);
});

test("signed unlock tokens are project scoped and expire", () => {
  const now = 1_000_000;
  const token = createUnlockToken("adobe", "test-secret", 60_000, now);

  assert.equal(verifyUnlockToken(token, "adobe", "test-secret", now + 30_000), true);
  assert.equal(verifyUnlockToken(token, "roblox", "test-secret", now + 30_000), false);
  assert.equal(verifyUnlockToken(token, "adobe", "wrong-secret", now + 30_000), false);
  assert.equal(verifyUnlockToken(token, "adobe", "test-secret", now + 60_001), false);
  assert.equal(verifyUnlockToken(`${token}tampered`, "adobe", "test-secret", now + 30_000), false);
});

test("attempt limiter blocks repeated failed attempts per project and identity", () => {
  const limiter = createAttemptLimiter({ maxAttempts: 3, windowMs: 60_000 });
  const now = 2_000_000;

  assert.equal(limiter.recordFailure("203.0.113.1", "adobe", now).allowed, true);
  assert.equal(limiter.recordFailure("203.0.113.1", "adobe", now + 1).allowed, true);
  assert.equal(limiter.recordFailure("203.0.113.1", "adobe", now + 2).allowed, true);
  assert.equal(limiter.recordFailure("203.0.113.1", "adobe", now + 3).allowed, false);

  assert.equal(limiter.recordFailure("203.0.113.1", "roblox", now + 4).allowed, true);
  assert.equal(limiter.recordFailure("203.0.113.1", "adobe", now + 60_001).allowed, true);
});

test("normalizes project ids before deriving secrets or cookies", () => {
  assert.equal(normalizeProjectId("Adobe"), "adobe");
  assert.equal(normalizeProjectId("roblox-2026"), "roblox-2026");
  assert.equal(normalizeProjectId("../adobe"), null);
  assert.equal(normalizeProjectId("PASSWORD_ADOBE"), null);
});
