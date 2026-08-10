import { MOCK_SOLANA_TRACKER } from "@/lib/config";
import { fetchTopProfitableToken } from "@/lib/game/solanatracker-client";
import type { TopToken } from "@/lib/game/store";

/**
 * A handful of well-known Solana memecoin tickers for the deterministic mock
 * (MOCK_SOLANA_TRACKER=true) — no real image URLs, the UI falls back to a
 * generic coin icon when imageUrl is null.
 */
const MOCK_TOKENS: Omit<TopToken, "pnl" | "pnlPercent">[] = [
  { symbol: "BONK", name: "Bonk", imageUrl: null },
  { symbol: "WIF", name: "dogwifhat", imageUrl: null },
  { symbol: "POPCAT", name: "Popcat", imageUrl: null },
  { symbol: "MEW", name: "cat in a dogs world", imageUrl: null },
  { symbol: "GOAT", name: "Goatseus Maximus", imageUrl: null },
  { symbol: "PNUT", name: "Peanut the Squirrel", imageUrl: null },
];

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

function mockTopToken(seed: number): TopToken {
  // Offset from the PNL mock's own seed use so the two don't draw identical
  // sequences and always "agree" in a suspicious pattern.
  const random = mulberry32(seed + 1);
  const pick = MOCK_TOKENS[Math.floor(random() * MOCK_TOKENS.length)];
  // Skewed positive (a wallet's best-performing token is usually an actual
  // winner) but can land negative — mirrors real per-token position data,
  // where even the "most profitable" token can be a (small) loss if
  // nothing the wallet traded ever turned a profit. $ and % share a sign,
  // since a real position's dollar profit and its ROI% always agree.
  const pnl = Math.round((random() - 0.3) * 500 * 100) / 100;
  const pnlPercent = Math.round((pnl >= 0 ? 1 : -1) * random() * 400 * 100) / 100;
  return { ...pick, pnl, pnlPercent };
}

/**
 * The wallet's single most profitable memecoin — decorative only, shown as
 * a small badge on the duel screen. Unlike getPnlProvider().getFixedPnl(),
 * this NEVER throws and never blocks a match: a missing wallet, a failed
 * lookup, or no real API key just means no badge, since it has no bearing
 * on the match result.
 */
export async function getTopToken(walletAddress: string, seed: number): Promise<TopToken | null> {
  if (MOCK_SOLANA_TRACKER) return mockTopToken(seed);
  if (!walletAddress) return null;
  return fetchTopProfitableToken(walletAddress);
}
