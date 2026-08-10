import { prisma } from "@/lib/db/client";
import type { Tournament as TournamentRow } from "@/generated/prisma/client";
import type { GameMode } from "@/lib/game/game-modes";

export interface StoredTournament {
  id: string;
  name: string;
  description: string | null;
  status: string; // "UPCOMING" | "LIVE" | "COMPLETED"
  startsAt: string | null;
  gameMode: GameMode | null;
  prizeDescription: string | null;
  signupsEnabled: boolean;
  participantCount: number;
}

function mapTournament(row: TournamentRow & { _count: { participants: number } }): StoredTournament {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    startsAt: row.startsAt?.toISOString() ?? null,
    gameMode: (row.gameMode as GameMode | null) ?? null,
    prizeDescription: row.prizeDescription,
    signupsEnabled: row.signupsEnabled,
    participantCount: row._count.participants,
  };
}

export async function listTournaments(): Promise<StoredTournament[]> {
  const rows = await prisma.tournament.findMany({
    include: { _count: { select: { participants: true } } },
    orderBy: { startsAt: "asc" },
  });
  return rows.map(mapTournament);
}

export async function getTournamentById(id: string): Promise<StoredTournament | null> {
  const row = await prisma.tournament.findUnique({
    where: { id },
    include: { _count: { select: { participants: true } } },
  });
  return row ? mapTournament(row) : null;
}

export async function isRegistered(tournamentId: string, userId: string): Promise<boolean> {
  const row = await prisma.tournamentParticipant.findUnique({
    where: { tournamentId_userId: { tournamentId, userId } },
  });
  return row !== null;
}

/** Batch version for the tournament list page — one query instead of N. */
export async function getRegisteredTournamentIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.tournamentParticipant.findMany({
    where: { userId },
    select: { tournamentId: true },
  });
  return new Set(rows.map((r) => r.tournamentId));
}

export async function registerParticipant(tournamentId: string, userId: string): Promise<void> {
  await prisma.tournamentParticipant.upsert({
    where: { tournamentId_userId: { tournamentId, userId } },
    create: { tournamentId, userId },
    update: {},
  });
}
