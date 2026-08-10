import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DuplicateWalletError, verifyUserWallet } from "@/lib/db/users";
import { consumeChallenge, getChallenge, isChallengeExpired } from "@/lib/db/wallet-challenges";
import { verifyWalletSignature } from "@/lib/wallet/verify";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Step 2 of wallet verification: the client signed the challenge message
 * with its connected wallet and sends the signature back here. This route
 * is the ONLY place a user's wallet ever gets marked verified, and only
 * after a real cryptographic check — never from the client's say-so.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  if (!checkRateLimit(`wallet-verify:${user.id}`, 10, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const walletAddress = typeof body?.walletAddress === "string" ? body.walletAddress.trim() : "";
  const signatureHex = typeof body?.signature === "string" ? body.signature : "";

  if (!walletAddress || !signatureHex) {
    return NextResponse.json({ error: "Missing wallet address or signature." }, { status: 400 });
  }

  const challenge = await getChallenge(user.id);
  if (!challenge) {
    return NextResponse.json(
      { error: "No pending verification found. Request a new one." },
      { status: 400 }
    );
  }

  // Single-use, regardless of outcome: consuming it here means a captured
  // message+signature pair can never be replayed, even if this exact check
  // fails and the caller retries — a retry must request a fresh challenge.
  await consumeChallenge(user.id);

  if (isChallengeExpired(challenge)) {
    return NextResponse.json({ error: "Verification expired. Request a new one." }, { status: 410 });
  }

  if (challenge.walletAddress !== walletAddress) {
    return NextResponse.json(
      { error: "Wallet address does not match the pending challenge." },
      { status: 400 }
    );
  }

  const isValid = verifyWalletSignature({
    message: challenge.message,
    signatureHex,
    walletAddress,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Signature verification failed." }, { status: 400 });
  }

  try {
    await verifyUserWallet(user.id, walletAddress);
  } catch (error) {
    if (error instanceof DuplicateWalletError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ ok: true, walletAddress });
}
