import { MATCH_DURATION_SECONDS } from "@/lib/config";
import { updateUserStats } from "@/lib/db/users";
import { updateModeStats, type TimedGameMode } from "@/lib/db/mode-ratings";
import { calculateEloChange } from "@/lib/game/mmr";
import { generatePnlSeed, getPnlProvider, PnlUnavailableError } from "@/lib/game/pnl-service";
import { getTopToken } from "@/lib/game/top-token-service";
import type { MockOpponent } from "@/lib/game/bots";
import { createMatchId, getMatch, saveMatch, withLock } from "@/lib/db/matches";
import type { MatchPlayerRecord, StoredMatch } from "@/lib/game/store";
import { DEFAULT_GAME_MODE, type GameMode } from "@/lib/game/game-modes";

export interface MatchPlayerInput {
  userId: string;
  username: string;
  walletAddress: string | null;
  profileImageUrl: string | null;
  isBot: boolean;
  mmr: number;
}

export function toMatchPlayerInput(user: {
  id: string;
  username: string;
  walletAddress: string | null;
  profileImageUrl: string | null;
  mmr: number;
}): MatchPlayerInput {
  return {
    userId: user.id,
    username: user.username,
    walletAddress: user.walletAddress,
    profileImageUrl: user.profileImageUrl,
    isBot: false,
    mmr: user.mmr,
  };
}

export function botToMatchPlayerInput(bot: MockOpponent & { mmr: number }): MatchPlayerInput {
  return {
    userId: `bot:${bot.username}`,
    username: bot.username,
    walletAddress: bot.walletAddress,
    profileImageUrl: null,
    isBot: true,
    mmr: bot.mmr,
  };
}

function toRecord(p: MatchPlayerInput): MatchPlayerRecord {
  return {
    userId: p.userId,
    username: p.username,
    walletAddress: p.walletAddress,
    profileImageUrl: p.profileImageUrl,
    isBot: p.isBot,
    mmrBefore: p.mmr,
    mmrAfter: null,
    pnlSeed: generatePnlSeed(),
    startingPnl: null,
    endingPnl: null,
    pnlChange: null,
    pnlPercent: null,
    result: null,
    topToken: null,
  };
}

/**
 * Server creates every match — the client only ever receives the result.
 * `isRanked` defaults to true (every existing ranked/queue/bot call site is
 * unaffected); private duels (src/lib/game/private-duel-service.ts) pass
 * false, which applyMatchResult() below uses to skip Elo/MMR entirely.
 *
 * `gameMode` defaults to ALL_TIME so every existing call site (and every
 * historical match) is unaffected — it determines which Solana Tracker
 * timeframe ensurePnlFetched() below uses for BOTH players, and which
 * rating applyMatchResult() updates on completion.
 */
export async function createMatch(
  playerA: MatchPlayerInput,
  playerB: MatchPlayerInput,
  isRanked = true,
  gameMode: GameMode = DEFAULT_GAME_MODE
): Promise<StoredMatch> {
  const match: StoredMatch = {
    id: createMatchId(),
    status: "FOUND",
    duration: MATCH_DURATION_SECONDS,
    createdAt: new Date().toISOString(),
    startedAt: null,
    endedAt: null,
    winnerId: null,
    loserId: null,
    pnlStatus: "PENDING",
    pnlError: null,
    forfeitedBy: null,
    isRanked,
    gameMode,
    players: [toRecord(playerA), toRecord(playerB)],
  };
  return saveMatch(match);
}

/**
 * Fetches and freezes each player's wallet ALL-TIME PNL, if not already
 * done. Idempotent/no-op once pnlStatus is "READY" — the external PNL
 * provider is called at most once per match, never per-second and never
 * per-retry-of-an-already-succeeded match. On failure, marks the match
 * "FAILED" with a human-readable reason instead of ever inventing a value.
 *
 * Also fetches each player's top-profit token alongside the real PNL —
 * purely decorative, so it never blocks or fails the match even if it
 * comes back null (see top-token-service.ts).
 */
async function ensurePnlFetched(match: StoredMatch): Promise<StoredMatch> {
  if (match.pnlStatus === "READY") return match;

  const provider = getPnlProvider();
  try {
    const players = (await Promise.all(
      match.players.map(async (p) => {
        const [{ pnl: startingPnl, pnlPercent }, topToken] = await Promise.all([
          provider.getFixedPnl(p.walletAddress ?? "", p.pnlSeed, match.gameMode),
          getTopToken(p.walletAddress ?? "", p.pnlSeed),
        ]);
        return { ...p, startingPnl, pnlPercent, topToken };
      })
    )) as [MatchPlayerRecord, MatchPlayerRecord];

    return saveMatch({ ...match, players, pnlStatus: "READY", pnlError: null });
  } catch (error) {
    const message =
      error instanceof PnlUnavailableError || error instanceof Error
        ? error.message
        : "Unable to verify wallet PNL.";
    return saveMatch({ ...match, pnlStatus: "FAILED", pnlError: message });
  }
}

/**
 * Step 1 of starting a duel: verify + freeze both players' ALL-TIME PNL.
 * Deliberately does NOT set `startedAt` — that only happens in startMatch(),
 * once the client has shown "PNL VERIFIED" and run the 3-2-1 countdown, so a
 * slow PNL lookup never eats into the 30-second match clock. Safe to call
 * repeatedly (e.g. a "retry" after a failure) — a prior success is never
 * re-fetched.
 */
export async function verifyMatchPnl(matchId: string): Promise<StoredMatch | null> {
  return withLock(matchId, async () => {
    const match = await getMatch(matchId);
    if (!match) return null;
    if (match.status !== "FOUND") return match;
    return ensurePnlFetched(match);
  });
}

/**
 * Step 2: idempotent transition FOUND -> ACTIVE. Requires PNL to already be
 * verified (calls ensurePnlFetched as a safety net if a client somehow skips
 * straight here) — refuses to start a ranked match on unverified PNL. Safe
 * to call more than once (e.g. both players' clients racing to start) — only
 * the first successful call has an effect.
 */
export async function startMatch(matchId: string): Promise<StoredMatch | null> {
  return withLock(matchId, async () => {
    let match = await getMatch(matchId);
    if (!match) return null;
    if (match.status !== "FOUND") return match;

    match = await ensurePnlFetched(match);
    if (match.pnlStatus !== "READY") return match;

    return saveMatch({ ...match, status: "ACTIVE", startedAt: new Date().toISOString() });
  });
}

export interface LiveMatchView {
  match: StoredMatch;
  secondsRemaining: number;
  /** Present only while ACTIVE — the players' fixed PNL, frozen since match start. */
  livePnl: [number, number] | null;
}

/**
 * Server-authoritative read. Determines match end from `startedAt` +
 * `duration` timestamps, not from anything the client says — if time has
 * elapsed, this finalizes the match right here before returning, so the
 * very next poll from either player (or a page reload) sees the same
 * COMPLETED result. Finalization is guarded by a per-match lock and a
 * status check so it only ever runs once per match.
 *
 * PNL is intentionally NOT recomputed here from elapsed time or coin price
 * — it was already fixed once (verifyMatchPnl/startMatch) and is simply
 * echoed back.
 */
export async function getLiveMatchView(matchId: string): Promise<LiveMatchView | null> {
  return withLock(matchId, async () => {
    let match = await getMatch(matchId);
    if (!match) return null;

    if (match.status !== "ACTIVE" || !match.startedAt) {
      return { match, secondsRemaining: match.duration, livePnl: null };
    }

    const elapsedSeconds = (Date.now() - new Date(match.startedAt).getTime()) / 1000;

    if (elapsedSeconds >= match.duration) {
      match = await finalizeMatch(match);
      return { match, secondsRemaining: 0, livePnl: null };
    }

    const fixedPnl: [number, number] = [
      match.players[0].startingPnl ?? 0,
      match.players[1].startingPnl ?? 0,
    ];

    return {
      match,
      secondsRemaining: Math.max(0, Math.ceil(match.duration - elapsedSeconds)),
      livePnl: fixedPnl,
    };
  });
}

/**
 * Shared by finalizeMatch (clock ran out) and forfeitMatch (a player left
 * early) — computes Elo, applies stats to real (non-bot) accounts, and
 * persists the COMPLETED match once. `forfeitedBy` is null for a normal
 * finish, or the leaving player's userId for a forfeit.
 *
 * For a private duel (match.isRanked === false), MMR is deliberately left
 * unchanged and updateUserStats() is never called — private duels use the
 * same PNL-comparison/win-loss logic as ranked, but must never move a
 * player's real MMR or win/loss record.
 */
async function applyMatchResult(
  match: StoredMatch,
  players: [MatchPlayerRecord, MatchPlayerRecord],
  winnerIndex: 0 | 1,
  forfeitedBy: string | null
): Promise<StoredMatch> {
  const loserIndex: 0 | 1 = winnerIndex === 0 ? 1 : 0;
  const winner = players[winnerIndex];
  const loser = players[loserIndex];

  winner.result = "WIN";
  loser.result = "LOSS";

  if (match.isRanked) {
    const { winnerChange, loserChange } = calculateEloChange(winner.mmrBefore, loser.mmrBefore);
    winner.mmrAfter = winner.isBot ? winner.mmrBefore : winner.mmrBefore + winnerChange;
    loser.mmrAfter = loser.isBot ? loser.mmrBefore : loser.mmrBefore + loserChange;

    // Only real users have a persisted profile to update — MMR/W-L/streak
    // never touch a bot "account" because there isn't one. ALL_TIME keeps
    // updating User's own mmr/wins/losses/streak columns exactly as before
    // game modes existed; the three timed modes get their own ModeRating
    // row instead, so playing THIRTY_DAYS/SEVEN_DAYS/ONE_DAY never touches
    // (and can never accidentally overwrite) a player's original All-Time
    // ranked MMR.
    if (match.gameMode === "ALL_TIME") {
      if (!winner.isBot) await updateUserStats(winner.userId, { mmr: winner.mmrAfter, won: true });
      if (!loser.isBot) await updateUserStats(loser.userId, { mmr: loser.mmrAfter, won: false });
    } else {
      const timedMode = match.gameMode as TimedGameMode;
      if (!winner.isBot) await updateModeStats(winner.userId, timedMode, { mmr: winner.mmrAfter, won: true });
      if (!loser.isBot) await updateModeStats(loser.userId, timedMode, { mmr: loser.mmrAfter, won: false });
    }
  } else {
    winner.mmrAfter = winner.mmrBefore;
    loser.mmrAfter = loser.mmrBefore;
  }

  return saveMatch({
    ...match,
    status: "COMPLETED",
    endedAt: new Date().toISOString(),
    winnerId: winner.userId,
    loserId: loser.userId,
    forfeitedBy,
    players,
  });
}

/**
 * Must only be called from inside withLock. "Ending" PNL is just a copy of
 * the frozen "starting" value — winner is whoever's fixed ALL-TIME PNL is
 * higher, not who "improved more" (there's no more live movement to compare).
 */
async function finalizeMatch(match: StoredMatch): Promise<StoredMatch> {
  const players = match.players.map((p) => {
    const fixedPnl = p.startingPnl ?? 0;
    return { ...p, startingPnl: fixedPnl, endingPnl: fixedPnl, pnlChange: 0 };
  }) as [MatchPlayerRecord, MatchPlayerRecord];

  const [a, b] = players;
  const aPnl = a.endingPnl ?? 0;
  const bPnl = b.endingPnl ?? 0;

  const winnerIndex: 0 | 1 =
    aPnl === bPnl ? (a.mmrBefore <= b.mmrBefore ? 0 : 1) : aPnl > bPnl ? 0 : 1;

  return applyMatchResult(match, players, winnerIndex, null);
}

/**
 * Ends a match immediately because one player left — the leaving player
 * always loses, regardless of PNL (which may not even be known yet if they
 * left before verification finished). Works for a match in FOUND or ACTIVE
 * status. Idempotent: once a match is COMPLETED (by forfeit or the clock),
 * calling this again is a no-op that just returns the already-decided
 * result — a match can't be "re-forfeited" or have its outcome flipped.
 */
export async function forfeitMatch(matchId: string, leavingUserId: string): Promise<StoredMatch | null> {
  return withLock(matchId, async () => {
    const match = await getMatch(matchId);
    if (!match) return null;
    if (match.status === "COMPLETED") return match;

    const leavingIndex = match.players.findIndex((p) => p.userId === leavingUserId);
    if (leavingIndex === -1) return match; // not a participant of this match — no-op

    const winnerIndex: 0 | 1 = leavingIndex === 0 ? 1 : 0;
    const players = match.players.map((p) => {
      const fixedPnl = p.startingPnl ?? 0;
      return { ...p, startingPnl: fixedPnl, endingPnl: fixedPnl, pnlChange: 0 };
    }) as [MatchPlayerRecord, MatchPlayerRecord];

    return applyMatchResult(match, players, winnerIndex, leavingUserId);
  });
}
