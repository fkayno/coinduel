"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { StoredTournament } from "@/lib/db/tournaments";

type Tab = "UPCOMING" | "LIVE" | "COMPLETED";
const TABS: Tab[] = ["UPCOMING", "LIVE", "COMPLETED"];

interface TournamentTabsProps {
  tournaments: StoredTournament[];
  isLoggedIn: boolean;
  isPro: boolean;
  registeredIds: string[];
}

const UPGRADE_REASON = "Tournament participation is a CoinDuel Pro feature.";

function JoinControl({
  tournament,
  isLoggedIn,
  isPro,
  registered,
  onJoined,
}: {
  tournament: StoredTournament;
  isLoggedIn: boolean;
  isPro: boolean;
  registered: boolean;
  onJoined: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (tournament.status === "COMPLETED") {
    return <span className="text-xs font-semibold text-muted">ENDED</span>;
  }

  if (registered) {
    return (
      <span className="rounded-md border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-bold tracking-wide text-accent">
        REGISTERED
      </span>
    );
  }

  if (!isLoggedIn) {
    return (
      <Link
        href="/login?next=/tournaments"
        className="rounded-md border border-border px-4 py-2 text-xs font-bold tracking-wide text-foreground transition-colors duration-150 hover:border-muted"
      >
        LOG IN TO JOIN
      </Link>
    );
  }

  if (!isPro) {
    return (
      <Link
        href={`/pricing?reason=${encodeURIComponent(UPGRADE_REASON)}`}
        className="rounded-md bg-accent px-4 py-2 text-xs font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98]"
      >
        GET PRO
      </Link>
    );
  }

  async function handleJoin() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/join`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Couldn't join this tournament.");
        return;
      }
      onJoined();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleJoin}
        disabled={busy}
        className="rounded-md bg-accent px-4 py-2 text-xs font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "JOINING..." : "JOIN"}
      </button>
      {error && <span className="text-[10px] font-semibold text-loss">{error}</span>}
    </div>
  );
}

export function TournamentTabs({ tournaments, isLoggedIn, isPro, registeredIds }: TournamentTabsProps) {
  const [tab, setTab] = useState<Tab>("UPCOMING");
  const [registered, setRegistered] = useState<Set<string>>(new Set(registeredIds));

  const filtered = tournaments.filter((t) => t.status === tab);

  return (
    <div>
      <div className="flex gap-2 rounded-xl border border-border bg-surface p-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2.5 text-xs font-bold tracking-widest transition-colors duration-150 ${
              tab === t ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">No {tab.toLowerCase()} tournaments right now.</p>
        ) : (
          filtered.map((tournament) => (
            <div
              key={tournament.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-6"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">{tournament.name}</h3>
                  {tournament.status === "LIVE" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest text-accent">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                      LIVE
                    </span>
                  )}
                </div>
                {tournament.description && (
                  <p className="mt-1 max-w-md text-sm text-muted">{tournament.description}</p>
                )}
                <p className="mt-2 text-xs text-muted">
                  {tournament.status === "UPCOMING" ? "Starts " : ""}
                  {formatDate(tournament.startsAt)} &middot; {tournament.participantCount} registered
                </p>
              </div>

              <JoinControl
                tournament={tournament}
                isLoggedIn={isLoggedIn}
                isPro={isPro}
                registered={registered.has(tournament.id)}
                onJoined={() => setRegistered((prev) => new Set(prev).add(tournament.id))}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
