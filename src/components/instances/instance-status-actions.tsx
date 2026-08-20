"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { changeInstanceStatusAction } from "@/actions/instances";
import { INSTANCE_STATUS_TRANSITIONS } from "@/lib/validation/instance";
import { INSTANCE_STATUS_LABELS } from "@/lib/status-labels";

const STATUS_ACTION_META: Record<string, { label: string; description: string; destructive: boolean }> = {
  ACTIVE: {
    label: "Réactiver",
    description: "L'instance redeviendra active et la vérification de licence sera à nouveau acceptée.",
    destructive: false,
  },
  SUSPENDED: {
    label: "Suspendre",
    description:
      "La vérification de licence refusera l'accès pour cette instance jusqu'à sa réactivation.",
    destructive: true,
  },
  DECOMMISSIONED: {
    label: "Désaffecter",
    description:
      "Action définitive : cette instance ne pourra plus jamais être réactivée. À utiliser uniquement lorsque l'instance est définitivement retirée.",
    destructive: true,
  },
};

export function InstanceStatusActions({ instanceId, status }: { instanceId: string; status: string }) {
  const nextStatuses = INSTANCE_STATUS_TRANSITIONS[status] ?? [];

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
            title={`${meta.label} cette instance ?`}
            description={meta.description}
            hiddenFields={{ id: instanceId, status: nextStatus }}
            action={changeInstanceStatusAction}
            successMessage={`Instance : statut changé en ${INSTANCE_STATUS_LABELS[nextStatus]?.label ?? nextStatus}.`}
            destructive={meta.destructive}
          />
        );
      })}
    </div>
  );
}
