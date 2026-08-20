import "server-only";

import { prisma } from "@/lib/prisma";
import type { AuditActorType, Prisma } from "@prisma/client";

/**
 * Actions are namespaced "entity.verb" strings, e.g. "client.created",
 * "instance.suspended", "license.verify.failure". Keep this list in sync
 * with actual call sites — it exists so audit queries/filters stay
 * predictable instead of accumulating ad-hoc strings.
 */
export type AuditAction =
  | "user.login.success"
  | "user.login.failure"
  | "user.logout"
  | "user.created"
  | "user.status_changed"
  | "client.created"
  | "client.updated"
  | "client.archived"
  | "client.reactivated"
  | "product.created"
  | "product.updated"
  | "instance.created"
  | "instance.updated"
  | "instance.suspended"
  | "instance.reactivated"
  | "instance.decommissioned"
  | "instance.license_key.rotated"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.status_changed"
  | "payment.recorded"
  | "payment.updated"
  | "license.verify.success"
  | "license.verify.failure";

interface RecordAuditEventInput {
  actorType: AuditActorType;
  actorUserId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Append-only audit trail. Never call `prisma.auditEvent.update` or
 * `.delete` anywhere in the app — this function is the only writer.
 * Callers must not pass secrets, tokens, or password material in `metadata`.
 */
export async function recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      actorType: input.actorType,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? undefined,
    },
  });
}
