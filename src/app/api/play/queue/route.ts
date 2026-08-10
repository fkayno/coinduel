import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { addToQueue, findActiveMatchForUser, getQueueEntry, removeFromQueue } from "@/lib/db/matches";
import { checkRateLimit } from "@/lib/rate-limit";
import { DEFAULT_GAME_MODE, isGameMode } from "@/lib/game/game-modes";
import { getModeStats } from "@/lib/db/mode-ratings";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  if (!checkRateLimit(`queue-join:${user.id}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  // Server-side enforcement — the real security boundary. The UI also
  // hides/disables the Find Match button for unverified users, but that's
  // just UX; this check is what actually stops ranked play without a
  // cryptographically verified wallet, regardless of what the client sends.
  if (!user.walletVerified || !user.walletAddress) {
    return NextResponse.json(
      { error: "Verify your Solana wallet before playing ranked matches.", code: "WALLET_NOT_VERIFIED" },
      { status: 403 }
    );
  }

  // Strict allowlist — never trust an arbitrary client-supplied timeframe
  // string. An invalid/missing value falls back to the original ALL_TIME
  // mode rather than erroring, so this endpoint stays backwards-compatible
  // with any caller that doesn't send a body at all.
  const body = await request.json().catch(() => null);
  const requestedMode = body?.gameMode;
  const gameMode = isGameMode(requestedMode) ? requestedMode : DEFAULT_GAME_MODE;

  // A user can't queue while they already have a match in flight.
  const activeMatch = await findActiveMatchForUser(user.id);
  if (activeMatch) {
    return NextResponse.json({ error: "Already in a match.", matchId: activeMatch.id }, { status: 409 });
  }

  // Joining while already queued is a harmless no-op (but DOES let a player
  // switch mode/refresh their MMR snapshot by re-queueing) — addToQueue is
  // an upsert on userId, so this can never create a second queue row for
  // the same user, which is what guarantees a player can't be simultaneously
  // queued in two modes at once.
  if (!(await getQueueEntry(user.id))) {
    // ALL_TIME keeps using the account's real (global) MMR; the three timed
    // modes use that mode's own rating, defaulting to 1000 the first time a
    // user queues for it — never the ALL_TIME value, which would let a
    // veteran All-Time player unfairly skip the timed ladder.
    const mmr =
      gameMode === "ALL_TIME" ? user.mmr : (await getModeStats(user.id, gameMode)).mmr;

    await addToQueue({
      userId: user.id,
      username: user.username,
      mmr,
      gameMode,
      joinedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await removeFromQueue(user.id);
  return NextResponse.json({ ok: true });
}
