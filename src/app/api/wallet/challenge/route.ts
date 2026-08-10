import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isValidSolanaAddress } from "@/lib/solana";
import { createChallenge } from "@/lib/db/wallet-challenges";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Step 1 of wallet verification: the client has connected a wallet
 * extension and knows its public address, and asks the server for a
 * message to sign. The server embeds the account id, the claimed wallet
 * address, a fresh nonce, and a short expiration — nothing here marks the
 * wallet as verified yet, that only happens in /api/wallet/verify after a
 * real signature check.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  if (!checkRateLimit(`wallet-challenge:${user.id}`, 10, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const walletAddress = typeof body?.walletAddress === "string" ? body.walletAddress.trim() : "";

  if (!isValidSolanaAddress(walletAddress)) {
    return NextResponse.json({ error: "Invalid Solana wallet address." }, { status: 400 });
  }

  const challenge = await createChallenge(user.id, walletAddress);

  return NextResponse.json({
    message: challenge.message,
    nonce: challenge.nonce,
    expiresAt: challenge.expiresAt,
  });
}
