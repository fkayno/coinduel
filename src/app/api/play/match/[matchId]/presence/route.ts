import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getMatch } from "@/lib/db/matches";
import { getPresence, heartbeat } from "@/lib/db/video-signaling";
import { PRESENCE_TIMEOUT_MS } from "@/lib/config";

async function assertParticipant(matchId: string, userId: string): Promise<boolean> {
  const match = await getMatch(matchId);
  return !!match && match.players.some((p) => p.userId === userId);
}

/** Video-connection-status heartbeat only — never affects match/MMR outcome. */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/play/match/[matchId]/presence">
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { matchId } = await ctx.params;
  if (!(await assertParticipant(matchId, user.id))) {
    return NextResponse.json({ error: "Not your match." }, { status: 403 });
  }

  await heartbeat(matchId, user.id);
  return NextResponse.json({ ok: true });
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/play/match/[matchId]/presence">
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { matchId } = await ctx.params;
  const match = await getMatch(matchId);
  if (!match || !(await assertParticipant(matchId, user.id))) {
    return NextResponse.json({ error: "Not your match." }, { status: 403 });
  }

  const entries = await getPresence(matchId);
  const now = Date.now();
  const players = match.players.map((p) => {
    const entry = entries.find((e) => e.userId === p.userId);
    const online = !!entry && now - new Date(entry.lastSeenAt).getTime() < PRESENCE_TIMEOUT_MS;
    return { userId: p.userId, online };
  });

  return NextResponse.json({ players });
}
