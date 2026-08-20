"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProductAction, updateProductAction } from "@/actions/products";
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
import type { Product } from "@prisma/client";
import { PRODUCT_STATUS_LABELS } from "@/lib/status-labels";

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [state, formAction, isPending] = useActionState(
    async (_prevState: ActionResult<Product> | undefined, formData: FormData) =>
      isEdit ? updateProductAction(formData) : createProductAction(formData),
    undefined
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success(isEdit ? "Produit mis à jour." : "Produit créé.");
      router.push(`/produits/${state.data.id}`);
      router.refresh();
    }
  }, [state, isEdit, router]);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {isEdit && <input type="hidden" name="id" value={product!.id} />}

      <div className="space-y-1.5">
        <Label htmlFor="name">Nom du produit *</Label>
        <Input id="name" name="name" defaultValue={product?.name} required />
        {state && !state.ok && state.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">Slug *</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={product?.slug}
          placeholder="gestion-ecommerce"
          required
        />
        {state && !state.ok && state.fieldErrors?.slug && (
          <p className="text-sm text-destructive">{state.fieldErrors.slug[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="currentVersion">Version actuelle</Label>
        <Input id="currentVersion" name="currentVersion" defaultValue={product?.currentVersion ?? ""} />
      </div>

      {isEdit && (
        <div className="space-y-1.5">
          <Label htmlFor="status">Statut</Label>
          <Select name="status" defaultValue={product!.status}>
            <SelectTrigger id="status" className="w-full sm:w-64">
              <SelectValue>
                {(value: string) => PRODUCT_STATUS_LABELS[value]?.label ?? value}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Actif</SelectItem>
              <SelectItem value="DEPRECATED">Déprécié</SelectItem>
              <SelectItem value="ARCHIVED">Archivé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={product?.description ?? ""} />
      </div>

      {state && !state.ok && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer le produit"}
      </Button>
    </form>
  );
}
