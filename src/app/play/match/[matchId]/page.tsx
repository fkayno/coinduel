import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getLiveMatchView } from "@/lib/game/match-service";
import { getProStatusMap } from "@/lib/billing/entitlement";
import { DuelRoom } from "@/components/play/duel-room";

export const metadata: Metadata = {
  title: "Duel — CoinDuel",
};

export default async function MatchPage(props: PageProps<"/play/match/[matchId]">) {
  const user = await requireUser();
  const { matchId } = await props.params;

  const view = await getLiveMatchView(matchId);
  if (!view) redirect("/play");

  const isParticipant = view.match.players.some((p) => p.userId === user.id);
  if (!isParticipant) redirect("/play");

  const proStatus = await getProStatusMap(view.match.players.map((p) => p.userId));

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <DuelRoom
        matchId={matchId}
        currentUserId={user.id}
        initialView={view}
        proStatus={proStatus}
      />
    </div>
  );
}
