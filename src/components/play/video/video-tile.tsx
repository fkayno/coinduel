"use client";

import { useEffect, useRef, useState } from "react";
import type { TopToken } from "@/lib/game/store";
import { formatPnl, formatPercent } from "@/lib/format";

interface VideoTileProps {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
  mirrored?: boolean;
  /** When false, a placeholder is shown instead of the <video> element. */
  showVideo: boolean;
  placeholderText: string;
  /** Optional status strip pinned to the bottom of the tile. */
  statusText?: string | null;
  /** The player's most profitable memecoin, shown as a top-left badge. Decorative only. */
  topToken?: TopToken | null;
  /**
   * Whether wallet PNL verification has finished. Before this, the top-token
   * badge is hidden entirely (data simply isn't known yet). Once true, it
   * shows either the real token or a "TOP TRADE / NO DATA" empty state —
   * never fabricated placeholder values.
   */
  topTokenReady?: boolean;
  /** Merged onto the outer square container — use to control max size. */
  className?: string;
}

/**
 * Always a perfect 1:1 square (`aspect-square` + `object-fit: cover`), never
 * a 16:9 rectangle — the camera feed is the dominant visual element of the
 * match screen. Sizing itself (how big the square gets) is controlled by
 * the parent via `className` (e.g. `w-full max-w-[560px]`), so this
 * component just guarantees the shape stays square at every size, desktop
 * through mobile.
 */
export function VideoTile({
  stream,
  label,
  muted = false,
  mirrored = false,
  showVideo,
  placeholderText,
  statusText,
  topToken,
  topTokenReady = false,
  className = "",
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Some browsers silently block autoplay of an UNMUTED <video> element
  // (audio autoplay policy) with no error surfaced anywhere by default —
  // this is the most likely reason two players couldn't hear each other
  // even though the underlying WebRTC audio track was flowing correctly.
  // We explicitly call .play(), and if the browser rejects it, show a
  // "tap to enable sound" affordance — a direct click always satisfies the
  // browser's user-gesture requirement.
  const [needsAudioTap, setNeedsAudioTap] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.srcObject = stream;
    if (!stream) return;

    el.play().then(
      () => setNeedsAudioTap(false),
      () => {
        if (!muted) setNeedsAudioTap(true);
      }
    );
  }, [stream, muted]);

  function handleEnableAudio() {
    setNeedsAudioTap(false);
    videoRef.current?.play().catch(() => setNeedsAudioTap(true));
  }

  return (
    <div
      className={`relative aspect-square w-full overflow-hidden rounded-3xl border-2 border-border bg-surface-2 shadow-[0_0_60px_-20px_rgba(34,224,122,0.25)] ${className}`}
    >
      {showVideo && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          style={{ aspectRatio: "1 / 1", objectFit: "cover" }}
          className={`h-full w-full ${mirrored ? "-scale-x-100" : ""}`}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-center sm:gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-sm font-bold text-muted sm:h-20 sm:w-20 sm:text-2xl">
            {label.slice(0, 1)}
          </span>
          <span className="px-1 text-[9px] font-semibold tracking-widest text-muted sm:text-sm">
            {placeholderText}
          </span>
        </div>
      )}

      <div className="absolute left-1.5 top-1.5 flex max-w-[75%] flex-col items-start gap-1 sm:left-4 sm:top-4 sm:max-w-[82%] sm:gap-2">
        {topTokenReady &&
          (topToken ? (
            <div className="flex flex-col gap-0.5 rounded-lg border border-white/10 bg-black/75 px-1.5 py-1 backdrop-blur-md sm:gap-1 sm:rounded-2xl sm:px-5 sm:py-3.5">
              <span className="text-[6px] font-bold tracking-[0.1em] text-muted sm:text-[11px] sm:tracking-[0.18em]">
                MOST PROFITABLE
              </span>
              <span className="flex min-w-0 items-center gap-1 sm:gap-2">
                {topToken.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={topToken.imageUrl}
                    alt=""
                    className="h-3 w-3 shrink-0 rounded-full object-cover sm:h-8 sm:w-8"
                  />
                ) : (
                  <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[8px] sm:h-8 sm:w-8 sm:text-base">
                    🪙
                  </span>
                )}
                <span className="truncate text-[10px] font-extrabold leading-none text-white sm:text-2xl md:text-3xl">
                  {topToken.symbol}
                </span>
              </span>
              <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 sm:gap-x-3 sm:gap-y-0.5">
                <span
                  className={`text-[9px] font-extrabold sm:text-lg md:text-xl ${topToken.pnl >= 0 ? "text-accent" : "text-loss"}`}
                >
                  {formatPnl(topToken.pnl)}
                </span>
                <span
                  className={`text-[7px] font-bold sm:text-sm md:text-base ${topToken.pnlPercent >= 0 ? "text-accent/80" : "text-loss/80"}`}
                >
                  {formatPercent(topToken.pnlPercent)}
                </span>
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 rounded-lg border border-white/10 bg-black/75 px-1.5 py-1 backdrop-blur-md sm:gap-1 sm:rounded-2xl sm:px-5 sm:py-3">
              <span className="text-[6px] font-bold tracking-[0.1em] text-muted sm:text-[11px] sm:tracking-[0.18em]">
                TOP TRADE
              </span>
              <span className="text-[9px] font-bold text-muted sm:text-base">NO DATA</span>
            </div>
          ))}
        <span className="rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm sm:px-3 sm:py-1.5 sm:text-sm">
          {label}
        </span>
      </div>

      {needsAudioTap && (
        <button
          type="button"
          onClick={handleEnableAudio}
          className="absolute right-1.5 top-1.5 rounded-full bg-loss/90 px-1.5 py-1 text-[8px] font-bold tracking-wide text-white backdrop-blur-sm sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs"
        >
          TAP FOR SOUND
        </button>
      )}

      {statusText && (
        <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-1 text-center text-[9px] font-semibold tracking-wide text-white backdrop-blur-sm sm:px-3 sm:py-2.5 sm:text-sm">
          {statusText}
        </div>
      )}
    </div>
  );
}
