import type { MatchPlayerRecord } from "@/lib/game/store";

export function formatPnl(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  const formatted = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${formatted}`;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

/**
 * A player's fixed match PNL. Deliberately lives here rather than in
 * game/store.ts — that module imports node:fs and can't be pulled into a
 * client bundle, and this file is already safely shared by client and
 * server code. The MatchPlayerRecord import above is type-only (erased at
 * compile time), so it doesn't drag store.ts's runtime code along.
 */
export function fixedPnlOf(player: MatchPlayerRecord): number {
  return player.endingPnl ?? player.startingPnl ?? 0;
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(isoDate: string): string {
  const diffSeconds = Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 1000));

  if (diffSeconds < 60) return `${diffSeconds} second${diffSeconds === 1 ? "" : "s"} ago`;

  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}
