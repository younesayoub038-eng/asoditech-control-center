"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserForAction } from "@/lib/auth/guards";
import { recordAuditEvent } from "@/lib/audit";
import { createProductSchema, updateProductSchema } from "@/lib/validation/product";
import { actionError, actionOk, type ActionResult } from "@/actions/types";
import type { Product } from "@prisma/client";

function normalizeOptional(value: string | null | undefined): string | null {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export async function createProductAction(formData: FormData): Promise<ActionResult<Product>> {
  const user = await requireUserForAction();

  const parsed = createProductSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    currentVersion: formData.get("currentVersion"),
  });
  if (!parsed.success) {
    return actionError("Champs invalides.", parsed.error.flatten().fieldErrors);
  }

  const slugTaken = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (slugTaken) {
    return actionError("Ce slug est déjà utilisé.", { slug: ["Ce slug est déjà utilisé."] });
  }

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: normalizeOptional(parsed.data.description),
      currentVersion: normalizeOptional(parsed.data.currentVersion),
    },
  });

  await recordAuditEvent({
    actorType: "USER",
    actorUserId: user.id,
    action: "product.created",
    entityType: "Product",
    entityId: product.id,
    metadata: { slug: product.slug },
  });

  revalidatePath("/produits");
  return actionOk(product);
}

export async function updateProductAction(formData: FormData): Promise<ActionResult<Product>> {
  const user = await requireUserForAction();

  const parsed = updateProductSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    currentVersion: formData.get("currentVersion"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return actionError("Champs invalides.", parsed.error.flatten().fieldErrors);
  }

  const existing = await prisma.product.findUnique({ where: { id: parsed.data.id } });
  if (!existing) {
    return actionError("Produit introuvable.");
  }

  if (parsed.data.slug !== existing.slug) {
    const slugTaken = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
    if (slugTaken) {
      return actionError("Ce slug est déjà utilisé.", { slug: ["Ce slug est déjà utilisé."] });
    }
  }

  const product = await prisma.product.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: normalizeOptional(parsed.data.description),
      currentVersion: normalizeOptional(parsed.data.currentVersion),
      status: parsed.data.status,
    },
  });

  await recordAuditEvent({
    actorType: "USER",
    actorUserId: user.id,
    action: "product.updated",
    entityType: "Product",
    entityId: product.id,
    metadata: { previousStatus: existing.status, newStatus: product.status },
  });

  revalidatePath("/produits");
  revalidatePath(`/produits/${product.id}`);
  return actionOk(product);
}
