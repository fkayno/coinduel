import { RANK_TIERS } from "@/lib/mock-data";
import { winRate, type LeaderboardEntry } from "@/lib/db/leaderboard";
import { Avatar } from "@/components/ui/avatar";
import { ProBadge } from "@/components/ui/pro-badge";

function tierColor(tier: string): string {
  return RANK_TIERS.find((r) => r.tier === tier)?.color ?? "#96969e";
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <p className="px-6 py-12 text-center text-sm text-muted">
        No ranked matches have been completed yet — be the first on the board.
      </p>
    );
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <table className="hidden w-full text-left sm:table">
        <thead>
          <tr className="border-b border-border text-xs font-semibold tracking-widest text-muted">
            <th className="px-6 py-4 font-semibold">#</th>
            <th className="px-6 py-4 font-semibold">PLAYER</th>
            <th className="px-6 py-4 font-semibold">RANK</th>
            <th className="px-6 py-4 font-semibold">MMR</th>
            <th className="px-6 py-4 font-semibold">W/L</th>
            <th className="px-6 py-4 font-semibold">WIN RATE</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.userId}
              className="border-b border-border/60 text-sm transition-colors duration-150 last:border-b-0 hover:bg-surface-2"
            >
              <td className="px-6 py-4 font-mono tabular-nums text-muted">{entry.rank}</td>
              <td className="px-6 py-4 font-semibold text-foreground">
                <span className="flex items-center gap-2.5">
                  <Avatar username={entry.username} profileImageUrl={entry.profileImageUrl} size="xs" />
                  {entry.username}
                  {entry.isPro && <ProBadge />}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-muted">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tierColor(entry.tier) }}
                  />
                  {entry.tier}
                </span>
              </td>
              <td className="px-6 py-4 font-mono tabular-nums text-foreground">
                {entry.mmr.toLocaleString()}
              </td>
              <td className="px-6 py-4 font-mono tabular-nums text-muted">
                {entry.wins}-{entry.losses}
              </td>
              <td className="px-6 py-4 font-mono tabular-nums text-accent">{winRate(entry)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile card list */}
      <div className="divide-y divide-border sm:hidden">
        {entries.map((entry) => (
          <div key={entry.userId} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm tabular-nums text-muted">{entry.rank}</span>
              <Avatar username={entry.username} profileImageUrl={entry.profileImageUrl} size="sm" />
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  {entry.username}
                  {entry.isPro && <ProBadge />}
                </p>
                <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: tierColor(entry.tier) }}
                  />
                  {entry.tier} &middot; {entry.mmr.toLocaleString()} MMR
                </span>
              </div>
            </div>
            <span className="font-mono text-sm font-semibold tabular-nums text-accent">
              {winRate(entry)}%
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
