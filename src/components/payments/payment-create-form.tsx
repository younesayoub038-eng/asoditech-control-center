"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPaymentAction } from "@/actions/payments";
import type { ActionResult } from "@/actions/types";
import type { Payment } from "@prisma/client";
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
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/status-labels";

interface ClientOption {
  id: string;
  companyName: string;
}
interface SubscriptionOption {
  id: string;
  clientId: string;
  planName: string;
}

export function PaymentCreateForm({
  clients,
  subscriptions,
}: {
  clients: ClientOption[];
  subscriptions: SubscriptionOption[];
}) {
  const router = useRouter();
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const filteredSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.clientId === selectedClientId),
    [subscriptions, selectedClientId]
  );

  const [state, formAction, isPending] = useActionState(
    async (_prevState: ActionResult<Payment> | undefined, formData: FormData) =>
      createPaymentAction(formData),
    undefined
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Paiement enregistré.");
      router.push(`/paiements/${state.data.id}`);
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
          <Label htmlFor="subscriptionId">Abonnement (optionnel)</Label>
          <Select name="subscriptionId" disabled={!selectedClientId}>
            <SelectTrigger id="subscriptionId" className="w-full">
              <SelectValue
                placeholder={selectedClientId ? "Aucun (paiement ponctuel)" : "Choisir un client d'abord"}
              >
                {(value: string | null) => {
                  const sub = filteredSubscriptions.find((s) => s.id === value);
                  if (sub) return sub.planName;
                  return selectedClientId ? "Aucun (paiement ponctuel)" : "Choisir un client d'abord";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {filteredSubscriptions.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.planName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
          <Label htmlFor="paymentDate">Date *</Label>
          <Input
            id="paymentDate"
            name="paymentDate"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="method">Méthode *</Label>
          <Select name="method" required defaultValue="BANK_TRANSFER">
            <SelectTrigger id="method" className="w-full">
              <SelectValue>{(value: string) => PAYMENT_METHOD_LABELS[value] ?? value}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BANK_TRANSFER">Virement bancaire</SelectItem>
              <SelectItem value="CASH">Espèces</SelectItem>
              <SelectItem value="CARD">Carte bancaire</SelectItem>
              <SelectItem value="MOBILE_MONEY">Mobile money</SelectItem>
              <SelectItem value="OTHER">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Statut *</Label>
          <Select name="status" required defaultValue="SUCCEEDED">
            <SelectTrigger id="status" className="w-full">
              <SelectValue>{(value: string) => PAYMENT_STATUS_LABELS[value]?.label ?? value}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="SUCCEEDED">Réussi</SelectItem>
              <SelectItem value="FAILED">Échoué</SelectItem>
              <SelectItem value="REFUNDED">Remboursé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="referenceId">Référence externe</Label>
        <Input id="referenceId" name="referenceId" placeholder="N° de virement, reçu..." />
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
        {isPending ? "Enregistrement..." : "Enregistrer le paiement"}
      </Button>
    </form>
  );
}
