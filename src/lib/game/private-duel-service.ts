import { hasProAccess } from "@/lib/billing/entitlement";
import { findUserById } from "@/lib/db/users";
import { findActiveMatchForUser } from "@/lib/db/matches";
import {
  cancelRoom,
  claimRoomForMatch,
  createPrivateRoom,
  getPrivateRoomByCode,
  getWaitingRoomForHost,
  type StoredPrivateRoom,
} from "@/lib/db/private-rooms";
import { createMatch, toMatchPlayerInput } from "@/lib/game/match-service";

export class PrivateDuelError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

interface RequestingUser {
  id: string;
  username: string;
  walletAddress: string | null;
  walletVerified: boolean;
  profileImageUrl: string | null;
  mmr: number;
}

/**
 * Private duels reuse the exact same wallet-verification requirement as
 * ranked matchmaking (see /play's page-level gate) — they still freeze real
 * wallet PNL, so an unverified wallet would just fail PNL verification
 * anyway. Checked here too (not just hidden in the UI) since this is an
 * API route any authenticated request could hit directly.
 */
function assertCanPlay(user: RequestingUser): void {
  if (!user.walletVerified || !user.walletAddress) {
    throw new PrivateDuelError("Verify your wallet before creating or joining a private duel.", 403);
  }
}

async function assertNotAlreadyInMatch(userId: string): Promise<void> {
  const active = await findActiveMatchForUser(userId);
  if (active) throw new PrivateDuelError("You're already in an active match.", 409);
}

export async function createPrivateDuel(user: RequestingUser): Promise<StoredPrivateRoom> {
  if (!(await hasProAccess(user.id))) {
    throw new PrivateDuelError("Private duels are a CoinDuel Pro feature.", 403);
  }
  assertCanPlay(user);
  await assertNotAlreadyInMatch(user.id);

  const existingRoom = await getWaitingRoomForHost(user.id);
  if (existingRoom) return existingRoom;

  return createPrivateRoom(user.id);
}

export async function cancelPrivateDuel(userId: string): Promise<void> {
  const room = await getWaitingRoomForHost(userId);
  if (room) await cancelRoom(room.id, userId);
}

export interface JoinResult {
  matchId: string;
}

export async function joinPrivateDuel(user: RequestingUser, rawCode: string): Promise<JoinResult> {
  if (!(await hasProAccess(user.id))) {
    throw new PrivateDuelError("Private duels are a CoinDuel Pro feature.", 403);
  }
  assertCanPlay(user);
  await assertNotAlreadyInMatch(user.id);

  const code = rawCode.trim().toUpperCase();
  const room = await getPrivateRoomByCode(code);
  if (!room) throw new PrivateDuelError("Room code not found.", 404);
  if (room.hostUserId === user.id) throw new PrivateDuelError("You can't join your own room.", 400);
  if (room.status !== "WAITING") throw new PrivateDuelError("This room is no longer available.", 410);
  if (new Date(room.expiresAt).getTime() < Date.now()) {
    throw new PrivateDuelError("This room code has expired.", 410);
  }

  const host = await findUserById(room.hostUserId);
  if (!host) throw new PrivateDuelError("The host account no longer exists.", 404);

  await assertNotAlreadyInMatch(host.id);

  const match = await createMatch(
    toMatchPlayerInput({
      id: host.id,
      username: host.username,
      walletAddress: host.walletAddress,
      profileImageUrl: host.profileImageUrl,
      mmr: host.mmr,
    }),
    toMatchPlayerInput({
      id: user.id,
      username: user.username,
      walletAddress: user.walletAddress,
      profileImageUrl: user.profileImageUrl,
      mmr: user.mmr,
    }),
    false // isRanked — private duels never affect ranked MMR
  );

  // Claim the room for this match atomically — if two joiners somehow raced
  // the same code, only the first claimRoomForMatch wins; the loser's match
  // was already created above though, so it's a real (harmless, unlinked)
  // match rather than left dangling. Vanishingly rare in practice since a
  // room can only be joined by knowing its exact short code.
  const claimed = await claimRoomForMatch(room.id, match.id);
  if (!claimed) throw new PrivateDuelError("This room was just taken by someone else.", 409);

  return { matchId: match.id };
}
