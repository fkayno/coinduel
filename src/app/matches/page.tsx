import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { listMatchesForUser } from "@/lib/db/matches";
import { fixedPnlOf, formatPnl, formatRelativeTime } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { ProBadge } from "@/components/ui/pro-badge";
import { getProStatusMap } from "@/lib/billing/entitlement";

export const metadata: Metadata = {
  title: "Matches — CoinDuel",
};

export default async function MatchesPage() {
  const user = await requireUser();
  const matches = await listMatchesForUser(user.id);
  const opponentProStatus = await getProStatusMap(
    matches.map((match) => match.players.find((p) => p.userId !== user.id)?.userId ?? "")
  );

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
      <span className="text-xs font-semibold tracking-[0.3em] text-muted">MATCHES</span>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground">
        Match History
      </h1>

      {matches.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          No matches yet.{" "}
          <Link href="/play" className="font-semibold text-accent hover:text-accent-dim">
            Find a ranked match
          </Link>{" "}
          to get started.
        </p>
      ) : (
        <div className="mt-10 flex flex-col gap-3">
          {matches.map((match) => {
            const me = match.players.find((p) => p.userId === user.id)!;
            const opponent = match.players.find((p) => p.userId !== user.id)!;
            const isWin = me.result === "WIN";
            const pnlAdvantage = fixedPnlOf(me) - fixedPnlOf(opponent);
            const mmrChange = (me.mmrAfter ?? me.mmrBefore) - me.mmrBefore;

            return (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 transition-colors duration-150 hover:border-muted/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-bold tracking-wide ${isWin ? "text-accent" : "text-loss"}`}
                  >
                    {isWin ? "VICTORY" : "DEFEAT"}
                  </span>
                  {!match.isRanked && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted">
                      PRIVATE
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 text-sm text-muted">
                    <Avatar
                      username={opponent.username}
                      profileImageUrl={opponent.profileImageUrl}
                      size="xs"
                    />
                    vs @{opponent.username}
                    {opponentProStatus[opponent.userId] && <ProBadge />}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                  <span
                    className={`text-sm font-semibold ${pnlAdvantage >= 0 ? "text-accent" : "text-loss"}`}
                  >
                    {formatPnl(pnlAdvantage)} PNL
                  </span>
                  <span
                    className={`text-sm font-semibold ${mmrChange >= 0 ? "text-accent" : "text-loss"}`}
                  >
                    {mmrChange >= 0 ? "+" : ""}
                    {mmrChange} MMR
                  </span>
                  <span className="text-xs text-muted">
                    {formatRelativeTime(match.endedAt ?? match.createdAt)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
