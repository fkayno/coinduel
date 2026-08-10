import { prisma } from "@/lib/db/client";
import type { GameMode } from "@/lib/game/game-modes";
import { STARTING_MMR } from "@/lib/game/mmr";

/**
 * SERVER-ONLY. Per-(user, game mode) MMR/wins/losses/streak for the three
 * timed ranked modes (THIRTY_DAYS/SEVEN_DAYS/ONE_DAY) — deliberately never
 * called with "ALL_TIME", which keeps using User.mmr/wins/losses/streak
 * directly (src/lib/db/users.ts's updateUserStats), exactly as it did
 * before game modes existed. See ModeRating in schema.prisma for why.
 */

export type TimedGameMode = Exclude<GameMode, "ALL_TIME">;

export interface ModeStats {
  mmr: number;
  wins: number;
  losses: number;
  streak: number;
}

const DEFAULT_STATS: ModeStats = { mmr: STARTING_MMR, wins: 0, losses: 0, streak: 0 };

/** A user who has never played this mode simply IS at the default rating — no row needs to exist yet. */
export async function getModeStats(userId: string, gameMode: TimedGameMode): Promise<ModeStats> {
  const row = await prisma.modeRating.findUnique({ where: { userId_gameMode: { userId, gameMode } } });
  if (!row) return DEFAULT_STATS;
  return { mmr: row.mmr, wins: row.wins, losses: row.losses, streak: row.streak };
}

export async function getModeStatsMap(
  userIds: string[],
  gameMode: TimedGameMode
): Promise<Record<string, ModeStats>> {
  const rows = await prisma.modeRating.findMany({ where: { userId: { in: userIds }, gameMode } });
  const byUser = new Map(rows.map((r) => [r.userId, r]));

  const result: Record<string, ModeStats> = {};
  for (const userId of userIds) {
    const row = byUser.get(userId);
    result[userId] = row
      ? { mmr: row.mmr, wins: row.wins, losses: row.losses, streak: row.streak }
      : DEFAULT_STATS;
  }
  return result;
}

/** Applies a ranked-match result to a user's per-mode rating — mirrors users.ts's updateUserStats() streak formula exactly. */
export async function updateModeStats(
  userId: string,
  gameMode: TimedGameMode,
  input: { mmr: number; won: boolean }
): Promise<void> {
  const existing = await prisma.modeRating.findUnique({
    where: { userId_gameMode: { userId, gameMode } },
    select: { streak: true },
  });
  const currentStreak = existing?.streak ?? 0;

  const streak = input.won
    ? currentStreak > 0
      ? currentStreak + 1
      : 1
    : currentStreak < 0
      ? currentStreak - 1
      : -1;

  await prisma.modeRating.upsert({
    where: { userId_gameMode: { userId, gameMode } },
    create: {
      userId,
      gameMode,
      mmr: input.mmr,
      wins: input.won ? 1 : 0,
      losses: input.won ? 0 : 1,
      streak,
    },
    update: {
      mmr: input.mmr,
      wins: { increment: input.won ? 1 : 0 },
      losses: { increment: input.won ? 0 : 1 },
      streak,
    },
  });
}

/** For the per-mode leaderboard — same shape/intent as src/lib/db/leaderboard.ts's User-based query, scoped to one timed mode. */
export async function listModeLeaderboard(
  gameMode: TimedGameMode,
  limit: number
): Promise<
  {
    userId: string;
    username: string;
    profileImageUrl: string | null;
    mmr: number;
    wins: number;
    losses: number;
  }[]
> {
  const rows = await prisma.modeRating.findMany({
    where: { gameMode, OR: [{ wins: { gt: 0 } }, { losses: { gt: 0 } }] },
    orderBy: { mmr: "desc" },
    take: limit,
    include: { user: { select: { username: true, profileImageUrl: true } } },
  });

  return rows.map((row) => ({
    userId: row.userId,
    username: row.user.username,
    profileImageUrl: row.user.profileImageUrl,
    mmr: row.mmr,
    wins: row.wins,
    losses: row.losses,
  }));
}
