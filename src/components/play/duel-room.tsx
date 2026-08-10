"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Avatar } from "@/components/ui/avatar";
import { ProBadge } from "@/components/ui/pro-badge";
import { VideoTile } from "@/components/play/video/video-tile";
import { VideoControls } from "@/components/play/video/video-controls";
import { useWebRTC, type ConnectionStatus, type OpponentStatus } from "@/components/play/video/use-webrtc";
import { getRankForMmr } from "@/lib/game/mmr";
import { shortenAddress } from "@/lib/solana";
import { fixedPnlOf, formatPnl } from "@/lib/format";
import { MAX_VIDEO_CONNECT_WAIT_SECONDS } from "@/lib/config";
import type { MatchPlayerRecord } from "@/lib/game/store";
import type { LiveMatchView } from "@/lib/game/match-service";

interface DuelRoomProps {
  matchId: string;
  currentUserId: string;
  initialView: LiveMatchView;
  /** PRO status per userId — computed once server-side; a 30-60s match never needs live re-checking. */
  proStatus: Record<string, boolean>;
}

type Phase =
  | "found"
  | "connecting"
  | "verifying-pnl"
  | "pnl-failed"
  | "countdown"
  | "live"
  | "calculating"
  | "result";

/** Cosmetic sub-states shown only while phase === "verifying-pnl". */
type PnlStage = "checking" | "fetching" | "verified";

function initialPhase(view: LiveMatchView): Phase {
  if (view.match.status === "COMPLETED") return "result";
  if (view.match.status === "ACTIVE") return "live";
  return "found";
}

function myConnectionStatusText(status: ConnectionStatus): string {
  switch (status) {
    case "requesting-permissions":
      return "REQUESTING CAMERA & MIC...";
    case "connecting":
      return "CONNECTING...";
    case "unstable":
      return "CONNECTION UNSTABLE";
    case "reconnecting":
      return "RECONNECTING...";
    case "failed":
      return "CONNECTION FAILED";
    case "connected":
    case "idle":
    default:
      return "";
  }
}

function opponentStatusText(status: OpponentStatus): string {
  switch (status) {
    case "connecting":
      return "OPPONENT CONNECTING...";
    case "disconnected":
      return "OPPONENT DISCONNECTED";
    case "left":
      return "OPPONENT LEFT";
    case "connected":
    default:
      return "";
  }
}

function PlayerIdentity({
  label,
  player,
  isPro,
}: {
  label: string;
  player: MatchPlayerRecord;
  isPro: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-8 py-6">
      <span className="text-xs font-semibold tracking-[0.2em] text-muted">{label}</span>
      <Avatar username={player.username} profileImageUrl={player.profileImageUrl} size="lg" />
      <span className="flex items-center gap-1.5 text-lg font-bold text-foreground">
        @{player.username}
        {isPro && <ProBadge />}
      </span>
      <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground/90">
        {getRankForMmr(player.mmrBefore)}
      </span>
      <span className="text-sm text-muted">{player.mmrBefore.toLocaleString()} MMR</span>
      {player.walletAddress && (
        <span className="text-xs text-muted">{shortenAddress(player.walletAddress)}</span>
      )}
    </div>
  );
}

/** What to show in place of the ALL-TIME PNL figure under a camera. */
type PnlDisplay = { kind: "value"; value: number } | { kind: "text"; text: string; tone?: "muted" | "loss" };

function ArenaCameraRow({ leftCamera, rightCamera }: { leftCamera: ReactNode; rightCamera: ReactNode }) {
  return (
    <div className="relative grid w-full grid-cols-2 gap-3 sm:gap-8 lg:gap-10">
      <div className="mx-auto w-full max-w-[560px]">{leftCamera}</div>
      <div className="mx-auto w-full max-w-[560px]">{rightCamera}</div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-background text-[10px] font-extrabold tracking-widest text-muted shadow-lg sm:h-14 sm:w-14 sm:text-sm">
          VS
        </span>
      </div>
    </div>
  );
}

function ArenaIdentityRow({
  left,
  right,
}: {
  left: { label: string; player: MatchPlayerRecord; pnl: PnlDisplay; isPro: boolean };
  right: { label: string; player: MatchPlayerRecord; pnl: PnlDisplay; isPro: boolean };
}) {
  return (
    <div className="grid w-full grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-10">
      <ArenaIdentityBlock {...left} />
      <ArenaIdentityBlock {...right} />
    </div>
  );
}

function ArenaIdentityBlock({
  label,
  player,
  pnl,
  isPro,
}: {
  label: string;
  player: MatchPlayerRecord;
  pnl: PnlDisplay;
  isPro: boolean;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-1 text-center">
      <span className="text-xs font-semibold tracking-[0.2em] text-muted">{label}</span>
      <Avatar username={player.username} profileImageUrl={player.profileImageUrl} size="md" />
      <span className="flex items-center gap-1.5 text-lg font-bold text-foreground">
        @{player.username}
        {isPro && <ProBadge />}
      </span>
      <div className="mt-1 flex items-center gap-2">
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground/90">
          {getRankForMmr(player.mmrBefore)}
        </span>
        <span className="text-xs text-muted">{player.mmrBefore.toLocaleString()} MMR</span>
      </div>
      <span className="mt-3 text-[10px] font-semibold tracking-[0.25em] text-muted">
        ALL-TIME PNL
      </span>
      {pnl.kind === "value" ? (
        <AnimatedNumber
          value={pnl.value}
          prefix="$"
          jitter={false}
          className={`text-3xl font-extrabold ${pnl.value >= 0 ? "text-accent" : "text-loss"}`}
        />
      ) : (
        <span
          className={`text-sm font-bold tracking-wide ${pnl.tone === "loss" ? "text-loss" : "text-muted"}`}
        >
          {pnl.text}
        </span>
      )}
    </div>
  );
}

function ResultTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const toneClass =
    tone === "positive" ? "text-accent" : tone === "negative" ? "text-loss" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-center">
      <p className="text-[10px] font-semibold tracking-widest text-muted">{label}</p>
      <p className={`mt-1 text-base font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

export function DuelRoom({ matchId, currentUserId, initialView, proStatus }: DuelRoomProps) {
  const router = useRouter();
  const [view, setView] = useState<LiveMatchView>(initialView);
  const [phase, setPhase] = useState<Phase>(() => initialPhase(initialView));
  const [countdown, setCountdown] = useState(3);
  const [pnlStage, setPnlStage] = useState<PnlStage>("checking");
  const [pnlFailReason, setPnlFailReason] = useState<string | null>(null);

  const meIndex = view.match.players[0].userId === currentUserId ? 0 : 1;
  const opponentIndex = meIndex === 0 ? 1 : 0;
  const me = view.match.players[meIndex];
  const opponent = view.match.players[opponentIndex];
  const isMePro = proStatus[me.userId] ?? false;
  const isOpponentPro = proStatus[opponent.userId] ?? false;
  const modeLabel = view.match.isRanked ? "RANKED 1V1" : "PRIVATE DUEL";

  // Video is an additional layer on top of the match — it starts as soon as
  // a match exists and tears down once the duel is over. It never gates or
  // delays the 30-second timer, PNL, MMR, or result logic below.
  const videoActive =
    phase === "found" ||
    phase === "connecting" ||
    phase === "verifying-pnl" ||
    phase === "pnl-failed" ||
    phase === "countdown" ||
    phase === "live";
  const video = useWebRTC({
    matchId,
    opponentUserId: opponent.userId,
    isOfferer: meIndex === 0,
    active: videoActive,
  });

  // Awaits the forfeit request before navigating — /play's server component
  // checks for an active match and redirects back into it, so if we
  // navigated away before the forfeit landed, that check could still see
  // the match as ACTIVE and bounce the user right back here. A `pagehide`
  // listener below covers the tab-close/navigate-away case, which can't
  // await anything.
  async function handleLeaveCall() {
    await fetch(`/api/play/match/${matchId}/leave`, { method: "POST" }).catch(() => {});
    router.push("/play");
  }

  // Covers closing the tab / navigating away without clicking "LEAVE MATCH"
  // — `keepalive` lets the request outlive the page unload.
  useEffect(() => {
    const inProgressPhases: Phase[] = [
      "found",
      "connecting",
      "verifying-pnl",
      "pnl-failed",
      "countdown",
      "live",
    ];
    function handlePageHide() {
      if (!inProgressPhases.includes(phase)) return;
      fetch(`/api/play/match/${matchId}/leave`, { method: "POST", keepalive: true }).catch(() => {});
    }
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [phase, matchId]);

  // Watches for the match ending early (the opponent forfeited) while I'm
  // still in an earlier phase that doesn't otherwise poll match state —
  // without this, the remaining player could be stuck on "MATCH STARTING"
  // or similar indefinitely if the other player leaves right after a match
  // is found.
  useEffect(() => {
    const watchedPhases: Phase[] = [
      "found",
      "connecting",
      "verifying-pnl",
      "pnl-failed",
      "countdown",
    ];
    if (!watchedPhases.includes(phase)) return;
    let cancelled = false;

    const id = setInterval(async () => {
      const res = await fetch(`/api/play/match/${matchId}`);
      if (!res.ok || cancelled) return;
      const data: LiveMatchView = await res.json();
      if (cancelled || data.match.status !== "COMPLETED") return;
      setView(data);
      setPhase("calculating");
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [phase, matchId]);

  // Phase: found -> hold on the reveal briefly, then start connecting the video call.
  useEffect(() => {
    if (phase !== "found") return;
    const t = setTimeout(() => setPhase("connecting"), 2200);
    return () => clearTimeout(t);
  }, [phase]);

  // Phase: connecting -> proceed once the video call connects, or after a
  // bounded wait regardless — video must never delay the actual match.
  useEffect(() => {
    if (phase !== "connecting") return;
    const delayMs =
      video.connectionStatus === "connected" ? 400 : MAX_VIDEO_CONNECT_WAIT_SECONDS * 1000;
    const t = setTimeout(() => {
      setPnlStage("checking");
      setPhase("verifying-pnl");
    }, delayMs);
    return () => clearTimeout(t);
  }, [phase, video.connectionStatus]);

  // pnlStage: checking -> fetching, after a brief cosmetic beat. pnlStage is
  // set to "checking" by whatever transitions phase into "verifying-pnl"
  // (this effect, or handleRetryPnl below), never synchronously in here.
  useEffect(() => {
    if (phase !== "verifying-pnl" || pnlStage !== "checking") return;
    const t = setTimeout(() => setPnlStage("fetching"), 550);
    return () => clearTimeout(t);
  }, [phase, pnlStage]);

  // pnlStage: fetching -> ask the server to verify + freeze both players'
  // real ALL-TIME wallet PNL. This is the ONLY time PNL is fetched for the
  // whole match — never per-second, never re-fetched once it succeeds. On
  // failure, the ranked match is blocked outright; it never falls back to a
  // random/mock value.
  useEffect(() => {
    if (phase !== "verifying-pnl" || pnlStage !== "fetching") return;
    let cancelled = false;

    (async () => {
      const res = await fetch(`/api/play/match/${matchId}/verify-pnl`, { method: "POST" });
      if (cancelled) return;

      if (!res.ok) {
        setPnlFailReason("Could not reach the wallet PNL service. Please try again.");
        setPhase("pnl-failed");
        return;
      }

      const data = await res.json();
      if (cancelled) return;
      setView((prev) => ({ ...prev, match: data.match }));

      if (data.match.pnlStatus === "READY") {
        setPnlStage("verified");
      } else {
        setPnlFailReason(data.match.pnlError ?? "Unable to verify wallet PNL.");
        setPhase("pnl-failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, pnlStage, matchId]);

  // pnlStage: verified -> brief confirmation beat, then the 3-2-1 countdown.
  // The 30-second server clock has NOT started yet — it only starts once
  // startMatch() is called at the end of the countdown below.
  useEffect(() => {
    if (phase !== "verifying-pnl" || pnlStage !== "verified") return;
    const t = setTimeout(() => setPhase("countdown"), 700);
    return () => clearTimeout(t);
  }, [phase, pnlStage]);

  function handleRetryPnl() {
    setPnlFailReason(null);
    setPnlStage("checking");
    setPhase("verifying-pnl");
  }

  // Phase: countdown -> 3, 2, 1, then tell the server to actually start the
  // duel clock. PNL was already verified in the previous phase, so this
  // just timestamps the match — it doesn't re-fetch PNL.
  useEffect(() => {
    if (phase !== "countdown") return;

    if (countdown === 0) {
      let cancelled = false;
      (async () => {
        const res = await fetch(`/api/play/match/${matchId}/start`, { method: "POST" });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setView((prev) => ({ ...prev, match: data.match }));
          if (data.match.status === "COMPLETED") {
            // The opponent forfeited during the countdown.
            setPhase("calculating");
            return;
          }
          if (data.match.pnlStatus === "FAILED") {
            setPnlFailReason(data.match.pnlError ?? "Unable to verify wallet PNL.");
            setPhase("pnl-failed");
            return;
          }
        }
        if (!cancelled) setPhase("live");
      })();
      return () => {
        cancelled = true;
      };
    }

    const t = setTimeout(() => setCountdown((c) => c - 1), 800);
    return () => clearTimeout(t);
  }, [phase, countdown, matchId]);

  // Phase: live -> poll the server every second. It owns the clock; PNL is
  // fixed for the whole match, so the polled value never actually changes.
  useEffect(() => {
    if (phase !== "live") return;
    let cancelled = false;

    const poll = async () => {
      const res = await fetch(`/api/play/match/${matchId}`);
      if (!res.ok || cancelled) return;
      const data: LiveMatchView = await res.json();
      if (cancelled) return;

      setView(data);
      if (data.match.status === "COMPLETED") setPhase("calculating");
    };

    poll();
    const id = setInterval(poll, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [phase, matchId]);

  // Phase: calculating -> brief pause so "CALCULATING RESULT..." reads as a
  // real beat rather than a flash, then reveal the already-computed result.
  useEffect(() => {
    if (phase !== "calculating") return;
    const t = setTimeout(() => setPhase("result"), 1100);
    return () => clearTimeout(t);
  }, [phase]);

  // The top-token badge only ever shows once PNL verification has actually
  // finished — before that, `topToken` is just unfetched-null, not a real
  // "no data" result, so the badge must stay hidden rather than show it.
  const topTokenReady = view.match.pnlStatus === "READY";

  const myCamera = (
    <VideoTile
      stream={video.localStream}
      label="YOU"
      muted
      mirrored
      showVideo={video.cameraOn && !video.cameraDenied}
      placeholderText="CAMERA OFF"
      statusText={myConnectionStatusText(video.connectionStatus) || null}
      topToken={me.topToken}
      topTokenReady={topTokenReady}
    />
  );
  const opponentCamera = (
    <VideoTile
      stream={video.remoteStream}
      label={`@${opponent.username}`}
      showVideo={video.remoteStream !== null && video.opponentStatus !== "left"}
      placeholderText={
        video.opponentStatus === "disconnected"
          ? "OPPONENT DISCONNECTED"
          : video.opponentStatus === "left"
            ? "OPPONENT LEFT"
            : "CONNECTING..."
      }
      statusText={opponentStatusText(video.opponentStatus) || null}
      topToken={opponent.topToken}
      topTokenReady={topTokenReady}
    />
  );

  const videoControls = (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <VideoControls
        cameraOn={video.cameraOn}
        micOn={video.micOn}
        cameraDenied={video.cameraDenied}
        micDenied={video.micDenied}
        onToggleCamera={video.toggleCamera}
        onToggleMic={video.toggleMic}
        onLeave={handleLeaveCall}
      />
      <p className="text-center text-[11px] text-muted">
        Live peer-to-peer video &middot; not recorded or stored, and ends when the match does.
      </p>
    </div>
  );

  if (phase === "found") {
    return (
      <div className="flex flex-col items-center gap-8 py-10 text-center">
        <span className="animate-pop-in text-xs font-bold tracking-[0.3em] text-accent">
          MATCH FOUND
        </span>
        <div className="flex w-full max-w-2xl flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10">
          <PlayerIdentity label="YOU" player={me} isPro={isMePro} />
          <span className="text-lg font-extrabold tracking-widest text-muted">VS</span>
          <PlayerIdentity label="OPPONENT" player={opponent} isPro={isOpponentPro} />
        </div>
      </div>
    );
  }

  if (phase === "connecting") {
    return (
      <div className="flex flex-col items-center gap-8 py-6 text-center">
        <span className="text-xs font-bold tracking-[0.3em] text-muted">
          CONNECTING TO OPPONENT
        </span>
        <ArenaCameraRow leftCamera={myCamera} rightCamera={opponentCamera} />
        <ArenaIdentityRow
          left={{ label: "YOU", player: me, pnl: { kind: "text", text: "—" }, isPro: isMePro }}
          right={{
            label: "OPPONENT",
            player: opponent,
            pnl: { kind: "text", text: "—" },
            isPro: isOpponentPro,
          }}
        />
        {videoControls}
      </div>
    );
  }

  if (phase === "verifying-pnl") {
    const stageText =
      pnlStage === "checking"
        ? "VERIFYING TRADING PERFORMANCE..."
        : pnlStage === "fetching"
          ? "FETCHING ALL-TIME PNL..."
          : "PNL VERIFIED";
    const pnlText: PnlDisplay = {
      kind: "text",
      text: pnlStage === "verified" ? "VERIFIED" : "FETCHING...",
    };

    return (
      <div className="flex flex-col items-center gap-8 py-6 text-center">
        <span className="text-xs font-bold tracking-[0.3em] text-muted">{modeLabel}</span>
        <ArenaCameraRow leftCamera={myCamera} rightCamera={opponentCamera} />
        <ArenaIdentityRow
          left={{ label: "YOU", player: me, pnl: pnlText, isPro: isMePro }}
          right={{ label: "OPPONENT", player: opponent, pnl: pnlText, isPro: isOpponentPro }}
        />
        <span
          key={stageText}
          className={`animate-pop-in text-sm font-bold tracking-[0.2em] ${
            pnlStage === "verified" ? "text-accent" : "text-muted animate-pulse"
          }`}
        >
          {stageText}
        </span>
        {videoControls}
      </div>
    );
  }

  if (phase === "pnl-failed") {
    const pnlText: PnlDisplay = { kind: "text", text: "UNAVAILABLE", tone: "loss" };

    return (
      <div className="flex flex-col items-center gap-8 py-6 text-center">
        <span className="text-xs font-bold tracking-[0.3em] text-muted">{modeLabel}</span>
        <ArenaCameraRow leftCamera={myCamera} rightCamera={opponentCamera} />
        <ArenaIdentityRow
          left={{ label: "YOU", player: me, pnl: pnlText, isPro: isMePro }}
          right={{ label: "OPPONENT", player: opponent, pnl: pnlText, isPro: isOpponentPro }}
        />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-loss/50 bg-loss/5 px-8 py-6">
          <span className="text-lg font-extrabold tracking-wide text-loss">
            UNABLE TO VERIFY PNL
          </span>
          <p className="max-w-sm text-xs text-muted">
            {pnlFailReason ??
              "We couldn't retrieve a verified wallet's real ALL-TIME PNL. Ranked matches never use random or estimated PNL, so this match can't start yet."}
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={handleRetryPnl}
              className="rounded-md bg-accent px-6 py-2.5 text-xs font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98]"
            >
              RETRY
            </button>
            <button
              type="button"
              onClick={handleLeaveCall}
              className="rounded-md border border-border px-6 py-2.5 text-xs font-bold tracking-wide text-foreground transition-colors duration-150 hover:border-muted"
            >
              LEAVE MATCH
            </button>
          </div>
        </div>
        {videoControls}
      </div>
    );
  }

  if (phase === "countdown") {
    const myPnl = me.startingPnl ?? 0;
    const opponentPnl = opponent.startingPnl ?? 0;

    return (
      <div className="flex flex-col items-center gap-8 py-6 text-center">
        <span className="text-xs font-bold tracking-[0.3em] text-muted">MATCH STARTING</span>
        <ArenaCameraRow leftCamera={myCamera} rightCamera={opponentCamera} />
        <ArenaIdentityRow
          left={{ label: "YOU", player: me, pnl: { kind: "value", value: myPnl }, isPro: isMePro }}
          right={{
            label: "OPPONENT",
            player: opponent,
            pnl: { kind: "value", value: opponentPnl },
            isPro: isOpponentPro,
          }}
        />
        <span key={countdown} className="animate-pop-in text-8xl font-extrabold text-accent">
          {countdown === 0 ? "DUEL" : countdown}
        </span>
        {videoControls}
      </div>
    );
  }

  if (phase === "live") {
    const minutes = Math.floor(view.secondsRemaining / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (view.secondsRemaining % 60).toString().padStart(2, "0");

    const myPnl = view.livePnl ? view.livePnl[meIndex] : (me.startingPnl ?? 0);
    const opponentPnl = view.livePnl ? view.livePnl[opponentIndex] : (opponent.startingPnl ?? 0);
    const advantage = myPnl - opponentPnl;
    const leaderLabel = advantage === 0 ? "TIED" : advantage > 0 ? "YOU" : `@${opponent.username}`;

    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold tracking-[0.3em] text-muted">{modeLabel}</span>
          <span className="font-mono text-5xl font-bold tracking-tight text-foreground tabular-nums">
            {minutes}:{seconds}
          </span>
        </div>

        <ArenaCameraRow leftCamera={myCamera} rightCamera={opponentCamera} />
        <ArenaIdentityRow
          left={{ label: "YOU", player: me, pnl: { kind: "value", value: myPnl }, isPro: isMePro }}
          right={{
            label: "OPPONENT",
            player: opponent,
            pnl: { kind: "value", value: opponentPnl },
            isPro: isOpponentPro,
          }}
        />

        <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface-2 px-6 py-3">
          <span className="text-[10px] font-semibold tracking-[0.25em] text-muted">
            CURRENT LEADER
          </span>
          <span className="text-sm font-bold text-foreground">{leaderLabel}</span>
          {advantage !== 0 && (
            <span className="text-xs font-semibold text-accent">
              {formatPnl(Math.abs(advantage))} ADVANTAGE
            </span>
          )}
        </div>

        {videoControls}
      </div>
    );
  }

  if (phase === "calculating") {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <span className="animate-pulse text-sm font-bold tracking-[0.3em] text-muted">
          CALCULATING RESULT...
        </span>
      </div>
    );
  }

  // phase === "result"
  const isWinner = me.result === "WIN";
  const myFixedPnl = fixedPnlOf(me);
  const opponentFixedPnl = fixedPnlOf(opponent);
  const pnlAdvantage = myFixedPnl - opponentFixedPnl;
  const mmrBefore = me.mmrBefore;
  const mmrAfter = me.mmrAfter ?? mmrBefore;
  const mmrChange = mmrAfter - mmrBefore;
  const forfeitedByMe = view.match.forfeitedBy === me.userId;
  const forfeitedByOpponent = view.match.forfeitedBy === opponent.userId;

  return (
    <div className="flex flex-col items-center gap-8 py-10 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-bold tracking-[0.3em] text-muted">MATCH COMPLETE</span>
        <span
          className={`animate-pop-in text-5xl font-extrabold tracking-tight sm:text-6xl ${
            isWinner ? "text-accent" : "text-foreground"
          }`}
        >
          {isWinner ? "VICTORY" : "DEFEAT"}
        </span>
        {forfeitedByOpponent && (
          <span className="text-xs font-semibold tracking-wide text-muted">
            Your opponent left the match — win by forfeit.
          </span>
        )}
        {forfeitedByMe && (
          <span className="text-xs font-semibold tracking-wide text-muted">
            You left the match — automatic loss.
          </span>
        )}
      </div>

      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        <ResultTile
          label="YOUR ALL-TIME PNL"
          value={formatPnl(myFixedPnl)}
          tone={myFixedPnl >= 0 ? "positive" : "negative"}
        />
        <ResultTile
          label="OPPONENT ALL-TIME PNL"
          value={formatPnl(opponentFixedPnl)}
          tone={opponentFixedPnl >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface-2 px-6 py-4">
        <p className="text-[10px] font-semibold tracking-widest text-muted">PNL ADVANTAGE</p>
        <p className={`mt-1 text-lg font-bold ${pnlAdvantage >= 0 ? "text-accent" : "text-loss"}`}>
          {formatPnl(pnlAdvantage)}
        </p>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-3">
        <ResultTile label="MMR BEFORE" value={mmrBefore.toLocaleString()} />
        <ResultTile
          label="MMR CHANGE"
          value={`${mmrChange >= 0 ? "+" : ""}${mmrChange}`}
          tone={mmrChange >= 0 ? "positive" : "negative"}
        />
        <ResultTile label="MMR AFTER" value={mmrAfter.toLocaleString()} />
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-4">
        <Link
          href="/play"
          className="rounded-md bg-accent px-6 py-3 text-sm font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98]"
        >
          FIND ANOTHER MATCH
        </Link>
        <Link
          href="/matches"
          className="rounded-md border border-border px-6 py-3 text-sm font-bold tracking-wide text-foreground transition-colors duration-150 hover:border-muted"
        >
          VIEW MATCH HISTORY
        </Link>
      </div>
    </div>
  );
}
