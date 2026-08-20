"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createUserAction } from "@/actions/users";
import type { ActionResult } from "@/actions/types";
import type { User } from "@prisma/client";
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

export function CreateUserForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    async (_prevState: ActionResult<User> | undefined, formData: FormData) =>
      createUserAction(formData),
    undefined
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success(`Compte créé pour ${state.data.email}.`);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nom *</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail *</Label>
          <Input id="email" name="email" type="email" required />
          {state && !state.ok && state.fieldErrors?.email && (
            <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe temporaire *</Label>
          <Input id="password" name="password" type="password" minLength={10} required />
          {state && !state.ok && state.fieldErrors?.password && (
            <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Rôle *</Label>
          <Select name="role" required defaultValue="ADMIN">
            <SelectTrigger id="role" className="w-full">
              <SelectValue>
                {(value: string) => (value === "OWNER" ? "Propriétaire" : "Administrateur")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Administrateur</SelectItem>
              <SelectItem value="OWNER">Propriétaire</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {state && !state.ok && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Création..." : "Créer le compte"}
      </Button>
    </form>
  );
}
