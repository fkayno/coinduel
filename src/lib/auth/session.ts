/**
 * Signed session tokens using Web Crypto (HMAC-SHA256).
 *
 * This file must stay Edge-runtime safe — it's imported directly by
 * middleware.ts. Do NOT import next/headers, node:fs, or node:crypto here.
 */

export const SESSION_COOKIE_NAME = "coinduel_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length > 0) return secret;

  // In production, silently falling back to a public, hardcoded string
  // would mean every session cookie is signed with a secret anyone can
  // read from this source file — fully forgeable auth. Fail loudly instead
  // of fail-open. Local dev keeps the convenience fallback.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET is not set. Refusing to sign session tokens with a public fallback in production — set a real random value (openssl rand -base64 32)."
    );
  }
  return "coinduel-dev-only-insecure-secret-change-me";
}

function encodeUtf8(value: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(value);
  const bytes = new Uint8Array(new ArrayBuffer(encoded.length));
  bytes.set(encoded);
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const base64 = normalized + "=".repeat(padLength);
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getSigningKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encodeUtf8(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(userId: string): Promise<string> {
  const payload = JSON.stringify({ sub: userId, exp: Date.now() + SESSION_TTL_MS });
  const payloadB64 = bytesToBase64Url(encodeUtf8(payload));

  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, encodeUtf8(payloadB64));
  const signatureB64 = bytesToBase64Url(new Uint8Array(signature));

  return `${payloadB64}.${signatureB64}`;
}

export async function verifySessionToken(token: string): Promise<{ sub: string } | null> {
  const [payloadB64, signatureB64] = token.split(".");
  if (!payloadB64 || !signatureB64) return null;

  const key = await getSigningKey();
  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(signatureB64),
    encodeUtf8(payloadB64)
  );
  if (!isValid) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64))) as {
      sub: string;
      exp: number;
    };
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}
