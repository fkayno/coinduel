export type RankTier =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND"
  | "MASTER"
  | "GRANDMASTER";

export const RANK_TIERS: { tier: RankTier; color: string; minMmr: number }[] = [
  { tier: "BRONZE", color: "#a8702f", minMmr: 0 },
  { tier: "SILVER", color: "#9ca3af", minMmr: 800 },
  { tier: "GOLD", color: "#e2b13c", minMmr: 1000 },
  { tier: "PLATINUM", color: "#6ee7d8", minMmr: 1200 },
  { tier: "DIAMOND", color: "#7dd3fc", minMmr: 1400 },
  { tier: "MASTER", color: "#c084fc", minMmr: 1600 },
  { tier: "GRANDMASTER", color: "#22e07a", minMmr: 1800 },
];

export interface BattlePlayer {
  name: string;
  rank: string;
  mmr: number;
  pnl: number;
}

export const HERO_BATTLE: { playerA: BattlePlayer; playerB: BattlePlayer } = {
  playerA: { name: "PLAYER A", rank: "GOLD III", mmr: 1482, pnl: 243.18 },
  playerB: { name: "PLAYER B", rank: "GOLD III", mmr: 1501, pnl: 198.42 },
};

export const DUEL_SHOWCASE: { playerA: BattlePlayer; playerB: BattlePlayer } = {
  playerA: { name: "NOVAK_TRADES", rank: "DIAMOND II", mmr: 2184, pnl: 612.44 },
  playerB: { name: "REKT.SOL", rank: "DIAMOND II", mmr: 2201, pnl: -84.12 },
};

export const DUEL_CHART_A = [0, 18, 12, 34, 28, 52, 61, 48, 70, 88, 76, 94, 112];
export const DUEL_CHART_B = [0, -4, 8, 2, -12, -6, 4, -18, -10, -22, -14, -28, -18];

export const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    title: "CONNECT YOUR WALLET",
    description: "Link your Solana wallet and let CoinDuel analyze your trading performance.",
  },
  {
    number: "02",
    title: "FIND AN OPPONENT",
    description: "Get matched against a trader around your MMR.",
  },
  {
    number: "03",
    title: "OUTPERFORM THEM",
    description: "Your PNL is compared head-to-head during the match.",
  },
  {
    number: "04",
    title: "CLIMB THE RANKS",
    description: "Win matches, gain MMR and climb the CoinDuel ladder.",
  },
];

export const MOCK_PLAYER_CARD = {
  rank: "GOLD III",
  mmr: 1482,
  nextRank: "GOLD II",
  progress: 0.64,
};

// Real leaderboard data (LeaderboardEntry, listLeaderboard, winRate) lives
// in src/lib/db/leaderboard.ts — queries actual users by MMR. Nothing here
// is presented as real player standings anymore.
