/**
 * Types shared between server and client code for the match/queue domain.
 *
 * This file is deliberately types-only — no runtime code, no node:fs — so
 * every existing `import type {...} from "@/lib/game/store"` site (client
 * components, format.ts, top-token-service.ts) keeps working unchanged.
 * The actual runtime persistence (Postgres via Prisma) lives in
 * src/lib/db/matches.ts; import runtime functions (getMatch, saveMatch,
 * withLock, etc.) from there instead.
 */

export type MatchStatus = "FOUND" | "ACTIVE" | "COMPLETED";
export type MatchResult = "WIN" | "LOSS";

/**
 * Decorative only — the wallet's single most profitable memecoin, shown as
 * a small badge on the duel screen. Never affects match outcome. Populated
 * alongside startingPnl (see ensurePnlFetched in match-service.ts) but,
 * unlike startingPnl, a missing/failed lookup just means no badge — it
 * never blocks or fails a match.
 */
export interface TopToken {
  symbol: string;
  name: string;
  imageUrl: string | null;
  /** Realized profit in USD for this specific token — not the wallet's overall All-Time PNL. */
  pnl: number;
  /** Per-token ROI %, for this same token — not derived from the wallet's overall PNL. */
  pnlPercent: number;
}

export interface MatchPlayerRecord {
  /** Real user id, or "bot:<username>" for a DEV mock opponent (never a real user row). */
  userId: string;
  username: string;
  walletAddress: string | null;
  /** Snapshotted at match-creation time, like username — not a live link. */
  profileImageUrl: string | null;
  isBot: boolean;
  mmrBefore: number;
  mmrAfter: number | null;
  /** Per-player seed for the deterministic mock PNL fallback (see pnl-service.ts). */
  pnlSeed: number;
  /**
   * PNL is FIXED for the whole match — fetched once from Solana Tracker's wallet
   * "Total PnL" when the match starts, and frozen. startingPnl and
   * endingPnl are always equal by design; pnlChange is always 0 and kept
   * only for shape compatibility.
   */
  startingPnl: number | null;
  endingPnl: number | null;
  pnlChange: number | null;
  result: MatchResult | null;
  topToken: TopToken | null;
}

/**
 * Wallet PNL verification is a separate step from "match started" — the
 * client fetches/verifies PNL for both players FIRST (showing "VERIFYING
 * TRADING PERFORMANCE.../FETCHING ALL-TIME PNL..."), and only once this is
 * "READY" does it run the 3-2-1 countdown and call startMatch(), which sets
 * `startedAt`. This keeps a slow/failed PNL lookup from eating into the
 * 30-second match clock. See verifyMatchPnl()/startMatch() in match-service.ts.
 */
export type PnlVerificationStatus = "PENDING" | "READY" | "FAILED";

export interface StoredMatch {
  id: string;
  status: MatchStatus;
  duration: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  winnerId: string | null;
  loserId: string | null;
  pnlStatus: PnlVerificationStatus;
  /** Human-readable reason, set only when pnlStatus is "FAILED". */
  pnlError: string | null;
  /** Set to the leaving player's userId when the match ended via forfeit rather than the clock running out. */
  forfeitedBy: string | null;
  /** false for a CoinDuel Pro private duel — never affects ranked MMR. See match-service.ts's applyMatchResult(). */
  isRanked: boolean;
  players: [MatchPlayerRecord, MatchPlayerRecord];
}

export interface QueueEntry {
  userId: string;
  username: string;
  mmr: number;
  joinedAt: string;
}
