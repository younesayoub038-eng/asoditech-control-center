import "server-only";

import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";
import { hashLicenseKey } from "@/lib/license/key";

/**
 * Guidance values returned alongside the verdict so instances can behave
 * sensibly when the Control Center is briefly unreachable, without the
 * server having to track per-instance offline state. Enforcement of the
 * grace period is the instance's responsibility.
 */
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour: re-check at least this often
const GRACE_PERIOD_HOURS = 24; // may keep operating this long on a cached ACTIVE result

export type LicenseVerificationResult =
  | {
      allowed: true;
      status: "ACTIVE";
      instanceId: string;
      productSlug: string;
      checkedAt: string;
      cacheTtlSeconds: number;
      gracePeriodHours: number;
    }
  | {
      allowed: false;
      status: "SUSPENDED" | "DECOMMISSIONED" | "PROVISIONING" | "UNKNOWN";
      checkedAt: string;
    };

export async function verifyInstanceLicense(rawToken: string): Promise<LicenseVerificationResult> {
  const checkedAt = new Date().toISOString();
  const tokenHash = hashLicenseKey(rawToken);

  const instance = await prisma.instance.findUnique({
    where: { licenseKeyHash: tokenHash },
    include: { product: true },
  });

  if (!instance) {
    await recordAuditEvent({
      actorType: "INSTANCE",
      action: "license.verify.failure",
      entityType: "Instance",
      entityId: "unknown",
      metadata: { reason: "no_matching_instance" },
    });
    return { allowed: false, status: "UNKNOWN", checkedAt };
  }

  if (instance.status !== "ACTIVE") {
    await recordAuditEvent({
      actorType: "INSTANCE",
      action: "license.verify.failure",
      entityType: "Instance",
      entityId: instance.id,
      metadata: { reason: "instance_not_active", status: instance.status },
    });
    return { allowed: false, status: instance.status, checkedAt };
  }

  await prisma.instance.update({
    where: { id: instance.id },
    data: { licenseKeyLastVerifiedAt: new Date() },
  });

  await recordAuditEvent({
    actorType: "INSTANCE",
    action: "license.verify.success",
    entityType: "Instance",
    entityId: instance.id,
    metadata: {},
  });

  return {
    allowed: true,
    status: "ACTIVE",
    instanceId: instance.id,
    productSlug: instance.product.slug,
    checkedAt,
    cacheTtlSeconds: CACHE_TTL_SECONDS,
    gracePeriodHours: GRACE_PERIOD_HOURS,
  };
}
