import { Reveal } from "@/components/ui/reveal";
import { LiveMatchCard } from "@/components/home/live-match-card";
import { DUEL_CHART_A, DUEL_CHART_B, DUEL_SHOWCASE } from "@/lib/mock-data";

export function DuelShowcase() {
  return (
    <section id="duel" className="border-b border-border bg-background py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-sm font-bold tracking-[0.3em] text-muted">THE DUEL</h2>
        </Reveal>
        <Reveal delay={60}>
          <p className="mt-4 max-w-xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            This is what a CoinDuel match looks like.
          </p>
        </Reveal>

        <Reveal delay={140}>
          <div className="mt-12">
            <LiveMatchCard
              playerA={DUEL_SHOWCASE.playerA}
              chartA={DUEL_CHART_A}
              playerB={DUEL_SHOWCASE.playerB}
              chartB={DUEL_CHART_B}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
