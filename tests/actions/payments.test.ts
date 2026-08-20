import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createPaymentAction } from "@/actions/payments";
import { resetDb } from "../helpers/db";
import { loginAsTestUser } from "../helpers/auth";
import {
  createTestClient,
  createTestInstance,
  createTestProduct,
  createTestSubscription,
} from "../helpers/fixtures";
import { mockCookieStore } from "../mocks/cookie-store";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("createPaymentAction", () => {
  beforeEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });
  afterEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });

  it("records a one-off payment with no subscription", async () => {
    const user = await loginAsTestUser();
    const client = await createTestClient();

    const result = await createPaymentAction(
      formData({
        clientId: client.id,
        amount: "1000",
        currency: "MAD",
        paymentDate: "2026-01-01",
        status: "SUCCEEDED",
        method: "BANK_TRANSFER",
      })
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.subscriptionId).toBeNull();
      expect(result.data.recordedById).toBe(user.id);
    }
  });

  it("rejects a subscription that belongs to a different client", async () => {
    await loginAsTestUser();
    const clientA = await createTestClient();
    const clientB = await createTestClient();
    const product = await createTestProduct();
    const { instance } = await createTestInstance({ clientId: clientA.id, productId: product.id });
    const subscription = await createTestSubscription({
      clientId: clientA.id,
      instanceId: instance.id,
    });

    const result = await createPaymentAction(
      formData({
        clientId: clientB.id, // mismatched on purpose
        subscriptionId: subscription.id,
        amount: "500",
        currency: "MAD",
        paymentDate: "2026-01-01",
        status: "SUCCEEDED",
        method: "CARD",
      })
    );

    expect(result.ok).toBe(false);
  });

  it("rejects a non-positive amount", async () => {
    await loginAsTestUser();
    const client = await createTestClient();
    const result = await createPaymentAction(
      formData({
        clientId: client.id,
        amount: "0",
        currency: "MAD",
        paymentDate: "2026-01-01",
        status: "SUCCEEDED",
        method: "CASH",
      })
    );
    expect(result.ok).toBe(false);
  });
});
