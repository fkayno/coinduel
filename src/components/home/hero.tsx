import Link from "next/link";
import { BattleCard } from "@/components/ui/battle-card";
import { Reveal } from "@/components/ui/reveal";
import { HERO_BATTLE } from "@/lib/mock-data";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,224,122,0.08),transparent)]" />

      <div className="mx-auto grid max-w-6xl gap-16 px-6 py-24 lg:grid-cols-2 lg:items-center lg:py-32">
        <Reveal>
          <h1 className="text-6xl font-extrabold leading-[0.95] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
            TRADE.
            <br />
            DUEL.
            <br />
            CLIMB.
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted">
            Turn your Solana memecoin trading performance into a competitive 1v1.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/play"
              className="rounded-md bg-accent px-7 py-3.5 text-sm font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.97]"
            >
              PLAY RANKED
            </Link>
            <a
              href="#leaderboard"
              className="rounded-md border border-border px-7 py-3.5 text-sm font-bold tracking-wide text-foreground transition-colors duration-150 hover:border-muted"
            >
              VIEW LEADERBOARD
            </a>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <span className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                SAMPLE MATCH
              </span>
              <span className="text-xs font-medium tracking-wide text-muted">1v1 RANKED</span>
            </div>

            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-stretch sm:gap-0">
              <BattleCard player={HERO_BATTLE.playerA} />
              <div className="flex items-center justify-center px-4 py-1 sm:py-0">
                <span className="text-sm font-extrabold tracking-widest text-muted">VS</span>
              </div>
              <BattleCard player={HERO_BATTLE.playerB} align="right" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
