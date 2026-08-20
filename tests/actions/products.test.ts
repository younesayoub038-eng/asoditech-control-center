import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createProductAction, updateProductAction } from "@/actions/products";
import { resetDb } from "../helpers/db";
import { loginAsTestUser } from "../helpers/auth";
import { mockCookieStore } from "../mocks/cookie-store";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("product actions", () => {
  beforeEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });
  afterEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });

  it("rejects an unauthenticated caller", async () => {
    await expect(
      createProductAction(formData({ name: "Gestion", slug: "gestion" }))
    ).rejects.toThrow(/non autorisé/i);
  });

  it("rejects a duplicate slug on create", async () => {
    await loginAsTestUser();
    const first = await createProductAction(formData({ name: "Gestion", slug: "gestion-ecom" }));
    expect(first.ok).toBe(true);

    const second = await createProductAction(
      formData({ name: "Autre nom", slug: "gestion-ecom" })
    );
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.fieldErrors?.slug).toBeTruthy();
    }
  });

  it("rejects renaming a product's slug to one already taken by another product", async () => {
    await loginAsTestUser();
    const a = await createProductAction(formData({ name: "Product A", slug: "product-a" }));
    const b = await createProductAction(formData({ name: "Product B", slug: "product-b" }));
    if (!a.ok || !b.ok) throw new Error("setup failed");

    const result = await updateProductAction(
      formData({ id: b.data.id, name: "Product B", slug: "product-a", status: "ACTIVE" })
    );
    expect(result.ok).toBe(false);
  });

  it("allows keeping the same slug on update", async () => {
    await loginAsTestUser();
    const created = await createProductAction(formData({ name: "Product A", slug: "product-a" }));
    if (!created.ok) throw new Error("setup failed");

    const result = await updateProductAction(
      formData({ id: created.data.id, name: "Product A renamed", slug: "product-a", status: "ACTIVE" })
    );
    expect(result.ok).toBe(true);
  });
});
