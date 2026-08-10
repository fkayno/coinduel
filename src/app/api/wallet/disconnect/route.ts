import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { clearUserWallet } from "@/lib/db/users";

/** Disconnects the current user's wallet — a new one must be verified again before ranked play. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await clearUserWallet(user.id);
  return NextResponse.json({ ok: true });
}
