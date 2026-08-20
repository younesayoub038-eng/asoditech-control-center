import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createUserAction, setUserStatusAction } from "@/actions/users";
import { getCurrentUser, createSession } from "@/lib/auth/session";
import { resetDb } from "../helpers/db";
import { createTestUser, loginAsTestUser } from "../helpers/auth";
import { mockCookieStore } from "../mocks/cookie-store";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("user management authorization", () => {
  beforeEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });
  afterEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });

  it("rejects a non-OWNER (ADMIN) from creating a new account", async () => {
    await loginAsTestUser({ role: "ADMIN" });

    await expect(
      createUserAction(
        formData({ name: "New Staff", email: "new@asoditech.test", password: "a-long-enough-password", role: "ADMIN" })
      )
    ).rejects.toThrow(/non autorisé/i);
  });

  it("allows an OWNER to create a new account", async () => {
    await loginAsTestUser({ role: "OWNER" });

    const result = await createUserAction(
      formData({ name: "New Staff", email: "new@asoditech.test", password: "a-long-enough-password", role: "ADMIN" })
    );
    expect(result.ok).toBe(true);
  });

  it("rejects creating an account with an already-used email", async () => {
    await loginAsTestUser({ role: "OWNER" });
    const existing = await createTestUser({ email: "taken@asoditech.test" });

    const result = await createUserAction(
      formData({
        name: "Someone",
        email: existing.email,
        password: "a-long-enough-password",
        role: "ADMIN",
      })
    );
    expect(result.ok).toBe(false);
  });

  it("disabling a user immediately revokes their active sessions", async () => {
    // The mock cookie jar represents a single browser, so two concurrently
    // logged-in users are simulated by capturing each raw session token and
    // swapping which one is "in the browser" at each step.
    await loginAsTestUser({ role: "OWNER" });
    const ownerCookie = mockCookieStore.get("acc_session")!.value;

    mockCookieStore.clear();
    const target = await createTestUser({ role: "ADMIN" });
    await createSession(target.id);
    const targetCookie = mockCookieStore.get("acc_session")!.value;
    expect(await getCurrentUser()).toMatchObject({ id: target.id });

    mockCookieStore.clear();
    mockCookieStore.set("acc_session", ownerCookie);
    const result = await setUserStatusAction(formData({ id: target.id, status: "DISABLED" }));
    expect(result.ok).toBe(true);

    mockCookieStore.clear();
    mockCookieStore.set("acc_session", targetCookie);
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("prevents an owner from disabling their own account", async () => {
    const owner = await loginAsTestUser({ role: "OWNER" });
    const result = await setUserStatusAction(formData({ id: owner.id, status: "DISABLED" }));
    expect(result.ok).toBe(false);
  });
});
