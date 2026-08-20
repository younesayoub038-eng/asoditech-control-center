"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateSubscriptionAction } from "@/actions/subscriptions";
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

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function SubscriptionEditForm({ subscription }: { subscription: Subscription }) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (_prevState: ActionResult<Subscription> | undefined, formData: FormData) =>
      updateSubscriptionAction(formData),
    undefined
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Abonnement mis à jour.");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={subscription.id} />

      <div className="space-y-1.5">
        <Label htmlFor="planName">Nom du plan *</Label>
        <Input id="planName" name="planName" defaultValue={subscription.planName} required />
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
            defaultValue={subscription.amount.toString()}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Devise *</Label>
          <Input id="currency" name="currency" defaultValue={subscription.currency} required maxLength={3} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="billingInterval">Intervalle *</Label>
          <Select name="billingInterval" required defaultValue={subscription.billingInterval}>
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
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={toDateInputValue(subscription.startDate)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nextPaymentDate">Prochain paiement</Label>
          <Input
            id="nextPaymentDate"
            name="nextPaymentDate"
            type="date"
            defaultValue={toDateInputValue(subscription.nextPaymentDate)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={subscription.notes ?? ""} />
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
