import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { findUserById, toPublicUser } from "@/lib/db/users";
import { DEV_MOCK_OPPONENT_DELAY_SECONDS, DEV_MOCK_OPPONENT_ENABLED } from "@/lib/config";
import { pickMockOpponent } from "@/lib/game/bots";
import { botToMatchPlayerInput, createMatch, toMatchPlayerInput } from "@/lib/game/match-service";
import { findQueueOpponent, getSearchRangeForWaitTime } from "@/lib/game/matchmaking";
import {
  findActiveMatchForUser,
  getQueueEntry,
  QUEUE_LOCK_KEY,
  removeFromQueue,
  withLock,
} from "@/lib/db/matches";

/**
 * Polled by the client every second while queued (and once on mount, so a
 * page refresh mid-search or mid-match resumes correctly). Every call also
 * *drives* matchmaking forward — there's no separate background worker.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const activeMatch = await findActiveMatchForUser(user.id);
  if (activeMatch) {
    return NextResponse.json({ state: "match", matchId: activeMatch.id });
  }

  const entry = await getQueueEntry(user.id);
  if (!entry) {
    return NextResponse.json({ state: "idle" });
  }

  const matchId = await withLock(QUEUE_LOCK_KEY, async () => {
    // Re-check inside the lock — another concurrent tick may have already
    // matched this user (or removed them) between the reads above and now.
    if (await findActiveMatchForUser(user.id)) return null;
    const current = await getQueueEntry(user.id);
    if (!current) return null;

    const waitingSeconds = (Date.now() - new Date(current.joinedAt).getTime()) / 1000;
    const range = getSearchRangeForWaitTime(waitingSeconds);

    // ============================================================
    // REAL MATCHMAKING LOGIC
    // ============================================================
    const opponentEntry = await findQueueOpponent(current, range);
    if (opponentEntry) {
      const opponentUser = await findUserById(opponentEntry.userId);
      if (opponentUser) {
        const match = await createMatch(
          toMatchPlayerInput(user),
          toMatchPlayerInput(toPublicUser(opponentUser))
        );
        await removeFromQueue(user.id);
        await removeFromQueue(opponentEntry.userId);
        return match.id;
      }
    }

    // ============================================================
    // DEVELOPMENT MOCK OPPONENT FALLBACK — see src/lib/game/bots.ts
    // ============================================================
    if (DEV_MOCK_OPPONENT_ENABLED && waitingSeconds >= DEV_MOCK_OPPONENT_DELAY_SECONDS) {
      const bot = pickMockOpponent(current.mmr);
      const match = await createMatch(toMatchPlayerInput(user), botToMatchPlayerInput(bot));
      await removeFromQueue(user.id);
      return match.id;
    }

    return null;
  });

  if (matchId) {
    return NextResponse.json({ state: "match", matchId });
  }

  const waitingSeconds = (Date.now() - new Date(entry.joinedAt).getTime()) / 1000;
  return NextResponse.json({
    state: "queued",
    mmr: entry.mmr,
    waitingSeconds: Math.round(waitingSeconds),
    rangeMmr: getSearchRangeForWaitTime(waitingSeconds),
  });
}
