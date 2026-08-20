import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { loginAction, logoutAction } from "@/actions/auth";
import { createSession, getCurrentUser } from "@/lib/auth/session";
import { resetDb } from "../helpers/db";
import { createTestUser } from "../helpers/auth";
import { mockCookieStore } from "../mocks/cookie-store";
import { RedirectSignal } from "../setup";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("loginAction", () => {
  beforeEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });
  afterEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });

  it("rejects a wrong password with a generic message and logs the failure", async () => {
    const user = await createTestUser({ email: "staff@asoditech.test" });

    const result = await loginAction(
      undefined,
      formData({ email: user.email, password: "wrong-password" })
    );

    expect(result).toMatchObject({ ok: false });
    expect(mockCookieStore.has("acc_session")).toBe(false);

    const audit = await prisma.auditEvent.findFirstOrThrow({ where: { action: "user.login.failure" } });
    expect(audit).toBeTruthy();
  });

  it("rejects a non-existent email with the same generic message (no account enumeration)", async () => {
    const result = await loginAction(
      undefined,
      formData({ email: "nobody@asoditech.test", password: "whatever" })
    );
    const wrongPassword = await loginAction(
      undefined,
      formData({ email: (await createTestUser()).email, password: "wrong" })
    );

    expect(result.ok).toBe(false);
    expect(wrongPassword.ok).toBe(false);
    if (!result.ok && !wrongPassword.ok) {
      expect(result.error).toBe(wrongPassword.error);
    }
  });

  it("rejects a DISABLED account even with the correct password", async () => {
    const user = await createTestUser({ status: "DISABLED" });
    const result = await loginAction(
      undefined,
      formData({ email: user.email, password: "correct-horse-battery-staple" })
    );
    expect(result.ok).toBe(false);
  });

  it("creates a session, updates lastLoginAt, and redirects on success", async () => {
    const user = await createTestUser();

    await expect(
      loginAction(undefined, formData({ email: user.email, password: "correct-horse-battery-staple" }))
    ).rejects.toBeInstanceOf(RedirectSignal);

    expect(mockCookieStore.has("acc_session")).toBe(true);
    const current = await getCurrentUser();
    expect(current?.id).toBe(user.id);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.lastLoginAt).not.toBeNull();

    const audit = await prisma.auditEvent.findFirstOrThrow({ where: { action: "user.login.success" } });
    expect(audit.actorUserId).toBe(user.id);
  });
});

describe("logoutAction", () => {
  beforeEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });
  afterEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });

  it("destroys the session and redirects to the login page", async () => {
    const user = await createTestUser();
    await createSession(user.id);

    await expect(logoutAction()).rejects.toBeInstanceOf(RedirectSignal);

    expect(mockCookieStore.has("acc_session")).toBe(false);
    await expect(getCurrentUser()).resolves.toBeNull();

    const audit = await prisma.auditEvent.findFirstOrThrow({ where: { action: "user.logout" } });
    expect(audit.actorUserId).toBe(user.id);
  });
});
