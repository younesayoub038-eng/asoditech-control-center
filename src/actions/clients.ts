"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserForAction } from "@/lib/auth/guards";
import { recordAuditEvent } from "@/lib/audit";
import { createClientSchema, updateClientSchema } from "@/lib/validation/client";
import { actionError, actionOk, type ActionResult } from "@/actions/types";
import type { Client } from "@prisma/client";

function normalizeOptional(value: string | null | undefined): string | null {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export async function createClientAction(formData: FormData): Promise<ActionResult<Client>> {
  const user = await requireUserForAction();

  const parsed = createClientSchema.safeParse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return actionError("Champs invalides.", parsed.error.flatten().fieldErrors);
  }

  const client = await prisma.client.create({
    data: {
      companyName: parsed.data.companyName,
      contactName: normalizeOptional(parsed.data.contactName),
      email: normalizeOptional(parsed.data.email),
      phone: normalizeOptional(parsed.data.phone),
      whatsapp: normalizeOptional(parsed.data.whatsapp),
      notes: normalizeOptional(parsed.data.notes),
      createdById: user.id,
    },
  });

  await recordAuditEvent({
    actorType: "USER",
    actorUserId: user.id,
    action: "client.created",
    entityType: "Client",
    entityId: client.id,
    metadata: { companyName: client.companyName },
  });

  revalidatePath("/clients");
  return actionOk(client);
}

export async function updateClientAction(formData: FormData): Promise<ActionResult<Client>> {
  const user = await requireUserForAction();

  const parsed = updateClientSchema.safeParse({
    id: formData.get("id"),
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    notes: formData.get("notes"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return actionError("Champs invalides.", parsed.error.flatten().fieldErrors);
  }

  const existing = await prisma.client.findUnique({ where: { id: parsed.data.id } });
  if (!existing) {
    return actionError("Client introuvable.");
  }

  const client = await prisma.client.update({
    where: { id: parsed.data.id },
    data: {
      companyName: parsed.data.companyName,
      contactName: normalizeOptional(parsed.data.contactName),
      email: normalizeOptional(parsed.data.email),
      phone: normalizeOptional(parsed.data.phone),
      whatsapp: normalizeOptional(parsed.data.whatsapp),
      notes: normalizeOptional(parsed.data.notes),
      status: parsed.data.status,
    },
  });

  await recordAuditEvent({
    actorType: "USER",
    actorUserId: user.id,
    action: existing.status !== client.status
      ? (client.status === "ACTIVE" ? "client.reactivated" : "client.archived")
      : "client.updated",
    entityType: "Client",
    entityId: client.id,
    metadata: { previousStatus: existing.status, newStatus: client.status },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${client.id}`);
  return actionOk(client);
}
