import { MMR_RANGE_EXPAND_INTERVAL_SECONDS, MMR_SEARCH_RANGES } from "@/lib/config";
import { listQueue } from "@/lib/db/matches";
import type { QueueEntry } from "@/lib/game/store";

// ============================================================
// REAL MATCHMAKING LOGIC
// (The DEV MOCK OPPONENT FALLBACK lives separately in bots.ts and is only
// invoked from the /api/play/state route when this logic finds nobody.)
// ============================================================

/** MMR search radius for a player who has been queued this long. */
export function getSearchRangeForWaitTime(waitingSeconds: number): number {
  const step = Math.min(
    Math.floor(waitingSeconds / MMR_RANGE_EXPAND_INTERVAL_SECONDS),
    MMR_SEARCH_RANGES.length - 1
  );
  return MMR_SEARCH_RANGES[step];
}

/** Closest other queued real player within `range` MMR of `entry`. Never matches self. */
export async function findQueueOpponent(entry: QueueEntry, range: number): Promise<QueueEntry | null> {
  const queue = await listQueue();
  const candidates = queue.filter(
    (other) => other.userId !== entry.userId && Math.abs(other.mmr - entry.mmr) <= range
  );
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => Math.abs(a.mmr - entry.mmr) - Math.abs(b.mmr - entry.mmr));
  return candidates[0];
}
