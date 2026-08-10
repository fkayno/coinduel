"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface PlayHubProps {
  mmr: number;
  wins: number;
  losses: number;
  streak: number;
  rank: string;
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

export function PlayHub({ mmr, wins, losses, streak, rank }: PlayHubProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewState>("idle");
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

  async function handleFindMatch() {
    if (isFinding) return; // guards against double-clicks while a request is in flight
    setError(null);
    setIsFinding(true);

    try {
      const res = await fetch("/api/play/queue", { method: "POST" });
      const data = await res.json().catch(() => null);

      if (res.status === 409 && data?.matchId) {
        router.push(`/play/match/${data.matchId}`);
        return;
      }
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Couldn't join the queue. Try again.");
        return;
      }

      setView("searching");
      setWaitingSeconds(0);
      setRangeMmr(100);
    } catch {
      // Network failure (offline, DNS, etc.) — without this the fetch
      // rejection would go unhandled and the button would look "dead" with
      // no feedback at all.
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsFinding(false);
    }
  }

  async function handleCancel() {
    await fetch("/api/play/queue", { method: "DELETE" });
    setView("idle");
  }

  const totalGames = wins + losses;
  const winRatePct = totalGames === 0 ? 0 : Math.round((wins / totalGames) * 100);
  const streakLabel = streak === 0 ? "—" : streak > 0 ? `${streak}W` : `${Math.abs(streak)}L`;

  if (view === "searching") {
    return (
      <div className="flex flex-col items-center gap-8 rounded-2xl border border-border bg-surface p-10 text-center">
        <span className="text-xs font-semibold tracking-[0.3em] text-muted">
          SEARCHING FOR OPPONENT
        </span>

        <div className="flex gap-10">
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted">YOUR RANK</p>
            <p className="mt-1 text-lg font-bold text-foreground">{rank}</p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted">YOUR MMR</p>
            <p className="mt-1 text-lg font-bold text-foreground">{mmr.toLocaleString()}</p>
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
        <StatTile label="MMR" value={mmr.toLocaleString()} />
        <StatTile label="WIN RATE" value={`${winRatePct}%`} />
        <StatTile label="WINS" value={String(wins)} />
        <StatTile label="LOSSES" value={String(losses)} />
        <StatTile label="STREAK" value={streakLabel} />
      </div>

      {error && <p className="text-sm text-loss">{error}</p>}

      <button
        type="button"
        onClick={handleFindMatch}
        disabled={isFinding}
        className="rounded-md bg-accent px-10 py-4 text-base font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isFinding ? "JOINING..." : "FIND MATCH"}
      </button>

      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-bold tracking-[0.25em] text-muted">30 SECOND DUEL</span>
        <p className="max-w-sm text-xs text-muted">
          Your trading PNL is compared against your opponent&apos;s during the duel.
        </p>
      </div>
    </div>
  );
}
