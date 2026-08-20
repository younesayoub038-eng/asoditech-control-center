import { z } from "zod";

export const productStatusSchema = z.enum(["ACTIVE", "DEPRECATED", "ARCHIVED"]);

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Le nom du produit est requis.").max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(slugPattern, "Le slug doit être en minuscules, avec des tirets (ex : gestion-ecommerce)."),
  description: z.string().trim().max(5000).nullish().or(z.literal("")),
  currentVersion: z.string().trim().max(50).nullish().or(z.literal("")),
});

export const updateProductSchema = createProductSchema.extend({
  id: z.string().min(1),
  status: productStatusSchema,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
