import { prisma } from "@/lib/db/client";
import { Prisma } from "@/generated/prisma/client";

/**
 * SERVER-ONLY. PostgreSQL-backed WebRTC signaling + presence store —
 * replaces the old file-based src/lib/video/store.ts (.data/signals/*.json,
 * .data/dev-presence.json), which only worked within a single long-lived
 * process. That's unsafe on serverless hosting (e.g. Vercel): two requests
 * for the same match can land on different instances with no shared
 * filesystem, so one player's offer/ICE candidates could silently never
 * reach the other. Signaling messages (SDP offers/answers, ICE candidates)
 * are scoped strictly to a matchId — there is no free-form "room id" a
 * client can supply, so a user can only ever reach the signaling channel for
 * a match they're actually verified to belong to (enforced in the route
 * handlers, not here).
 */

export type SignalType = "offer" | "answer" | "ice-candidate" | "leave";

export interface SignalMessage {
  id: string;
  matchId: string;
  fromUserId: string;
  seq: number;
  type: SignalType;
  payload: unknown;
  createdAt: string;
}

export async function appendSignal(
  matchId: string,
  fromUserId: string,
  type: SignalType,
  payload: unknown
): Promise<SignalMessage> {
  const row = await prisma.videoSignal.create({
    data: {
      matchId,
      fromUserId,
      type,
      // Prisma's Json column rejects a plain JS `null`/`undefined` — those
      // need the sentinel values below to mean "store SQL NULL."
      payload: payload === undefined || payload === null ? Prisma.DbNull : (payload as Prisma.InputJsonValue),
    },
  });

  return {
    id: String(row.id),
    matchId: row.matchId,
    fromUserId: row.fromUserId,
    seq: row.id,
    type: row.type as SignalType,
    payload: row.payload,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Messages newer than `sinceSeq`, sent by the OTHER participant. */
export async function getSignalsSince(
  matchId: string,
  sinceSeq: number,
  excludeUserId: string
): Promise<SignalMessage[]> {
  const rows = await prisma.videoSignal.findMany({
    where: { matchId, id: { gt: sinceSeq }, fromUserId: { not: excludeUserId } },
    orderBy: { id: "asc" },
  });

  return rows.map((row) => ({
    id: String(row.id),
    matchId: row.matchId,
    fromUserId: row.fromUserId,
    seq: row.id,
    type: row.type as SignalType,
    payload: row.payload,
    createdAt: row.createdAt.toISOString(),
  }));
}

// --- Presence (heartbeat-based). Drives the video connection-status UI
// only — never the match's PNL/MMR outcome, which stays purely
// server-timestamp-driven in src/lib/game/match-service.ts.

export interface PresenceEntry {
  userId: string;
  lastSeenAt: string;
}

export async function heartbeat(matchId: string, userId: string): Promise<void> {
  const lastSeenAt = new Date();
  await prisma.videoPresence.upsert({
    where: { matchId_userId: { matchId, userId } },
    create: { matchId, userId, lastSeenAt },
    update: { lastSeenAt },
  });
}

export async function getPresence(matchId: string): Promise<PresenceEntry[]> {
  const rows = await prisma.videoPresence.findMany({ where: { matchId } });
  return rows.map((row) => ({ userId: row.userId, lastSeenAt: row.lastSeenAt.toISOString() }));
}
