"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PrivateDuelPanelProps {
  isPro: boolean;
}

type View = "idle" | "creating-wait";

const UPGRADE_REASON = "Private 1v1 duels are a CoinDuel Pro feature.";

export function PrivateDuelPanel({ isPro }: PrivateDuelPanelProps) {
  const router = useRouter();
  const [view, setView] = useState<View>("idle");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/duel/private/create", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't create a private duel room.");
        return;
      }
      setRoomCode(data.code);
      setView("creating-wait");

      pollRef.current = setInterval(async () => {
        const pollRes = await fetch(`/api/duel/private/${data.code}`);
        if (!pollRes.ok) return;
        const pollData = await pollRes.json();
        if (pollData.status === "MATCHED" && pollData.matchId) {
          if (pollRef.current) clearInterval(pollRef.current);
          router.push(`/play/match/${pollData.matchId}`);
        }
      }, 2000);
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (pollRef.current) clearInterval(pollRef.current);
    await fetch("/api/duel/private/create", { method: "DELETE" }).catch(() => {});
    setRoomCode(null);
    setView("idle");
  }

  async function handleJoin() {
    if (!joinCode.trim()) {
      setError("Enter a room code.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/duel/private/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't join that room.");
        return;
      }
      router.push(`/play/match/${data.matchId}`);
    } finally {
      setBusy(false);
    }
  }

  if (!isPro) {
    return (
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-6">
        <div>
          <span className="text-xs font-semibold tracking-widest text-muted">PRIVATE DUEL</span>
          <p className="mt-1 text-sm text-muted">
            Create private 1v1 rooms and invite another player using a room code.
          </p>
        </div>
        <Link
          href={`/pricing?reason=${encodeURIComponent(UPGRADE_REASON)}`}
          className="shrink-0 rounded-md bg-accent px-5 py-2.5 text-xs font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98]"
        >
          GET PRO
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl border border-border bg-surface p-6">
      <span className="text-xs font-semibold tracking-widest text-muted">PRIVATE DUEL</span>

      {view === "idle" && (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={handleCreate}
            disabled={busy}
            className="rounded-md border border-border px-5 py-2.5 text-xs font-bold tracking-wide text-foreground transition-colors duration-150 hover:border-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            CREATE PRIVATE DUEL
          </button>
          <div className="flex items-center gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="CD-7X4K9"
              maxLength={8}
              className="w-32 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-xs font-bold tracking-widest text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={busy}
              className="rounded-md bg-accent px-5 py-2.5 text-xs font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              JOIN PRIVATE DUEL
            </button>
          </div>
        </div>
      )}

      {view === "creating-wait" && roomCode && (
        <div className="mt-4 flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-xs text-muted">Share this code with your opponent</p>
          <span className="rounded-lg border border-accent/40 bg-accent/10 px-6 py-3 text-2xl font-extrabold tracking-[0.2em] text-accent">
            {roomCode}
          </span>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            WAITING FOR OPPONENT...
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="text-xs font-semibold text-muted transition-colors duration-150 hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-xs font-semibold text-loss">{error}</p>}
    </div>
  );
}
