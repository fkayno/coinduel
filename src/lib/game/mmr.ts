import { RANK_TIERS, type RankTier } from "@/lib/mock-data";

export const STARTING_MMR = 1000;

const K_FACTOR = 32;

/** Standard Elo expected-score formula. */
function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Elo-style MMR change for a completed match. The server is always the
 * caller of this — it is never derived from anything the client submits.
 * Beating a higher-rated opponent yields more MMR; beating a much
 * lower-rated opponent yields less.
 */
export function calculateEloChange(
  winnerMmrBefore: number,
  loserMmrBefore: number
): { winnerChange: number; loserChange: number } {
  const expectedWinner = expectedScore(winnerMmrBefore, loserMmrBefore);
  const expectedLoser = 1 - expectedWinner;

  const winnerChange = Math.max(1, Math.round(K_FACTOR * (1 - expectedWinner)));
  const loserChange = Math.min(-1, Math.round(K_FACTOR * (0 - expectedLoser)));

  return { winnerChange, loserChange };
}

export function getRankForMmr(mmr: number): RankTier {
  let current: RankTier = RANK_TIERS[0].tier;
  for (const tier of RANK_TIERS) {
    if (mmr >= tier.minMmr) current = tier.tier;
  }
  return current;
}
