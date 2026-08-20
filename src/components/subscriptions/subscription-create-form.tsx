"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createSubscriptionAction } from "@/actions/subscriptions";
import type { ActionResult } from "@/actions/types";
import type { Subscription } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BILLING_INTERVAL_LABELS } from "@/lib/status-labels";

interface ClientOption {
  id: string;
  companyName: string;
}
interface InstanceOption {
  id: string;
  clientId: string;
  label: string;
  productName: string;
}

export function SubscriptionCreateForm({
  clients,
  instances,
}: {
  clients: ClientOption[];
  instances: InstanceOption[];
}) {
  const router = useRouter();
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const filteredInstances = useMemo(
    () => instances.filter((i) => i.clientId === selectedClientId),
    [instances, selectedClientId]
  );

  const [state, formAction, isPending] = useActionState(
    async (_prevState: ActionResult<Subscription> | undefined, formData: FormData) =>
      createSubscriptionAction(formData),
    undefined
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Abonnement créé.");
      router.push(`/abonnements/${state.data.id}`);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="clientId">Client *</Label>
          <Select
            name="clientId"
            required
            value={selectedClientId}
            onValueChange={(value) => setSelectedClientId(value ?? "")}
          >
            <SelectTrigger id="clientId" className="w-full">
              <SelectValue placeholder="Sélectionner un client">
                {(value: string | null) =>
                  clients.find((c) => c.id === value)?.companyName ?? "Sélectionner un client"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="instanceId">Instance *</Label>
          <Select name="instanceId" required disabled={!selectedClientId}>
            <SelectTrigger id="instanceId" className="w-full">
              <SelectValue
                placeholder={selectedClientId ? "Sélectionner une instance" : "Choisir un client d'abord"}
              >
                {(value: string | null) => {
                  const instance = filteredInstances.find((i) => i.id === value);
                  if (!instance) {
                    return selectedClientId ? "Sélectionner une instance" : "Choisir un client d'abord";
                  }
                  return `${instance.label} (${instance.productName})`;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {filteredInstances.map((instance) => (
                <SelectItem key={instance.id} value={instance.id}>
                  {instance.label} ({instance.productName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="planName">Nom du plan *</Label>
        <Input id="planName" name="planName" placeholder="Standard mensuel" required />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Montant *</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Devise *</Label>
          <Input id="currency" name="currency" defaultValue="MAD" required maxLength={3} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="billingInterval">Intervalle *</Label>
          <Select name="billingInterval" required defaultValue="MONTHLY">
            <SelectTrigger id="billingInterval" className="w-full">
              <SelectValue>{(value: string) => BILLING_INTERVAL_LABELS[value] ?? value}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MONTHLY">Mensuel</SelectItem>
              <SelectItem value="YEARLY">Annuel</SelectItem>
              <SelectItem value="ONE_TIME">Paiement unique</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Date de début *</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nextPaymentDate">Prochain paiement</Label>
          <Input id="nextPaymentDate" name="nextPaymentDate" type="date" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      {state && !state.ok && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Création..." : "Créer l'abonnement"}
      </Button>
    </form>
  );
}
