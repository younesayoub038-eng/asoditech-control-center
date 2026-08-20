"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updatePaymentAction } from "@/actions/payments";
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

interface SubscriptionOption {
  id: string;
  planName: string;
}

export function PaymentEditForm({
  payment,
  subscriptions,
}: {
  payment: Payment;
  subscriptions: SubscriptionOption[];
}) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (_prevState: ActionResult<Payment> | undefined, formData: FormData) =>
      updatePaymentAction(formData),
    undefined
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Paiement mis à jour.");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={payment.id} />

      <div className="space-y-1.5">
        <Label htmlFor="subscriptionId">Abonnement (optionnel)</Label>
        <Select name="subscriptionId" defaultValue={payment.subscriptionId ?? undefined}>
          <SelectTrigger id="subscriptionId" className="w-full">
            <SelectValue placeholder="Aucun (paiement ponctuel)">
              {(value: string | null) =>
                subscriptions.find((s) => s.id === value)?.planName ?? "Aucun (paiement ponctuel)"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {subscriptions.map((sub) => (
              <SelectItem key={sub.id} value={sub.id}>
                {sub.planName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Montant *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={payment.amount.toString()}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Devise *</Label>
          <Input id="currency" name="currency" defaultValue={payment.currency} required maxLength={3} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="paymentDate">Date *</Label>
          <Input
            id="paymentDate"
            name="paymentDate"
            type="date"
            defaultValue={payment.paymentDate.toISOString().slice(0, 10)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="method">Méthode *</Label>
          <Select name="method" required defaultValue={payment.method}>
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
          <Select name="status" required defaultValue={payment.status}>
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
        <Input id="referenceId" name="referenceId" defaultValue={payment.referenceId ?? ""} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={payment.notes ?? ""} />
      </div>

      {state && !state.ok && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
