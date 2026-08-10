/**
 * DEVELOPMENT MOCK OPPONENT FALLBACK
 *
 * A small roster of seeded bot profiles used only when real matchmaking
 * (src/lib/game/matchmaking.ts) can't find a second real player in the
 * queue within DEV_MOCK_OPPONENT_DELAY_SECONDS. Bots are never written to
 * the user store — they're denormalized directly onto the match record.
 *
 * This is intentionally isolated so it can be deleted or gated off
 * (DEV_MOCK_OPPONENT_ENABLED in src/lib/config.ts) once there are enough
 * real users for the queue to fill on its own.
 *
 * Wallet addresses are REAL, currently-indexed Solana wallets pulled from
 * Solana Tracker's own `/v2/pnl/leaderboard/top` endpoint (verified live
 * against the API on 2026-08-09) — required now that MOCK_SOLANA_TRACKER is
 * off, since getFixedPnl() no longer fakes a value for an unindexed wallet
 * and would otherwise block every match against a bot. These are real
 * top-tier traders, so their ALL-TIME PNL is large (millions of dollars) —
 * bot opponents will usually out-PNL a normal human player. Swap for
 * different real wallets if more balanced bot opponents are wanted later;
 * just don't go back to made-up addresses while MOCK_SOLANA_TRACKER=false.
 */

export interface MockOpponent {
  username: string;
  walletAddress: string;
}

const MOCK_OPPONENTS: MockOpponent[] = [
  { username: "GHOSTWICK", walletAddress: "71i5cxJ7yWWCQeoHpnr68yh65MGg66uutGdiVs6EGE7t" },
  { username: "0xVIPER", walletAddress: "6cNjLym8bDZ5JFGFSDom2us27iF7EBHYUXdFCdC5zWhX" },
  { username: "SOLQUEEN", walletAddress: "6LkGY852ponKKMuq2e7yZXrxnz1jd6weU1XBs7tEvHS" },
  { username: "PUMPFUN_KID", walletAddress: "CogHuKc8hVPU9iVcHKoR79k2vswv1P61XBk7kkDuJQXo" },
  { username: "REKT_SOL", walletAddress: "AiuRbiK8xZmeKyCw1Shk4xCeQyFcShE1KpydwNoETL1K" },
  { username: "DEGEN_ALPHA", walletAddress: "G3yfNkUaTvr1QvAPThRuNL9H5oogVDrzSVopCsY1f1he" },
];

/** Picks a bot with MMR seeded close to the waiting player's MMR. */
export function pickMockOpponent(nearMmr: number): MockOpponent & { mmr: number } {
  const pick = MOCK_OPPONENTS[Math.floor(Math.random() * MOCK_OPPONENTS.length)];
  const mmr = Math.max(0, Math.round(nearMmr + (Math.random() - 0.5) * 80));
  return { ...pick, mmr };
}
