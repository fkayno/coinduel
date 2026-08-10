import { redirect } from "next/navigation";
import { getSessionCookie } from "@/lib/auth/cookies";
import { verifySessionToken } from "@/lib/auth/session";
import { findUserById, toPublicUser, type PublicUser } from "@/lib/db/users";

export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = await getSessionCookie();
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  const user = await findUserById(session.sub);
  if (!user) return null;

  return toPublicUser(user);
}

/** Use at the top of a protected server component/page. */
export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
