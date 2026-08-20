import { z } from "zod";

export const paymentStatusSchema = z.enum(["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"]);
export const paymentMethodSchema = z.enum(["BANK_TRANSFER", "CASH", "CARD", "MOBILE_MONEY", "OTHER"]);

const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Code devise ISO 4217 invalide (ex : MAD, EUR, USD).");

export const createPaymentSchema = z.object({
  clientId: z.string().min(1, "Le client est requis."),
  subscriptionId: z.string().min(1).nullish().or(z.literal("")),
  amount: z.coerce.number().positive("Le montant doit être positif.").max(10_000_000),
  currency: currencySchema,
  paymentDate: z.coerce.date(),
  status: paymentStatusSchema,
  method: paymentMethodSchema,
  referenceId: z.string().trim().max(200).nullish().or(z.literal("")),
  notes: z.string().trim().max(5000).nullish().or(z.literal("")),
});

export const updatePaymentSchema = createPaymentSchema
  .omit({ clientId: true })
  .extend({
    id: z.string().min(1),
  });

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
