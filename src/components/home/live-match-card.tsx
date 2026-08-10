"use client";

import { useEffect, useState } from "react";
import { DuelSide } from "@/components/home/duel-side";
import { MATCH_DURATION_SECONDS } from "@/lib/config";
import type { BattlePlayer } from "@/lib/mock-data";

interface LiveMatchCardProps {
  playerA: BattlePlayer;
  chartA: number[];
  playerB: BattlePlayer;
  chartB: number[];
}

export function LiveMatchCard({ playerA, chartA, playerB, chartB }: LiveMatchCardProps) {
  const [secondsLeft, setSecondsLeft] = useState(MATCH_DURATION_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timeout = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timeout);
  }, [secondsLeft]);

  const matchEnded = secondsLeft <= 0;
  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  const winner =
    playerA.pnl === playerB.pnl ? null : playerA.pnl > playerB.pnl ? playerA : playerB;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex flex-col items-center gap-1 border-b border-border py-6">
        {matchEnded ? (
          <>
            <span className="text-sm font-bold tracking-[0.25em] text-accent">
              MATCH COMPLETE
            </span>
            {winner && (
              <span className="mt-1 text-xs font-semibold tracking-wide text-muted">
                {winner.name} WINS
              </span>
            )}
          </>
        ) : (
          <>
            <span className="font-mono text-4xl font-bold tracking-tight text-foreground tabular-nums">
              {minutes}:{seconds}
            </span>
            <span className="text-xs font-semibold tracking-[0.25em] text-muted">
              MATCH TIME
            </span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr]">
        <DuelSide player={playerA} chart={chartA} align="left" frozen={matchEnded} />
        <div className="flex items-center justify-center border-border px-6 py-2 sm:border-x sm:py-0">
          <span className="text-lg font-extrabold tracking-widest text-muted">VS</span>
        </div>
        <DuelSide player={playerB} chart={chartB} align="right" frozen={matchEnded} />
      </div>
    </div>
  );
}
