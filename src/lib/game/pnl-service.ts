import { MOCK_SOLANA_TRACKER } from "@/lib/config";
import { fetchWalletTotalPnl, fetchWalletPeriodRealizedPnl } from "@/lib/game/solanatracker-client";
import type { GameMode } from "@/lib/game/game-modes";

/**
 * PNL provider abstraction. The match system only ever talks to this
 * interface, never to a specific data source.
 *
 * Ranked-match PNL is a single FIXED number per player, fetched once when
 * the match starts and never recomputed — it is explicitly NOT derived
 * from elapsed match time or live coin price movement. Real integration:
 * Solana Tracker's wallet PnL endpoints (solanatracker.io):
 *   - ALL_TIME: the wallet's all-time total (realized + unrealized), plus
 *     its real overall ROI % (Solana Tracker's own `summary.roi` field)
 *   - THIRTY_DAYS / SEVEN_DAYS / ONE_DAY: the wallet's REALIZED PnL over
 *     that trailing window (see solanatracker-client.ts's
 *     fetchWalletPeriodRealizedPnl doc comment for why this is realized-only,
 *     not a fabricated realized+unrealized blend) — that endpoint has no
 *     equivalent window-scoped ROI %, so pnlPercent is always null here.
 */
export interface FixedPnlResult {
  pnl: number;
  /** Real return-on-capital %, only when the data source actually reports one (currently ALL_TIME only). Never estimated. */
  pnlPercent: number | null;
}

export interface PnlProvider {
  /**
   * The player's fixed PNL for an entire match under the given game mode,
   * given their wallet + a per-match seed (seed is only used by the mock
   * provider).
   *
   * When MOCK_SOLANA_TRACKER is false, this NEVER silently falls back to a
   * fake value on failure — it throws PnlUnavailableError instead, so
   * callers can surface a real "unable to verify PNL" error rather than
   * starting a ranked match on made-up data.
   */
  getFixedPnl(walletAddress: string, seed: number, gameMode: GameMode): Promise<FixedPnlResult>;
}

/** Thrown when real wallet PNL can't be retrieved and MUST NOT be faked. */
export class PnlUnavailableError extends Error {}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return function random(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic mock PnL: the same seed always yields the same single
 * number, mixed with the game mode so the four modes don't return identical
 * mock values for the same seed. DEVELOPMENT ONLY (MOCK_SOLANA_TRACKER=true)
 * — never used as a fallback for a failed real lookup, and never presented
 * as real blockchain activity. Only fabricates a percent for ALL_TIME, to
 * mirror the real provider's shape (null for timed modes) during local dev.
 */
function mockFixedPnl(seed: number, gameMode: GameMode): FixedPnlResult {
  const modeOffset = GAME_MODES_ORDER.indexOf(gameMode);
  const random = mulberry32(seed + modeOffset * 7919);
  const pnl = Math.round((random() - 0.35) * 400 * 100) / 100;
  const pnlPercent =
    gameMode === "ALL_TIME" ? Math.round((random() - 0.3) * 120 * 100) / 100 : null;
  return { pnl, pnlPercent };
}

const GAME_MODES_ORDER: GameMode[] = ["ALL_TIME", "THIRTY_DAYS", "SEVEN_DAYS", "ONE_DAY"];

const provider: PnlProvider = {
  async getFixedPnl(walletAddress, seed, gameMode) {
    if (MOCK_SOLANA_TRACKER) {
      return mockFixedPnl(seed, gameMode);
    }

    if (!walletAddress) {
      throw new PnlUnavailableError("No verified wallet address on this account.");
    }

    try {
      switch (gameMode) {
        case "ALL_TIME": {
          const { pnl, roiPercent } = await fetchWalletTotalPnl(walletAddress);
          return { pnl, pnlPercent: roiPercent };
        }
        case "THIRTY_DAYS":
          return { pnl: await fetchWalletPeriodRealizedPnl(walletAddress, "30d"), pnlPercent: null };
        case "SEVEN_DAYS":
          return { pnl: await fetchWalletPeriodRealizedPnl(walletAddress, "7d"), pnlPercent: null };
        case "ONE_DAY":
          return { pnl: await fetchWalletPeriodRealizedPnl(walletAddress, "1d"), pnlPercent: null };
      }
    } catch (error) {
      // Real Solana Tracker call failed — this must NEVER fall back to mock
      // or random data for a ranked match. Propagate so the caller blocks
      // the match instead of starting it on fabricated PNL.
      throw new PnlUnavailableError(
        error instanceof Error ? error.message : "Unable to verify wallet PNL."
      );
    }
  },
};

/**
 * Single entry point the rest of the app calls. Gated by MOCK_SOLANA_TRACKER
 * (env var, see .env and src/lib/config.ts) — set SOLANA_TRACKER_API_KEY and
 * MOCK_SOLANA_TRACKER=false to go live.
 */
export function getPnlProvider(): PnlProvider {
  return provider;
}

export function generatePnlSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
