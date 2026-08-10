import { prisma } from "@/lib/db/client";
import type { PrivateRoom as PrivateRoomRow } from "@/generated/prisma/client";

export interface StoredPrivateRoom {
  id: string;
  code: string;
  hostUserId: string;
  status: string; // "WAITING" | "MATCHED" | "EXPIRED" | "CANCELLED"
  matchId: string | null;
  createdAt: string;
  expiresAt: string;
}

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O/1/I — avoids visual ambiguity
const CODE_LENGTH = 5;
const ROOM_TTL_MS = 15 * 60 * 1000;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `CD-${code}`;
}

function mapRoom(row: PrivateRoomRow): StoredPrivateRoom {
  return {
    id: row.id,
    code: row.code,
    hostUserId: row.hostUserId,
    status: row.status,
    matchId: row.matchId,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}

/** Retries on the rare code collision (32^5 ≈ 33M possibilities — collisions are near-nonexistent, but never silently overwrite one). */
export async function createPrivateRoom(hostUserId: string): Promise<StoredPrivateRoom> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const row = await prisma.privateRoom.create({
        data: {
          code: generateCode(),
          hostUserId,
          status: "WAITING",
          expiresAt: new Date(Date.now() + ROOM_TTL_MS),
        },
      });
      return mapRoom(row);
    } catch (error) {
      const isUniqueViolation =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002";
      if (!isUniqueViolation) throw error;
    }
  }
  throw new Error("Could not generate a unique room code. Please try again.");
}

export async function getPrivateRoomByCode(code: string): Promise<StoredPrivateRoom | null> {
  const row = await prisma.privateRoom.findUnique({ where: { code: code.toUpperCase() } });
  return row ? mapRoom(row) : null;
}

export async function getWaitingRoomForHost(hostUserId: string): Promise<StoredPrivateRoom | null> {
  const row = await prisma.privateRoom.findFirst({
    where: { hostUserId, status: "WAITING" },
    orderBy: { createdAt: "desc" },
  });
  return row ? mapRoom(row) : null;
}

/** Atomically WAITING -> MATCHED, guarding against two joiners racing the same code — only the first wins. */
export async function claimRoomForMatch(roomId: string, matchId: string): Promise<boolean> {
  const result = await prisma.privateRoom.updateMany({
    where: { id: roomId, status: "WAITING" },
    data: { status: "MATCHED", matchId },
  });
  return result.count === 1;
}

export async function cancelRoom(roomId: string, hostUserId: string): Promise<void> {
  await prisma.privateRoom.updateMany({
    where: { id: roomId, hostUserId, status: "WAITING" },
    data: { status: "CANCELLED" },
  });
}
