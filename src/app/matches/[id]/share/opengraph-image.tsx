import { ImageResponse } from "next/og";
import { getMatch } from "@/lib/db/matches";
import { shareDisplayOf } from "@/lib/format";
import { GAME_MODE_META } from "@/lib/game/game-modes";
import type { MatchPlayerRecord } from "@/lib/game/store";

export const alt = "CoinDuel match result";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COLORS = {
  background: "#060607",
  surface: "#0e0e10",
  border: "#242428",
  accent: "#22e07a",
  foreground: "#f5f5f4",
  muted: "#96969e",
};

function AvatarCircle({ player }: { player: MatchPlayerRecord }) {
  return (
    <div
      style={{
        display: "flex",
        width: 140,
        height: 140,
        borderRadius: "50%",
        border: `2px solid ${COLORS.border}`,
        background: COLORS.surface,
        alignItems: "center",
        justifyContent: "center",
        fontSize: 56,
        fontWeight: 800,
        color: COLORS.accent,
      }}
    >
      {player.username.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatch(id);

  if (!match || match.status !== "COMPLETED") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: COLORS.background,
            color: COLORS.foreground,
            fontSize: 48,
            fontWeight: 800,
          }}
        >
          COINDUEL
        </div>
      ),
      { ...size }
    );
  }

  const [a, b] = match.players;
  const winner = match.players.find((p) => p.result === "WIN") ?? a;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: COLORS.background,
          padding: 60,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: "100%",
            borderRadius: 32,
            border: `2px solid ${COLORS.border}`,
            background: COLORS.surface,
            padding: 56,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 8,
              color: COLORS.accent,
            }}
          >
            🏆 COINDUEL
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 56, marginTop: 48 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <AvatarCircle player={a} />
              <div
                style={{
                  display: "flex",
                  fontSize: 32,
                  fontWeight: 800,
                  color: a.result === "WIN" ? COLORS.accent : COLORS.foreground,
                }}
              >
                @{a.username}
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: COLORS.muted }}>VS</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <AvatarCircle player={b} />
              <div
                style={{
                  display: "flex",
                  fontSize: 32,
                  fontWeight: 800,
                  color: b.result === "WIN" ? COLORS.accent : COLORS.foreground,
                }}
              >
                @{b.username}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: COLORS.foreground, marginTop: 48 }}>
            📈 {shareDisplayOf(a)} vs {shareDisplayOf(b)}
          </div>

          <div style={{ display: "flex", fontSize: 36, fontWeight: 800, color: COLORS.accent, marginTop: 20 }}>
            {winner.username} WON
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 4,
              color: COLORS.muted,
              marginTop: 12,
            }}
          >
            {GAME_MODE_META[match.gameMode].label}
          </div>

          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: COLORS.foreground, marginTop: 40 }}>
            ⚔️ Challenge me → coinduel.online
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
