"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserForAction } from "@/lib/auth/guards";
import { recordAuditEvent } from "@/lib/audit";
import { generateLicenseKey } from "@/lib/license/key";
import {
  createInstanceSchema,
  updateInstanceSchema,
  changeInstanceStatusSchema,
  INSTANCE_STATUS_TRANSITIONS,
} from "@/lib/validation/instance";
import { actionError, actionOk, type ActionResult } from "@/actions/types";
import type { Instance } from "@prisma/client";

function normalizeOptional(value: string | null | undefined): string | null {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export async function createInstanceAction(
  formData: FormData
): Promise<ActionResult<{ instance: Instance; rawLicenseKey: string }>> {
  const user = await requireUserForAction();

  const parsed = createInstanceSchema.safeParse({
    clientId: formData.get("clientId"),
    productId: formData.get("productId"),
    label: formData.get("label"),
    url: formData.get("url"),
    version: formData.get("version"),
  });
  if (!parsed.success) {
    return actionError("Champs invalides.", parsed.error.flatten().fieldErrors);
  }

  const [client, product] = await Promise.all([
    prisma.client.findUnique({ where: { id: parsed.data.clientId } }),
    prisma.product.findUnique({ where: { id: parsed.data.productId } }),
  ]);
  if (!client) return actionError("Client introuvable.");
  if (!product) return actionError("Produit introuvable.");

  const { raw, hash, displayPrefix } = generateLicenseKey();

  const instance = await prisma.instance.create({
    data: {
      clientId: parsed.data.clientId,
      productId: parsed.data.productId,
      label: parsed.data.label,
      url: normalizeOptional(parsed.data.url),
      version: normalizeOptional(parsed.data.version),
      licenseKeyHash: hash,
      licenseKeyPrefix: displayPrefix,
    },
  });

  await recordAuditEvent({
    actorType: "USER",
    actorUserId: user.id,
    action: "instance.created",
    entityType: "Instance",
    entityId: instance.id,
    metadata: { clientId: client.id, productId: product.id, label: instance.label },
  });

  revalidatePath("/instances");
  return actionOk({ instance, rawLicenseKey: raw });
}

export async function updateInstanceAction(formData: FormData): Promise<ActionResult<Instance>> {
  const user = await requireUserForAction();

  const parsed = updateInstanceSchema.safeParse({
    id: formData.get("id"),
    label: formData.get("label"),
    url: formData.get("url"),
    version: formData.get("version"),
  });
  if (!parsed.success) {
    return actionError("Champs invalides.", parsed.error.flatten().fieldErrors);
  }

  const existing = await prisma.instance.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return actionError("Instance introuvable.");

  const instance = await prisma.instance.update({
    where: { id: parsed.data.id },
    data: {
      label: parsed.data.label,
      url: normalizeOptional(parsed.data.url),
      version: normalizeOptional(parsed.data.version),
    },
  });

  await recordAuditEvent({
    actorType: "USER",
    actorUserId: user.id,
    action: "instance.updated",
    entityType: "Instance",
    entityId: instance.id,
  });

  revalidatePath("/instances");
  revalidatePath(`/instances/${instance.id}`);
  return actionOk(instance);
}

export async function changeInstanceStatusAction(formData: FormData): Promise<ActionResult<Instance>> {
  const user = await requireUserForAction();

  const parsed = changeInstanceStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return actionError("Champs invalides.", parsed.error.flatten().fieldErrors);
  }

  const existing = await prisma.instance.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return actionError("Instance introuvable.");

  const allowedNextStatuses = INSTANCE_STATUS_TRANSITIONS[existing.status] ?? [];
  if (!allowedNextStatuses.includes(parsed.data.status)) {
    return actionError(
      `Transition de statut invalide : ${existing.status} → ${parsed.data.status}.`
    );
  }

  const instance = await prisma.instance.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });

  const actionName =
    instance.status === "SUSPENDED"
      ? "instance.suspended"
      : instance.status === "DECOMMISSIONED"
        ? "instance.decommissioned"
        : "instance.reactivated";

  await recordAuditEvent({
    actorType: "USER",
    actorUserId: user.id,
    action: actionName,
    entityType: "Instance",
    entityId: instance.id,
    metadata: { previousStatus: existing.status, newStatus: instance.status },
  });

  revalidatePath("/instances");
  revalidatePath(`/instances/${instance.id}`);
  return actionOk(instance);
}

export async function rotateInstanceLicenseKeyAction(
  formData: FormData
): Promise<ActionResult<{ instance: Instance; rawLicenseKey: string }>> {
  const user = await requireUserForAction();
  const id = String(formData.get("id") ?? "");
  if (!id) return actionError("Instance introuvable.");

  const existing = await prisma.instance.findUnique({ where: { id } });
  if (!existing) return actionError("Instance introuvable.");

  const { raw, hash, displayPrefix } = generateLicenseKey();

  const instance = await prisma.instance.update({
    where: { id },
    data: {
      licenseKeyHash: hash,
      licenseKeyPrefix: displayPrefix,
      licenseKeyRotatedAt: new Date(),
    },
  });

  await recordAuditEvent({
    actorType: "USER",
    actorUserId: user.id,
    action: "instance.license_key.rotated",
    entityType: "Instance",
    entityId: instance.id,
  });

  revalidatePath(`/instances/${instance.id}`);
  return actionOk({ instance, rawLicenseKey: raw });
}
