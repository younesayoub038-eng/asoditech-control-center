import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createClientAction, updateClientAction } from "@/actions/clients";
import { resetDb } from "../helpers/db";
import { loginAsTestUser } from "../helpers/auth";
import { mockCookieStore } from "../mocks/cookie-store";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("createClientAction", () => {
  beforeEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });
  afterEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });

  it("rejects an unauthenticated caller", async () => {
    await expect(createClientAction(formData({ companyName: "Acme" }))).rejects.toThrow(
      /non autorisé/i
    );
  });

  it("rejects invalid input with field-level errors, not a thrown exception", async () => {
    await loginAsTestUser();
    const result = await createClientAction(formData({ companyName: "" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.companyName).toBeTruthy();
    }
  });

  it("creates a client and records who created it", async () => {
    const user = await loginAsTestUser();
    const result = await createClientAction(
      formData({ companyName: "Boutique Atlas", email: "contact@atlas.ma" })
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.companyName).toBe("Boutique Atlas");
      expect(result.data.status).toBe("ACTIVE");
      expect(result.data.createdById).toBe(user.id);
    }

    const audit = await prisma.auditEvent.findFirstOrThrow({ where: { action: "client.created" } });
    expect(audit.actorUserId).toBe(user.id);
  });

  it("treats blank optional fields as null, not empty strings", async () => {
    await loginAsTestUser();
    const result = await createClientAction(
      formData({ companyName: "Acme", email: "", phone: "" })
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBeNull();
      expect(result.data.phone).toBeNull();
    }
  });
});

describe("updateClientAction", () => {
  beforeEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });
  afterEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });

  it("logs client.archived when status flips to INACTIVE", async () => {
    await loginAsTestUser();
    const created = await createClientAction(formData({ companyName: "Acme" }));
    if (!created.ok) throw new Error("setup failed");

    const result = await updateClientAction(
      formData({
        id: created.data.id,
        companyName: "Acme",
        status: "INACTIVE",
      })
    );
    expect(result.ok).toBe(true);

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: { action: "client.archived", entityId: created.data.id },
    });
    expect(audit.metadata).toMatchObject({ previousStatus: "ACTIVE", newStatus: "INACTIVE" });
  });

  it("logs client.reactivated when status flips back to ACTIVE", async () => {
    await loginAsTestUser();
    const created = await createClientAction(formData({ companyName: "Acme" }));
    if (!created.ok) throw new Error("setup failed");
    await updateClientAction(
      formData({ id: created.data.id, companyName: "Acme", status: "INACTIVE" })
    );

    await updateClientAction(
      formData({ id: created.data.id, companyName: "Acme", status: "ACTIVE" })
    );

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: { action: "client.reactivated", entityId: created.data.id },
    });
    expect(audit).toBeTruthy();
  });

  it("logs a plain client.updated when status is unchanged", async () => {
    await loginAsTestUser();
    const created = await createClientAction(formData({ companyName: "Acme" }));
    if (!created.ok) throw new Error("setup failed");

    await updateClientAction(
      formData({ id: created.data.id, companyName: "Acme Renamed", status: "ACTIVE" })
    );

    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: { action: "client.updated", entityId: created.data.id },
    });
    expect(audit).toBeTruthy();
  });

  it("returns an error for a non-existent client instead of throwing", async () => {
    await loginAsTestUser();
    const result = await updateClientAction(
      formData({ id: "does-not-exist", companyName: "Acme", status: "ACTIVE" })
    );
    expect(result.ok).toBe(false);
  });
});
