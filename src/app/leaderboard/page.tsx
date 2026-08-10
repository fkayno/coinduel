import type { Metadata } from "next";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { listLeaderboard } from "@/lib/db/leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard — CoinDuel",
};

export default async function LeaderboardPage() {
  const entries = await listLeaderboard(100);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-20">
      <span className="text-xs font-semibold tracking-[0.3em] text-muted">LEADERBOARD</span>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
        WHO&apos;S ON TOP?
      </h1>

      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-surface">
        <LeaderboardTable entries={entries} />
      </div>
    </div>
  );
}
