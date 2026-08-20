import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { verifyInstanceLicense } from "@/lib/license/verify";
import { resetDb } from "../helpers/db";
import { createTestClient, createTestInstance, createTestProduct } from "../helpers/fixtures";

describe("verifyInstanceLicense", () => {
  beforeEach(resetDb);
  afterEach(resetDb);

  it("denies an unknown key without revealing why", async () => {
    const result = await verifyInstanceLicense("lic_does-not-exist");
    expect(result.allowed).toBe(false);
    expect(result.status).toBe("UNKNOWN");
  });

  it("allows a key belonging to an ACTIVE instance", async () => {
    const client = await createTestClient();
    const product = await createTestProduct();
    const { rawLicenseKey } = await createTestInstance({
      clientId: client.id,
      productId: product.id,
      status: "ACTIVE",
    });

    const result = await verifyInstanceLicense(rawLicenseKey);
    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.status).toBe("ACTIVE");
      expect(result.productSlug).toBe(product.slug);
    }
  });

  it("denies a key belonging to a SUSPENDED instance", async () => {
    const client = await createTestClient();
    const product = await createTestProduct();
    const { rawLicenseKey } = await createTestInstance({
      clientId: client.id,
      productId: product.id,
      status: "SUSPENDED",
    });

    const result = await verifyInstanceLicense(rawLicenseKey);
    expect(result.allowed).toBe(false);
    expect(result.status).toBe("SUSPENDED");
  });

  it("denies a key belonging to a DECOMMISSIONED instance", async () => {
    const client = await createTestClient();
    const product = await createTestProduct();
    const { rawLicenseKey } = await createTestInstance({
      clientId: client.id,
      productId: product.id,
      status: "DECOMMISSIONED",
    });

    const result = await verifyInstanceLicense(rawLicenseKey);
    expect(result.allowed).toBe(false);
    expect(result.status).toBe("DECOMMISSIONED");
  });

  it("denies a PROVISIONING instance (not yet live)", async () => {
    const client = await createTestClient();
    const product = await createTestProduct();
    const { rawLicenseKey } = await createTestInstance({
      clientId: client.id,
      productId: product.id,
      status: "PROVISIONING",
    });

    const result = await verifyInstanceLicense(rawLicenseKey);
    expect(result.allowed).toBe(false);
    expect(result.status).toBe("PROVISIONING");
  });

  it("records an audit event for both success and failure, without ever storing the raw key", async () => {
    const client = await createTestClient();
    const product = await createTestProduct();
    const { instance, rawLicenseKey } = await createTestInstance({
      clientId: client.id,
      productId: product.id,
      status: "ACTIVE",
    });

    await verifyInstanceLicense(rawLicenseKey);
    await verifyInstanceLicense("lic_wrong-key");

    const events = await prisma.auditEvent.findMany({ orderBy: { createdAt: "asc" } });
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ action: "license.verify.success", entityId: instance.id });
    expect(events[1]).toMatchObject({ action: "license.verify.failure" });

    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain(rawLicenseKey);
  });

  it("updates licenseKeyLastVerifiedAt only on a successful check", async () => {
    const client = await createTestClient();
    const product = await createTestProduct();
    const { instance, rawLicenseKey } = await createTestInstance({
      clientId: client.id,
      productId: product.id,
      status: "ACTIVE",
    });
    expect(instance.licenseKeyLastVerifiedAt).toBeNull();

    await verifyInstanceLicense(rawLicenseKey);

    const updated = await prisma.instance.findUniqueOrThrow({ where: { id: instance.id } });
    expect(updated.licenseKeyLastVerifiedAt).not.toBeNull();
  });

  it("rejects a key rotated away from (old key stops working immediately)", async () => {
    const client = await createTestClient();
    const product = await createTestProduct();
    const { instance, rawLicenseKey: oldKey } = await createTestInstance({
      clientId: client.id,
      productId: product.id,
      status: "ACTIVE",
    });

    const { generateLicenseKey } = await import("@/lib/license/key");
    const rotated = generateLicenseKey();
    await prisma.instance.update({
      where: { id: instance.id },
      data: { licenseKeyHash: rotated.hash, licenseKeyPrefix: rotated.displayPrefix },
    });

    const oldResult = await verifyInstanceLicense(oldKey);
    expect(oldResult.allowed).toBe(false);

    const newResult = await verifyInstanceLicense(rotated.raw);
    expect(newResult.allowed).toBe(true);
  });
});
