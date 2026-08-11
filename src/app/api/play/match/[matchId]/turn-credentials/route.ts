import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getMatch } from "@/lib/db/matches";
import { fetchTurnIceServers } from "@/lib/webrtc/turn";
import { checkRateLimit } from "@/lib/rate-limit";

async function assertParticipant(matchId: string, userId: string): Promise<boolean> {
  const match = await getMatch(matchId);
  return !!match && match.players.some((p) => p.userId === userId);
}

/**
 * Mints short-lived Cloudflare TURN credentials for this match's WebRTC
 * call — never the long-lived API token itself (see src/lib/webrtc/turn.ts).
 * `iceServers: null` means Cloudflare isn't configured or the request
 * failed; the client falls back to STUN-only rather than blocking the match.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/play/match/[matchId]/turn-credentials">
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  if (!checkRateLimit(`turn-credentials:${user.id}`, 10, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const { matchId } = await ctx.params;
  if (!(await assertParticipant(matchId, user.id))) {
    return NextResponse.json({ error: "Not your match." }, { status: 403 });
  }

  const iceServers = await fetchTurnIceServers();
  return NextResponse.json({ iceServers });
}
