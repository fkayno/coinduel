"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GameModeModal } from "@/components/play/game-mode-modal";
import { GAME_MODE_META, DEFAULT_GAME_MODE, type GameMode } from "@/lib/game/game-modes";

interface ModeStats {
  mmr: number;
  wins: number;
  losses: number;
  streak: number;
}

interface PlayHubProps {
  rank: string;
  statsByMode: Record<GameMode, ModeStats>;
}

type ViewState = "idle" | "searching";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-[10px] font-semibold tracking-widest text-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-foreground sm:text-base">{value}</p>
    </div>
  );
}

export function PlayHub({ rank, statsByMode }: PlayHubProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewState>("idle");
  const [showModeModal, setShowModeModal] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>(DEFAULT_GAME_MODE);
  const [waitingSeconds, setWaitingSeconds] = useState(0);
  const [rangeMmr, setRangeMmr] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [isFinding, setIsFinding] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore state on mount — covers a refresh while queued or mid-match.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/play/state");
      if (!res.ok || cancelled) return;
      const data = await res.json();
      if (cancelled) return;
      if (data.state === "match") {
        router.push(`/play/match/${data.matchId}`);
      } else if (data.state === "queued") {
        setGameMode(data.gameMode ?? DEFAULT_GAME_MODE);
        setView("searching");
        setWaitingSeconds(data.waitingSeconds);
        setRangeMmr(data.rangeMmr);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view !== "searching") return;

    const poll = async () => {
      const res = await fetch("/api/play/state");
      if (!res.ok) return;
      const data = await res.json();
      if (data.state === "match") {
        router.push(`/play/match/${data.matchId}`);
      } else if (data.state === "queued") {
        setWaitingSeconds(data.waitingSeconds);
        setRangeMmr(data.rangeMmr);
      } else {
        setView("idle");
      }
    };

    pollRef.current = setInterval(poll, 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [view, router]);

  async function handleConfirmMode(mode: GameMode) {
    if (isFinding) return; // guards against double-clicks while a request is in flight
    setError(null);
    setIsFinding(true);

    try {
      const res = await fetch("/api/play/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameMode: mode }),
      });
      const data = await res.json().catch(() => null);

      if (res.status === 409 && data?.matchId) {
        router.push(`/play/match/${data.matchId}`);
        return;
      }
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Couldn't join the queue. Try again.");
        setShowModeModal(false);
        return;
      }

      setGameMode(mode);
      setShowModeModal(false);
      setView("searching");
      setWaitingSeconds(0);
      setRangeMmr(100);
    } catch {
      // Network failure (offline, DNS, etc.) — without this the fetch
      // rejection would go unhandled and the button would look "dead" with
      // no feedback at all.
      setError("Couldn't reach the server. Check your connection and try again.");
      setShowModeModal(false);
    } finally {
      setIsFinding(false);
    }
  }

  async function handleCancel() {
    await fetch("/api/play/queue", { method: "DELETE" });
    setView("idle");
  }

  const activeStats = statsByMode[gameMode];
  const totalGames = activeStats.wins + activeStats.losses;
  const winRatePct = totalGames === 0 ? 0 : Math.round((activeStats.wins / totalGames) * 100);
  const streakLabel =
    activeStats.streak === 0 ? "—" : activeStats.streak > 0 ? `${activeStats.streak}W` : `${Math.abs(activeStats.streak)}L`;

  if (view === "searching") {
    return (
      <div className="flex flex-col items-center gap-8 rounded-2xl border border-border bg-surface p-10 text-center">
        <span className="text-xs font-semibold tracking-[0.3em] text-muted">
          SEARCHING FOR OPPONENT &middot; {GAME_MODE_META[gameMode].label}
        </span>

        <div className="flex gap-10">
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted">YOUR RANK</p>
            <p className="mt-1 text-lg font-bold text-foreground">{rank}</p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted">YOUR MMR</p>
            <p className="mt-1 text-lg font-bold text-foreground">{activeStats.mmr.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-accent"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-accent"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-accent"
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <span className="text-sm font-semibold tracking-wide text-foreground">
            SEARCHING...
          </span>
        </div>

        <p className="text-xs text-muted">
          {waitingSeconds}s elapsed &middot; searching within &plusmn;{rangeMmr} MMR
        </p>

        <button
          type="button"
          onClick={handleCancel}
          className="text-xs font-semibold text-muted transition-colors duration-150 hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div>
        <span className="text-xs font-semibold tracking-[0.3em] text-muted">RANKED 1V1</span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Prove you&apos;re the better memecoin trader.
        </h1>
      </div>

      <div className="grid w-full grid-cols-3 gap-3 sm:grid-cols-6">
        <StatTile label="RANK" value={rank} />
        <StatTile label="MMR" value={activeStats.mmr.toLocaleString()} />
        <StatTile label="WIN RATE" value={`${winRatePct}%`} />
        <StatTile label="WINS" value={String(activeStats.wins)} />
        <StatTile label="LOSSES" value={String(activeStats.losses)} />
        <StatTile label="STREAK" value={streakLabel} />
      </div>

      {error && <p className="text-sm text-loss">{error}</p>}

      <button
        type="button"
        onClick={() => setShowModeModal(true)}
        disabled={isFinding}
        className="rounded-md bg-accent px-10 py-4 text-base font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        FIND MATCH
      </button>

      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-bold tracking-[0.25em] text-muted">30 SECOND DUEL</span>
        <p className="max-w-sm text-xs text-muted">
          Your trading PNL is compared against your opponent&apos;s during the duel.
        </p>
      </div>

      {showModeModal && (
        <GameModeModal
          mmrByMode={{
            ALL_TIME: statsByMode.ALL_TIME.mmr,
            THIRTY_DAYS: statsByMode.THIRTY_DAYS.mmr,
            SEVEN_DAYS: statsByMode.SEVEN_DAYS.mmr,
            ONE_DAY: statsByMode.ONE_DAY.mmr,
          }}
          onConfirm={handleConfirmMode}
          onClose={() => setShowModeModal(false)}
        />
      )}
    </div>
  );
}
