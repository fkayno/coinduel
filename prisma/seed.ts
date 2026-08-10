import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

/**
 * DEVELOPMENT-ONLY seed data.
 *
 * NEVER run this against a production database — it exists purely so a
 * fresh local/dev Postgres instance has something to sign in with and
 * click around. It is NOT wired into any Prisma CLI hook (no
 * `migrations.seed` in prisma.config.ts) — it only ever runs when someone
 * explicitly invokes `npm run db:seed`, deliberately kept as manual and
 * separate from the migration flow as possible. `prisma migrate deploy`
 * (the production-safe migration command) never touches this file.
 *
 * Idempotent — safe to run more than once, skips users that already exist.
 */
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — see .env.example.");
  }

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const email = "demo@example.com";
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`Seed user already exists (${email}), skipping.`);
    } else {
      const user = await prisma.user.create({
        data: {
          username: "demo_player",
          email,
          passwordHash: hashPassword("password123"),
          mmr: 1000,
        },
      });

      console.log(`Seeded ${user.username} (${email} / password123).`);
      console.log("This account has no verified wallet — verify one from /profile to play ranked matches.");
    }

    // Sample tournament seeding is disabled for now — the tournaments page
    // should show an empty state until real tournaments are ready.
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
