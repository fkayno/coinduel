import { prisma } from "@/lib/db/client";
import { getRankForMmr } from "@/lib/game/mmr";
import { getProStatusMap } from "@/lib/billing/entitlement";
import type { RankTier } from "@/lib/mock-data";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  profileImageUrl: string | null;
  tier: RankTier;
  mmr: number;
  wins: number;
  losses: number;
  isPro: boolean;
}

export function winRate(entry: Pick<LeaderboardEntry, "wins" | "losses">): number {
  const total = entry.wins + entry.losses;
  return total === 0 ? 0 : Math.round((entry.wins / total) * 100);
}

/**
 * Real top-N leaderboard, ordered by MMR — replaces the old mock-data-backed
 * table. Only ever includes users with at least one completed match, so a
 * fresh production launch shows an honest (possibly near-empty) leaderboard
 * rather than padding it with players who've never actually played.
 */
export async function listLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
  const rows = await prisma.user.findMany({
    where: { OR: [{ wins: { gt: 0 } }, { losses: { gt: 0 } }] },
    orderBy: { mmr: "desc" },
    take: limit,
    select: {
      id: true,
      username: true,
      profileImageUrl: true,
      mmr: true,
      wins: true,
      losses: true,
    },
  });

  const proStatus = await getProStatusMap(rows.map((r) => r.id));

  return rows.map((row, index) => ({
    rank: index + 1,
    userId: row.id,
    username: row.username,
    profileImageUrl: row.profileImageUrl,
    tier: getRankForMmr(row.mmr),
    mmr: row.mmr,
    wins: row.wins,
    losses: row.losses,
    isPro: proStatus[row.id] ?? false,
  }));
}
