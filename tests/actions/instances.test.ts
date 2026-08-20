import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  changeInstanceStatusAction,
  createInstanceAction,
  rotateInstanceLicenseKeyAction,
} from "@/actions/instances";
import { verifyInstanceLicense } from "@/lib/license/verify";
import { resetDb } from "../helpers/db";
import { loginAsTestUser } from "../helpers/auth";
import { createTestClient, createTestProduct } from "../helpers/fixtures";
import { mockCookieStore } from "../mocks/cookie-store";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("instance actions", () => {
  beforeEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });
  afterEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });

  it("creates an instance in PROVISIONING with a working, one-time-visible license key", async () => {
    await loginAsTestUser();
    const client = await createTestClient();
    const product = await createTestProduct();

    const result = await createInstanceAction(
      formData({ clientId: client.id, productId: product.id, label: "Prod" })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.instance.status).toBe("PROVISIONING");
    expect(result.data.rawLicenseKey).toMatch(/^lic_/);

    // The raw key is never persisted anywhere — only its hash.
    const stored = await prisma.instance.findUniqueOrThrow({ where: { id: result.data.instance.id } });
    expect(stored.licenseKeyHash).not.toBe(result.data.rawLicenseKey);

    // But the returned raw key does authenticate against the license endpoint,
    // even while PROVISIONING (though verification is denied at that status).
    const verify = await verifyInstanceLicense(result.data.rawLicenseKey);
    expect(verify.status).toBe("PROVISIONING");
  });

  it("rejects creating an instance for a non-existent client", async () => {
    await loginAsTestUser();
    const product = await createTestProduct();
    const result = await createInstanceAction(
      formData({ clientId: "does-not-exist", productId: product.id, label: "Prod" })
    );
    expect(result.ok).toBe(false);
  });

  describe("status transitions", () => {
    async function setupActiveInstance() {
      await loginAsTestUser();
      const client = await createTestClient();
      const product = await createTestProduct();
      const created = await createInstanceAction(
        formData({ clientId: client.id, productId: product.id, label: "Prod" })
      );
      if (!created.ok) throw new Error("setup failed");
      return created.data.instance;
    }

    it("allows PROVISIONING -> ACTIVE", async () => {
      const instance = await setupActiveInstance();
      const result = await changeInstanceStatusAction(
        formData({ id: instance.id, status: "ACTIVE" })
      );
      expect(result.ok).toBe(true);
    });

    it("rejects PROVISIONING -> SUSPENDED (must go through ACTIVE first)", async () => {
      const instance = await setupActiveInstance();
      const result = await changeInstanceStatusAction(
        formData({ id: instance.id, status: "SUSPENDED" })
      );
      expect(result.ok).toBe(false);
    });

    it("rejects any transition out of DECOMMISSIONED (terminal state)", async () => {
      const instance = await setupActiveInstance();
      await changeInstanceStatusAction(formData({ id: instance.id, status: "ACTIVE" }));
      await changeInstanceStatusAction(formData({ id: instance.id, status: "DECOMMISSIONED" }));

      const result = await changeInstanceStatusAction(
        formData({ id: instance.id, status: "ACTIVE" })
      );
      expect(result.ok).toBe(false);
    });

    it("a suspended instance is denied by the license endpoint again", async () => {
      const instance = await setupActiveInstance();
      await changeInstanceStatusAction(formData({ id: instance.id, status: "ACTIVE" }));
      await changeInstanceStatusAction(formData({ id: instance.id, status: "SUSPENDED" }));

      const stored = await prisma.instance.findUniqueOrThrow({ where: { id: instance.id } });
      expect(stored.status).toBe("SUSPENDED");
    });
  });

  it("rotating the license key invalidates the old one and issues a new working one", async () => {
    await loginAsTestUser();
    const client = await createTestClient();
    const product = await createTestProduct();
    const created = await createInstanceAction(
      formData({ clientId: client.id, productId: product.id, label: "Prod" })
    );
    if (!created.ok) throw new Error("setup failed");
    await changeInstanceStatusAction(formData({ id: created.data.instance.id, status: "ACTIVE" }));

    const oldKey = created.data.rawLicenseKey;
    const rotated = await rotateInstanceLicenseKeyAction(
      formData({ id: created.data.instance.id })
    );
    expect(rotated.ok).toBe(true);
    if (!rotated.ok) return;

    expect(rotated.data.rawLicenseKey).not.toBe(oldKey);

    const oldVerify = await verifyInstanceLicense(oldKey);
    expect(oldVerify.allowed).toBe(false);

    const newVerify = await verifyInstanceLicense(rotated.data.rawLicenseKey);
    expect(newVerify.allowed).toBe(true);
  });
});
