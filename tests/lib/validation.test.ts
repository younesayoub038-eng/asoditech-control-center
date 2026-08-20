import { describe, expect, it } from "vitest";
import { createClientSchema } from "@/lib/validation/client";
import { createProductSchema } from "@/lib/validation/product";
import { createInstanceSchema, INSTANCE_STATUS_TRANSITIONS } from "@/lib/validation/instance";
import {
  createSubscriptionSchema,
  SUBSCRIPTION_STATUS_TRANSITIONS,
} from "@/lib/validation/subscription";
import { createPaymentSchema } from "@/lib/validation/payment";
import { loginSchema } from "@/lib/validation/auth";

describe("createClientSchema", () => {
  it("accepts a minimal valid client", () => {
    expect(createClientSchema.safeParse({ companyName: "Acme SARL" }).success).toBe(true);
  });

  it("rejects a missing company name", () => {
    expect(createClientSchema.safeParse({ companyName: "" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = createClientSchema.safeParse({ companyName: "Acme", email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("allows an empty-string email (optional field left blank in a form)", () => {
    const result = createClientSchema.safeParse({ companyName: "Acme", email: "" });
    expect(result.success).toBe(true);
  });
});

describe("createProductSchema", () => {
  it("rejects an uppercase slug", () => {
    expect(
      createProductSchema.safeParse({ name: "Gestion", slug: "Gestion-Ecommerce" }).success
    ).toBe(false);
  });

  it("rejects a slug with spaces", () => {
    expect(
      createProductSchema.safeParse({ name: "Gestion", slug: "gestion ecommerce" }).success
    ).toBe(false);
  });

  it("accepts a well-formed kebab-case slug", () => {
    expect(
      createProductSchema.safeParse({ name: "Gestion", slug: "gestion-ecommerce" }).success
    ).toBe(true);
  });
});

describe("createInstanceSchema", () => {
  it("requires clientId and productId", () => {
    const result = createInstanceSchema.safeParse({ clientId: "", productId: "", label: "Prod" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid deployment URL", () => {
    const result = createInstanceSchema.safeParse({
      clientId: "c1",
      productId: "p1",
      label: "Prod",
      url: "not a url",
    });
    expect(result.success).toBe(false);
  });
});

describe("INSTANCE_STATUS_TRANSITIONS", () => {
  it("does not allow skipping PROVISIONING straight to SUSPENDED", () => {
    expect(INSTANCE_STATUS_TRANSITIONS.PROVISIONING).not.toContain("SUSPENDED");
  });

  it("DECOMMISSIONED is terminal", () => {
    expect(INSTANCE_STATUS_TRANSITIONS.DECOMMISSIONED).toEqual([]);
  });

  it("ACTIVE can suspend or decommission but not go back to PROVISIONING", () => {
    expect(INSTANCE_STATUS_TRANSITIONS.ACTIVE).toEqual(
      expect.arrayContaining(["SUSPENDED", "DECOMMISSIONED"])
    );
    expect(INSTANCE_STATUS_TRANSITIONS.ACTIVE).not.toContain("PROVISIONING");
  });
});

describe("createSubscriptionSchema", () => {
  it("rejects a zero or negative amount", () => {
    const base = {
      clientId: "c1",
      instanceId: "i1",
      planName: "Standard",
      currency: "MAD",
      billingInterval: "MONTHLY" as const,
      startDate: new Date(),
    };
    expect(createSubscriptionSchema.safeParse({ ...base, amount: 0 }).success).toBe(false);
    expect(createSubscriptionSchema.safeParse({ ...base, amount: -50 }).success).toBe(false);
    expect(createSubscriptionSchema.safeParse({ ...base, amount: 50 }).success).toBe(true);
  });

  it("rejects a currency code that isn't 3 letters", () => {
    const base = {
      clientId: "c1",
      instanceId: "i1",
      planName: "Standard",
      amount: 50,
      billingInterval: "MONTHLY" as const,
      startDate: new Date(),
    };
    expect(createSubscriptionSchema.safeParse({ ...base, currency: "MADX" }).success).toBe(false);
    expect(createSubscriptionSchema.safeParse({ ...base, currency: "12" }).success).toBe(false);
    expect(createSubscriptionSchema.safeParse({ ...base, currency: "mad" }).success).toBe(true);
  });
});

describe("SUBSCRIPTION_STATUS_TRANSITIONS", () => {
  it("CANCELLED is terminal", () => {
    expect(SUBSCRIPTION_STATUS_TRANSITIONS.CANCELLED).toEqual([]);
  });

  it("PAST_DUE can recover to ACTIVE", () => {
    expect(SUBSCRIPTION_STATUS_TRANSITIONS.PAST_DUE).toContain("ACTIVE");
  });
});

describe("createPaymentSchema", () => {
  it("requires a positive amount and a client", () => {
    const result = createPaymentSchema.safeParse({
      clientId: "",
      amount: -1,
      currency: "MAD",
      paymentDate: new Date(),
      status: "SUCCEEDED",
      method: "CARD",
    });
    expect(result.success).toBe(false);
  });

  it("allows an omitted subscriptionId (one-off payment)", () => {
    const result = createPaymentSchema.safeParse({
      clientId: "c1",
      amount: 1000,
      currency: "MAD",
      paymentDate: new Date(),
      status: "SUCCEEDED",
      method: "BANK_TRANSFER",
    });
    expect(result.success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });
});
