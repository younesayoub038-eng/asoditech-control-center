import { prisma } from "@/lib/prisma";
import { generateLicenseKey } from "@/lib/license/key";
import type { InstanceStatus } from "@prisma/client";

let counter = 0;
function nextId() {
  counter += 1;
  return counter;
}

export async function createTestClient(overrides: Partial<{ status: "ACTIVE" | "INACTIVE" }> = {}) {
  const n = nextId();
  return prisma.client.create({
    data: {
      companyName: `Test Client ${n}`,
      status: overrides.status ?? "ACTIVE",
    },
  });
}

export async function createTestProduct() {
  const n = nextId();
  return prisma.product.create({
    data: {
      name: `Test Product ${n}`,
      slug: `test-product-${n}`,
    },
  });
}

/** Returns both the created Instance row and the raw (unhashed) license key. */
export async function createTestInstance(overrides: {
  clientId: string;
  productId: string;
  status?: InstanceStatus;
}) {
  const { raw, hash, displayPrefix } = generateLicenseKey();
  const instance = await prisma.instance.create({
    data: {
      clientId: overrides.clientId,
      productId: overrides.productId,
      label: `Test Instance ${nextId()}`,
      status: overrides.status ?? "PROVISIONING",
      licenseKeyHash: hash,
      licenseKeyPrefix: displayPrefix,
    },
  });
  return { instance, rawLicenseKey: raw };
}

export async function createTestSubscription(overrides: {
  clientId: string;
  instanceId: string;
  status?: "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELLED";
}) {
  return prisma.subscription.create({
    data: {
      clientId: overrides.clientId,
      instanceId: overrides.instanceId,
      planName: "Standard",
      amount: 500,
      currency: "MAD",
      billingInterval: "MONTHLY",
      startDate: new Date(),
      status: overrides.status ?? "ACTIVE",
    },
  });
}
