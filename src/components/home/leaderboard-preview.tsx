import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { listLeaderboard } from "@/lib/db/leaderboard";

export async function LeaderboardPreview() {
  const entries = await listLeaderboard(8);

  return (
    <section id="leaderboard" className="border-b border-border bg-surface/40 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-sm font-bold tracking-[0.3em] text-muted">WHO&apos;S ON TOP?</h2>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-surface">
            <LeaderboardTable entries={entries} />
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-8 flex justify-center">
            <Link
              href="/leaderboard"
              className="rounded-md border border-border px-6 py-3 text-sm font-bold tracking-wide text-foreground transition-colors duration-150 hover:border-muted"
            >
              VIEW FULL LEADERBOARD
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
