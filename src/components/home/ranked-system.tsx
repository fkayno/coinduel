import { Reveal } from "@/components/ui/reveal";
import { MOCK_PLAYER_CARD, RANK_TIERS } from "@/lib/mock-data";

export function RankedSystem() {
  const currentTier = "GOLD";
  const progressPercent = Math.round(MOCK_PLAYER_CARD.progress * 100);

  return (
    <section className="border-b border-border bg-surface/40 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-sm font-bold tracking-[0.3em] text-muted">CLIMB THE LADDER</h2>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <Reveal delay={80}>
            <div className="rounded-2xl border border-border bg-surface p-2">
              {[...RANK_TIERS].reverse().map((r) => {
                const isCurrent = r.tier === currentTier;
                return (
                  <div
                    key={r.tier}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors duration-150 ${
                      isCurrent ? "bg-surface-2 ring-1 ring-accent/40" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                      <span
                        className={`text-sm font-semibold tracking-wide ${
                          isCurrent ? "text-foreground" : "text-muted"
                        }`}
                      >
                        {r.tier}
                      </span>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-bold tracking-widest text-accent">
                        YOU
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="rounded-2xl border border-border bg-surface p-8">
              <span className="text-xs font-semibold tracking-widest text-muted">
                CURRENT RANK
              </span>
              <h3 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground">
                {MOCK_PLAYER_CARD.rank}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {MOCK_PLAYER_CARD.mmr.toLocaleString()} MMR
              </p>

              <div className="mt-8">
                <div className="flex items-center justify-between text-xs font-medium text-muted">
                  <span>Progress to {MOCK_PLAYER_CARD.nextRank}</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
