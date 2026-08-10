import { AnimatedNumber } from "@/components/ui/animated-number";
import { Sparkline } from "@/components/ui/sparkline";
import type { BattlePlayer } from "@/lib/mock-data";

interface DuelSideProps {
  player: BattlePlayer;
  chart: number[];
  align: "left" | "right";
  frozen?: boolean;
}

export function DuelSide({ player, chart, align, frozen = false }: DuelSideProps) {
  const isPositive = player.pnl >= 0;
  const color = isPositive ? "#22e07a" : "#f4495a";

  return (
    <div
      className={`flex flex-col gap-4 p-8 ${
        align === "right" ? "sm:items-end sm:text-right" : "sm:items-start sm:text-left"
      } items-start text-left`}
    >
      <span className="text-xs font-semibold tracking-[0.2em] text-muted">{player.name}</span>
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground/90">
          {player.rank}
        </span>
        <span className="text-xs text-muted">{player.mmr.toLocaleString()} MMR</span>
      </div>
      <AnimatedNumber
        value={player.pnl}
        prefix="$"
        jitter={!frozen}
        className={`text-4xl font-extrabold ${isPositive ? "text-accent" : "text-loss"}`}
      />
      <Sparkline data={chart} color={color} className="h-16 w-full max-w-[240px]" />
    </div>
  );
}
