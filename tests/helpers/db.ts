import { prisma } from "@/lib/prisma";

// Refuse to run against anything that doesn't look like a test database —
// resetDb() is destructive (deletes every row in every table).
if (!/test/i.test(process.env.DATABASE_URL ?? "")) {
  throw new Error(
    `Refusing to run tests: DATABASE_URL does not look like a test database (${process.env.DATABASE_URL}).`
  );
}

/** Wipes every table between tests. Test-DB only — never point this at a real database. */
export async function resetDb() {
  await prisma.$transaction([
    prisma.auditEvent.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.instance.deleteMany(),
    prisma.product.deleteMany(),
    prisma.client.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
