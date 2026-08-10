import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getMatch } from "@/lib/db/matches";
import type { MatchPlayerRecord } from "@/lib/game/store";
import { getRankForMmr } from "@/lib/game/mmr";
import { shortenAddress } from "@/lib/solana";
import { fixedPnlOf, formatPnl, formatRelativeTime } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { ProBadge } from "@/components/ui/pro-badge";
import { getProStatusMap } from "@/lib/billing/entitlement";
import { GAME_MODE_META } from "@/lib/game/game-modes";

export const metadata: Metadata = {
  title: "Match Detail — CoinDuel",
};

function PlayerSummary({
  label,
  player,
  isPro,
  pnlLabel,
}: {
  label: string;
  player: MatchPlayerRecord;
  isPro: boolean;
  pnlLabel: string;
}) {
  const pnl = fixedPnlOf(player);
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 text-center">
      <span className="text-xs font-semibold tracking-widest text-muted">{label}</span>
      <div className="mt-3 flex justify-center">
        <Avatar username={player.username} profileImageUrl={player.profileImageUrl} size="lg" />
      </div>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-lg font-bold text-foreground">
        @{player.username}
        {isPro && <ProBadge />}
      </p>
      <p className="mt-1 text-xs text-muted">
        {getRankForMmr(player.mmrBefore)} &middot; {player.mmrBefore.toLocaleString()} MMR
      </p>
      <p className="mt-3 text-[10px] font-semibold tracking-[0.25em] text-muted">{pnlLabel}</p>
      <p className={`mt-1 text-2xl font-extrabold ${pnl >= 0 ? "text-accent" : "text-loss"}`}>
        {formatPnl(pnl)}
      </p>
      {player.walletAddress && (
        <p className="mt-1 text-xs text-muted">{shortenAddress(player.walletAddress)}</p>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const cls = tone === "positive" ? "text-accent" : tone === "negative" ? "text-loss" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-center">
      <p className="text-[10px] font-semibold tracking-widest text-muted">{label}</p>
      <p className={`mt-1 text-base font-bold ${cls}`}>{value}</p>
    </div>
  );
}

export default async function MatchDetailPage(props: PageProps<"/matches/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;

  const match = await getMatch(id);
  if (!match) notFound();

  const isParticipant = match.players.some((p) => p.userId === user.id);
  if (!isParticipant) redirect("/matches");
  if (match.status !== "COMPLETED") redirect(`/play/match/${match.id}`);

  const me = match.players.find((p) => p.userId === user.id)!;
  const opponent = match.players.find((p) => p.userId !== user.id)!;
  const isWin = me.result === "WIN";
  const mmrChange = (me.mmrAfter ?? me.mmrBefore) - me.mmrBefore;
  const proStatus = await getProStatusMap([me.userId, opponent.userId]);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-20">
      <Link
        href="/matches"
        className="text-xs font-semibold text-muted transition-colors duration-150 hover:text-foreground"
      >
        &larr; Back to matches
      </Link>

      <div className="mt-6 flex flex-col items-center gap-2 text-center">
        <span
          className={`text-4xl font-extrabold tracking-tight ${isWin ? "text-accent" : "text-foreground"}`}
        >
          {isWin ? "VICTORY" : "DEFEAT"}
        </span>
        {!match.isRanked ? (
          <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted">
            PRIVATE DUEL &middot; DID NOT AFFECT MMR
          </span>
        ) : (
          <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted">
            {GAME_MODE_META[match.gameMode].label}
          </span>
        )}
        <span className="text-xs text-muted">
          {formatRelativeTime(match.endedAt ?? match.createdAt)}
        </span>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PlayerSummary
          label="YOU"
          player={me}
          isPro={proStatus[me.userId] ?? false}
          pnlLabel={GAME_MODE_META[match.gameMode].label}
        />
        <PlayerSummary
          label="OPPONENT"
          player={opponent}
          isPro={proStatus[opponent.userId] ?? false}
          pnlLabel={GAME_MODE_META[match.gameMode].label}
        />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Tile label="MMR BEFORE" value={me.mmrBefore.toLocaleString()} />
        <Tile
          label="MMR CHANGE"
          value={`${mmrChange >= 0 ? "+" : ""}${mmrChange}`}
          tone={mmrChange >= 0 ? "positive" : "negative"}
        />
        <Tile label="MMR AFTER" value={(me.mmrAfter ?? me.mmrBefore).toLocaleString()} />
      </div>
    </div>
  );
}
