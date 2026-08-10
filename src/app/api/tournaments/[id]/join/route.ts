import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasProAccess } from "@/lib/billing/entitlement";
import { getTournamentById, registerParticipant } from "@/lib/db/tournaments";

/**
 * Registers the authenticated user for a tournament. Tournament
 * participation is a CoinDuel Pro feature — gated server-side here, not
 * just by hiding the "JOIN" button for free users in the UI.
 */
export async function POST(_request: Request, ctx: RouteContext<"/api/tournaments/[id]/join">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  if (!(await hasProAccess(user.id))) {
    return NextResponse.json(
      { error: "Tournament participation is a CoinDuel Pro feature.", upgradeUrl: "/pricing" },
      { status: 403 }
    );
  }

  const { id } = await ctx.params;
  const tournament = await getTournamentById(id);
  if (!tournament) return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
  if (tournament.status === "COMPLETED") {
    return NextResponse.json({ error: "This tournament has already ended." }, { status: 410 });
  }

  await registerParticipant(id, user.id);
  return NextResponse.json({ ok: true });
}
