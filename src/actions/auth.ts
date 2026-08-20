"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroyCurrentSession, getCurrentUser } from "@/lib/auth/session";
import { recordAuditEvent } from "@/lib/audit";
import { loginSchema } from "@/lib/validation/auth";
import { actionError, type ActionResult } from "@/actions/types";

// Generic message on purpose: never reveal whether the email exists, whether
// the password was wrong, or whether the account is disabled.
const INVALID_CREDENTIALS_MESSAGE = "E-mail ou mot de passe incorrect.";

export async function loginAction(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return actionError(INVALID_CREDENTIALS_MESSAGE, parsed.error.flatten().fieldErrors);
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  const passwordOk = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !passwordOk || user.status !== "ACTIVE") {
    await recordAuditEvent({
      actorType: "USER",
      actorUserId: user?.id,
      action: "user.login.failure",
      entityType: "User",
      entityId: user?.id ?? "unknown",
      metadata: { email },
    });
    return actionError(INVALID_CREDENTIALS_MESSAGE);
  }

  await createSession(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await recordAuditEvent({
    actorType: "USER",
    actorUserId: user.id,
    action: "user.login.success",
    entityType: "User",
    entityId: user.id,
  });

  redirect("/tableau-de-bord");
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  await destroyCurrentSession();
  if (user) {
    await recordAuditEvent({
      actorType: "USER",
      actorUserId: user.id,
      action: "user.logout",
      entityType: "User",
      entityId: user.id,
    });
  }
  redirect("/connexion");
}
