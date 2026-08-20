"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";

export function LicenseKeyDialog({
  rawKey,
  open,
  onConfirm,
}: {
  rawKey: string;
  open: boolean;
  onConfirm: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    toast.success("Clé copiée dans le presse-papiers.");
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Clé de licence de l&apos;instance</DialogTitle>
          <DialogDescription>
            Cette clé ne sera plus jamais affichée. Copiez-la et transmettez-la à l&apos;équipe
            responsable du déploiement de l&apos;instance maintenant.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input readOnly value={rawKey} className="font-mono text-xs" />
          <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label="Copier">
            <Copy className="size-4" />
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" disabled={!copied} onClick={onConfirm}>
            {copied ? "J'ai copié la clé — continuer" : "Copiez la clé pour continuer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
