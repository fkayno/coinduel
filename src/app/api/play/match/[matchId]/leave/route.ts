import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { forfeitMatch } from "@/lib/game/match-service";

/**
 * Called when a player clicks "LEAVE MATCH", or when their tab is closed
 * mid-match (see the `pagehide` handler in duel-room.tsx). The leaving
 * player always forfeits — this is the authoritative, server-side outcome;
 * the client's own WebRTC "leave" signal is a separate, best-effort UI
 * courtesy to the opponent and never determines the match result.
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/play/match/[matchId]/leave">
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { matchId } = await ctx.params;
  const match = await forfeitMatch(matchId, user.id);
  if (!match) return NextResponse.json({ error: "Match not found." }, { status: 404 });

  const isParticipant = match.players.some((p) => p.userId === user.id);
  if (!isParticipant) return NextResponse.json({ error: "Not your match." }, { status: 403 });

  return NextResponse.json({ match });
}
