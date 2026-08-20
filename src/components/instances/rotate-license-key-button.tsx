"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LicenseKeyDialog } from "@/components/instances/license-key-dialog";
import { rotateInstanceLicenseKeyAction } from "@/actions/instances";
import type { ActionResult } from "@/actions/types";
import type { Instance } from "@prisma/client";

export function RotateLicenseKeyButton({ instanceId }: { instanceId: string }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (
      _prevState: ActionResult<{ instance: Instance; rawLicenseKey: string }> | undefined,
      formData: FormData
    ) => rotateInstanceLicenseKeyAction(formData),
    undefined
  );

  if (state?.ok && confirmOpen) {
    setConfirmOpen(false);
    setKeyDialogOpen(true);
  }

  return (
    <>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Button type="button" variant="outline" onClick={() => setConfirmOpen(true)}>
          Régénérer la clé de licence
        </Button>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Régénérer la clé de licence ?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;ancienne clé cessera immédiatement de fonctionner. L&apos;instance déployée
              devra être mise à jour avec la nouvelle clé pour continuer à passer la vérification
              de licence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form action={formAction}>
            <input type="hidden" name="id" value={instanceId} />
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Annuler</AlertDialogCancel>
              <AlertDialogAction type="submit" disabled={isPending} variant="destructive">
                {isPending ? "En cours..." : "Régénérer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {state?.ok && (
        <LicenseKeyDialog
          rawKey={state.data.rawLicenseKey}
          open={keyDialogOpen}
          onConfirm={() => {
            setKeyDialogOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
