/**
 * SERVER-ONLY. Cloudflare Realtime TURN credential minting.
 *
 * The long-lived TURN Key ID + API Token (CLOUDFLARE_TURN_KEY_ID /
 * CLOUDFLARE_TURN_KEY_API_TOKEN) must never reach the browser — this module
 * exchanges them, server-side, for short-lived ICE server credentials
 * (username+credential valid only for `ttl` seconds) that ARE safe to hand
 * to a client. See src/app/api/play/turn-credentials/route.ts for the only
 * caller.
 *
 * Falls back to null (not a thrown error) when Cloudflare isn't configured
 * or the request fails — video/audio must never block the underlying 30s
 * match, so the caller falls back to STUN-only (see config.ts's
 * ICE_SERVERS) rather than failing the match.
 */

const CLOUDFLARE_TURN_ENDPOINT = "https://rtc.live.cloudflare.com/v1/turn/keys";

/** Comfortably longer than one match (30s) plus queue/connect time, short enough to limit exposure if leaked. */
const TURN_CREDENTIAL_TTL_SECONDS = 600;

export async function fetchTurnIceServers(): Promise<RTCIceServer[] | null> {
  const keyId = process.env.CLOUDFLARE_TURN_KEY_ID;
  const apiToken = process.env.CLOUDFLARE_TURN_KEY_API_TOKEN;
  if (!keyId || !apiToken) return null;

  try {
    const res = await fetch(
      `${CLOUDFLARE_TURN_ENDPOINT}/${encodeURIComponent(keyId)}/credentials/generate-ice-servers`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl: TURN_CREDENTIAL_TTL_SECONDS }),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    const iceServers = data?.iceServers;
    if (!Array.isArray(iceServers) || iceServers.length === 0) return null;

    return iceServers as RTCIceServer[];
  } catch {
    return null;
  }
}
