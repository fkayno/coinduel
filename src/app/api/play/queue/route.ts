import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { addToQueue, findActiveMatchForUser, getQueueEntry, removeFromQueue } from "@/lib/db/matches";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST() {
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

  // A user can't queue while they already have a match in flight.
  const activeMatch = await findActiveMatchForUser(user.id);
  if (activeMatch) {
    return NextResponse.json({ error: "Already in a match.", matchId: activeMatch.id }, { status: 409 });
  }

  // Joining while already queued is a harmless no-op, not an error.
  if (!(await getQueueEntry(user.id))) {
    await addToQueue({
      userId: user.id,
      username: user.username,
      mmr: user.mmr,
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
