# src/lib/db — PostgreSQL (Supabase) data access layer

This is the **only** place the app talks to the database. Every model in
`prisma/schema.prisma` is read/written exclusively through the repository
files here — nothing else in the codebase imports `@/generated/prisma`
directly, and nothing depends on the old `.data/*.json` files anymore
(those files, and the code that read/wrote them, no longer exist). The
database itself is Supabase Postgres — see `DATABASE_URL`/`DIRECT_URL` in
`.env.example`.

| File | Replaces | Models |
|---|---|---|
| `client.ts` | — | Prisma client singleton (driver adapter + pooled connection pool) |
| `lock.ts` | the in-process `Map`-based lock in the old `game/store.ts` | Postgres advisory locks — see below |
| `users.ts` | `src/lib/auth/dev-store.ts` | `User` |
| `wallet-challenges.ts` | `src/lib/wallet/challenge-store.ts` | `WalletChallenge` |
| `matches.ts` | `src/lib/game/store.ts` (runtime half) | `Match`, `MatchPlayer`, `QueueEntry` |
| `subscriptions.ts` | — | `Subscription` |
| `stripe-events.ts` | — | `StripeEvent` |
| `private-rooms.ts` | — | `PrivateRoom` |
| `tournaments.ts` | — | `Tournament`, `TournamentParticipant` |

Profile pictures are **not** in this directory — they live in Supabase
Storage, not Postgres. See `src/lib/storage/supabase-avatar-storage.ts`.

Every repository function keeps the **exact same name and shape** the old
JSON-store function had (just `async` now) — this was a deliberate
migration choice so call sites only ever needed an import-path change plus
`await`, never a rewrite of the business logic that calls them
(`match-service.ts`'s PNL-freezing/Elo/forfeit logic, `matchmaking.ts`,
every API route). Types (`StoredMatch`, `MatchPlayerRecord`, `PublicUser`,
etc.) mostly still live next to where they always did
(`src/lib/game/store.ts`, now types-only with zero runtime code) so
`import type` sites in client components didn't need to change at all.

## Concurrency: Postgres advisory locks, not row locks or SERIALIZABLE

`withLock(key, fn)` in `lock.ts` is a drop-in replacement for the old
in-process lock, but backed by `pg_advisory_xact_lock` — a named,
transaction-scoped mutex enforced by the database itself. This is what
makes match mutation and matchmaking safe across **multiple server
instances**, not just multiple requests within one Node process (which is
all the old in-memory lock could ever guarantee).

Two lock keys are used throughout the app, unchanged from before:

- `QUEUE_LOCK_KEY` ("queue") — serializes the entire "read the queue, pick
  an opponent, create a match, remove both players from the queue"
  decision in `POST /api/play/state`. Combined with `QueueEntry.userId`
  being the table's primary key (so `addToQueue` is an upsert, not an
  insert), this is what prevents duplicate matches, a user ending up in
  two matches at once, or a user matching themselves.
- A per-`matchId` lock — serializes every mutation of a single match
  (`verifyMatchPnl`, `startMatch`, `getLiveMatchView`'s auto-finalize,
  `forfeitMatch`), exactly like before.

The lock is held for the whole transaction, including any external network
calls inside `fn` (e.g. the Solana Tracker PNL/top-token fetch) — the
transaction `timeout`/`maxWait` in `lock.ts` are set generously (20s) to
accommodate that; this mirrors the old in-process lock's behavior exactly,
just enforced by Postgres instead of a JS `Map`.

## Bots are denormalized, not fake User rows

A bot opponent's app-level id (`"bot:GHOSTWICK"`) is never written to
`MatchPlayer.userId` — that column has a real foreign key to `User.id`, so
writing a fake id there would violate it. Bots write `userId: null` +
`isBot: true` + `username` instead; `"bot:<username>"` is reconstructed at
read time. See the mapping functions at the top of `matches.ts`.

## Avatars are stored in Supabase Storage, not Postgres

`src/lib/storage/supabase-avatar-storage.ts` uploads to the public
`avatars` bucket (created by `scripts/supabase-storage-setup.ts`) using the
service_role key — never the client. `User.profileImageUrl` stores the
resulting direct public URL. The `AvatarStorage` interface in
`src/lib/storage/avatar-storage.ts` means swapping to a different backend
later is still a one-file change.

## Local dev seed data

`prisma/seed.ts` creates one demo account for local development. It is
**not** wired into any Prisma CLI hook — `prisma migrate deploy` (the
production-safe migration command) never touches it. Run it explicitly:

```bash
npm run db:seed
```
