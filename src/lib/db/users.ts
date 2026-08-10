import { Prisma, type User as UserRow } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { STARTING_MMR } from "@/lib/game/mmr";

/**
 * SERVER-ONLY. PostgreSQL-backed replacement for the old
 * src/lib/auth/dev-store.ts — same exported function names and shapes
 * (now async), so every call site only needed an import-path change plus
 * `await`, not a rewrite.
 */

export interface StoredUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  walletAddress: string | null;
  walletVerified: boolean;
  walletVerifiedAt: string | null;
  createdAt: string;
  mmr: number;
  wins: number;
  losses: number;
  streak: number;
  profileImageUrl: string | null;
}

export type PublicUser = Omit<StoredUser, "passwordHash">;

/** Prisma returns Date objects; every consumer in the app expects ISO strings, exactly as the old JSON store produced. */
function mapUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.passwordHash,
    walletAddress: row.walletAddress,
    walletVerified: row.walletVerified,
    walletVerifiedAt: row.walletVerifiedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    mmr: row.mmr,
    wins: row.wins,
    losses: row.losses,
    streak: row.streak,
    profileImageUrl: row.profileImageUrl,
  };
}

export function toPublicUser(user: StoredUser): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  const row = await prisma.user.findFirst({ where: { email: { equals: normalized, mode: "insensitive" } } });
  return row ? mapUser(row) : null;
}

export async function findUserByUsername(username: string): Promise<StoredUser | null> {
  const normalized = username.trim();
  const row = await prisma.user.findFirst({ where: { username: { equals: normalized, mode: "insensitive" } } });
  return row ? mapUser(row) : null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? mapUser(row) : null;
}

/** Thrown when a unique constraint (username or email) is violated — signupAction maps this to a friendly field error. */
export class DuplicateUserError extends Error {
  constructor(public readonly field: "username" | "email") {
    super(`That ${field} is already in use.`);
  }
}

export async function createUser(input: {
  username: string;
  email: string;
  password: string;
}): Promise<StoredUser> {
  try {
    const row = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash: hashPassword(input.password),
        mmr: STARTING_MMR,
      },
    });
    return mapUser(row);
  } catch (error) {
    // A race past the application-level pre-check in signupAction (two
    // concurrent signups for the same username/email) — the JSON store had
    // no way to even detect this; Postgres's unique constraint does.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = (error.meta?.target as string[] | undefined) ?? [];
      throw new DuplicateUserError(target.includes("email") ? "email" : "username");
    }
    throw error;
  }
}

/** Thrown when a wallet is already verified on a different account — walletAddress is unique across users. */
export class DuplicateWalletError extends Error {
  constructor() {
    super("This wallet is already verified on another account.");
  }
}

/**
 * Marks a wallet as verified for a user. Only ever call this after a
 * signature has been cryptographically verified (see
 * src/lib/wallet/verify.ts) — never in response to a client just claiming
 * an address. Overwrites any previously verified wallet (one verified
 * wallet per account). `walletAddress` is unique across all users, so this
 * throws DuplicateWalletError if another account already verified it.
 */
export async function verifyUserWallet(userId: string, walletAddress: string): Promise<StoredUser | null> {
  try {
    const row = await prisma.user.update({
      where: { id: userId },
      data: { walletAddress, walletVerified: true, walletVerifiedAt: new Date() },
    });
    return mapUser(row);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DuplicateWalletError();
    }
    return isRecordNotFound(error) ? null : Promise.reject(error);
  }
}

/** Disconnects a user's wallet — a new wallet must go through verification again. */
export async function clearUserWallet(userId: string): Promise<StoredUser | null> {
  try {
    const row = await prisma.user.update({
      where: { id: userId },
      data: { walletAddress: null, walletVerified: false, walletVerifiedAt: null },
    });
    return mapUser(row);
  } catch (error) {
    return isRecordNotFound(error) ? null : Promise.reject(error);
  }
}

/**
 * Sets the user's avatar URL after a server-validated upload has already
 * been stored (see src/app/api/profile/avatar/route.ts) — never call this
 * with a client-supplied URL directly.
 */
export async function setUserProfileImage(userId: string, profileImageUrl: string): Promise<StoredUser | null> {
  try {
    const row = await prisma.user.update({ where: { id: userId }, data: { profileImageUrl } });
    return mapUser(row);
  } catch (error) {
    return isRecordNotFound(error) ? null : Promise.reject(error);
  }
}

/** Reverts a user to the default letter avatar. */
export async function clearUserProfileImage(userId: string): Promise<StoredUser | null> {
  try {
    const row = await prisma.user.update({ where: { id: userId }, data: { profileImageUrl: null } });
    return mapUser(row);
  } catch (error) {
    return isRecordNotFound(error) ? null : Promise.reject(error);
  }
}

export function verifyUserPassword(user: StoredUser, password: string): boolean {
  return verifyPassword(password, user.passwordHash);
}

/** Applies a ranked-match result to a user's persisted profile. */
export async function updateUserStats(
  userId: string,
  input: { mmr: number; won: boolean }
): Promise<StoredUser | null> {
  try {
    const current = await prisma.user.findUnique({ where: { id: userId }, select: { streak: true } });
    if (!current) return null;

    const streak = input.won
      ? current.streak > 0
        ? current.streak + 1
        : 1
      : current.streak < 0
        ? current.streak - 1
        : -1;

    const row = await prisma.user.update({
      where: { id: userId },
      data: {
        mmr: input.mmr,
        wins: { increment: input.won ? 1 : 0 },
        losses: { increment: input.won ? 0 : 1 },
        streak,
      },
    });
    return mapUser(row);
  } catch (error) {
    return isRecordNotFound(error) ? null : Promise.reject(error);
  }
}

function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}
