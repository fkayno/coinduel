/**
 * SERVER-ONLY Solana Tracker API client.
 *
 * Never import this from a "use client" component or any module that a
 * client component imports — SOLANA_TRACKER_API_KEY must never reach the
 * browser bundle. Only src/lib/game/pnl-service.ts calls this, which is
 * itself only ever called from server-side match logic (match-service.ts,
 * route handlers) and stores the result server-side before it's ever sent
 * to a client as plain JSON.
 *
 * Endpoint verified against https://docs.solanatracker.io (PnL v2 wallet
 * summary — docs.solanatracker.io/guides/pnl-v2/wallet-analysis) — confirmed
 * base URL, path, auth header, and response field:
 *
 *   curl "https://data.solanatracker.io/v2/pnl/wallets/{wallet}" \
 *     -H "x-api-key: YOUR_API_KEY"
 *   -> { summary: { pnl: { total: number }, invested, proceeds, roi: number, counts: {...} }, analysis: { winRate }, ... }
 *
 * Free tier: 10,000 requests/month, 3 req/sec — get a key at
 * https://www.solanatracker.io/account/data-api (requires signing up;
 * not something this tool does on your behalf).
 */

const SOLANA_TRACKER_API_BASE = "https://data.solanatracker.io";

export class SolanaTrackerError extends Error {}

export interface WalletTotalPnlResult {
  pnl: number;
  /**
   * The wallet's real all-time return-on-capital %, straight from Solana
   * Tracker's own `summary.roi` field — null only if that specific field is
   * missing from an otherwise-valid response, never estimated. See
   * fetchWalletPeriodRealizedPnl()'s doc comment for why the timed-window
   * endpoint below has no equivalent and can't offer this at all.
   */
  roiPercent: number | null;
}

/** Fetches a wallet's total PnL (and real ROI %, if present) from Solana Tracker's wallet PnL summary. Throws on any failure. */
export async function fetchWalletTotalPnl(walletAddress: string): Promise<WalletTotalPnlResult> {
  const apiKey = process.env.SOLANA_TRACKER_API_KEY;
  if (!apiKey) {
    throw new SolanaTrackerError("SOLANA_TRACKER_API_KEY is not configured.");
  }

  const url = `${SOLANA_TRACKER_API_BASE}/v2/pnl/wallets/${encodeURIComponent(walletAddress)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "x-api-key": apiKey,
        accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new SolanaTrackerError(`Solana Tracker request failed: ${(error as Error).message}`);
  }

  if (!res.ok) {
    throw new SolanaTrackerError(`Solana Tracker API responded with ${res.status}`);
  }

  const data = await res.json().catch(() => null);
  const totalPnl = data?.summary?.pnl?.total;
  const roi = data?.summary?.roi;

  if (typeof totalPnl !== "number" || Number.isNaN(totalPnl)) {
    throw new SolanaTrackerError("Solana Tracker response did not include a numeric total PnL.");
  }

  return {
    pnl: totalPnl,
    roiPercent: typeof roi === "number" && !Number.isNaN(roi) ? roi : null,
  };
}

/**
 * Solana Tracker's own accepted `period` values for the wallet performance
 * endpoint (`1d | 7d | 14d | 30d | 90d | all`) — this module only ever uses
 * the three CoinDuel actually needs for the timed game modes.
 */
export type SolanaTrackerPeriod = "1d" | "7d" | "30d";

/**
 * Fetches a wallet's REALIZED profit/loss for a specific trailing window
 * (last 24h / 7 days / 30 days) from Solana Tracker's wallet performance
 * endpoint — a different endpoint from fetchWalletTotalPnl() above, which
 * only ever returns the ALL-TIME total.
 *
 * Endpoint verified against https://docs.solanatracker.io (PnL v2 wallet
 * performance):
 *
 *   curl "https://data.solanatracker.io/v2/pnl/wallets/{wallet}/performance?period=7d" \
 *     -H "x-api-key: YOUR_API_KEY"
 *   -> { window: 7, totals: { realizedPnl: number, volume, trades }, ... }
 *
 * IMPORTANT ASYMMETRY vs. fetchWalletTotalPnl(): the all-time summary
 * endpoint's `pnl.total` is realized + unrealized (current paper value of
 * still-open positions) combined. This performance endpoint's `totals` only
 * exposes `realizedPnl` for the window — Solana Tracker does not report a
 * combined realized+unrealized figure scoped to an arbitrary trailing
 * window, only "right now" (which isn't meaningfully attributable to "the
 * last 7 days" specifically). Rather than approximate a combined number by
 * mixing two different snapshots, timed modes compare REALIZED PNL for the
 * selected window — a real, directly-API-supported value, not a fabricated
 * or estimated one. See game-modes.ts's GAME_MODE_META descriptions, which
 * this asymmetry is intentionally kept honest with ("compare your PNL from
 * the last N days" — trades actually closed in that window).
 */
export async function fetchWalletPeriodRealizedPnl(
  walletAddress: string,
  period: SolanaTrackerPeriod
): Promise<number> {
  const apiKey = process.env.SOLANA_TRACKER_API_KEY;
  if (!apiKey) {
    throw new SolanaTrackerError("SOLANA_TRACKER_API_KEY is not configured.");
  }

  const url = `${SOLANA_TRACKER_API_BASE}/v2/pnl/wallets/${encodeURIComponent(walletAddress)}/performance?period=${period}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "x-api-key": apiKey,
        accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new SolanaTrackerError(`Solana Tracker request failed: ${(error as Error).message}`);
  }

  if (!res.ok) {
    throw new SolanaTrackerError(`Solana Tracker API responded with ${res.status}`);
  }

  const data = await res.json().catch(() => null);
  const realizedPnl = data?.totals?.realizedPnl;

  if (typeof realizedPnl !== "number" || Number.isNaN(realizedPnl)) {
    throw new SolanaTrackerError("Solana Tracker response did not include a numeric realized PnL.");
  }

  return realizedPnl;
}

export interface TopTokenResult {
  symbol: string;
  name: string;
  imageUrl: string | null;
  /** Realized profit in USD for this specific token — not the wallet's overall PNL. */
  pnl: number;
  /** Per-token ROI %, straight from the API's own `roi` field for that position. */
  pnlPercent: number;
}

/**
 * Fetches a wallet's most profitable token position, for the decorative
 * "most profitable memecoin" badge only (see src/lib/game/top-token-service.ts)
 * — NEVER throws, returns null on any failure/missing data, since this must
 * never block a ranked match the way fetchWalletTotalPnl() does.
 *
 * Endpoint verified against https://docs.solanatracker.io (PnL v2 wallet
 * positions — mirrors /v2/pnl/wallets/:wallet/tokens/:token per-token
 * fields) — confirmed base URL, path, auth header, and response shape:
 *
 *   curl "https://data.solanatracker.io/v2/pnl/wallets/{wallet}/positions?limit=100" \
 *     -H "x-api-key: YOUR_API_KEY"
 *   -> { positions: [{ token, pnl: { realized, unrealized, total }, roi,
 *                       meta: { symbol, name, image } }, ...] }
 *
 * "Most profitable" is ranked by REALIZED per-token profit (pnl.realized),
 * not unrealized/paper gains and not the wallet's overall PNL — the $ and %
 * shown on the badge both come from that same winning position. Sorts
 * client-side rather than relying on any API-side sort query param, since
 * the exact accepted sort key isn't documented and this is a small
 * decorative fetch (one page of up to 100 positions is plenty).
 *
 * Deliberately an unsigned `>` comparison, not "highest positive PNL only"
 * — if every position the wallet ever traded is a loss, this naturally
 * picks whichever one lost the LEAST (closest to $0), e.g. -$1, rather than
 * returning null/"no data" just because nothing was profitable. Never
 * filter this to `realizedPnl > 0` — that would break that fallback.
 */
export async function fetchTopProfitableToken(walletAddress: string): Promise<TopTokenResult | null> {
  const apiKey = process.env.SOLANA_TRACKER_API_KEY;
  if (!apiKey) return null;

  const url = `${SOLANA_TRACKER_API_BASE}/v2/pnl/wallets/${encodeURIComponent(walletAddress)}/positions?limit=100`;

  try {
    const res = await fetch(url, {
      headers: { "x-api-key": apiKey, accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    const positions = data?.positions;
    if (!Array.isArray(positions) || positions.length === 0) return null;

    let best: {
      realizedPnl: number;
      pnlPercent: number;
      symbol: string;
      name: string;
      imageUrl: string | null;
    } | null = null;

    for (const position of positions) {
      const realizedPnl = position?.pnl?.realized;
      const symbol = position?.meta?.symbol;
      if (typeof realizedPnl !== "number" || typeof symbol !== "string" || !symbol) continue;
      if (!best || realizedPnl > best.realizedPnl) {
        const roi = position?.roi;
        best = {
          realizedPnl,
          pnlPercent: typeof roi === "number" ? roi : 0,
          symbol,
          name: typeof position?.meta?.name === "string" ? position.meta.name : symbol,
          imageUrl: typeof position?.meta?.image === "string" ? position.meta.image : null,
        };
      }
    }
    if (!best) return null;

    return {
      symbol: best.symbol,
      name: best.name,
      imageUrl: best.imageUrl,
      pnl: best.realizedPnl,
      pnlPercent: best.pnlPercent,
    };
  } catch {
    return null;
  }
}
