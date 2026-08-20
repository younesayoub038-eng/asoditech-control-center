import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";

/**
 * Use at the top of protected Server Components / layouts. Redirects to the
 * login page if there is no valid session. This is the real authorization
 * boundary — route protection in `proxy.ts` is only a fast, best-effort
 * redirect and must never be relied upon alone.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/connexion");
  }
  return user;
}

/** Use inside Server Actions to authorize a mutation. Throws instead of redirecting. */
export async function requireUserForAction(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Non autorisé : session invalide ou expirée.");
  }
  return user;
}

/**
 * Only OWNER may provision or disable staff accounts. This is the one place
 * `UserRole` is currently enforced — see docs/adr/0003-auth-and-sessions.md.
 */
export async function requireOwnerForAction(): Promise<CurrentUser> {
  const user = await requireUserForAction();
  if (user.role !== "OWNER") {
    throw new Error("Non autorisé : réservé aux propriétaires du compte.");
  }
  return user;
}
