import { getSubscriptionByUserId } from "@/lib/db/subscriptions";
import { prisma } from "@/lib/db/client";

/**
 * THE single centralized PRO entitlement check — every PRO-gated feature
 * (private duels, tournaments, profile pictures, the PRO badge) must call
 * this, never re-derive PRO status from its own query. Trusts nothing but
 * the Subscription row, which is itself only ever written from verified
 * Stripe webhook events (see src/app/api/stripe/webhook/route.ts) — there is
 * no client-settable field anywhere that can flip this.
 *
 * "active" is Stripe's own status string and is the ONLY status that grants
 * PRO. This single check already covers every case in the spec:
 *   - Cancelled but still in the paid period: Stripe keeps status "active"
 *     until the period actually ends (cancelAtPeriodEnd is just a label for
 *     the UI) — so PRO correctly stays on.
 *   - Payment failed (past_due/unpaid) or subscription ended
 *     (canceled/incomplete_expired) or paused: none of these are "active",
 *     so PRO is correctly removed the moment Stripe's own status changes.
 */
export async function hasProAccess(userId: string): Promise<boolean> {
  const subscription = await getSubscriptionByUserId(userId);
  return subscription?.status === "active";
}

/**
 * Batch version for pages that render PRO badges next to multiple users at
 * once (match history, a duel's two players) — one query instead of N.
 * Bot ids ("bot:<username>") are never real Subscription rows and always
 * resolve to false without hitting the database.
 */
export async function getProStatusMap(userIds: string[]): Promise<Record<string, boolean>> {
  const realUserIds = [...new Set(userIds.filter((id) => !id.startsWith("bot:")))];
  if (realUserIds.length === 0) return {};

  const rows = await prisma.subscription.findMany({
    where: { userId: { in: realUserIds }, status: "active" },
    select: { userId: true },
  });

  const map: Record<string, boolean> = {};
  for (const id of realUserIds) map[id] = false;
  for (const row of rows) map[row.userId] = true;
  return map;
}
