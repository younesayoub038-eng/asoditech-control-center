"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOwnerForAction } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { destroyAllSessionsForUser } from "@/lib/auth/session";
import { recordAuditEvent } from "@/lib/audit";
import { createUserSchema } from "@/lib/validation/user";
import { actionError, actionOk, type ActionResult } from "@/actions/types";
import type { User } from "@prisma/client";

export async function createUserAction(formData: FormData): Promise<ActionResult<User>> {
  const owner = await requireOwnerForAction();

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return actionError("Champs invalides.", parsed.error.flatten().fieldErrors);
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return actionError("Un compte existe déjà avec cet e-mail.", {
      email: ["Un compte existe déjà avec cet e-mail."],
    });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
    },
  });

  await recordAuditEvent({
    actorType: "USER",
    actorUserId: owner.id,
    action: "user.created",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  revalidatePath("/parametres");
  return actionOk(user);
}

export async function setUserStatusAction(formData: FormData): Promise<ActionResult<User>> {
  const owner = await requireOwnerForAction();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || (status !== "ACTIVE" && status !== "DISABLED")) {
    return actionError("Requête invalide.");
  }
  if (id === owner.id) {
    return actionError("Vous ne pouvez pas modifier votre propre statut.");
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return actionError("Utilisateur introuvable.");

  const user = await prisma.user.update({ where: { id }, data: { status } });

  if (status === "DISABLED") {
    await destroyAllSessionsForUser(user.id);
  }

  await recordAuditEvent({
    actorType: "USER",
    actorUserId: owner.id,
    action: "user.status_changed",
    entityType: "User",
    entityId: user.id,
    metadata: { previousStatus: existing.status, newStatus: user.status },
  });

  revalidatePath("/parametres");
  return actionOk(user);
}
