import { prisma } from "@/lib/db/client";
import { randomUUID } from "node:crypto";

/**
 * SERVER-ONLY. PostgreSQL-backed replacement for the old
 * src/lib/wallet/challenge-store.ts — identical exported shape (now async).
 *
 * One pending challenge per user at a time — `userId` is the table's
 * primary key, so `createChallenge` upserting on it naturally replaces any
 * previous pending challenge (exactly the old `store[userId] = challenge`
 * overwrite semantics). A challenge is deleted (single-use) the moment
 * it's checked in /api/wallet/verify, whether that check succeeds or
 * fails — this is what makes the nonce replay-proof: a captured
 * signature+message pair is worthless the moment it's used (or a fresh
 * challenge is requested), and it stops being valid on its own after
 * CHALLENGE_TTL_MS regardless.
 */

export interface WalletChallenge {
  userId: string;
  walletAddress: string;
  nonce: string;
  message: string;
  createdAt: string;
  expiresAt: string;
}

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes — deliberately short-lived

function buildChallengeMessage(input: {
  userId: string;
  walletAddress: string;
  nonce: string;
  issuedAt: Date;
  expiresAt: Date;
}): string {
  return [
    "CoinDuel Wallet Verification",
    "",
    `Account: ${input.userId}`,
    `Wallet: ${input.walletAddress}`,
    `Nonce: ${input.nonce}`,
    `Issued At: ${input.issuedAt.toISOString()}`,
    `Expires At: ${input.expiresAt.toISOString()}`,
    "",
    "Signing this message proves you control this wallet. It is free and will",
    "not trigger a blockchain transaction.",
  ].join("\n");
}

/** Creates (and persists) a fresh challenge for a user, replacing any prior pending one. */
export async function createChallenge(userId: string, walletAddress: string): Promise<WalletChallenge> {
  const nonce = randomUUID();
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + CHALLENGE_TTL_MS);
  const message = buildChallengeMessage({ userId, walletAddress, nonce, issuedAt, expiresAt });

  const row = await prisma.walletChallenge.upsert({
    where: { userId },
    create: { userId, walletAddress, nonce, message, createdAt: issuedAt, expiresAt },
    update: { walletAddress, nonce, message, createdAt: issuedAt, expiresAt },
  });

  return {
    userId: row.userId,
    walletAddress: row.walletAddress,
    nonce: row.nonce,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}

export async function getChallenge(userId: string): Promise<WalletChallenge | null> {
  const row = await prisma.walletChallenge.findUnique({ where: { userId } });
  if (!row) return null;
  return {
    userId: row.userId,
    walletAddress: row.walletAddress,
    nonce: row.nonce,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}

/** Deletes a user's pending challenge — call this whether verification succeeded or failed. */
export async function consumeChallenge(userId: string): Promise<void> {
  await prisma.walletChallenge.deleteMany({ where: { userId } });
}

export function isChallengeExpired(challenge: WalletChallenge): boolean {
  return new Date(challenge.expiresAt).getTime() < Date.now();
}
