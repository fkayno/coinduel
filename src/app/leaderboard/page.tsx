import type { Metadata } from "next";
import Link from "next/link";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { listLeaderboard } from "@/lib/db/leaderboard";
import { GAME_MODES, isGameMode, GAME_MODE_META, DEFAULT_GAME_MODE } from "@/lib/game/game-modes";

export const metadata: Metadata = {
  title: "Leaderboard — CoinDuel",
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  // Never trust the query string beyond the fixed allowlist — an invalid
  // value just falls back to the default board rather than erroring.
  const activeMode = isGameMode(mode) ? mode : DEFAULT_GAME_MODE;
  const entries = await listLeaderboard(100, activeMode);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-20">
      <span className="text-xs font-semibold tracking-[0.3em] text-muted">LEADERBOARD</span>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
        WHO&apos;S ON TOP?
      </h1>

      <div className="mt-8 flex flex-wrap gap-2">
        {GAME_MODES.map((mode) => (
          <Link
            key={mode}
            href={`/leaderboard?mode=${mode}`}
            className={`rounded-full border px-4 py-2 text-xs font-bold tracking-wide transition-colors duration-150 ${
              mode === activeMode
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-muted hover:border-muted hover:text-foreground"
            }`}
          >
            {GAME_MODE_META[mode].shortLabel}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
        <LeaderboardTable entries={entries} />
      </div>
    </div>
  );
}
