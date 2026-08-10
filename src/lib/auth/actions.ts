"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createUser, DuplicateUserError, findUserByEmail, findUserByUsername, verifyUserPassword } from "@/lib/db/users";
import { createSessionToken } from "@/lib/auth/session";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/cookies";
import { validateEmail, validatePassword, validateUsername } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

async function getRequestIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export interface SignupInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export type AuthResult =
  | { ok: true }
  | { ok: false; field?: "username" | "email" | "password"; error: string };

/**
 * Creates the account only — wallet verification is a separate step
 * (src/app/api/wallet/*) that happens once the account (and therefore a
 * session) already exists, since the verification challenge embeds the
 * account id.
 */
export async function signupAction(input: SignupInput): Promise<AuthResult> {
  const ip = await getRequestIp();
  if (!checkRateLimit(`signup:${ip}`, 10, 15 * 60 * 1000)) {
    return { ok: false, error: "Too many signup attempts. Please try again in a few minutes." };
  }

  const usernameError = validateUsername(input.username);
  if (usernameError) return { ok: false, field: "username", error: usernameError };

  const emailError = validateEmail(input.email);
  if (emailError) return { ok: false, field: "email", error: emailError };

  const passwordError = validatePassword(input.password);
  if (passwordError) return { ok: false, field: "password", error: passwordError };

  if (await findUserByEmail(input.email)) {
    return { ok: false, field: "email", error: "An account with this email already exists." };
  }
  if (await findUserByUsername(input.username)) {
    return { ok: false, field: "username", error: "That username is taken." };
  }

  let user;
  try {
    user = await createUser({
      username: input.username.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
    });
  } catch (error) {
    // Only reachable via a genuine race — two signups for the same
    // username/email landing between the checks above and this insert.
    if (error instanceof DuplicateUserError) {
      return { ok: false, field: error.field, error: `That ${error.field} is already in use.` };
    }
    throw error;
  }

  const token = await createSessionToken(user.id);
  await setSessionCookie(token);

  return { ok: true };
}

export async function loginAction(input: LoginInput): Promise<AuthResult> {
  const ip = await getRequestIp();
  // Deliberately tight — this is the classic brute-force target. Keyed by
  // IP (not email) so an attacker can't work around it by spraying many
  // different accounts from one source.
  if (!checkRateLimit(`login:${ip}`, 10, 5 * 60 * 1000)) {
    return { ok: false, error: "Too many login attempts. Please try again in a few minutes." };
  }

  if (!input.email.trim() || !input.password) {
    return { ok: false, error: "Enter your email and password." };
  }

  const user = await findUserByEmail(input.email);
  const valid = user ? verifyUserPassword(user, input.password) : false;

  if (!user || !valid) {
    return { ok: false, error: "Invalid email or password." };
  }

  const token = await createSessionToken(user.id);
  await setSessionCookie(token);

  return { ok: true };
}

export async function logoutAction(_formData: FormData): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}
