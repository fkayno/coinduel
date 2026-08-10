import { AnimatedNumber } from "@/components/ui/animated-number";
import type { BattlePlayer } from "@/lib/mock-data";

interface BattleCardProps {
  player: BattlePlayer;
  align?: "left" | "right";
}

export function BattleCard({ player, align = "left" }: BattleCardProps) {
  const isPositive = player.pnl >= 0;

  return (
    <div
      className={`flex flex-1 flex-col gap-4 rounded-2xl border border-border bg-surface-2 p-6 ${
        align === "right" ? "sm:items-end sm:text-right" : "sm:items-start sm:text-left"
      } items-start text-left`}
    >
      <span className="text-xs font-semibold tracking-[0.2em] text-muted">
        {player.name}
      </span>
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold tracking-wide text-foreground/90">
          {player.rank}
        </span>
        <span className="text-xs text-muted">{player.mmr.toLocaleString()} MMR</span>
      </div>
      <AnimatedNumber
        value={player.pnl}
        prefix="$"
        className={`text-3xl font-bold ${isPositive ? "text-accent" : "text-loss"}`}
      />
    </div>
  );
}
