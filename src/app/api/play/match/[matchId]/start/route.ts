import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { startMatch } from "@/lib/game/match-service";

/** Called once by the client when the 3-2-1 countdown finishes. Idempotent. */
export async function POST(_request: Request, ctx: RouteContext<"/api/play/match/[matchId]/start">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { matchId } = await ctx.params;
  const match = await startMatch(matchId);
  if (!match) return NextResponse.json({ error: "Match not found." }, { status: 404 });

  const isParticipant = match.players.some((p) => p.userId === user.id);
  if (!isParticipant) return NextResponse.json({ error: "Not your match." }, { status: 403 });

  return NextResponse.json({ match });
}
