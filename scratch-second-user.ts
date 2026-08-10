import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/client";
import { hashPassword } from "./src/lib/auth/password";
import { createSessionToken } from "./src/lib/auth/session";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const email = "duelpro2@example.com";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: "duelpro2",
        email,
        passwordHash: hashPassword("TestPassword123!"),
        mmr: 1000,
        walletAddress: "CogHuKc8hVPU9iVcHKoR79k2vswv1P61XBk7kkDuJQXo",
        walletVerified: true,
      },
    });
  }

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      stripeCustomerId: "cus_manual_test_2",
      stripeSubscriptionId: "sub_manual_test_2",
      stripePriceId: "price_manual_test",
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    },
    update: { status: "active", currentPeriodStart: now, currentPeriodEnd: periodEnd },
  });

  const token = await createSessionToken(user.id);
  console.log("USERID:" + user.id);
  console.log("TOKEN:" + token);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
