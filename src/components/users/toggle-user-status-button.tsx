"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { setUserStatusAction } from "@/actions/users";

export function ToggleUserStatusButton({ userId, status }: { userId: string; status: string }) {
  const nextStatus = status === "ACTIVE" ? "DISABLED" : "ACTIVE";

  return (
    <ConfirmActionButton
      label={status === "ACTIVE" ? "Désactiver" : "Réactiver"}
      title={status === "ACTIVE" ? "Désactiver ce compte ?" : "Réactiver ce compte ?"}
      description={
        status === "ACTIVE"
          ? "Toutes les sessions actives de cet utilisateur seront immédiatement révoquées."
          : "Cet utilisateur pourra à nouveau se connecter."
      }
      hiddenFields={{ id: userId, status: nextStatus }}
      action={setUserStatusAction}
      successMessage={status === "ACTIVE" ? "Compte désactivé." : "Compte réactivé."}
      destructive={status === "ACTIVE"}
    />
  );
}
