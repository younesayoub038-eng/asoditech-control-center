"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { changeSubscriptionStatusAction } from "@/actions/subscriptions";
import { SUBSCRIPTION_STATUS_TRANSITIONS } from "@/lib/validation/subscription";
import { SUBSCRIPTION_STATUS_LABELS } from "@/lib/status-labels";

const STATUS_ACTION_META: Record<string, { label: string; description: string; destructive: boolean }> = {
  ACTIVE: {
    label: "Marquer actif",
    description: "L'abonnement redevient actif.",
    destructive: false,
  },
  PAST_DUE: {
    label: "Marquer en retard",
    description: "Signale que le paiement attendu n'a pas été reçu.",
    destructive: true,
  },
  SUSPENDED: {
    label: "Suspendre",
    description: "L'abonnement est suspendu. Pensez à suspendre l'instance correspondante si nécessaire.",
    destructive: true,
  },
  CANCELLED: {
    label: "Résilier",
    description: "Action définitive : cet abonnement ne pourra plus être réactivé.",
    destructive: true,
  },
};

export function SubscriptionStatusActions({
  subscriptionId,
  status,
}: {
  subscriptionId: string;
  status: string;
}) {
  const nextStatuses = SUBSCRIPTION_STATUS_TRANSITIONS[status] ?? [];

  if (nextStatuses.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {nextStatuses.map((nextStatus) => {
        const meta = STATUS_ACTION_META[nextStatus];
        if (!meta) return null;
        return (
          <ConfirmActionButton
            key={nextStatus}
            label={meta.label}
            title={`${meta.label} cet abonnement ?`}
            description={meta.description}
            hiddenFields={{ id: subscriptionId, status: nextStatus }}
            action={changeSubscriptionStatusAction}
            successMessage={`Abonnement : statut changé en ${SUBSCRIPTION_STATUS_LABELS[nextStatus]?.label ?? nextStatus}.`}
            destructive={meta.destructive}
          />
        );
      })}
    </div>
  );
}
