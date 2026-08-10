import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createPrivateDuel, PrivateDuelError, cancelPrivateDuel } from "@/lib/game/private-duel-service";
import { checkRateLimit } from "@/lib/rate-limit";

/** Creates (or returns the already-existing) WAITING private room for this user. PRO-gated server-side. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  if (!checkRateLimit(`private-room-create:${user.id}`, 10, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  try {
    const room = await createPrivateDuel(user);
    return NextResponse.json({ code: room.code, expiresAt: room.expiresAt });
  } catch (error) {
    if (error instanceof PrivateDuelError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to create private duel room:", error);
    return NextResponse.json({ error: "Couldn't create a private duel room. Try again." }, { status: 500 });
  }
}

/** Cancels the caller's own waiting room (e.g. they navigate away before anyone joins). */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await cancelPrivateDuel(user.id);
  return NextResponse.json({ ok: true });
}
