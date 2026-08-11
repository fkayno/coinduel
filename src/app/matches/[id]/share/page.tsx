import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMatch } from "@/lib/db/matches";
import { shareDisplayOf } from "@/lib/format";
import { GAME_MODE_META } from "@/lib/game/game-modes";
import { Avatar } from "@/components/ui/avatar";
import { SITE_URL } from "@/lib/config";
import { ShareActions } from "@/components/matches/share-actions";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

async function loadCompletedMatch(id: string) {
  const match = await getMatch(id);
  if (!match || match.status !== "COMPLETED") return null;
  return match;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { id } = await params;
  const match = await loadCompletedMatch(id);
  if (!match) return { title: "Match Result — CoinDuel" };

  const [a, b] = match.players;
  const winner = match.players.find((p) => p.result === "WIN") ?? a;
  const title = `${a.username} vs ${b.username} — CoinDuel`;
  const description = `${winner.username} WON — ${GAME_MODE_META[match.gameMode].label} duel on CoinDuel. Challenge me!`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * Public, no-auth match result card — anyone with the link can view it
 * (unlike /matches/[id], which requires the viewer to be a participant).
 * Deliberately excludes wallet addresses, unlike the private match-detail
 * page. Only ever renders for a COMPLETED match — 404s otherwise so a live
 * or not-yet-played match can't leak a preview of its state.
 */
export default async function MatchSharePage({ params }: SharePageProps) {
  const { id } = await params;
  const match = await loadCompletedMatch(id);
  if (!match) notFound();

  const [a, b] = match.players;
  const winner = match.players.find((p) => p.result === "WIN") ?? a;
  const shareUrl = `${SITE_URL}/matches/${match.id}/share`;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-6 py-20">
      <div className="w-full rounded-3xl border border-border bg-surface p-8 text-center">
        <p className="text-xs font-extrabold tracking-[0.3em] text-accent">🏆 COINDUEL</p>

        <div className="mt-6 flex items-center justify-center gap-6">
          <PlayerBlock username={a.username} profileImageUrl={a.profileImageUrl} isWinner={a.result === "WIN"} />
          <span className="text-sm font-bold text-muted">VS</span>
          <PlayerBlock username={b.username} profileImageUrl={b.profileImageUrl} isWinner={b.result === "WIN"} />
        </div>

        <p className="mt-6 text-2xl font-extrabold text-foreground">
          📈 {shareDisplayOf(a)} <span className="text-muted">vs</span> {shareDisplayOf(b)}
        </p>

        <p className="mt-3 text-lg font-extrabold text-accent">{winner.username} WON</p>

        <p className="mt-1 text-[10px] font-semibold tracking-[0.25em] text-muted">
          {GAME_MODE_META[match.gameMode].label}
        </p>

        <p className="mt-6 text-sm font-bold text-foreground">
          ⚔️ Challenge me → <span className="text-accent">coinduel.online</span>
        </p>
      </div>

      <ShareActions shareUrl={shareUrl} imageUrl={`${shareUrl}/opengraph-image`} />
    </div>
  );
}

function PlayerBlock({
  username,
  profileImageUrl,
  isWinner,
}: {
  username: string;
  profileImageUrl: string | null;
  isWinner: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Avatar username={username} profileImageUrl={profileImageUrl} size="lg" />
      <span className={`text-sm font-bold ${isWinner ? "text-accent" : "text-foreground"}`}>@{username}</span>
    </div>
  );
}
