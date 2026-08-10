import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getRankForMmr } from "@/lib/game/mmr";
import { findActiveMatchForUser } from "@/lib/db/matches";
import { hasProAccess } from "@/lib/billing/entitlement";
import { getModeStats } from "@/lib/db/mode-ratings";
import { PlayHub } from "@/components/play/play-hub";
import { PrivateDuelPanel } from "@/components/play/private-duel-panel";

export const metadata: Metadata = {
  title: "Play — CoinDuel",
};

export default async function PlayPage() {
  const user = await requireUser();

  // Covers a refresh that lands back on /play while a match already exists —
  // send them straight back into it rather than showing the idle hub.
  const activeMatch = await findActiveMatchForUser(user.id);
  if (activeMatch) redirect(`/play/match/${activeMatch.id}`);

  if (!user.walletVerified || !user.walletAddress) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-20 text-center">
        <span className="text-xs font-semibold tracking-[0.3em] text-muted">RANKED 1V1</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Verify your wallet to play ranked.
        </h1>
        <p className="text-sm text-muted">
          Ranked matches use your wallet&apos;s trading PNL, so we need to confirm you actually
          control it before you can queue. This takes a few seconds — connect a Solana wallet and
          sign a message to prove ownership.
        </p>
        <Link
          href="/profile"
          className="rounded-md bg-accent px-8 py-3.5 text-sm font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98]"
        >
          VERIFY WALLET
        </Link>
      </div>
    );
  }

  const isPro = await hasProAccess(user.id);

  const [thirtyDay, sevenDay, oneDay] = await Promise.all([
    getModeStats(user.id, "THIRTY_DAYS"),
    getModeStats(user.id, "SEVEN_DAYS"),
    getModeStats(user.id, "ONE_DAY"),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
      <PlayHub
        rank={getRankForMmr(user.mmr)}
        statsByMode={{
          ALL_TIME: { mmr: user.mmr, wins: user.wins, losses: user.losses, streak: user.streak },
          THIRTY_DAYS: thirtyDay,
          SEVEN_DAYS: sevenDay,
          ONE_DAY: oneDay,
        }}
      />
      <PrivateDuelPanel isPro={isPro} />
    </div>
  );
}
