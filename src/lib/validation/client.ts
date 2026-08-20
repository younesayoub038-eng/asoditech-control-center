import { z } from "zod";

export const clientStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const createClientSchema = z.object({
  companyName: z.string().trim().min(2, "Le nom de l'entreprise est requis.").max(200),
  contactName: z.string().trim().max(200).nullish().or(z.literal("")),
  email: z.email("Adresse e-mail invalide.").nullish().or(z.literal("")),
  phone: z.string().trim().max(30).nullish().or(z.literal("")),
  whatsapp: z.string().trim().max(30).nullish().or(z.literal("")),
  notes: z.string().trim().max(5000).nullish().or(z.literal("")),
});

export const updateClientSchema = createClientSchema.extend({
  id: z.string().min(1),
  status: clientStatusSchema,
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
