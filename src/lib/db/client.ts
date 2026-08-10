import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * SERVER-ONLY. Single Prisma client for the whole app, backed by a
 * PostgreSQL connection pool via the `pg` driver adapter (required by
 * Prisma ORM 7 — there is no built-in query engine binary anymore).
 *
 * Never import this (or anything under src/lib/db/) from a "use client"
 * file — it pulls in `pg`/`node:net` and generated engine code that can't
 * run in a browser bundle. Every src/lib/db/*.ts module is a server-only
 * repository that route handlers and server components call into.
 *
 * Cached on `globalThis` in development so Next.js's hot-reload doesn't
 * spin up a fresh connection pool on every file save (a common Prisma+Next
 * footgun otherwise) — standard Prisma singleton pattern.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Every production data path now requires a real PostgreSQL connection — see .env.example."
    );
  }

  const pool = globalForPrisma.pgPool ?? new Pool({ connectionString });
  if (process.env.NODE_ENV !== "production") globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
