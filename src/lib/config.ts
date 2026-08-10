/**
 * Central place for tunable product constants.
 * Change MATCH_DURATION_SECONDS here to adjust match length everywhere.
 */
export const MATCH_DURATION_SECONDS = 30;

/** MMR search radius, widening the longer a player waits in queue. */
export const MMR_SEARCH_RANGES = [100, 150, 200, 300];

/** How often (in seconds) the search radius advances to the next step above. */
export const MMR_RANGE_EXPAND_INTERVAL_SECONDS = 5;

/**
 * DEVELOPMENT MOCK OPPONENT FALLBACK
 * If no real opponent is found in this many seconds, queue a seeded mock
 * opponent instead so the app is playable solo. Set to false to disable
 * (matches will then wait indefinitely for a real opponent).
 * See src/lib/game/bots.ts and src/lib/game/matchmaking.ts.
 */
export const DEV_MOCK_OPPONENT_ENABLED = true;
export const DEV_MOCK_OPPONENT_DELAY_SECONDS = 4;

/**
 * Controlled by the MOCK_SOLANA_TRACKER environment variable (see .env).
 *
 * true  -> PNL comes from the deterministic mock generator in
 *          src/lib/game/pnl-service.ts. Development only. The match UI
 *          clearly labels matches as using mock PNL when this is on.
 * false -> PNL MUST come from the real Solana Tracker API. If that call
 *          fails for any reason, the match does NOT silently fall back to
 *          mock/random data — PNL verification fails outright and the
 *          ranked match is blocked from starting (see match-service.ts).
 *
 * Defaults to true (mock) so local development works without an API key.
 * Set MOCK_SOLANA_TRACKER=false and SOLANA_TRACKER_API_KEY in production.
 */
export const MOCK_SOLANA_TRACKER = process.env.MOCK_SOLANA_TRACKER !== "false";

/**
 * LIVE 1V1 VIDEO (WebRTC)
 *
 * Signaling uses HTTP polling through Route Handlers backed by Postgres
 * (see src/lib/db/video-signaling.ts) rather than a raw WebSocket server —
 * this app runs on plain `next dev`/`next start` with no custom server, and
 * a typical serverless deploy target (e.g. Vercel) can't host a persistent
 * WebSocket server anyway. The actual audio/video media is still genuine
 * peer-to-peer WebRTC and never touches the server.
 *
 * STUN-only: works for same-network/simple-NAT testing. Production-grade
 * cross-network reliability needs a TURN server too (e.g. Twilio Network
 * Traversal Service, Xirsys, Cloudflare Calls, or self-hosted coturn) —
 * intentionally not wired up here since it requires third-party credentials.
 */
export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export const SIGNAL_POLL_INTERVAL_MS = 700;
export const PRESENCE_HEARTBEAT_INTERVAL_MS = 2000;
export const PRESENCE_TIMEOUT_MS = 7000;

/** How long the "CONNECTING TO OPPONENT" phase waits before starting the
 * duel regardless — video must never delay or block the core 30s match. */
export const MAX_VIDEO_CONNECT_WAIT_SECONDS = 6;

/** CoinDuel's community Discord invite — the single source of truth, used
 * only by the footer's Discord icon (src/components/footer.tsx). */
export const DISCORD_INVITE_URL = "https://discord.gg/C2QTbkBzWS";
