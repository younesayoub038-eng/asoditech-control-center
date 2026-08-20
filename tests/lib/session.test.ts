import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroyAllSessionsForUser,
  destroyCurrentSession,
  getCurrentUser,
} from "@/lib/auth/session";
import { resetDb } from "../helpers/db";
import { createTestUser } from "../helpers/auth";
import { mockCookieStore } from "../mocks/cookie-store";

describe("session lifecycle", () => {
  beforeEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });
  afterEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });

  it("returns null when there is no session cookie", async () => {
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("resolves the user for a valid session", async () => {
    const user = await createTestUser();
    await createSession(user.id);

    const current = await getCurrentUser();
    expect(current?.id).toBe(user.id);
    expect(current?.email).toBe(user.email);
  });

  it("stores only a hash of the session token, never the raw value", async () => {
    const user = await createTestUser();
    await createSession(user.id);

    const rawToken = mockCookieStore.get("acc_session")?.value;
    expect(rawToken).toBeTruthy();

    const sessions = await prisma.session.findMany({ where: { userId: user.id } });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].tokenHash).not.toBe(rawToken);
  });

  it("rejects a session whose owning user is DISABLED", async () => {
    const user = await createTestUser({ status: "DISABLED" });
    await createSession(user.id);

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("rejects an expired session", async () => {
    const user = await createTestUser();
    await createSession(user.id);

    const session = await prisma.session.findFirstOrThrow({ where: { userId: user.id } });
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("rejects a tampered/garbage cookie value", async () => {
    const user = await createTestUser();
    await createSession(user.id);

    mockCookieStore.set("acc_session", "not-a-real-token");

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("destroyCurrentSession removes the session row and the cookie", async () => {
    const user = await createTestUser();
    await createSession(user.id);

    await destroyCurrentSession();

    expect(mockCookieStore.has("acc_session")).toBe(false);
    await expect(getCurrentUser()).resolves.toBeNull();
    await expect(prisma.session.count({ where: { userId: user.id } })).resolves.toBe(0);
  });

  it("destroyAllSessionsForUser revokes every session for that user immediately", async () => {
    const user = await createTestUser();
    await createSession(user.id);
    await expect(getCurrentUser()).resolves.not.toBeNull();

    await destroyAllSessionsForUser(user.id);

    // The cookie the browser holds is now orphaned — no matching row.
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("two users' sessions are independent", async () => {
    const userA = await createTestUser();
    await createSession(userA.id);
    const asA = await getCurrentUser();
    expect(asA?.id).toBe(userA.id);

    const userB = await createTestUser();
    await createSession(userB.id);
    const asB = await getCurrentUser();
    expect(asB?.id).toBe(userB.id);
    expect(asB?.id).not.toBe(userA.id);
  });
});
