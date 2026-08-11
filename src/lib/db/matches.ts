import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { withLock } from "@/lib/db/lock";
import type {
  Match as MatchRow,
  MatchPlayer as MatchPlayerRow,
  QueueEntry as QueueEntryRow,
} from "@/generated/prisma/client";
import type {
  MatchPlayerRecord,
  MatchResult,
  MatchStatus,
  PnlVerificationStatus,
  QueueEntry,
  StoredMatch,
  TopToken,
} from "@/lib/game/store";
import type { GameMode } from "@/lib/game/game-modes";

/**
 * SERVER-ONLY. PostgreSQL-backed replacement for the old
 * src/lib/game/store.ts — same exported function names/shapes (now
 * async), backed by the Match/MatchPlayer/QueueEntry Prisma models. Types
 * (`StoredMatch`, `MatchPlayerRecord`, etc.) still live in
 * src/lib/game/store.ts, which is now types-only (no runtime code, no
 * node:fs) so client-reachable `import type` sites are unaffected.
 *
 * `withLock`/`QUEUE_LOCK_KEY` are re-exported from src/lib/db/lock.ts so
 * every existing call site's single `import {...} from "@/lib/game/store"`
 * (now "@/lib/db/matches") still gets everything from one place.
 */
export { withLock };
export const QUEUE_LOCK_KEY = "queue";

export function createMatchId(): string {
  return randomUUID();
}

// --- Mapping: Prisma rows <-> app-level StoredMatch/MatchPlayerRecord ---

function mapPlayer(row: MatchPlayerRow): MatchPlayerRecord {
  const topToken: TopToken | null = row.topTokenSymbol
    ? {
        symbol: row.topTokenSymbol,
        name: row.topTokenName ?? row.topTokenSymbol,
        imageUrl: row.topTokenImageUrl,
        pnl: row.topTokenPnl ?? 0,
        pnlPercent: row.topTokenPnlPercent ?? 0,
      }
    : null;

  return {
    // Bots are never a real User row (see saveMatch below) — their stable
    // app-level id is reconstructed from isBot + username, matching the
    // "bot:<username>" convention the rest of the app already expects.
    // The empty-string fallback only applies to a real player whose User
    // row was later deleted (onDelete: SetNull on MatchPlayer.user) — an
    // edge case that can only affect old history for an account that no
    // longer exists to log in and compare against.
    userId: row.isBot ? `bot:${row.username}` : (row.userId ?? ""),
    username: row.username,
    walletAddress: row.walletAddress,
    profileImageUrl: row.profileImageUrl,
    isBot: row.isBot,
    mmrBefore: row.mmrBefore,
    mmrAfter: row.mmrAfter,
    pnlSeed: row.pnlSeed,
    startingPnl: row.startingPnl,
    endingPnl: row.endingPnl,
    pnlChange: row.pnlChange,
    pnlPercent: row.pnlPercent,
    result: row.result as MatchResult | null,
    topToken,
  };
}

function mapMatch(matchRow: MatchRow, playerRows: MatchPlayerRow[]): StoredMatch {
  const players = [...playerRows]
    .sort((a, b) => a.playerIndex - b.playerIndex)
    .map(mapPlayer) as [MatchPlayerRecord, MatchPlayerRecord];

  return {
    id: matchRow.id,
    status: matchRow.status as MatchStatus,
    duration: matchRow.duration,
    createdAt: matchRow.createdAt.toISOString(),
    startedAt: matchRow.startedAt?.toISOString() ?? null,
    endedAt: matchRow.endedAt?.toISOString() ?? null,
    winnerId: matchRow.winnerId,
    loserId: matchRow.loserId,
    pnlStatus: matchRow.pnlStatus as PnlVerificationStatus,
    pnlError: matchRow.pnlError,
    forfeitedBy: matchRow.forfeitedBy,
    isRanked: matchRow.isRanked,
    gameMode: matchRow.gameMode as GameMode,
    players,
  };
}

// --- Match read/write ---

/**
 * Upserts the whole match + both player rows in one transaction. Kept as a
 * single "save the whole StoredMatch" primitive (not granular field
 * updates) deliberately — match-service.ts's business logic (PNL freezing,
 * Elo math, forfeit handling) builds a complete StoredMatch in memory and
 * re-saves it wholesale, exactly like the old JSON store; changing that
 * call pattern would mean rewriting business logic this migration isn't
 * meant to touch.
 */
export async function saveMatch(match: StoredMatch): Promise<StoredMatch> {
  await prisma.$transaction(async (tx) => {
    const matchData = {
      status: match.status,
      startedAt: match.startedAt ? new Date(match.startedAt) : null,
      endedAt: match.endedAt ? new Date(match.endedAt) : null,
      winnerId: match.winnerId,
      loserId: match.loserId,
      pnlStatus: match.pnlStatus,
      pnlError: match.pnlError,
      forfeitedBy: match.forfeitedBy,
    };

    await tx.match.upsert({
      where: { id: match.id },
      create: {
        id: match.id,
        duration: match.duration,
        createdAt: new Date(match.createdAt),
        isRanked: match.isRanked,
        gameMode: match.gameMode,
        ...matchData,
      },
      update: matchData,
    });

    for (let playerIndex = 0; playerIndex < match.players.length; playerIndex++) {
      const p = match.players[playerIndex];
      const playerData = {
        // NULL for bots — "bot:<username>" is not a real User.id and would
        // violate the foreign key. isBot + username is what reconstructs
        // the app-level id on read (see mapPlayer above).
        userId: p.isBot ? null : p.userId,
        username: p.username,
        walletAddress: p.walletAddress,
        profileImageUrl: p.profileImageUrl,
        isBot: p.isBot,
        mmrBefore: p.mmrBefore,
        mmrAfter: p.mmrAfter,
        pnlSeed: p.pnlSeed,
        startingPnl: p.startingPnl,
        endingPnl: p.endingPnl,
        pnlChange: p.pnlChange,
        pnlPercent: p.pnlPercent,
        result: p.result,
        topTokenSymbol: p.topToken?.symbol ?? null,
        topTokenName: p.topToken?.name ?? null,
        topTokenImageUrl: p.topToken?.imageUrl ?? null,
        topTokenPnl: p.topToken?.pnl ?? null,
        topTokenPnlPercent: p.topToken?.pnlPercent ?? null,
      };

      await tx.matchPlayer.upsert({
        where: { matchId_playerIndex: { matchId: match.id, playerIndex } },
        create: { matchId: match.id, playerIndex, ...playerData },
        update: playerData,
      });
    }
  });

  return match;
}

export async function getMatch(matchId: string): Promise<StoredMatch | null> {
  const row = await prisma.match.findUnique({ where: { id: matchId }, include: { players: true } });
  return row ? mapMatch(row, row.players) : null;
}

export async function findActiveMatchForUser(userId: string): Promise<StoredMatch | null> {
  const playerRow = await prisma.matchPlayer.findFirst({
    where: { userId, match: { status: { in: ["FOUND", "ACTIVE"] } } },
    include: { match: { include: { players: true } } },
  });
  return playerRow ? mapMatch(playerRow.match, playerRow.match.players) : null;
}

export async function listMatchesForUser(userId: string): Promise<StoredMatch[]> {
  const playerRows = await prisma.matchPlayer.findMany({
    where: { userId, match: { status: "COMPLETED" } },
    include: { match: { include: { players: true } } },
    orderBy: { match: { endedAt: "desc" } },
  });
  return playerRows.map((p) => mapMatch(p.match, p.match.players));
}

// --- Matchmaking queue ---

function mapQueueEntry(row: QueueEntryRow): QueueEntry {
  return {
    userId: row.userId,
    username: row.username,
    mmr: row.mmr,
    gameMode: row.gameMode as GameMode,
    joinedAt: row.joinedAt.toISOString(),
  };
}

export async function getQueueEntry(userId: string): Promise<QueueEntry | null> {
  const row = await prisma.queueEntry.findUnique({ where: { userId } });
  return row ? mapQueueEntry(row) : null;
}

export async function listQueue(): Promise<QueueEntry[]> {
  const rows = await prisma.queueEntry.findMany();
  return rows.map(mapQueueEntry);
}

/** Upsert, not insert — joining while already queued replaces (resets) the existing entry, same as the old JSON store. */
export async function addToQueue(entry: QueueEntry): Promise<void> {
  await prisma.queueEntry.upsert({
    where: { userId: entry.userId },
    create: {
      userId: entry.userId,
      username: entry.username,
      mmr: entry.mmr,
      gameMode: entry.gameMode,
      joinedAt: new Date(entry.joinedAt),
    },
    update: {
      username: entry.username,
      mmr: entry.mmr,
      gameMode: entry.gameMode,
      joinedAt: new Date(entry.joinedAt),
    },
  });
}

export async function removeFromQueue(userId: string): Promise<void> {
  await prisma.queueEntry.deleteMany({ where: { userId } });
}
