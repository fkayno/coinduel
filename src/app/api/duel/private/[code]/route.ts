import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPrivateRoomByCode } from "@/lib/db/private-rooms";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Polled by the host's "waiting for opponent" screen to detect when someone
 * joins — mirrors the existing /api/play/state polling pattern. Room codes
 * are shareable by design (like a game lobby code), so this only requires
 * being logged in, not being the host specifically.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/duel/private/[code]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  // Same room-code-guessing concern as the POST join route below — this GET
  // is polled by the host, but an attacker could otherwise use it to
  // enumerate valid codes at unlimited speed.
  if (!checkRateLimit(`duel-code-lookup:${user.id}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const { code } = await ctx.params;
  const room = await getPrivateRoomByCode(code);
  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  return NextResponse.json({
    status: room.status,
    matchId: room.matchId,
    expiresAt: room.expiresAt,
  });
}
