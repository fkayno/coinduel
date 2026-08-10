import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getMatch } from "@/lib/db/matches";
import { appendSignal, getSignalsSince, type SignalType } from "@/lib/db/video-signaling";

const VALID_TYPES: SignalType[] = ["offer", "answer", "ice-candidate", "leave"];

/**
 * The room is always the matchId from the URL — there is no client-supplied
 * "room id" anywhere in this API, so a user can never address a match they
 * aren't verified to belong to.
 */
async function assertParticipant(matchId: string, userId: string): Promise<boolean> {
  const match = await getMatch(matchId);
  return !!match && match.players.some((p) => p.userId === userId);
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/play/match/[matchId]/signal">
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { matchId } = await ctx.params;
  if (!(await assertParticipant(matchId, user.id))) {
    return NextResponse.json({ error: "Not your match." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const type = body?.type as SignalType | undefined;
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid signal type." }, { status: 400 });
  }

  const message = await appendSignal(matchId, user.id, type, body.payload ?? null);
  return NextResponse.json({ seq: message.seq });
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/play/match/[matchId]/signal">
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { matchId } = await ctx.params;
  if (!(await assertParticipant(matchId, user.id))) {
    return NextResponse.json({ error: "Not your match." }, { status: 403 });
  }

  const since = Number(new URL(request.url).searchParams.get("since") ?? "0") || 0;
  const messages = await getSignalsSince(matchId, since, user.id);

  return NextResponse.json({ messages });
}
