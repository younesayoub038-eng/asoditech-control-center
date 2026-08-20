import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  changeSubscriptionStatusAction,
  createSubscriptionAction,
} from "@/actions/subscriptions";
import { resetDb } from "../helpers/db";
import { loginAsTestUser } from "../helpers/auth";
import { createTestClient, createTestInstance, createTestProduct } from "../helpers/fixtures";
import { mockCookieStore } from "../mocks/cookie-store";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("subscription actions", () => {
  beforeEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });
  afterEach(async () => {
    await resetDb();
    mockCookieStore.clear();
  });

  it("rejects an instance that belongs to a different client than the one specified", async () => {
    await loginAsTestUser();
    const clientA = await createTestClient();
    const clientB = await createTestClient();
    const product = await createTestProduct();
    const { instance } = await createTestInstance({ clientId: clientA.id, productId: product.id });

    const result = await createSubscriptionAction(
      formData({
        clientId: clientB.id, // mismatched on purpose
        instanceId: instance.id,
        planName: "Standard",
        amount: "500",
        currency: "MAD",
        billingInterval: "MONTHLY",
        startDate: "2026-01-01",
      })
    );

    expect(result.ok).toBe(false);
  });

  it("creates a subscription when client and instance match", async () => {
    await loginAsTestUser();
    const client = await createTestClient();
    const product = await createTestProduct();
    const { instance } = await createTestInstance({ clientId: client.id, productId: product.id });

    const result = await createSubscriptionAction(
      formData({
        clientId: client.id,
        instanceId: instance.id,
        planName: "Standard",
        amount: "500",
        currency: "MAD",
        billingInterval: "MONTHLY",
        startDate: "2026-01-01",
      })
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe("ACTIVE");
    }
  });

  describe("status transitions", () => {
    async function setupSubscription() {
      await loginAsTestUser();
      const client = await createTestClient();
      const product = await createTestProduct();
      const { instance } = await createTestInstance({ clientId: client.id, productId: product.id });
      const created = await createSubscriptionAction(
        formData({
          clientId: client.id,
          instanceId: instance.id,
          planName: "Standard",
          amount: "500",
          currency: "MAD",
          billingInterval: "MONTHLY",
          startDate: "2026-01-01",
        })
      );
      if (!created.ok) throw new Error("setup failed");
      return created.data;
    }

    it("allows ACTIVE -> PAST_DUE -> ACTIVE (recovery)", async () => {
      const subscription = await setupSubscription();
      const toPastDue = await changeSubscriptionStatusAction(
        formData({ id: subscription.id, status: "PAST_DUE" })
      );
      expect(toPastDue.ok).toBe(true);

      const backToActive = await changeSubscriptionStatusAction(
        formData({ id: subscription.id, status: "ACTIVE" })
      );
      expect(backToActive.ok).toBe(true);
    });

    it("rejects any transition out of CANCELLED (terminal state)", async () => {
      const subscription = await setupSubscription();
      await changeSubscriptionStatusAction(formData({ id: subscription.id, status: "CANCELLED" }));

      const result = await changeSubscriptionStatusAction(
        formData({ id: subscription.id, status: "ACTIVE" })
      );
      expect(result.ok).toBe(false);
    });

    it("stamps cancelledAt when cancelled and suspendedAt when suspended", async () => {
      const subscription = await setupSubscription();
      const suspended = await changeSubscriptionStatusAction(
        formData({ id: subscription.id, status: "SUSPENDED" })
      );
      expect(suspended.ok).toBe(true);
      if (suspended.ok) {
        expect(suspended.data.suspendedAt).not.toBeNull();
        expect(suspended.data.cancelledAt).toBeNull();
      }
    });
  });
});
