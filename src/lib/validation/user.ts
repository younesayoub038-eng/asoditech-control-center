import { z } from "zod";

export const userRoleSchema = z.enum(["OWNER", "ADMIN"]);

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Le nom est requis.").max(200),
  email: z.email("Adresse e-mail invalide."),
  password: z.string().min(10, "Le mot de passe doit contenir au moins 10 caractères."),
  role: userRoleSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
