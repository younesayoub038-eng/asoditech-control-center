"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateInstanceAction } from "@/actions/instances";
import type { ActionResult } from "@/actions/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Instance } from "@prisma/client";

export function InstanceEditForm({ instance }: { instance: Instance }) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (_prevState: ActionResult<Instance> | undefined, formData: FormData) =>
      updateInstanceAction(formData),
    undefined
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Instance mise à jour.");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={instance.id} />

      <div className="space-y-1.5">
        <Label htmlFor="label">Libellé *</Label>
        <Input id="label" name="label" defaultValue={instance.label} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="url">URL de déploiement</Label>
        <Input id="url" name="url" type="url" defaultValue={instance.url ?? ""} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="version">Version</Label>
        <Input id="version" name="version" defaultValue={instance.version ?? ""} />
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
