"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createInstanceAction } from "@/actions/instances";
import type { ActionResult } from "@/actions/types";
import type { Instance } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LicenseKeyDialog } from "@/components/instances/license-key-dialog";

interface Option {
  id: string;
  label: string;
}

export function InstanceCreateForm({
  clients,
  products,
}: {
  clients: Option[];
  products: Option[];
}) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (
      _prevState: ActionResult<{ instance: Instance; rawLicenseKey: string }> | undefined,
      formData: FormData
    ) => createInstanceAction(formData),
    undefined
  );

  const [dialogOpen, setDialogOpen] = useState(false);

  if (state?.ok && !dialogOpen) {
    setDialogOpen(true);
  }

  return (
    <>
      <form action={formAction} className="max-w-xl space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="clientId">Client *</Label>
            <Select name="clientId" required>
              <SelectTrigger id="clientId" className="w-full">
                <SelectValue placeholder="Sélectionner un client">
                  {(value: string | null) => clients.find((c) => c.id === value)?.label ?? "Sélectionner un client"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="productId">Produit *</Label>
            <Select name="productId" required>
              <SelectTrigger id="productId" className="w-full">
                <SelectValue placeholder="Sélectionner un produit">
                  {(value: string | null) =>
                    products.find((p) => p.id === value)?.label ?? "Sélectionner un produit"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="label">Libellé *</Label>
          <Input id="label" name="label" placeholder="Production — Client X" required />
          {state && !state.ok && state.fieldErrors?.label && (
            <p className="text-sm text-destructive">{state.fieldErrors.label[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="url">URL de déploiement</Label>
            <Input id="url" name="url" type="url" placeholder="https://client-x.asoditech.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="version">Version</Label>
            <Input id="version" name="version" placeholder="1.0.0" />
          </div>
        </div>

        {state && !state.ok && (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Création..." : "Créer l'instance"}
        </Button>
      </form>

      {state?.ok && (
        <LicenseKeyDialog
          rawKey={state.data.rawLicenseKey}
          open={dialogOpen}
          onConfirm={() => router.push(`/instances/${state.data.instance.id}`)}
        />
      )}
    </>
  );
}
