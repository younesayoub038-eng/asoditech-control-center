"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClientAction, updateClientAction } from "@/actions/clients";
import type { ActionResult } from "@/actions/types";
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
import type { Client } from "@prisma/client";
import { CLIENT_STATUS_LABELS } from "@/lib/status-labels";

export function ClientForm({ client }: { client?: Client }) {
  const router = useRouter();
  const isEdit = Boolean(client);

  const [state, formAction, isPending] = useActionState(
    async (_prevState: ActionResult<Client> | undefined, formData: FormData) =>
      isEdit ? updateClientAction(formData) : createClientAction(formData),
    undefined
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success(isEdit ? "Client mis à jour." : "Client créé.");
      router.push(`/clients/${state.data.id}`);
      router.refresh();
    }
  }, [state, isEdit, router]);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {isEdit && <input type="hidden" name="id" value={client!.id} />}

      <div className="space-y-1.5">
        <Label htmlFor="companyName">Nom de l&apos;entreprise *</Label>
        <Input
          id="companyName"
          name="companyName"
          defaultValue={client?.companyName}
          required
          aria-invalid={Boolean(state && !state.ok && state.fieldErrors?.companyName)}
        />
        {state && !state.ok && state.fieldErrors?.companyName && (
          <p className="text-sm text-destructive">{state.fieldErrors.companyName[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contactName">Personne à contacter</Label>
          <Input id="contactName" name="contactName" defaultValue={client?.contactName ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} />
          {state && !state.ok && state.fieldErrors?.email && (
            <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" defaultValue={client?.phone ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" name="whatsapp" defaultValue={client?.whatsapp ?? ""} />
        </div>
      </div>

      {isEdit && (
        <div className="space-y-1.5">
          <Label htmlFor="status">Statut</Label>
          <Select name="status" defaultValue={client!.status}>
            <SelectTrigger id="status" className="w-full sm:w-64">
              <SelectValue>
                {(value: string) => CLIENT_STATUS_LABELS[value]?.label ?? value}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Actif</SelectItem>
              <SelectItem value="INACTIVE">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={client?.notes ?? ""} />
      </div>

      {state && !state.ok && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer le client"}
        </Button>
      </div>
    </form>
  );
}
