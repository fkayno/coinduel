import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { joinPrivateDuel, PrivateDuelError } from "@/lib/game/private-duel-service";
import { checkRateLimit } from "@/lib/rate-limit";

/** Joins an existing private room by code and starts the real duel. PRO-gated server-side. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  // Tighter than most limits here on purpose — this is the one place a
  // client could try to brute-force-guess another user's room code.
  if (!checkRateLimit(`private-room-join:${user.id}`, 15, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  if (!code.trim()) {
    return NextResponse.json({ error: "Enter a room code." }, { status: 400 });
  }

  try {
    const result = await joinPrivateDuel(user, code);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PrivateDuelError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Failed to join private duel:", error);
    return NextResponse.json({ error: "Couldn't join that room. Try again." }, { status: 500 });
  }
}
