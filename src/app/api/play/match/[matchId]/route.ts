import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getLiveMatchView } from "@/lib/game/match-service";

/**
 * Polled by the client every second while a match is active. This is the
 * server-authoritative clock: it derives elapsed time from `startedAt`,
 * computes PNL itself, and finalizes the match in place once time is up —
 * the browser's own countdown is purely a display, never the source of truth.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/play/match/[matchId]">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { matchId } = await ctx.params;
  const view = await getLiveMatchView(matchId);
  if (!view) return NextResponse.json({ error: "Match not found." }, { status: 404 });

  const isParticipant = view.match.players.some((p) => p.userId === user.id);
  if (!isParticipant) return NextResponse.json({ error: "Not your match." }, { status: 403 });

  return NextResponse.json(view);
}
