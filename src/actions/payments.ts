"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserForAction } from "@/lib/auth/guards";
import { recordAuditEvent } from "@/lib/audit";
import { createPaymentSchema, updatePaymentSchema } from "@/lib/validation/payment";
import { actionError, actionOk, type ActionResult } from "@/actions/types";
import type { Payment } from "@prisma/client";

function normalizeOptional(value: string | null | undefined): string | null {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export async function createPaymentAction(formData: FormData): Promise<ActionResult<Payment>> {
  const user = await requireUserForAction();

  const parsed = createPaymentSchema.safeParse({
    clientId: formData.get("clientId"),
    subscriptionId: formData.get("subscriptionId") || undefined,
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    paymentDate: formData.get("paymentDate"),
    status: formData.get("status"),
    method: formData.get("method"),
    referenceId: formData.get("referenceId"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return actionError("Champs invalides.", parsed.error.flatten().fieldErrors);
  }

  const client = await prisma.client.findUnique({ where: { id: parsed.data.clientId } });
  if (!client) return actionError("Client introuvable.");

  if (parsed.data.subscriptionId) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: parsed.data.subscriptionId },
    });
    if (!subscription) return actionError("Abonnement introuvable.");
    if (subscription.clientId !== parsed.data.clientId) {
      return actionError("Cet abonnement n'appartient pas au client sélectionné.");
    }
  }

  const payment = await prisma.payment.create({
    data: {
      clientId: parsed.data.clientId,
      subscriptionId: parsed.data.subscriptionId || null,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      paymentDate: parsed.data.paymentDate,
      status: parsed.data.status,
      method: parsed.data.method,
      referenceId: normalizeOptional(parsed.data.referenceId),
      notes: normalizeOptional(parsed.data.notes),
      recordedById: user.id,
    },
  });

  await recordAuditEvent({
    actorType: "USER",
    actorUserId: user.id,
    action: "payment.recorded",
    entityType: "Payment",
    entityId: payment.id,
    metadata: { clientId: payment.clientId, amount: payment.amount.toString(), currency: payment.currency },
  });

  revalidatePath("/paiements");
  return actionOk(payment);
}

export async function updatePaymentAction(formData: FormData): Promise<ActionResult<Payment>> {
  const user = await requireUserForAction();

  const parsed = updatePaymentSchema.safeParse({
    id: formData.get("id"),
    subscriptionId: formData.get("subscriptionId") || undefined,
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    paymentDate: formData.get("paymentDate"),
    status: formData.get("status"),
    method: formData.get("method"),
    referenceId: formData.get("referenceId"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return actionError("Champs invalides.", parsed.error.flatten().fieldErrors);
  }

  const existing = await prisma.payment.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return actionError("Paiement introuvable.");

  if (parsed.data.subscriptionId) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: parsed.data.subscriptionId },
    });
    if (!subscription) return actionError("Abonnement introuvable.");
    if (subscription.clientId !== existing.clientId) {
      return actionError("Cet abonnement n'appartient pas au client de ce paiement.");
    }
  }

  const payment = await prisma.payment.update({
    where: { id: parsed.data.id },
    data: {
      subscriptionId: parsed.data.subscriptionId || null,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      paymentDate: parsed.data.paymentDate,
      status: parsed.data.status,
      method: parsed.data.method,
      referenceId: normalizeOptional(parsed.data.referenceId),
      notes: normalizeOptional(parsed.data.notes),
    },
  });

  await recordAuditEvent({
    actorType: "USER",
    actorUserId: user.id,
    action: "payment.updated",
    entityType: "Payment",
    entityId: payment.id,
    metadata: { previousStatus: existing.status, newStatus: payment.status },
  });

  revalidatePath("/paiements");
  revalidatePath(`/paiements/${payment.id}`);
  return actionOk(payment);
}
