import { prisma } from "@/lib/db/client";
import { getRankForMmr } from "@/lib/game/mmr";
import { getProStatusMap } from "@/lib/billing/entitlement";
import { listModeLeaderboard, type TimedGameMode } from "@/lib/db/mode-ratings";
import type { GameMode } from "@/lib/game/game-modes";
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
 * Real top-N leaderboard, ordered by MMR — one per game mode, never a
 * single table mixing them (ALL_TIME and, say, ONE_DAY MMR aren't
 * comparable numbers — showing them together would be misleading, not just
 * unsorted). ALL_TIME reads straight off User (unchanged since before game
 * modes existed); the three timed modes read from ModeRating. Only ever
 * includes players with at least one completed match in THAT mode, so a
 * fresh mode shows an honest (possibly near-empty) board rather than
 * padding it with players who've never played it.
 */
export async function listLeaderboard(limit: number, gameMode: GameMode = "ALL_TIME"): Promise<LeaderboardEntry[]> {
  if (gameMode !== "ALL_TIME") {
    const rows = await listModeLeaderboard(gameMode as TimedGameMode, limit);
    const proStatus = await getProStatusMap(rows.map((r) => r.userId));

    return rows.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      username: row.username,
      profileImageUrl: row.profileImageUrl,
      tier: getRankForMmr(row.mmr),
      mmr: row.mmr,
      wins: row.wins,
      losses: row.losses,
      isPro: proStatus[row.userId] ?? false,
    }));
  }

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
