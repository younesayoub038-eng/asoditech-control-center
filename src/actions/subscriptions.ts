"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserForAction } from "@/lib/auth/guards";
import { recordAuditEvent } from "@/lib/audit";
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  changeSubscriptionStatusSchema,
  SUBSCRIPTION_STATUS_TRANSITIONS,
} from "@/lib/validation/subscription";
import { actionError, actionOk, type ActionResult } from "@/actions/types";
import type { Subscription } from "@prisma/client";

function normalizeOptional(value: string | null | undefined): string | null {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export async function createSubscriptionAction(formData: FormData): Promise<ActionResult<Subscription>> {
  const user = await requireUserForAction();

  const parsed = createSubscriptionSchema.safeParse({
    clientId: formData.get("clientId"),
    instanceId: formData.get("instanceId"),
    planName: formData.get("planName"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    billingInterval: formData.get("billingInterval"),
    startDate: formData.get("startDate"),
    nextPaymentDate: formData.get("nextPaymentDate") || undefined,
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return actionError("Champs invalides.", parsed.error.flatten().fieldErrors);
  }

  const instance = await prisma.instance.findUnique({ where: { id: parsed.data.instanceId } });
  if (!instance) return actionError("Instance introuvable.");
  if (instance.clientId !== parsed.data.clientId) {
    return actionError("Cette instance n'appartient pas au client sélectionné.");
  }

  const subscription = await prisma.subscription.create({
    data: {
      clientId: parsed.data.clientId,
      instanceId: parsed.data.instanceId,
      planName: parsed.data.planName,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      billingInterval: parsed.data.billingInterval,
      startDate: parsed.data.startDate,
      nextPaymentDate: parsed.data.nextPaymentDate ?? null,
      notes: normalizeOptional(parsed.data.notes),
    },
  });

  await recordAuditEvent({
    actorType: "USER",
    actorUserId: user.id,
    action: "subscription.created",
    entityType: "Subscription",
    entityId: subscription.id,
    metadata: { clientId: subscription.clientId, instanceId: subscription.instanceId },
  });

  revalidatePath("/abonnements");
  return actionOk(subscription);
}

export async function updateSubscriptionAction(formData: FormData): Promise<ActionResult<Subscription>> {
  const user = await requireUserForAction();

  const parsed = updateSubscriptionSchema.safeParse({
    id: formData.get("id"),
    planName: formData.get("planName"),
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    billingInterval: formData.get("billingInterval"),
    startDate: formData.get("startDate"),
    nextPaymentDate: formData.get("nextPaymentDate") || undefined,
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return actionError("Champs invalides.", parsed.error.flatten().fieldErrors);
  }

  const existing = await prisma.subscription.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return actionError("Abonnement introuvable.");

  const subscription = await prisma.subscription.update({
    where: { id: parsed.data.id },
    data: {
      planName: parsed.data.planName,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      billingInterval: parsed.data.billingInterval,
      startDate: parsed.data.startDate,
      nextPaymentDate: parsed.data.nextPaymentDate ?? null,
      notes: normalizeOptional(parsed.data.notes),
    },
  });

  await recordAuditEvent({
    actorType: "USER",
    actorUserId: user.id,
    action: "subscription.updated",
    entityType: "Subscription",
    entityId: subscription.id,
  });

  revalidatePath("/abonnements");
  revalidatePath(`/abonnements/${subscription.id}`);
  return actionOk(subscription);
}

export async function changeSubscriptionStatusAction(
  formData: FormData
): Promise<ActionResult<Subscription>> {
  const user = await requireUserForAction();

  const parsed = changeSubscriptionStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return actionError("Champs invalides.", parsed.error.flatten().fieldErrors);
  }

  const existing = await prisma.subscription.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return actionError("Abonnement introuvable.");

  const allowedNextStatuses = SUBSCRIPTION_STATUS_TRANSITIONS[existing.status] ?? [];
  if (!allowedNextStatuses.includes(parsed.data.status)) {
    return actionError(
      `Transition de statut invalide : ${existing.status} → ${parsed.data.status}.`
    );
  }

  const now = new Date();
  const subscription = await prisma.subscription.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      cancelledAt: parsed.data.status === "CANCELLED" ? now : existing.cancelledAt,
      suspendedAt: parsed.data.status === "SUSPENDED" ? now : existing.suspendedAt,
    },
  });

  await recordAuditEvent({
    actorType: "USER",
    actorUserId: user.id,
    action: "subscription.status_changed",
    entityType: "Subscription",
    entityId: subscription.id,
    metadata: { previousStatus: existing.status, newStatus: subscription.status },
  });

  revalidatePath("/abonnements");
  revalidatePath(`/abonnements/${subscription.id}`);
  return actionOk(subscription);
}
