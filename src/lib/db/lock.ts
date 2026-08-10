import { prisma } from "@/lib/db/client";

/**
 * SERVER-ONLY. Postgres-backed replacement for the old in-process
 * `withLock()` (a JS `Map<string, Promise>` in src/lib/game/store.ts) —
 * same call-site shape (`withLock(key, fn)`), same guarantee ("only one
 * `fn` for this exact key runs at a time"), but now enforced by the
 * database instead of a single Node process's memory. This is what makes
 * matchmaking/match-mutation safety hold across multiple server instances,
 * not just multiple requests within one process.
 *
 * Uses a Postgres advisory lock (`pg_advisory_xact_lock`), transaction-
 * scoped so it's automatically released on commit, rollback, or a crashed
 * connection — never left dangling. `hashtextextended(key, 0)` turns an
 * arbitrary string key (a matchId, or the fixed queue-matching key) into
 * the bigint lock id the function requires.
 *
 * `fn` itself keeps using the plain `prisma` client for its own
 * reads/writes (not the transaction handle) — that's intentional, not a
 * bug: the lock's only job is to stop two `fn` calls for the same key from
 * ever running concurrently. Once that's guaranteed, `fn`'s own queries
 * never race each other regardless of which pooled connection they land
 * on, because nothing else can be holding the same key at the same time.
 *
 * `timeout` is set generously (20s, well past Prisma's 5s interactive-
 * transaction default) because `fn` can include a real network call to
 * Solana Tracker (PNL/top-token verification) — the lock must stay held
 * for that whole round trip, exactly like the old in-process lock did.
 */
export async function withLock<T>(key: string, fn: () => Promise<T> | T): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
      return fn();
    },
    { timeout: 20_000, maxWait: 20_000 }
  );
}
