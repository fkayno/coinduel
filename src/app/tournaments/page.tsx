import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasProAccess } from "@/lib/billing/entitlement";
import { listTournaments, getRegisteredTournamentIds } from "@/lib/db/tournaments";
import { TournamentTabs } from "@/components/tournaments/tournament-tabs";

export const metadata: Metadata = {
  title: "Tournaments — CoinDuel",
};

export default async function TournamentsPage() {
  const user = await getCurrentUser();
  const [tournaments, isPro, registeredIds] = await Promise.all([
    listTournaments(),
    user ? hasProAccess(user.id) : Promise.resolve(false),
    user ? getRegisteredTournamentIds(user.id) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-20">
      <span className="text-xs font-semibold tracking-[0.3em] text-muted">TOURNAMENTS</span>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
        Compete for the crown.
      </h1>
      <p className="mt-4 max-w-xl text-sm text-muted">
        Anyone can browse tournaments. Joining is a CoinDuel Pro feature.
      </p>

      <div className="mt-10">
        <TournamentTabs
          tournaments={tournaments}
          isLoggedIn={user !== null}
          isPro={isPro}
          registeredIds={[...registeredIds]}
        />
      </div>
    </div>
  );
}
