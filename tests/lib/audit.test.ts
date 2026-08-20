import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/audit";
import { resetDb } from "../helpers/db";
import { createTestUser } from "../helpers/auth";

describe("audit log", () => {
  beforeEach(resetDb);
  afterEach(resetDb);

  it("records a structured event with actor, action, entity, and metadata", async () => {
    const user = await createTestUser();

    await recordAuditEvent({
      actorType: "USER",
      actorUserId: user.id,
      action: "client.created",
      entityType: "Client",
      entityId: "client-123",
      metadata: { companyName: "Acme" },
    });

    const events = await prisma.auditEvent.findMany();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      actorType: "USER",
      actorUserId: user.id,
      action: "client.created",
      entityType: "Client",
      entityId: "client-123",
    });
    expect(events[0].metadata).toEqual({ companyName: "Acme" });
  });

  it("supports a system/instance actor with no actorUserId", async () => {
    await recordAuditEvent({
      actorType: "INSTANCE",
      action: "license.verify.success",
      entityType: "Instance",
      entityId: "instance-123",
    });

    const event = await prisma.auditEvent.findFirstOrThrow();
    expect(event.actorType).toBe("INSTANCE");
    expect(event.actorUserId).toBeNull();
  });

  it("survives the actor user being deleted (SetNull, not cascade)", async () => {
    const user = await createTestUser();
    await recordAuditEvent({
      actorType: "USER",
      actorUserId: user.id,
      action: "client.created",
      entityType: "Client",
      entityId: "client-123",
    });

    await prisma.user.delete({ where: { id: user.id } });

    const event = await prisma.auditEvent.findFirstOrThrow();
    expect(event.actorUserId).toBeNull();
    expect(event.action).toBe("client.created");
  });
});
