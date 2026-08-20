import { z } from "zod";

export const subscriptionStatusSchema = z.enum(["ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"]);
export const billingIntervalSchema = z.enum(["MONTHLY", "YEARLY", "ONE_TIME"]);

const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Code devise ISO 4217 invalide (ex : MAD, EUR, USD).");

export const createSubscriptionSchema = z.object({
  clientId: z.string().min(1, "Le client est requis."),
  instanceId: z.string().min(1, "L'instance est requise."),
  planName: z.string().trim().min(2, "Le nom du plan est requis.").max(200),
  amount: z.coerce.number().positive("Le montant doit être positif.").max(10_000_000),
  currency: currencySchema,
  billingInterval: billingIntervalSchema,
  startDate: z.coerce.date(),
  nextPaymentDate: z.coerce.date().optional(),
  notes: z.string().trim().max(5000).nullish().or(z.literal("")),
});

export const updateSubscriptionSchema = createSubscriptionSchema
  .omit({ clientId: true, instanceId: true })
  .extend({
    id: z.string().min(1),
  });

// Explicit, allowed transitions only. Automated enforcement (e.g. auto-suspend
// on overdue payment) is intentionally NOT implemented yet — see
// docs/adr/0002-domain-model.md, deferred decisions.
export const SUBSCRIPTION_STATUS_TRANSITIONS: Record<string, string[]> = {
  ACTIVE: ["PAST_DUE", "SUSPENDED", "CANCELLED"],
  PAST_DUE: ["ACTIVE", "SUSPENDED", "CANCELLED"],
  SUSPENDED: ["ACTIVE", "CANCELLED"],
  CANCELLED: [],
};

export const changeSubscriptionStatusSchema = z.object({
  id: z.string().min(1),
  status: subscriptionStatusSchema,
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
