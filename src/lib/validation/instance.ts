import { z } from "zod";

export const instanceStatusSchema = z.enum([
  "PROVISIONING",
  "ACTIVE",
  "SUSPENDED",
  "DECOMMISSIONED",
]);

export const createInstanceSchema = z.object({
  clientId: z.string().min(1, "Le client est requis."),
  productId: z.string().min(1, "Le produit est requis."),
  label: z.string().trim().min(2, "Le libellé est requis.").max(200),
  url: z.url("URL invalide.").nullish().or(z.literal("")),
  version: z.string().trim().max(50).nullish().or(z.literal("")),
});

export const updateInstanceSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().min(2).max(200),
  url: z.url("URL invalide.").nullish().or(z.literal("")),
  version: z.string().trim().max(50).nullish().or(z.literal("")),
});

// Explicit, allowed transitions only — see docs/adr/0002-domain-model.md.
// PROVISIONING -> ACTIVE -> SUSPENDED -> ACTIVE ... -> DECOMMISSIONED (terminal)
export const INSTANCE_STATUS_TRANSITIONS: Record<string, string[]> = {
  PROVISIONING: ["ACTIVE", "DECOMMISSIONED"],
  ACTIVE: ["SUSPENDED", "DECOMMISSIONED"],
  SUSPENDED: ["ACTIVE", "DECOMMISSIONED"],
  DECOMMISSIONED: [],
};

export const changeInstanceStatusSchema = z.object({
  id: z.string().min(1),
  status: instanceStatusSchema,
});

export type CreateInstanceInput = z.infer<typeof createInstanceSchema>;
export type UpdateInstanceInput = z.infer<typeof updateInstanceSchema>;
