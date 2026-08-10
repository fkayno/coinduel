import { prisma } from "@/lib/db/client";
import type { Subscription as SubscriptionRow } from "@/generated/prisma/client";

export interface StoredSubscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

function mapSubscription(row: SubscriptionRow): StoredSubscription {
  return {
    id: row.id,
    userId: row.userId,
    stripeCustomerId: row.stripeCustomerId,
    stripeSubscriptionId: row.stripeSubscriptionId,
    stripePriceId: row.stripePriceId,
    status: row.status,
    currentPeriodStart: row.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
  };
}

export async function getSubscriptionByUserId(userId: string): Promise<StoredSubscription | null> {
  const row = await prisma.subscription.findUnique({ where: { userId } });
  return row ? mapSubscription(row) : null;
}

export async function getSubscriptionByStripeCustomerId(
  stripeCustomerId: string
): Promise<StoredSubscription | null> {
  const row = await prisma.subscription.findUnique({ where: { stripeCustomerId } });
  return row ? mapSubscription(row) : null;
}

/** Creates the (customer-only, not-yet-subscribed) row the first time a user starts checkout. */
export async function createPendingSubscription(
  userId: string,
  stripeCustomerId: string
): Promise<StoredSubscription> {
  const row = await prisma.subscription.upsert({
    where: { userId },
    create: { userId, stripeCustomerId, status: "incomplete" },
    update: {},
  });
  return mapSubscription(row);
}

export interface SubscriptionStripeState {
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * The ONLY function that writes Stripe-derived subscription state — called
 * exclusively from the webhook handler (src/app/api/stripe/webhook/route.ts)
 * with data read directly off a verified Stripe event. Upserts by userId
 * (not stripeSubscriptionId) since the userId<->customer link is created
 * before a subscription exists (see createPendingSubscription above) — this
 * keeps exactly one Subscription row per user no matter how many times they
 * subscribe/cancel/resubscribe.
 */
export async function upsertSubscriptionState(
  userId: string,
  state: SubscriptionStripeState
): Promise<StoredSubscription> {
  const row = await prisma.subscription.upsert({
    where: { userId },
    create: { userId, ...state },
    update: state,
  });
  return mapSubscription(row);
}
