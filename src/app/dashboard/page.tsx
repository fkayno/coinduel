import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/current-user";
import { shortenAddress } from "@/lib/solana";
import { getRankForMmr } from "@/lib/game/mmr";
import { listMatchesForUser } from "@/lib/db/matches";
import { fixedPnlOf, formatPnl, formatRelativeTime } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { ProBadge } from "@/components/ui/pro-badge";
import { getProStatusMap, hasProAccess } from "@/lib/billing/entitlement";

export const metadata: Metadata = {
  title: "Dashboard — CoinDuel",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const recentMatches = (await listMatchesForUser(user.id)).slice(0, 3);
  const totalGames = user.wins + user.losses;
  const winRatePct = totalGames === 0 ? 0 : Math.round((user.wins / totalGames) * 100);
  const isPro = await hasProAccess(user.id);
  const opponentProStatus = await getProStatusMap(
    recentMatches.map((match) => match.players.find((p) => p.userId !== user.id)?.userId ?? "")
  );

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-20">
      <span className="text-xs font-semibold tracking-[0.3em] text-muted">DASHBOARD</span>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Avatar username={user.username} profileImageUrl={user.profileImageUrl} size="md" />
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Welcome back, {user.username}.
        </h1>
        {isPro && <ProBadge />}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <span className="text-xs font-semibold tracking-widest text-muted">RANK</span>
          <p className="mt-2 text-2xl font-bold text-foreground">{getRankForMmr(user.mmr)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <span className="text-xs font-semibold tracking-widest text-muted">MMR</span>
          <p className="mt-2 text-2xl font-bold text-foreground">{user.mmr.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <span className="text-xs font-semibold tracking-widest text-muted">WALLET</span>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {user.walletAddress ? shortenAddress(user.walletAddress) : "Not connected"}
          </p>
          {user.walletVerified ? (
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Verified
            </span>
          ) : (
            <span className="mt-1 inline-block text-xs font-semibold text-muted">Not verified</span>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <span className="text-xs font-semibold tracking-widest text-muted">WIN RATE</span>
          <p className="mt-2 text-2xl font-bold text-foreground">{winRatePct}%</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <span className="text-xs font-semibold tracking-widest text-muted">RECORD</span>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {user.wins}-{user.losses}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <span className="text-xs font-semibold tracking-widest text-muted">STREAK</span>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {user.streak === 0 ? "—" : user.streak > 0 ? `${user.streak}W` : `${Math.abs(user.streak)}L`}
          </p>
        </div>
      </div>

      <Link
        href={user.walletVerified ? "/play" : "/profile"}
        className="mt-8 inline-block rounded-md bg-accent px-8 py-3.5 text-sm font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98]"
      >
        {user.walletVerified ? "FIND RANKED MATCH" : "VERIFY WALLET TO PLAY"}
      </Link>

      <div className="mt-14">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-[0.3em] text-muted">RECENT MATCHES</span>
          <Link
            href="/matches"
            className="text-xs font-semibold text-accent transition-colors duration-150 hover:text-accent-dim"
          >
            View all
          </Link>
        </div>

        {recentMatches.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No matches yet — find your first ranked duel above.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {recentMatches.map((match) => {
              const me = match.players.find((p) => p.userId === user.id)!;
              const opponent = match.players.find((p) => p.userId !== user.id)!;
              const isWin = me.result === "WIN";
              const mmrChange = (me.mmrAfter ?? me.mmrBefore) - me.mmrBefore;
              const pnlAdvantage = fixedPnlOf(me) - fixedPnlOf(opponent);

              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition-colors duration-150 hover:border-muted/60 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold tracking-wide ${isWin ? "text-accent" : "text-loss"}`}
                    >
                      {isWin ? "VICTORY" : "DEFEAT"}
                    </span>
                    {!match.isRanked && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted">
                        PRIVATE
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                      <Avatar
                        username={opponent.username}
                        profileImageUrl={opponent.profileImageUrl}
                        size="xs"
                      />
                      vs @{opponent.username}
                      {opponentProStatus[opponent.userId] && <ProBadge />}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs font-semibold ${mmrChange >= 0 ? "text-accent" : "text-loss"}`}
                    >
                      {formatPnl(pnlAdvantage)} PNL &middot; {mmrChange >= 0 ? "+" : ""}
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
    </div>
  );
}
