/**
 * Bootstraps the single OWNER account needed to log into a fresh
 * environment. This is NOT demo/fixture data — it creates zero clients,
 * products, instances, subscriptions, or payments. The dashboard's "0
 * client" empty state after seeding is correct, not a bug.
 *
 * Usage: pnpm db:seed
 * Override the default local credentials with SEED_OWNER_EMAIL /
 * SEED_OWNER_PASSWORD env vars — required in any non-local environment.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_OWNER_EMAIL ?? "owner@asoditech.local";
  const password = process.env.SEED_OWNER_PASSWORD ?? "change-me-immediately";

  const passwordHash = await bcrypt.hash(password, 12);

  const owner = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Propriétaire ASODITECH",
      passwordHash,
      role: "OWNER",
      status: "ACTIVE",
    },
  });

  console.log(`Compte propriétaire prêt : ${owner.email}`);
  if (!process.env.SEED_OWNER_PASSWORD) {
    console.log(`Mot de passe par défaut (local uniquement) : ${password}`);
    console.log("Changez ce mot de passe avant tout déploiement non local.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
